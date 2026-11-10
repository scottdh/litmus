'use server';
import {
  DomainError,
  LIGHTS,
  PERSONA_ICONS,
  type AddDestination,
  type Light,
  type MoveDestination,
  type StepDestination,
  type StepId,
  type TaskId,
} from '@litmus/core';
import { revalidatePath } from 'next/cache';
import {
  addChapterOnMap,
  addStepOnMap,
  addTaskOnMap,
  addPersonaOnMap,
  addTeamOnMap,
  assignTeamOnMap,
  setPersonaIconOnMap,
  setPersonaOnMap,
  moveOnMap,
  rateOnMap,
  removeTeamOnMap,
  removePersonaOnMap,
  renameOnMap,
  setStepNoteOnMap,
  undoChangeOnMap,
} from '../composition';
import type { AddResult, MoveResult, RenameResult } from '../features/map/rename-result';

/** Every page shows the map, the task view included, so a change refreshes them all. */
const refresh = () => {
  revalidatePath('/', 'layout');
};

/** Domain failures go back as stable codes, so a raw message never reaches the page. */
async function run(change: () => Promise<void>): Promise<RenameResult> {
  try {
    await change();
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
  refresh();
  return { ok: true };
}

/** Reachable by anyone who can reach the server, so nothing about the input is assumed. */
export async function renameAction(input: {
  mapId: unknown;
  kind: unknown;
  id: unknown;
  name: unknown;
}): Promise<RenameResult> {
  const { mapId, kind, id, name } = input;
  if (
    typeof mapId !== 'string' ||
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    (kind !== 'chapter' && kind !== 'task' && kind !== 'step' && kind !== 'team' && kind !== 'persona')
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return run(() => renameOnMap({ mapId, kind, id, name }));
}

const isLight = (value: unknown): value is Light => LIGHTS.some((light) => light === value);

export async function rateAction(input: {
  mapId: unknown;
  id: unknown;
  light: unknown;
  note: unknown;
}): Promise<MoveResult> {
  const { mapId, id, light, note } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string' || typeof note !== 'string' || !isLight(light)) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  try {
    const undoToken = await rateOnMap({ mapId, id, light, note });
    refresh();
    return { ok: true, undoToken };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

function readDestination(to: unknown): MoveDestination | StepDestination | null {
  if (typeof to !== 'object' || to === null) return null;
  const { chapterId, parentId, subtaskId, before } = to as {
    chapterId?: unknown;
    parentId?: unknown;
    subtaskId?: unknown;
    before?: unknown;
  };
  if (before !== null && typeof before !== 'string') return null;
  const place = before as TaskId | null;
  if (typeof chapterId === 'string') return { chapterId, before: place };
  if (typeof parentId === 'string') return { parentId: parentId as TaskId, before: place };
  if (typeof subtaskId === 'string') return { subtaskId: subtaskId as TaskId, before: before as StepId | null };
  return null;
}

export async function moveAction(input: { mapId: unknown; id: unknown; to: unknown }): Promise<MoveResult> {
  const { mapId, id } = input;
  const to = readDestination(input.to);
  if (typeof mapId !== 'string' || typeof id !== 'string' || to === null) return { ok: false, code: 'INVALID_INPUT' };
  try {
    const undoToken = await moveOnMap({ mapId, id, to });
    refresh();
    return { ok: true, undoToken };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

async function runAdd(add: () => Promise<{ id: string; undoToken: string }>): Promise<AddResult> {
  try {
    const added = await add();
    refresh();
    return { ok: true, ...added };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

function readAddDestination(to: unknown): AddDestination | null {
  if (typeof to !== 'object' || to === null) return null;
  const { chapterId, parentId } = to as { chapterId?: unknown; parentId?: unknown };
  if (typeof chapterId === 'string') return { chapterId };
  if (typeof parentId === 'string') return { parentId: parentId as TaskId };
  return null;
}

export async function addTaskAction(input: {
  mapId: unknown;
  name: unknown;
  to: unknown;
  teamId?: unknown;
  personaId?: unknown;
}): Promise<AddResult> {
  const { mapId, name } = input;
  const to = readAddDestination(input.to);
  const teamId = input.teamId ?? null;
  const personaId = input.personaId ?? null;
  if (
    typeof mapId !== 'string' ||
    typeof name !== 'string' ||
    to === null ||
    (teamId !== null && typeof teamId !== 'string') ||
    (personaId !== null && typeof personaId !== 'string')
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return runAdd(() => addTaskOnMap({ mapId, name, to, teamId, personaId }));
}

export async function addStepAction(input: { mapId: unknown; name: unknown; subtaskId: unknown }): Promise<AddResult> {
  const { mapId, name, subtaskId } = input;
  if (typeof mapId !== 'string' || typeof name !== 'string' || typeof subtaskId !== 'string') {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return runAdd(() => addStepOnMap({ mapId, name, subtaskId }));
}

export async function noteStepAction(input: { mapId: unknown; id: unknown; note: unknown }): Promise<RenameResult> {
  const { mapId, id, note } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string' || typeof note !== 'string') {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return run(() => setStepNoteOnMap({ mapId, id, note }));
}

export async function addChapterAction(input: { mapId: unknown; name: unknown; before: unknown }): Promise<AddResult> {
  const { mapId, name, before } = input;
  if (typeof mapId !== 'string' || typeof name !== 'string' || (before !== null && typeof before !== 'string')) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return runAdd(() => addChapterOnMap({ mapId, name, before }));
}

export async function assignTeamAction(input: { mapId: unknown; id: unknown; teamId: unknown }): Promise<RenameResult> {
  const { mapId, id, teamId } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string' || (teamId !== null && typeof teamId !== 'string')) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return run(() => assignTeamOnMap({ mapId, id, teamId }));
}

export async function setPersonaAction(input: {
  mapId: unknown;
  id: unknown;
  personaId: unknown;
  on: unknown;
}): Promise<RenameResult> {
  const { mapId, id, personaId, on } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string' || typeof personaId !== 'string' || typeof on !== 'boolean') {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return run(() => setPersonaOnMap({ mapId, id, personaId, on }));
}

export async function addTeamAction(input: { mapId: unknown; name: unknown }): Promise<AddResult> {
  const { mapId, name } = input;
  if (typeof mapId !== 'string' || typeof name !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  return runAdd(() => addTeamOnMap({ mapId, name }));
}

export async function addPersonaAction(input: { mapId: unknown; name: unknown }): Promise<AddResult> {
  const { mapId, name } = input;
  if (typeof mapId !== 'string' || typeof name !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  return runAdd(() => addPersonaOnMap({ mapId, name }));
}

export async function setPersonaIconAction(input: {
  mapId: unknown;
  id: unknown;
  icon: unknown;
}): Promise<RenameResult> {
  const { mapId, id, icon } = input;
  const known = PERSONA_ICONS.find((other) => other === icon);
  if (typeof mapId !== 'string' || typeof id !== 'string' || known === undefined) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  return run(() => setPersonaIconOnMap({ mapId, id, icon: known }));
}

export async function removeTeamAction(input: { mapId: unknown; id: unknown }): Promise<MoveResult> {
  const { mapId, id } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  try {
    const { undoToken } = await removeTeamOnMap({ mapId, teamId: id });
    refresh();
    return { ok: true, undoToken };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

export async function undoChangeAction(token: unknown): Promise<RenameResult> {
  if (typeof token !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  return run(() => undoChangeOnMap(token));
}

export async function removePersonaAction(input: { mapId: unknown; id: unknown }): Promise<MoveResult> {
  const { mapId, id } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  try {
    const { undoToken } = await removePersonaOnMap({ mapId, personaId: id });
    refresh();
    return { ok: true, undoToken };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}
