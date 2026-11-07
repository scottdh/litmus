import type { Brand } from '../../kernel/brand.ts';

export type MapId = Brand<string, 'MapId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type StepId = Brand<string, 'StepId'>;
export type TeamId = Brand<string, 'TeamId'>;

/** Who's responsible for turning a task from grey to green. */
export interface Team {
  id: TeamId;
  name: string;
}

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
  /** Only top-level tasks have a team. Their subtasks share it. */
  teamId?: TeamId;
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
  teams: Team[];
  activities: Activity[];
}
