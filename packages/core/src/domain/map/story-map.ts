import type { Brand } from '../../kernel/brand.ts';

export type MapId = Brand<string, 'MapId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type StepId = Brand<string, 'StepId'>;

export interface Product {
  id: ProductId;
  name: string;
}

/** A breakdown of a subtask. Takes no light, and nothing about it reaches a rating. */
export interface Step {
  id: StepId;
  name: string;
  note: string;
}

export interface Subtask {
  id: TaskId;
  name: string;
  steps: Step[];
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
