const browserAPI = (() => {
    if (typeof browser !== 'undefined') {
        return browser; // for Firefox
    }
    return chrome; //for Chrome
})();

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
    if (!acronym || !expansion) {
        throw new Error("Acronym and expansion are required");
    }
    
    try {
        const existingAcronyms = await getAcronyms();
        
        const newAcronym = {
            acronym: acronym.toUpperCase(),
            expansion: expansion,
            description: description
        };
        
        const updatedAcronyms = [...existingAcronyms, newAcronym];
        
        await browserAPI.storage.local.set({ 'acronyms': updatedAcronyms });
        return "Acronym added successfully";
    } catch (error) {
        console.error('Error adding acronym:', error);
        throw error;
    }
}

const removeAcronym = async (acronymToRemove) => {
    try {
        const existingAcronyms = await getAcronyms();
        const filteredAcronyms = existingAcronyms.filter(
            item => item.acronym !== acronymToRemove.toUpperCase()
        );
        
        await browserAPI.storage.local.set({ 'acronyms': filteredAcronyms });
        return "Acronym removed successfully";
    } catch (error) {
        console.error('Error removing acronym:', error);
        throw error;
    }
}

export { getAcronyms, addAcronym, removeAcronym }