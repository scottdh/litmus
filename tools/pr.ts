// The normal way onto main: rebase, scan for secrets, push, open the PR, turn on auto-merge. Then stop.
import { execFileSync } from 'node:child_process';

function run(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
}

function fail(message: string): never {
  console.error(`pnpm pr: ${message}`);
  process.exit(1);
}

const branch = run('git', ['branch', '--show-current']);
if (branch === 'main' || branch === '') fail('refusing to run on main. Work on a branch in your own worktree.');
if (run('git', ['status', '--porcelain']) !== '') fail('commit or stash your changes first.');

run('git', ['fetch', 'origin', 'main']);
run('git', ['rebase', 'origin/main']);

try {
  run('gitleaks', ['git', '--no-banner', '--redact', `--log-opts=origin/main..HEAD`]);
} catch {
  fail('gitleaks failed or found a secret. Nothing was pushed.');
}

run('git', ['push', '--force-with-lease', '-u', 'origin', branch]);

const prs = JSON.parse(run('gh', ['pr', 'list', '--head', branch, '--json', 'url'])) as { url: string }[];
let url = prs[0]?.url;
if (url === undefined) {
  const title = run('git', ['log', 'origin/main..HEAD', '--reverse', '--format=%s']).split('\n')[0] ?? branch;
  const commits = run('git', ['log', 'origin/main..HEAD', '--reverse', '--format=- %s']);
  const issue = /-(\d+)$/.exec(branch)?.[1];
  const body = [
    commits,
    issue === undefined ? '' : `\nCloses #${issue}`,
    '\n🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ].join('\n');
  url = run('gh', ['pr', 'create', '--title', title, '--body', body, '--head', branch]);
}

run('gh', ['pr', 'merge', url, '--auto', '--rebase']);
console.log(`${url}\nAuto-merge is on. You're done: don't wait on CI.`);
