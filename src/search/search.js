// Fuse is already loaded globally so no need here
import { getAcronyms } from "../storage.js";

const search = {
  // My data structure will look like:
  //  acronyms = [{
  //      acronym: "IRS",
  //      expansion: "Internal Revenue Service",
  //      description: "Federal Agency that controls Tax"

  async render(query = "") {
    const results = document.querySelector("#results");
    const acronyms = await getAcronyms();

    if (acronyms.length === 0) {
      results.replaceChildren(message("No acronyms found. Add some first!"));
      return;
    }

    const items = query.trim()
      ? new Fuse(acronyms, options).search(query).map((result) => result.item)
      : acronyms;

    if (items.length === 0) {
      results.replaceChildren(message("No matching acronyms found."));
    } else {
      results.replaceChildren(...items.map(renderItem));
    }
  },
};

// Built with textContent so stored text is never parsed as HTML
const renderItem = (item) => {
  const div = document.createElement("div");
  div.className = "result-item";

  const title = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = item.acronym;
  title.append(strong, ` - ${item.expansion}`);
  div.append(title);

  if (item.description) {
    const small = document.createElement("small");
    small.textContent = item.description;
    div.append(small);
  }

  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.textContent = "×";
  remove.title = `Delete ${item.acronym}`;
  remove.dataset.acronym = item.acronym;
  remove.dataset.expansion = item.expansion;
  div.append(remove);

  return div;
};

const message = (text) => {
  const div = document.createElement("div");
  div.className = "message";
  div.textContent = text;
  return div;
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
