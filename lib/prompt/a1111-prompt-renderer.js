export function renderA1111Prompt(prompt) {
    return String(prompt || '')
        .replace(/\r\n?/g, '\n')
        .trim()
        .replace(/\\{2,}(?=[()])/g, '\\');
}
