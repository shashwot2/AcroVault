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

const getAcronyms = async () => {
    try {
        const result = await browserAPI.storage.local.get(['acronyms']);
        return result.acronyms || [];
    } catch (error) {
        console.error('Error getting acronyms:', error);
        return [];
    }
}

const addAcronym = async (acronym, expansion, description = "") => {
    acronym = acronym?.trim();
    expansion = expansion?.trim();
    if (!acronym || !expansion) {
        throw new Error("Acronym and expansion are required");
    }

    try {
        const existingAcronyms = await getAcronyms();

        const newAcronym = {
            acronym: acronym.toUpperCase(),
            expansion: expansion,
            description: description.trim()
        };

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

// Only seed sample data on first run
const seedAcronyms = async (defaults) => {
    const existingAcronyms = await getAcronyms();
    if (existingAcronyms.length === 0) {
        await browserAPI.storage.local.set({ 'acronyms': defaults });
    }
}

export { getAcronyms, addAcronym, removeAcronym, seedAcronyms }
