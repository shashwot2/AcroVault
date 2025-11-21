import { addAcronym, getAcronyms } from './storage.js'
import search from './search/search.js'

document.querySelector('#search').addEventListener('input', (e) => {
    search.render(e.target.value)
    console.log("searching")
})

addAcronym("IRS", "Internal Revenue Service", "Federal Agency that controls Tax")
addAcronym("API", "Application Programming Interface", "Set of protocols for building software")
addAcronym("URL", "Uniform Resource Locator", "Web address")