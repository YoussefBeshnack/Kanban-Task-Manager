import { TASKS_STORAGE_KEY, TaskStatus, TaskPriority } from "./constants.js";

export interface TaskDTO {
  id?: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  status?: TaskStatus;
  createdAt?: string;
  index?: number;
}

function normalizeTaskPriority(value: unknown): TaskPriority {
  return value === "medium" || value === "high" || value === "low" ? value : "low";
}

function normalizeTaskStatus(value: unknown): TaskStatus {
  return value === "in-progress" || value === "completed" || value === "todo" ? value : "todo";
}

function getStoredValue(source: unknown, key: string): unknown {
  if (typeof source !== "object" || source === null) return undefined;
  return Reflect.get(source, key);
}

export class Task {
  public id: string;
  public createdAt: string;
  public index: number;

  constructor(
    public title: string,
    public description: string,
    public priority: TaskPriority,
    public dueDate: string,
    public status: TaskStatus = "todo",
    id?: string,
    createdAt?: string,
    index: number = 0
  ) {
    this.id = id ?? crypto.randomUUID();
    this.createdAt = createdAt ?? new Date().toISOString();
    this.index = index;
  }

  public static fromJSON(raw: unknown): Task {
    const title = getStoredValue(raw, "title");
    const description = getStoredValue(raw, "description");
    const priority = getStoredValue(raw, "priority");
    const dueDate = getStoredValue(raw, "dueDate");
    const status = getStoredValue(raw, "status");
    const id = getStoredValue(raw, "id");
    const createdAt = getStoredValue(raw, "createdAt");
    const index = getStoredValue(raw, "index");

    return new Task(
      typeof title === "string" ? title : "",
      typeof description === "string" ? description : "",
      normalizeTaskPriority(priority),
      typeof dueDate === "string" ? dueDate : "",
      normalizeTaskStatus(status),
      typeof id === "string" ? id : undefined,
      typeof createdAt === "string" ? createdAt : undefined,
      typeof index === "number" ? index : 0
    );
  }

  public editTask(title: string, description: string, priority: TaskPriority, dueDate: string): void {
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.dueDate = dueDate;
  }
}

class TaskManager {
  private tasks: Task[] = [];

  constructor() {
    this.tasks = this.loadTasks();
    this.reindexTasks();
  }

  public getTasksByStatus(status: TaskStatus): Task[] {
    return this.tasks
      .filter((task) => task.status === status)
      .map((task) => Task.fromJSON({ ...task }));
  }

  public getTaskById(id: string): Task | null {
    const task = this.tasks.find((t) => t.id === id);
    return task ? Task.fromJSON({ ...task }) : null;
  }

  public addTask(task: Task): void {
    this.tasks.push(task);
    this.saveTasks();
  }

  public updateTaskStatus(id: string, status: TaskStatus): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = status;
      this.saveTasks();
    }
  }

  public updateTask(
    id: string,
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string
  ): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.editTask(title, description, priority, dueDate);
      this.saveTasks();
    }
  }

  public deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
    this.saveTasks();
  }

  private reindexTasks(): void {
    this.tasks.forEach((task, idx) => {
      task.index = idx;
    });
  }

  private saveTasks(): void {
    this.reindexTasks();
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (error) {
      console.error("[TaskManager]: Failed to sync tasks to localStorage", error);
    }
  }

  private loadTasks(): Task[] {
    const tasksData = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!tasksData) return [];

    try {
      const rawTasks: unknown = JSON.parse(tasksData);
      if (!Array.isArray(rawTasks)) return [];
      return rawTasks.map((task) => Task.fromJSON(task));
    } catch (error) {
      console.error("[TaskManager]: Malformed localStorage payload encountered", error);
      return [];
    }
  }
}

export const taskManager = new TaskManager();