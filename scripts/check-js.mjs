import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const ignoredDirectories = new Set(['.git', '.claude', 'node_modules']);
const files = [];

function collectFiles(dir) {
    for (const entry of readdirSync(dir)) {
        if (ignoredDirectories.has(entry)) continue;

        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) {
            collectFiles(path);
        } else if (entry.endsWith('.js') || entry.endsWith('.mjs')) {
            files.push(path);
        }
    }
}

collectFiles(root);
files.sort();

for (const file of files) {
    const displayPath = relative(root, file);
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    console.log(`ok ${displayPath}`);
}

console.log(`Checked ${files.length} JavaScript files.`);
