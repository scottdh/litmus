'use server';
import { DomainError, LIGHTS, type Light, type MoveDestination, type TaskId } from '@litmus/core';
import { revalidatePath } from 'next/cache';
import { moveOnMap, rateOnMap, renameOnMap, undoMoveOnMap } from '../composition';
import type { MoveResult, RenameResult } from '../features/map/rename-result';

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
    (kind !== 'chapter' && kind !== 'task')
  ) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  try {
    await renameOnMap({ mapId, kind, id, name });
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
  revalidatePath('/');
  return { ok: true };
}

const isLight = (value: unknown): value is Light => LIGHTS.some((light) => light === value);

export async function rateAction(input: {
  mapId: unknown;
  id: unknown;
  light: unknown;
  note: unknown;
}): Promise<RenameResult> {
  const { mapId, id, light, note } = input;
  if (typeof mapId !== 'string' || typeof id !== 'string' || typeof note !== 'string' || !isLight(light)) {
    return { ok: false, code: 'INVALID_INPUT' };
  }
  try {
    await rateOnMap({ mapId, id, light, note });
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
  revalidatePath('/');
  return { ok: true };
}

function readDestination(to: unknown): MoveDestination | null {
  if (typeof to !== 'object' || to === null) return null;
  const { chapterId, parentId, before } = to as { chapterId?: unknown; parentId?: unknown; before?: unknown };
  if (before !== null && typeof before !== 'string') return null;
  const place = before as TaskId | null;
  if (typeof chapterId === 'string') return { chapterId, before: place };
  if (typeof parentId === 'string') return { parentId: parentId as TaskId, before: place };
  return null;
}

export async function moveAction(input: { mapId: unknown; id: unknown; to: unknown }): Promise<MoveResult> {
  const { mapId, id } = input;
  const to = readDestination(input.to);
  if (typeof mapId !== 'string' || typeof id !== 'string' || to === null) return { ok: false, code: 'INVALID_INPUT' };
  try {
    const undoToken = await moveOnMap({ mapId, id, to });
    revalidatePath('/');
    return { ok: true, undoToken };
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
}

export async function undoMoveAction(token: unknown): Promise<RenameResult> {
  if (typeof token !== 'string') return { ok: false, code: 'INVALID_INPUT' };
  try {
    await undoMoveOnMap(token);
  } catch (error) {
    if (error instanceof DomainError) return { ok: false, code: error.code };
    throw error;
  }
  revalidatePath('/');
  return { ok: true };
}
