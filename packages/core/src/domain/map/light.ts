/** Fixed order, used wherever lights are listed or stacked. Never sort tasks by it. */
export const LIGHTS = ['green', 'yellow', 'red', 'grey', 'out-of-scope'] as const;

export type Light = (typeof LIGHTS)[number];
