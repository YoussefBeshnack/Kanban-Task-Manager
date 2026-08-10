import { Task, taskManager } from "./taskManager.js";
import { card, emptyList, VALIDATION_RULES, NOTIFICATION_CONFIG } from "./constants.js";
// -----------------------------------------------------------------------------
// DOM Elements Map
// -----------------------------------------------------------------------------
const DOM = {
    addButton: document.querySelector("#add-task-btn"),
    modal: {
        overlay: document.querySelector("#modal-overlay"),
        closeBtn: document.querySelector("#close-modal-btn"),
        title: document.querySelector("#modal-title"),
    },
    form: {
        self: document.querySelector("#task-form"),
        titleInput: document.querySelector("#task-title"),
        descInput: document.querySelector("#task-description"),
        priorityInput: document.querySelector("#task-priority"),
        dueDateInput: document.querySelector("#task-due-date"),
        titleError: document.querySelector("#title-error"),
        dateError: document.querySelector("#date-error"),
        descError: document.querySelector("#description-error"),
        charCount: document.querySelector("#char-count"),
        cancelBtn: document.querySelector("#cancel-btn"),
        submitBtn: document.querySelector("#submit-btn"),
    },
    kanban: {
        todo: {
            count: document.querySelector('.kanban-card[data-status="todo"] [data-role="tasks-count"]'),
            tasks: document.querySelector('.kanban-card[data-status="todo"] [data-role="tasks-list"]'),
        },
        inProgress: {
            count: document.querySelector('.kanban-card[data-status="in-progress"] [data-role="tasks-count"]'),
            tasks: document.querySelector('.kanban-card[data-status="in-progress"] [data-role="tasks-list"]'),
        },
        completed: {
            count: document.querySelector('.kanban-card[data-status="completed"] [data-role="tasks-count"]'),
            tasks: document.querySelector('.kanban-card[data-status="completed"] [data-role="tasks-list"]'),
        },
    },
};
let currentEditingTask = null;
let isFormSubmitted = false;
// -----------------------------------------------------------------------------
// Utilities & Helpers
// -----------------------------------------------------------------------------
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function formatDate(dateString) {
    if (!dateString)
        return "";
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getCreatedAgo(createdAtIso) {
    const createdMs = new Date(createdAtIso).getTime();
    const diffInMs = Date.now() - createdMs;
    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    if (years > 0)
        return `${years}y ago`;
    if (months > 0)
        return `${months}mo ago`;
    if (weeks > 0)
        return `${weeks}w ago`;
    if (days > 0)
        return `${days}d ago`;
    if (hours > 0)
        return `${hours}h ago`;
    return `${Math.max(1, minutes)}m ago`;
}
function formatTaskIndex(index) {
    return `#${(index + 1).toString().padStart(3, "0")}`;
}
function normalizeStatusKey(status) {
    return status === "in-progress" ? "inProgress" : status;
}
function normalizePriorityValue(value) {
    return value === "medium" || value === "high" || value === "low" ? value : "low";
}
function normalizeStatusValue(value) {
    return value === "in-progress" || value === "completed" || value === "todo" ? value : "todo";
}
// -----------------------------------------------------------------------------
// Renderers
// -----------------------------------------------------------------------------
function showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification-toast");
    existingNotification?.remove();
    const typeStyles = {
        success: "bg-emerald-500 text-white",
        error: "bg-red-500 text-white",
        info: "bg-blue-500 text-white",
    };
    const toast = document.createElement("div");
    toast.className = `notification-toast fixed top-5 right-5 z-50 flex items-center px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ease-in-out transform translate-y-0 opacity-100 ${typeStyles[type]}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-y-2");
        setTimeout(() => {
            toast.remove();
        }, NOTIFICATION_CONFIG.FADE_OUT);
    }, NOTIFICATION_CONFIG.DURATION);
}
function renderPriorityBadge(priority) {
    const theme = card.priorityBadge[priority] ?? card.priorityBadge.low;
    return `
    <span class="${theme.bg} ${theme.text} text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wide">
      <span class="w-1.5 h-1.5 rounded-full ${theme.dot}"></span>
      ${escapeHtml(priority)}
    </span>
  `;
}
function renderActionButtons(currentStatusKey, taskId) {
    const allStatuses = ["todo", "inProgress", "completed"];
    const targetStatuses = allStatuses.filter((s) => s !== currentStatusKey);
    return targetStatuses
        .map((statusKey) => {
        const config = card.actionButton[statusKey];
        return `
        <button 
          class="status-btn text-[11px] px-3 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 ${config.class}" 
          data-task-id="${taskId}" 
          data-status="${config.data}"
        >
          <i class="fa-solid ${config.icon} pointer-events-none"></i>
          <span class="pointer-events-none">${config.title}</span>
        </button>
      `;
    })
        .join("");
}
function renderTaskCard(task) {
    const statusKey = normalizeStatusKey(task.status);
    const safeTitle = escapeHtml(task.title);
    const safeDescription = task.description ? escapeHtml(task.description) : "";
    return `
    <article class="group bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all duration-200">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${card.topBar[statusKey]}"></span>
          <span class="text-[10px] font-medium text-slate-400 uppercase tracking-wider">${formatTaskIndex(task.index)}</span>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="edit-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Edit task">
            <i class="fa-solid fa-pen text-xs pointer-events-none"></i>
          </button>
          <button class="delete-btn text-slate-400 hover:text-red-500 hover:bg-red-50 w-7 h-7 rounded-lg flex items-center justify-center transition-colors" data-task-id="${task.id}" title="Delete task">
            <i class="fa-solid fa-trash-can text-xs pointer-events-none"></i>
          </button>
        </div>
      </div>
      
      <h3 class="font-semibold mb-2 leading-snug ${card.title[statusKey]}">${safeTitle}</h3>

      ${safeDescription ? `<p class="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">${safeDescription}</p>` : ""}

      <div class="flex flex-wrap items-center gap-2 mb-4">
        ${renderPriorityBadge(task.priority)}
        ${statusKey === "completed"
        ? `<span class="bg-emerald-100 text-emerald-600 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
          <i class="fa-solid fa-check"></i> Done
        </span>`
        : ""}
      </div>
      
      <div class="flex items-center gap-3 text-xs text-slate-400 pb-3 mb-3 border-b border-slate-100">
        ${task.dueDate
        ? `<div class="flex items-center gap-1.5">
          <i class="fa-regular fa-calendar"></i>
          <span>${formatDate(task.dueDate)}</span>
        </div>`
        : ""}
        <div class="flex items-center gap-1.5" title="Created ${new Date(task.createdAt).toLocaleString()}">
          <i class="fa-regular fa-clock"></i>
          <span>${getCreatedAgo(task.createdAt)}</span>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2">
        ${renderActionButtons(statusKey, task.id)}
      </div>
    </article>
  `;
}
// -----------------------------------------------------------------------------
// Form Validation & Error UI
// -----------------------------------------------------------------------------
function showInputError(inputEl, errorEl, message) {
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
    }
    if (inputEl) {
        inputEl.classList.add("border-red-500", "focus:border-red-500", "focus:ring-red-500");
    }
}
function clearFieldError(inputEl, errorEl) {
    if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.add("hidden");
    }
    if (inputEl) {
        inputEl.classList.remove("border-red-500", "focus:border-red-500", "focus:ring-red-500");
    }
}
function clearFormErrors() {
    isFormSubmitted = false;
    const { titleInput, titleError, dueDateInput, dateError, descInput, descError } = DOM.form;
    clearFieldError(titleInput, titleError);
    clearFieldError(dueDateInput, dateError);
    clearFieldError(descInput, descError);
}
// -----------------------------------------------------------------------------
// Field Validation Functions
// -----------------------------------------------------------------------------
function validateTitle() {
    const title = DOM.form.titleInput?.value.trim() ?? "";
    if (!title) {
        showInputError(DOM.form.titleInput, DOM.form.titleError, "Task title is required.");
        return false;
    }
    if (title.length < VALIDATION_RULES.title.minLength) {
        showInputError(DOM.form.titleInput, DOM.form.titleError, `Title must be at least ${VALIDATION_RULES.title.minLength} characters.`);
        return false;
    }
    if (title.length > VALIDATION_RULES.title.maxLength) {
        showInputError(DOM.form.titleInput, DOM.form.titleError, `Title must be less than ${VALIDATION_RULES.title.maxLength} characters.`);
        return false;
    }
    clearFieldError(DOM.form.titleInput, DOM.form.titleError);
    return true;
}
function validateDueDate() {
    const dueDate = DOM.form.dueDateInput?.value ?? "";
    if (dueDate) {
        const selectedDate = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            showInputError(DOM.form.dueDateInput, DOM.form.dateError, "Due date cannot be in the past.");
            return false;
        }
    }
    clearFieldError(DOM.form.dueDateInput, DOM.form.dateError);
    return true;
}
function validateDescription() {
    const description = DOM.form.descInput?.value ?? "";
    if (description.length > VALIDATION_RULES.description.maxLength) {
        showInputError(DOM.form.descInput, DOM.form.descError, `Description must be less than ${VALIDATION_RULES.description.maxLength} characters.`);
        return false;
    }
    clearFieldError(DOM.form.descInput, DOM.form.descError);
    return true;
}
function validateForm() {
    const isTitleValid = validateTitle();
    const isDateValid = validateDueDate();
    const isDescValid = validateDescription();
    return isTitleValid && isDateValid && isDescValid;
}
function updateCharCount() {
    if (!DOM.form.charCount || !DOM.form.descInput)
        return;
    const currentLength = DOM.form.descInput.value.length;
    DOM.form.charCount.textContent = `${currentLength}/${VALIDATION_RULES.description.maxLength}`;
}
function setupRealtimeValidation() {
    DOM.form.titleInput?.addEventListener("input", () => {
        if (isFormSubmitted || DOM.form.titleInput?.value.trim()) {
            validateTitle();
        }
    });
    DOM.form.dueDateInput?.addEventListener("change", () => {
        validateDueDate();
    });
    DOM.form.descInput?.addEventListener("input", () => {
        updateCharCount();
        validateDescription();
    });
}
// -----------------------------------------------------------------------------
// UI State Controllers
// -----------------------------------------------------------------------------
function toggleModal(open, taskId = null) {
    clearFormErrors();
    currentEditingTask = open && taskId ? taskManager.getTaskById(taskId) : null;
    if (DOM.modal.overlay) {
        DOM.modal.overlay.classList.toggle("flex", open);
        DOM.modal.overlay.classList.toggle("hidden", !open);
    }
    if (!open) {
        DOM.form.self?.reset();
        updateCharCount();
        return;
    }
    const isEditing = Boolean(currentEditingTask);
    if (DOM.modal.title) {
        DOM.modal.title.textContent = isEditing ? "Edit Task" : "Create New Task";
    }
    if (DOM.form.submitBtn) {
        DOM.form.submitBtn.innerHTML = isEditing
            ? `<i class="fa-solid fa-floppy-disk mr-2"></i>Save Changes`
            : `<i class="fa-solid fa-plus mr-2"></i>Add Task`;
    }
    if (currentEditingTask && DOM.form.titleInput && DOM.form.descInput && DOM.form.priorityInput && DOM.form.dueDateInput) {
        DOM.form.titleInput.value = currentEditingTask.title;
        DOM.form.descInput.value = currentEditingTask.description;
        DOM.form.priorityInput.value = currentEditingTask.priority;
        DOM.form.dueDateInput.value = currentEditingTask.dueDate;
    }
    updateCharCount();
}
function renderBoard() {
    const columns = [
        { key: "todo", status: "todo" },
        { key: "inProgress", status: "in-progress" },
        { key: "completed", status: "completed" },
    ];
    columns.forEach(({ key, status }) => {
        const taskList = taskManager.getTasksByStatus(status);
        const columnDom = DOM.kanban[key];
        if (columnDom?.tasks) {
            columnDom.tasks.innerHTML =
                taskList.length > 0 ? taskList.map(renderTaskCard).join("") : emptyList;
        }
        if (columnDom?.count) {
            columnDom.count.textContent = String(taskList.length);
        }
    });
}
// -----------------------------------------------------------------------------
// Handlers & Listeners
// -----------------------------------------------------------------------------
function handleFormSubmit(event) {
    event.preventDefault();
    isFormSubmitted = true;
    if (!validateForm()) {
        return;
    }
    const title = DOM.form.titleInput?.value.trim() ?? "";
    const description = DOM.form.descInput?.value.trim() ?? "";
    const priority = normalizePriorityValue(DOM.form.priorityInput?.value);
    const dueDate = DOM.form.dueDateInput?.value ?? "";
    if (!title)
        return;
    if (currentEditingTask) {
        taskManager.updateTask(currentEditingTask.id, title, description, priority, dueDate);
        showNotification("Task updated successfully!", "success");
    }
    else {
        const newTask = new Task(title, description, priority, dueDate);
        taskManager.addTask(newTask);
        showNotification("Task added successfully!", "success");
    }
    toggleModal(false);
    renderBoard();
}
function handleBoardClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement))
        return;
    const editBtn = target.closest(".edit-btn");
    if (editBtn?.dataset.taskId) {
        toggleModal(true, editBtn.dataset.taskId);
        return;
    }
    const deleteBtn = target.closest(".delete-btn");
    if (deleteBtn?.dataset.taskId) {
        taskManager.deleteTask(deleteBtn.dataset.taskId);
        renderBoard();
        return;
    }
    const statusBtn = target.closest(".status-btn");
    if (statusBtn?.dataset.taskId && statusBtn.dataset.status) {
        taskManager.updateTaskStatus(statusBtn.dataset.taskId, normalizeStatusValue(statusBtn.dataset.status));
        renderBoard();
        return;
    }
}
function initializeEventListeners() {
    DOM.addButton?.addEventListener("click", () => toggleModal(true));
    DOM.modal.closeBtn?.addEventListener("click", () => toggleModal(false));
    DOM.form.cancelBtn?.addEventListener("click", () => toggleModal(false));
    DOM.modal.overlay?.addEventListener("click", (event) => {
        if (event.target === DOM.modal.overlay)
            toggleModal(false);
    });
    DOM.form.self?.addEventListener("submit", handleFormSubmit);
    setupRealtimeValidation();
    document.querySelector("main")?.addEventListener("click", handleBoardClick);
}
// Initialize Application
initializeEventListeners();
renderBoard();
