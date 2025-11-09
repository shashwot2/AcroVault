const getAcronyms = () => {
    return new Promise((resolve)=> {
        chrome.storage.local.get(['acronyms'], (result) => {
            resolve(result.acronyms || [])
        })
    })
}

export default {getAcronyms}