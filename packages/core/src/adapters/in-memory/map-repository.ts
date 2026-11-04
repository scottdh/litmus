import type { MapRecord, MapRepository } from '../../application/ports.ts';

export function createInMemoryMapRepository(records: MapRecord[]): MapRepository {
  return {
    find: (id) => Promise.resolve(records.find((record) => record.map.id === id) ?? null),
  };
}
