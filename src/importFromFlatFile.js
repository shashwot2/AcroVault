// Plain-text import/export. One acronym per line:
//   ACRONYM | Expansion | Description (optional)
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
        // Description may itself contain the separator, so rejoin the rest
        entries.push({ acronym, expansion, description: rest.join(` ${SEPARATOR} `) });
    });

    return { entries, errors };
}

const toTxt = (acronyms) => [
    "# AcroVault export",
    "# ACRONYM | Expansion | Description",
    ...acronyms.map(({ acronym, expansion, description }) =>
        [acronym, expansion, description].filter(Boolean).join(` ${SEPARATOR} `)
    ),
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
