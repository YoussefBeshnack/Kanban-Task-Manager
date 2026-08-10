import { TASKS_STORAGE_KEY } from "./constants.js";
function normalizeTaskPriority(value) {
    return value === "medium" || value === "high" || value === "low" ? value : "low";
}
function normalizeTaskStatus(value) {
    return value === "in-progress" || value === "completed" || value === "todo" ? value : "todo";
}
function getStoredValue(source, key) {
    if (typeof source !== "object" || source === null)
        return undefined;
    return Reflect.get(source, key);
}
export class Task {
    title;
    description;
    priority;
    dueDate;
    status;
    id;
    createdAt;
    index;
    constructor(title, description, priority, dueDate, status = "todo", id, createdAt, index = 0) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.status = status;
        this.id = id ?? crypto.randomUUID();
        this.createdAt = createdAt ?? new Date().toISOString();
        this.index = index;
    }
    static fromJSON(raw) {
        const title = getStoredValue(raw, "title");
        const description = getStoredValue(raw, "description");
        const priority = getStoredValue(raw, "priority");
        const dueDate = getStoredValue(raw, "dueDate");
        const status = getStoredValue(raw, "status");
        const id = getStoredValue(raw, "id");
        const createdAt = getStoredValue(raw, "createdAt");
        const index = getStoredValue(raw, "index");
        return new Task(typeof title === "string" ? title : "", typeof description === "string" ? description : "", normalizeTaskPriority(priority), typeof dueDate === "string" ? dueDate : "", normalizeTaskStatus(status), typeof id === "string" ? id : undefined, typeof createdAt === "string" ? createdAt : undefined, typeof index === "number" ? index : 0);
    }
    editTask(title, description, priority, dueDate) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
    }
}
class TaskManager {
    tasks = [];
    constructor() {
        this.tasks = this.loadTasks();
        this.reindexTasks();
    }
    getTasksByStatus(status) {
        return this.tasks
            .filter((task) => task.status === status)
            .map((task) => Task.fromJSON({ ...task }));
    }
    getTaskById(id) {
        const task = this.tasks.find((t) => t.id === id);
        return task ? Task.fromJSON({ ...task }) : null;
    }
    addTask(task) {
        this.tasks.push(task);
        this.saveTasks();
    }
    updateTaskStatus(id, status) {
        const task = this.tasks.find((t) => t.id === id);
        if (task) {
            task.status = status;
            this.saveTasks();
        }
    }
    updateTask(id, title, description, priority, dueDate) {
        const task = this.tasks.find((t) => t.id === id);
        if (task) {
            task.editTask(title, description, priority, dueDate);
            this.saveTasks();
        }
    }
    deleteTask(taskId) {
        this.tasks = this.tasks.filter((task) => task.id !== taskId);
        this.saveTasks();
    }
    reindexTasks() {
        this.tasks.forEach((task, idx) => {
            task.index = idx;
        });
    }
    saveTasks() {
        this.reindexTasks();
        try {
            localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(this.tasks));
        }
        catch (error) {
            console.error("[TaskManager]: Failed to sync tasks to localStorage", error);
        }
    }
    loadTasks() {
        const tasksData = localStorage.getItem(TASKS_STORAGE_KEY);
        if (!tasksData)
            return [];
        try {
            const rawTasks = JSON.parse(tasksData);
            if (!Array.isArray(rawTasks))
                return [];
            return rawTasks.map((task) => Task.fromJSON(task));
        }
        catch (error) {
            console.error("[TaskManager]: Malformed localStorage payload encountered", error);
            return [];
        }
    }
}
export const taskManager = new TaskManager();
