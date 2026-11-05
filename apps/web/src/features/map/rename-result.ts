import type { Light } from '@litmus/core';

export type RenameResult = { ok: true } | { ok: false; code: string };

export type Rate = (input: { mapId: string; id: string; light: Light; note: string }) => Promise<RenameResult>;

export type Rename = (input: {
  mapId: string;
  kind: 'chapter' | 'task';
  id: string;
  name: string;
}) => Promise<RenameResult>;
