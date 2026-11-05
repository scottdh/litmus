import type { Product, StoryMap, MapId } from '../domain/map/story-map.ts';
import type { Rating } from '../domain/map/rating.ts';

export interface MapRecord {
  map: StoryMap;
  product: Product;
  ratings: Rating[];
}

export interface MapRepository {
  find(id: MapId): Promise<MapRecord | null>;
  save(record: MapRecord): Promise<void>;
}
