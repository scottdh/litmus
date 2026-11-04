/** Rules with a reason each. Run by `pnpm arch` and in CI. @type {import('dependency-cruiser').IConfiguration} */
const core = '^packages/core/src';
module.exports = {
  forbidden: [
    {
      name: 'kernel-is-pure',
      comment: 'The kernel is shared by everything, so it depends on nothing internal.',
      severity: 'error',
      from: { path: `${core}/kernel` },
      to: { path: `${core}/(domain|application|adapters)|^apps/` },
    },
    {
      name: 'domain-is-pure',
      comment: 'Domain rules must be testable with no I/O. Only the kernel is allowed.',
      severity: 'error',
      from: { path: `${core}/domain` },
      to: { path: `${core}/(application|adapters)|^apps/` },
    },
    {
      name: 'domain-no-packages',
      comment: 'No third-party code or Node I/O in the domain or kernel.',
      severity: 'error',
      from: { path: `${core}/(domain|kernel)`, pathNot: '\\.test\\.ts$' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'core'] },
    },
    {
      name: 'application-no-adapters',
      comment: 'Use cases speak to ports. Adapters are chosen in composition.',
      severity: 'error',
      from: { path: `${core}/application` },
      to: { path: `${core}/adapters|^apps/` },
    },
    {
      name: 'core-no-web',
      comment: 'Core knows nothing about the app that hosts it.',
      severity: 'error',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      name: 'adapters-only-in-composition',
      comment: 'Only composition picks adapters, so a screen cannot quietly depend on sample data or a database.',
      severity: 'error',
      from: { path: '^apps/web/src', pathNot: '^apps/web/src/composition' },
      to: { path: `${core}/adapters` },
    },
    {
      name: 'ui-no-features',
      comment: 'Shared components know nothing about product features.',
      severity: 'error',
      from: { path: '^apps/web/src/ui' },
      to: { path: '^apps/web/src/(features|composition|app)' },
    },
    {
      name: 'no-circular',
      comment: 'Cycles make layers meaningless.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-dev-dep',
      comment: 'Shipped code must not rely on a devDependency.',
      severity: 'error',
      from: { path: '^(apps|packages)/[^/]+/src', pathNot: '\\.test\\.tsx?$' },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'no-unresolvable',
      comment: 'Every import must resolve.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.next|node_modules|next-env\\.d\\.ts' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs'],
    },
  },
};
