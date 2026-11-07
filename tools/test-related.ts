// Runs only the tests related to the given files, in every package that has tests.
// Paths are taken from the repo root. Every package gets every file, because web imports core's source.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';

export interface RelatedPlan {
  runs: { cwd: string; files: string[] }[];
  ignored: string[];
}

export function planRelatedRuns(root: string, packages: string[], paths: string[]): RelatedPlan {
  const files: string[] = [];
  const ignored: string[] = [];
  for (const path of paths) {
    const absolute = isAbsolute(path) ? path : resolve(root, path);
    const inPackage = packages.some((pkg) => !relative(join(root, pkg), absolute).startsWith('..'));
    if (inPackage) files.push(absolute);
    else ignored.push(path);
  }
  const runs = files.length === 0 ? [] : packages.map((pkg) => ({ cwd: join(root, pkg), files }));
  return { runs, ignored };
}

function packagesWithTests(root: string): string[] {
  return ['packages', 'apps'].flatMap((group) =>
    readdirSync(join(root, group))
      .map((name) => `${group}/${name}`)
      .filter((pkg) => {
        const manifest = join(root, pkg, 'package.json');
        if (!existsSync(manifest)) return false;
        const { scripts } = JSON.parse(readFileSync(manifest, 'utf8')) as { scripts?: Record<string, string> };
        return scripts?.test !== undefined;
      }),
  );
}

if (import.meta.main) {
  const root = process.cwd();
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error('pnpm test:related: give the files you changed, from the repo root.');
    process.exit(1);
  }

  const plan = planRelatedRuns(root, packagesWithTests(root), paths);
  if (plan.ignored.length > 0) console.log(`Not in a package with tests, skipped: ${plan.ignored.join(', ')}`);
  if (plan.runs.length === 0) console.log('No files in a package with tests, so no tests ran.');

  let failed = false;
  for (const run of plan.runs) {
    console.log(`\n▶ ${relative(root, run.cwd)}`);
    const result = spawnSync(
      'pnpm',
      ['exec', 'vitest', 'related', '--run', '--passWithNoTests', '--maxWorkers=2', ...run.files],
      { cwd: run.cwd, stdio: 'inherit' },
    );
    if (result.status !== 0) failed = true;
  }
  process.exit(failed ? 1 : 0);
}
