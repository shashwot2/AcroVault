import { addAcronym, removeAcronym, seedAcronyms } from './storage.js'
import search from './search/search.js'

const searchInput = document.querySelector('#search')
const addForm = document.querySelector('#add-form')
const addError = document.querySelector('#add-error')

const refresh = () => search.render(searchInput.value)

searchInput.addEventListener('input', refresh)

// Stop Enter from submitting the search form and reloading the page
document.querySelector('#search-form').addEventListener('submit', (e) => e.preventDefault())

document.querySelector('#add-toggle').addEventListener('click', () => {
    addForm.hidden = !addForm.hidden
    if (!addForm.hidden) addForm.elements.acronym.focus()
})

addForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { acronym, expansion, description } = addForm.elements
    try {
        await addAcronym(acronym.value, expansion.value, description.value)
        addForm.reset()
        addError.textContent = ''
        acronym.focus()
        refresh()
    } catch (error) {
        addError.textContent = error.message
    }
})

document.querySelector('#results').addEventListener('click', async (e) => {
    const button = e.target.closest('.delete-button')
    if (!button) return
    await removeAcronym(button.dataset.acronym, button.dataset.expansion)
    refresh()
})

await seedAcronyms([
    { acronym: "IRS", expansion: "Internal Revenue Service", description: "Federal Agency that controls Tax" },
    { acronym: "API", expansion: "Application Programming Interface", description: "Set of protocols for building software" },
    { acronym: "URL", expansion: "Uniform Resource Locator", description: "Web address" },
])
refresh()
