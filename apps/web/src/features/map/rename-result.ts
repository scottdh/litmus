import type { Light } from '@litmus/core';
import type { Destination } from './drop';

export type RenameResult = { ok: true } | { ok: false; code: string };

export type Rate = (input: { mapId: string; id: string; light: Light; note: string }) => Promise<RenameResult>;

export type Rename = (input: {
  mapId: string;
  kind: 'chapter' | 'task';
  id: string;
  name: string;
}) => Promise<RenameResult>;

export type MoveResult = { ok: true; undoToken: string } | { ok: false; code: string };

export type Move = (input: { mapId: string; id: string; to: Destination }) => Promise<MoveResult>;

export type UndoMove = (token: string) => Promise<RenameResult>;
