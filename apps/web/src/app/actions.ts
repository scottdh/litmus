'use server';
import { DomainError } from '@litmus/core';
import { revalidatePath } from 'next/cache';
import { renameOnMap } from '../composition';
import type { RenameResult } from '../features/map/rename-result';

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
