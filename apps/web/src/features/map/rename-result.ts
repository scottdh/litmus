import type { Light } from '@litmus/core';
import type { Destination } from './drop';

export type RenameResult = { ok: true } | { ok: false; code: string };

export type Rate = (input: { mapId: string; id: string; light: Light; note: string }) => Promise<RenameResult>;

export type Rename = (input: {
  mapId: string;
  kind: 'chapter' | 'task' | 'step' | 'team';
  id: string;
  name: string;
}) => Promise<RenameResult>;

export type MoveResult = { ok: true; undoToken: string } | { ok: false; code: string };

export type Move = (input: { mapId: string; id: string; to: Destination }) => Promise<MoveResult>;

export type UndoChange = (token: string) => Promise<RenameResult>;

export type AddResult = { ok: true; id: string; undoToken: string } | { ok: false; code: string };

export type AddTask = (input: {
  mapId: string;
  name: string;
  to: { chapterId: string } | { parentId: string };
  /** Only for a new top-level task. */
  teamId?: string | null;
}) => Promise<AddResult>;

export type AddStep = (input: { mapId: string; name: string; subtaskId: string }) => Promise<AddResult>;

export type NoteStep = (input: { mapId: string; id: string; note: string }) => Promise<RenameResult>;

export type AddChapter = (input: { mapId: string; name: string; before: string | null }) => Promise<AddResult>;

export type AssignTeam = (input: { mapId: string; id: string; teamId: string | null }) => Promise<RenameResult>;

export type RemoveTeam = (input: { mapId: string; id: string }) => Promise<MoveResult>;

export type AddTeam = (input: { mapId: string; name: string }) => Promise<AddResult>;
