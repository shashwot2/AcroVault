import { browserAPI, addAcronym, removeAcronym, getAcronyms, importAcronyms, seedAcronyms } from './localStorage.js'
import { parseTxt, toTxt, downloadTxt } from './importFromFlatFile.js'
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

// Options sheet
const settingsIcon = document.querySelector('#settings-icon')
const optionsSheet = document.querySelector('#options-sheet')
const importFile = document.querySelector('#import-file')
const importStatus = document.querySelector('#import-status')

const setOptionsOpen = (open) => {
    document.body.classList.toggle('options-open', open)
    settingsIcon.setAttribute('aria-expanded', open)
    optionsSheet.setAttribute('aria-hidden', !open)
    if (!open) importStatus.textContent = ''
}

const showStatus = (text, isError = false) => {
    importStatus.textContent = text
    importStatus.classList.toggle('error', isError)
}

settingsIcon.addEventListener('click', () =>
    setOptionsOpen(!document.body.classList.contains('options-open')))
settingsIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        settingsIcon.click()
    }
})
document.querySelector('#options-close').addEventListener('click', () => setOptionsOpen(false))
document.querySelector('#options-backdrop').addEventListener('click', () => setOptionsOpen(false))
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOptionsOpen(false)
})

// The file picker steals focus, which closes the popup and kills the import,
// so from the popup we hand off to a full tab instead
const isPopup = () =>
    browserAPI.extension?.getViews?.({ type: 'popup' }).includes(window) ?? false

document.querySelector('#import-button').addEventListener('click', async () => {
    if (isPopup()) {
        await browserAPI.tabs.create({ url: browserAPI.runtime.getURL('index.html?options') })
        window.close()
        return
    }
    importFile.click()
})

if (new URLSearchParams(location.search).has('options')) {
    setOptionsOpen(true)
    showStatus('Click "Import from .txt" to choose your file.')
}

importFile.addEventListener('change', async () => {
    const [file] = importFile.files
    if (!file) return
    try {
        const { entries, errors } = parseTxt(await file.text())
        const count = entries.length ? await importAcronyms(entries) : 0
        const skipped = errors.length ? ` Skipped ${errors.length}: ${errors.slice(0, 3).join('; ')}` : ''
        showStatus(`Imported ${count} acronym${count === 1 ? '' : 's'}.${skipped}`, count === 0)
        refresh()
    } catch (error) {
        showStatus(`Import failed: ${error.message}`, true)
    } finally {
        // Allow re-importing the same file
        importFile.value = ''
    }
})

document.querySelector('#export-button').addEventListener('click', async () => {
    const acronyms = await getAcronyms()
    downloadTxt(toTxt(acronyms), 'acrovault-acronyms.txt')
    showStatus(`Exported ${acronyms.length} acronym${acronyms.length === 1 ? '' : 's'}.`)
})

await seedAcronyms([
    { acronym: "IRS", expansion: "Internal Revenue Service", description: "Federal Agency that controls Tax" },
    { acronym: "API", expansion: "Application Programming Interface", description: "Set of protocols for building software" },
    { acronym: "URL", expansion: "Uniform Resource Locator", description: "Web address" },
])
refresh()
