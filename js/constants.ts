export const TASKS_STORAGE_KEY: string = "tasks";

export type TaskStatus = "todo" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type ColumnKey = "todo" | "inProgress" | "completed";
export type NotificationType = "success" | "error" | "info";

export interface ButtonConfig {
  readonly title: string;
  readonly class: string;
  readonly data: TaskStatus;
  readonly icon: string;
}

export interface PriorityTheme {
  readonly bg: string;
  readonly text: string;
  readonly dot: string;
}

export interface CardTheme {
  readonly topBar: Record<ColumnKey, string>;
  readonly title: Record<ColumnKey, string>;
  readonly priorityBadge: Record<TaskPriority, PriorityTheme>;
  readonly actionButton: Record<ColumnKey, ButtonConfig>;
}

export const card: CardTheme = {
  topBar: {
    todo: "bg-slate-300",
    inProgress: "bg-amber-400",
    completed: "bg-emerald-500",
  },
  title: {
    todo: "text-slate-800",
    inProgress: "text-slate-800",
    completed: "text-slate-500 line-through",
  },
  priorityBadge: {
    low: { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-500" },
    medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
    high: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
  },
  actionButton: {
    todo: {
      icon: "fa-arrow-rotate-left",
      title: "To Do",
      class: "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700",
      data: "todo",
    },
    inProgress: {
      icon: "fa-play",
      title: "Start",
      class: "bg-amber-100 text-amber-700 hover:bg-amber-200",
      data: "in-progress",
    },
    completed: {
      icon: "fa-check",
      title: "Complete",
      class: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
      data: "completed",
    },
  },
};

export const emptyList: string = `
  <div class="flex flex-col items-center justify-center py-12 text-slate-400">
    <i class="fa-regular fa-folder-open text-4xl mb-3 opacity-50"></i>
    <p class="text-sm">No tasks yet</p>
    <p class="text-xs mt-1">Click + to add one</p>
  </div>
`;

export const VALIDATION_RULES: {
  title: {
   minLength: number;
   maxLength: number;
 };
  description: {
   maxLength: number;
 };
} = {
 title: {
   minLength: 3,
   maxLength: 50,
 },
 description: {
   maxLength: 500,
 },
};

export const NOTIFICATION_CONFIG: {
 DURATION: number;
 FADE_OUT: number;
} = {
 DURATION: 3000,
 FADE_OUT: 300,
};