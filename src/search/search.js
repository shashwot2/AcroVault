// Fuse is already loaded globally so no need here
import { getAcronyms } from "../localStorage.js";

const search = {
  // My data structure will look like:
  //  acronyms = [{
  //      acronym: "IRS",
  //      expansion: "Internal Revenue Service",
  //      description: "Federal Agency that controls Tax",
  //      collection: "Government",
  //      tags: ["tax", "federal"]

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
      results.replaceChildren(...groupByCollection(items, query.trim() !== "").map(renderGroup));
    }
  },
};

const UNGROUPED = "No collection";

// Collections the user has expanded, kept so re-rendering on each keystroke doesn't collapse them
const openGroups = new Set();

// While searching, groups keep Fuse's best-match order and all open; otherwise they're
// alphabetical and only the ones the user opened stay open. Ungrouped always goes last.
const groupByCollection = (items, searching) => {
  const groups = new Map();
  for (const item of items) {
    const name = item.collection || UNGROUPED;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }

  const names = [...groups.keys()].filter((name) => name !== UNGROUPED);
  if (!searching) names.sort((a, b) => a.localeCompare(b));
  if (groups.has(UNGROUPED)) names.push(UNGROUPED);

  return names.map((name) => ({
    name,
    items: groups.get(name),
    open: searching || openGroups.has(name),
  }));
};

const renderGroup = ({ name, items, open }) => {
  const details = document.createElement("details");
  details.className = "collection-group";
  details.open = open;

  const summary = document.createElement("summary");
  const title = document.createElement("span");
  title.textContent = name;
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = items.length;
  summary.append(title, count);

  details.append(summary, ...items.map(renderItem));
  details.addEventListener("toggle", () => {
    if (details.open) openGroups.add(name);
    else openGroups.delete(name);
  });
  return details;
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

  // Collection is shown by the group heading, so only tags go here
  if (item.tags?.length) {
    const meta = document.createElement("div");
    meta.className = "meta";
    item.tags.forEach((tag) => meta.append(chip(`#${tag}`, "tag")));
    div.append(meta);
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

const chip = (text, kind) => {
  const span = document.createElement("span");
  span.className = `chip ${kind}`;
  span.textContent = text;
  return span;
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
    {
      name: "collection",
      weight: 1.5,
    },
    {
      name: "tags",
      weight: 1.5,
    },
  ],
};
export default search;
