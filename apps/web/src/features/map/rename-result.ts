export type RenameResult = { ok: true } | { ok: false; code: string };

export type Rename = (input: {
  mapId: string;
  kind: 'chapter' | 'task';
  id: string;
  name: string;
}) => Promise<RenameResult>;
