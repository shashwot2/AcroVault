const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // for Firefox
    }
    return chrome; //for Chrome
})();

// Same acronym can have several expansions (e.g. PM), so match on both
const isSame = (item, acronym, expansion) =>
    item.acronym === acronym.toUpperCase() &&
    item.expansion.toLowerCase() === expansion.toLowerCase();

// Tags arrive as "a, b" from text or as an array; store them trimmed, lowercased and unique
const parseTags = (tags = []) => {
    const list = Array.isArray(tags) ? tags : tags.split(",");
    return [...new Set(list.map(tag => tag.trim().toLowerCase()).filter(Boolean))];
}

const makeEntry = ({ acronym, expansion, description = "", collection = "", tags = [] }) => ({
    acronym: acronym.toUpperCase(),
    expansion,
    description: description.trim(),
    collection: collection.trim(),
    tags: parseTags(tags)
})

const getAcronyms = async () => {
    try {
        const result = await browserAPI.storage.local.get(['acronyms']);
        return result.acronyms || [];
    } catch (error) {
        console.error('Error getting acronyms:', error);
        return [];
    }
}

const addAcronym = async (acronym, expansion, description = "", collection = "", tags = []) => {
    acronym = acronym?.trim();
    expansion = expansion?.trim();
    if (!acronym || !expansion) {
        throw new Error("Acronym and expansion are required");
    }

    try {
        const existingAcronyms = await getAcronyms();

        const newAcronym = makeEntry({ acronym, expansion, description, collection, tags });

        // Replace an existing entry instead of adding a duplicate
        const updatedAcronyms = [
            ...existingAcronyms.filter(item => !isSame(item, acronym, expansion)),
            newAcronym
        ];

        await browserAPI.storage.local.set({ 'acronyms': updatedAcronyms });
        return "Acronym added successfully";
    } catch (error) {
        console.error('Error adding acronym:', error);
        throw error;
    }
}

const removeAcronym = async (acronym, expansion) => {
    try {
        const existingAcronyms = await getAcronyms();
        const filteredAcronyms = existingAcronyms.filter(
            item => !isSame(item, acronym, expansion)
        );

        await browserAPI.storage.local.set({ 'acronyms': filteredAcronyms });
        return "Acronym removed successfully";
    } catch (error) {
        console.error('Error removing acronym:', error);
        throw error;
    }
}

// Bulk add in a single storage write; returns how many entries were imported
const importAcronyms = async (entries) => {
    try {
        let updatedAcronyms = await getAcronyms();
        for (const entry of entries) {
            updatedAcronyms = [
                ...updatedAcronyms.filter(item => !isSame(item, entry.acronym, entry.expansion)),
                makeEntry(entry)
            ];
        }

        await browserAPI.storage.local.set({ 'acronyms': updatedAcronyms });
        return entries.length;
    } catch (error) {
        console.error('Error importing acronyms:', error);
        throw error;
    }
}

// Only seed sample data on first run
const seedAcronyms = async (defaults) => {
    const existingAcronyms = await getAcronyms();
    if (existingAcronyms.length === 0) {
        await browserAPI.storage.local.set({ 'acronyms': defaults });
    }
}

export { browserAPI, getAcronyms, addAcronym, removeAcronym, importAcronyms, seedAcronyms }
