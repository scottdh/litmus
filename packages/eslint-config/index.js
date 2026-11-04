import tseslint from 'typescript-eslint';

const TIME_BAN = [
  {
    selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
    message: 'Time comes from the injected Clock, so tests can pin it.',
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
    message: 'Time comes from the injected Clock, so tests can pin it.',
  },
];

const hardcodedColour = '#[0-9a-fA-F]{3,8}\\b|\\b(rgb|rgba|hsl|hsla|oklch|oklab)\\(|-\\[(#|rgb|hsl|oklch)';
const COLOUR_MESSAGE = 'Colour comes from tokens in globals.css. See DESIGN.md.';
const TRANSITION_MESSAGE = 'Name the properties that transition. transition-all animates things you did not intend.';

const DESIGN_BAN = [
  { selector: `Literal[value=/${hardcodedColour}/]`, message: COLOUR_MESSAGE },
  { selector: `TemplateElement[value.raw=/${hardcodedColour}/]`, message: COLOUR_MESSAGE },
  { selector: 'Literal[value=/\\btransition-all\\b/]', message: TRANSITION_MESSAGE },
  { selector: 'TemplateElement[value.raw=/\\btransition-all\\b/]', message: TRANSITION_MESSAGE },
  {
    selector: "JSXExpressionContainer > MemberExpression[property.name='message']",
    message: 'Never render a raw error message. Map the error code to written copy.',
  },
];

export function createConfig(tsconfigRootDir) {
  return tseslint.config(
    {
      ignores: [
        '**/node_modules/**',
        '**/.next/**',
        '**/next-env.d.ts',
        '**/*.cjs',
        '**/*.mjs',
        'eslint.config.js',
        'packages/eslint-config/**',
      ],
    },
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: { parserOptions: { projectService: true, tsconfigRootDir } },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              { name: 'uuid', message: 'Use the ids in the kernel.' },
              { name: 'moment', message: 'Use the Clock in the kernel.' },
            ],
          },
        ],
      },
    },
    {
      files: ['packages/core/src/{kernel,domain,application}/**/*.ts'],
      ignores: ['**/*.test.ts'],
      rules: { 'no-restricted-syntax': ['error', ...TIME_BAN] },
    },
    {
      files: ['apps/web/src/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-syntax': ['error', ...DESIGN_BAN],
        'no-restricted-imports': [
          'error',
          {
            patterns: [{ group: ['@base-ui/*'], message: 'Import our components from src/ui instead.' }],
          },
        ],
      },
    },
    {
      files: ['apps/web/src/ui/**/*.{ts,tsx}'],
      rules: { 'no-restricted-imports': 'off' },
    },
  );
}
