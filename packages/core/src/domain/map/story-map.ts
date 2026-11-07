import type { Brand } from '../../kernel/brand.ts';

export type MapId = Brand<string, 'MapId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type StepId = Brand<string, 'StepId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type PersonaId = Brand<string, 'PersonaId'>;

/** Who's responsible for turning a task from grey to green. */
export interface Team {
  id: TeamId;
  name: string;
}

/** The glyphs a persona can wear. Drawn in one colour, because colour on the map means a light. */
export const PERSONA_ICONS = ['person', 'wrench', 'bell', 'box', 'key', 'house', 'phone', 'star'] as const;
export type PersonaIcon = (typeof PERSONA_ICONS)[number];

/** Who carries a task out. Unlike a team, any number of personas can share a task. */
export interface Persona {
  id: PersonaId;
  name: string;
  icon: PersonaIcon;
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
  personaIds?: PersonaId[];
}

export interface Subtask {
  id: TaskId;
  name: string;
  /** Only when a different team has it. Without one, it follows its task's team. */
  teamId?: TeamId;
  personaIds?: PersonaId[];
  steps: Step[];
}

export interface Task {
  id: TaskId;
  name: string;
  /** Its subtasks follow it, unless they have a team of their own. */
  teamId?: TeamId;
  /** Only the ones set on this task. Its subtasks' and steps' personas roll up to it in the view. */
  personaIds?: PersonaId[];
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
  personas: Persona[];
  activities: Activity[];
}
