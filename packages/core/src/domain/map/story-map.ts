import type { Brand } from '../../kernel/brand.ts';

export type MapId = Brand<string, 'MapId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type TaskId = Brand<string, 'TaskId'>;

export interface Product {
  id: ProductId;
  name: string;
}

export interface Subtask {
  id: TaskId;
  name: string;
}

export interface Task {
  id: TaskId;
  name: string;
  subtasks: Subtask[];
}

export interface Activity {
  id: string;
  name: string;
  tasks: Task[];
}

/** Array order is narrative order. */
export interface StoryMap {
  id: MapId;
  name: string;
  activities: Activity[];
}
