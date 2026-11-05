import type { MapRecord, MapRepository } from '../../application/ports.ts';

export function createInMemoryMapRepository(initial: MapRecord[]): MapRepository {
  const records = new Map(initial.map((record) => [record.map.id, record]));
  return {
    find: (id) => Promise.resolve(records.get(id) ?? null),
    save: (record) => {
      records.set(record.map.id, record);
      return Promise.resolve();
    },
  };
}
