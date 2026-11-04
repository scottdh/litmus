import type { Brand } from './brand.ts';

export type Instant = Brand<string, 'Instant'>;

export interface Clock {
  now(): Instant;
}
