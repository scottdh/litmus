// Fails when a doc cites a repo path that does not exist. Stale docs are stale instructions.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const ROOTS = ['apps/', 'packages/', 'tools/', 'docs/', '.github/'];
const ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'DESIGN.md', 'README.md'];
const IGNORE_MARKER = '<!-- doc-paths: ignore -->';

export function citedPaths(markdown: string): string[] {
  const spans = [...markdown.matchAll(/`([^`\n]+)`/g)].map((match) => match[1] ?? '');
  return spans
    .filter((span) => ROOT_FILES.includes(span) || ROOTS.some((root) => span.startsWith(root)))
    .filter((span) => !/[*<>{}\s]/.test(span));
}

const docs = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'], {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean)
  .filter((file) => existsSync(file));

const missing = docs.flatMap((doc) => {
  const text = readFileSync(doc, 'utf8');
  if (text.includes(IGNORE_MARKER)) return [];
  return citedPaths(text)
    .filter((path) => !existsSync(path))
    .map((path) => `${doc}: cites ${path}, which does not exist`);
});

if (missing.length > 0) {
  console.error(missing.join('\n'));
  process.exit(1);
}
console.log(`Doc paths OK (${String(docs.length)} docs checked)`);
