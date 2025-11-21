// Fuse is already loaded globally so no need here
const search = {
  // My data structure will look like:
  //  acronyms = [{
  //      acronym: "IRS",
  //      expansion: "Internal Revenue Service",
  //      description: "Federal Agency that controls Tax"

  async render(query = "") {
    const { getAcronyms } = await import("../storage.js");
    const acronyms = await getAcronyms();
    
    if (acronyms.length === 0) {
      document.querySelector("#results").innerHTML = "<div>No acronyms found. Add some first!</div>";
      return;
    }
    
    const fuse = new Fuse(acronyms, options);
    
    if (!query.trim()) {
      // Show all acronyms if no query
      const allResults = acronyms.map(item => 
        `<div class="result-item">
          <strong>${item.acronym}</strong> - ${item.expansion}
          ${item.description ? `<br><small>${item.description}</small>` : ''}
        </div>`
      );
      document.querySelector("#results").innerHTML = allResults.join("");
    } else {
      const searchResults = fuse.search(query)
        .map((result) => 
          `<div class="result-item">
            <strong>${result.item.acronym}</strong> - ${result.item.expansion}
            ${result.item.description ? `<br><small>${result.item.description}</small>` : ''}
          </div>`
        );
      
      if (searchResults.length === 0) {
        document.querySelector("#results").innerHTML = "<div>No matching acronyms found.</div>";
      } else {
        document.querySelector("#results").innerHTML = searchResults.join("");
      }
    }
  },
};

const options = {
  includeScore: true,
  keys: [
    {
      name: "acronym",
      weight: 3,
    },
    {
      name: "expansion",
      weight: 2,
    },
    {
      name: "description",
      weight: 1,
    },
  ],
};
export default search;
