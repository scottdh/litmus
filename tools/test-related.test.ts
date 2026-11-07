import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planRelatedRuns } from './test-related.ts';

const root = '/repo';
const packages = ['packages/core', 'apps/web'];

void test('passes root-relative paths to every package as absolute paths', () => {
  const plan = planRelatedRuns(root, packages, [
    'packages/core/src/domain/map/step.ts',
    'apps/web/src/features/map/drop.ts',
  ]);
  const files = ['/repo/packages/core/src/domain/map/step.ts', '/repo/apps/web/src/features/map/drop.ts'];
  assert.deepEqual(plan.runs, [
    { cwd: '/repo/packages/core', files },
    { cwd: '/repo/apps/web', files },
  ]);
  assert.deepEqual(plan.ignored, []);
});

void test('runs web tests for a core change, since web imports core source', () => {
  const plan = planRelatedRuns(root, packages, ['packages/core/src/domain/map/step.ts']);
  assert.deepEqual(
    plan.runs.map((run) => run.cwd),
    ['/repo/packages/core', '/repo/apps/web'],
  );
});

void test('ignores paths outside every package and reports them', () => {
  const plan = planRelatedRuns(root, packages, ['tools/pr.ts', 'packages/core/src/index.ts']);
  assert.deepEqual(plan.ignored, ['tools/pr.ts']);
  assert.deepEqual(plan.runs[0]?.files, ['/repo/packages/core/src/index.ts']);
});

void test('plans no runs when no path is inside a package', () => {
  const plan = planRelatedRuns(root, packages, ['AGENTS.md']);
  assert.deepEqual(plan.runs, []);
  assert.deepEqual(plan.ignored, ['AGENTS.md']);
});

void test('accepts absolute paths and paths with ./', () => {
  const plan = planRelatedRuns(root, packages, ['./apps/web/src/a.ts', '/repo/packages/core/src/b.ts']);
  assert.deepEqual(plan.runs[0]?.files, ['/repo/apps/web/src/a.ts', '/repo/packages/core/src/b.ts']);
});
