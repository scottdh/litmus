import type { Brand } from '../../kernel/brand.ts';

export type MapId = Brand<string, 'MapId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type TaskId = Brand<string, 'TaskId'>;
export type StepId = Brand<string, 'StepId'>;
export type TeamId = Brand<string, 'TeamId'>;
export type PersonaId = Brand<string, 'PersonaId'>;
export type PainPointId = Brand<string, 'PainPointId'>;
export type QuoteId = Brand<string, 'QuoteId'>;
export type IdeaId = Brand<string, 'IdeaId'>;

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

/** Something a user said about a task, in their words. It isn't evidence for a light. */
export interface Quote {
  id: QuoteId;
  text: string;
  /** Who said it, when they match a persona on the map. */
  personaId?: PersonaId;
  /** How the research names them, such as "P3, mechanic". Invented in samples, never real. */
  participant: string;
}

/** Something that hurts. Quotes aren't placed under it: repeats are caught before they're added instead. */
export interface PainPoint {
  id: PainPointId;
  text: string;
}

/** A way we might better support the task. */
export interface Idea {
  id: IdeaId;
  text: string;
}

/** What research says about a task, subtask or step. Each has its own; nothing rolls up. */
export interface Research {
  /** One to four sentences on what the task is and why it's hard. */
  summary: string;
  pains: PainPoint[];
  /** Every quote, in the order it was written. */
  hearing: Quote[];
  ideas: Idea[];
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
  research?: Research;
}

export interface Subtask {
  id: TaskId;
  name: string;
  /** Only when a different team has it. Without one, it follows its task's team. */
  teamId?: TeamId;
  personaIds?: PersonaId[];
  research?: Research;
  steps: Step[];
}

export interface Task {
  id: TaskId;
  name: string;
  /** Its subtasks follow it, unless they have a team of their own. */
  teamId?: TeamId;
  /** Only the ones set on this task. Its subtasks' and steps' personas roll up to it in the view. */
  personaIds?: PersonaId[];
  research?: Research;
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
