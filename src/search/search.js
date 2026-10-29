// Fuse is already loaded globally so no need here
import { getAcronyms, getCollectionSettings, setCollectionUrl } from "../localStorage.js";

const search = {
  // My data structure will look like:
  //  acronyms = [{
  //      acronym: "IRS",
  //      expansion: "Internal Revenue Service",
  //      description: "Federal Agency that controls Tax",
  //      collection: "Government",
  //      tags: ["tax", "federal"]

  // URL of the page the user is on, set by start.js so matching collections open first
  pageUrl: "",
  // Full page only, set by start.js
  canEditSites: false,

  async render(query = this.lastQuery ?? "") {
    this.lastQuery = query;
    const results = document.querySelector("#results");
    const [acronyms, settings] = await Promise.all([getAcronyms(), getCollectionSettings()]);

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
      const onPage = new Set(
        Object.keys(settings).filter((name) => matchesPage(settings[name].url, this.pageUrl))
      );
      results.replaceChildren(
        ...groupByCollection(items, query.trim() !== "", onPage).map((group) =>
          renderGroup(group, settings[group.name]?.url ?? "")
        )
      );
    }
  },
};

const UNGROUPED = "No collection";

// Collections the user has expanded, kept so re-rendering on each keystroke doesn't collapse them
const openGroups = new Set();
// Collections whose site form is showing, kept for the same reason
const editingSites = new Set();

// "https://www.jira.example.com/browse/" -> "jira.example.com/browse"
const normalizeUrl = (url) =>
  url.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

// A pattern matches its own host, any subdomain of it, and any path below it
const matchesPage = (pattern, pageUrl) => {
  if (!pattern || !pageUrl) return false;
  pattern = normalizeUrl(pattern);
  const page = normalizeUrl(pageUrl.split(/[?#]/)[0]);
  const [patternHost] = pattern.split("/");
  const [pageHost] = page.split("/");
  const hostMatches = pageHost === patternHost || pageHost.endsWith(`.${patternHost}`);
  const path = pattern.slice(patternHost.length);
  const pagePath = page.slice(pageHost.length);
  return hostMatches && (pagePath === path || pagePath.startsWith(`${path}/`));
};

// While searching, groups keep Fuse's best-match order and all open; otherwise they're
// alphabetical and only the ones the user opened stay open. Collections linked to the
// current page always open and jump to the top. Ungrouped always goes last.
const groupByCollection = (items, searching, onPage = new Set()) => {
  const groups = new Map();
  for (const item of items) {
    const name = item.collection || UNGROUPED;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }

  const names = [...groups.keys()].filter((name) => name !== UNGROUPED);
  if (!searching) names.sort((a, b) => a.localeCompare(b));
  // Stable sort, so the order above is kept within each half
  names.sort((a, b) => onPage.has(b) - onPage.has(a));
  if (groups.has(UNGROUPED)) names.push(UNGROUPED);

  return names.map((name) => ({
    name,
    items: groups.get(name),
    open: searching || onPage.has(name) || openGroups.has(name),
    onPage: onPage.has(name),
  }));
};

const renderGroup = ({ name, items, open, onPage }, siteUrl) => {
  const details = document.createElement("details");
  details.className = "collection-group";
  details.classList.toggle("on-page", onPage);
  details.open = open;

  const summary = document.createElement("summary");
  const title = document.createElement("span");
  title.textContent = name;
  const count = document.createElement("span");
  count.className = "count";
  count.textContent = items.length;
  if (onPage) title.title = "Linked to the page you're on";
  summary.append(title);

  const editable = search.canEditSites && name !== UNGROUPED;
  if (editable) {
    const siteButton = document.createElement("button");
    siteButton.type = "button";
    siteButton.className = "site-button";
    siteButton.classList.toggle("linked", Boolean(siteUrl));
    siteButton.textContent = "🔗";
    siteButton.title = siteUrl ? `Opens on ${siteUrl}` : "Open this collection automatically on a site";
    // Inside <summary>, so stop the click from also toggling the accordion
    siteButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (editingSites.has(name)) {
        editingSites.delete(name);
      } else {
        editingSites.add(name);
        openGroups.add(name);
      }
      search.render();
    });
    summary.append(siteButton);
  }
  summary.append(count);

  details.append(summary);
  if (editable && editingSites.has(name)) details.append(renderSiteForm(name, siteUrl));
  details.append(...items.map(renderItem));
  details.addEventListener("toggle", () => {
    if (details.open) openGroups.add(name);
    else openGroups.delete(name);
  });
  return details;
};

// Leave the field empty and save to unlink the site
const renderSiteForm = (name, siteUrl) => {
  const form = document.createElement("form");
  form.className = "site-form";
  const input = document.createElement("input");
  input.placeholder = "e.g. jira.example.com";
  input.value = siteUrl;
  const save = document.createElement("button");
  save.textContent = "Save";
  form.append(input, save);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await setCollectionUrl(name, input.value);
    editingSites.delete(name);
    search.render();
  });
  requestAnimationFrame(() => input.focus());
  return form;
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
export { matchesPage };
export default search;
