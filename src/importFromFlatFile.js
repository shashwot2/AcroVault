// Plain-text import/export. One acronym per line:
//   ACRONYM | Expansion | Description | Collection | tag1, tag2
// Everything after Expansion is optional; leave a column empty to skip it.
// Blank lines and lines starting with # are ignored.

const SEPARATOR = "|";

// Returns { entries, errors } so bad lines can be reported without failing the whole file
const parseTxt = (text) => {
    const entries = [];
    const errors = [];

    text.split(/\r?\n/).forEach((line, index) => {
        line = line.trim();
        if (!line || line.startsWith("#")) return;

        const [acronym, expansion, ...rest] = line.split(SEPARATOR).map(part => part.trim());
        if (!acronym || !expansion) {
            errors.push(`Line ${index + 1}: expected "ACRONYM | Expansion"`);
            return;
        }
        // Collection and tags are always the last two columns when present, so any
        // extra separators belong to the description
        const [collection = "", tags = ""] = rest.length > 3 ? rest.slice(-2) : rest.slice(1);
        const description = rest.length > 3 ? rest.slice(0, -2).join(` ${SEPARATOR} `) : rest[0] ?? "";
        entries.push({ acronym, expansion, description, collection, tags });
    });

    return { entries, errors };
}

const toTxt = (acronyms) => [
    "# AcroVault export",
    "# ACRONYM | Expansion | Description | Collection | tag1, tag2",
    ...acronyms.map(({ acronym, expansion, description = "", collection = "", tags = [] }) => {
        // Columns are positional, so keep empty ones in the middle and only drop trailing ones
        const columns = [acronym, expansion, description, collection, tags.join(", ")];
        while (!columns.at(-1)) columns.pop();
        return columns.join(` ${SEPARATOR} `);
    }),
].join("\n") + "\n";

const downloadTxt = (text, filename) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

export { parseTxt, toTxt, downloadTxt }
