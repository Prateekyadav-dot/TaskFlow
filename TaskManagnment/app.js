// Task Management Board - JavaScript
// Global variables
let tasks = [];
let currentEditingTask = null;
let draggedTask = null;

// DOM Elements
const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const taskForm = document.getElementById("taskForm");
const modalTitle = document.getElementById("modalTitle");

// Task containers
const todoTasks = document.getElementById("todoTasks");
const inprogressTasks = document.getElementById("inprogressTasks");
const doneTasks = document.getElementById("doneTasks");

// Task counts
const todoCount = document.getElementById("todoCount");
const inprogressCount = document.getElementById("inprogressCount");
const doneCount = document.getElementById("doneCount");

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  initializeEventListeners();
  renderAllTasks();
  updateTaskCounts();
});

// Event Listeners
function initializeEventListeners() {
  // Modal controls
  addTaskBtn.addEventListener("click", openAddTaskModal);
  closeModal.addEventListener("click", closeTaskModal);
  cancelBtn.addEventListener("click", closeTaskModal);
  taskModal.addEventListener("click", (e) => {
    if (e.target === taskModal) closeTaskModal();
  });

  // Form submission
  taskForm.addEventListener("submit", handleTaskSubmit);

  // Drag and drop
  initializeDragAndDrop();
}

// Modal Functions
function openAddTaskModal() {
  currentEditingTask = null;
  modalTitle.textContent = "Add New Task";
  taskForm.reset();
  taskModal.classList.add("active");
}

function openEditTaskModal(taskId) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  currentEditingTask = task;
  modalTitle.textContent = "Edit Task";

  // Populate form
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDescription").value = task.description;
  document.getElementById("taskPriority").value = task.priority;
  document.getElementById("taskDueDate").value = task.dueDate;

  taskModal.classList.add("active");
}

function closeTaskModal() {
  taskModal.classList.remove("active");
  taskForm.reset();
  currentEditingTask = null;
}

// Task Management Functions
function handleTaskSubmit(e) {
  e.preventDefault();

  const taskData = {
    title: document.getElementById("taskTitle").value,
    description: document.getElementById("taskDescription").value,
    priority: document.getElementById("taskPriority").value,
    dueDate: document.getElementById("taskDueDate").value,
  };

  if (currentEditingTask) {
    updateTask(currentEditingTask.id, taskData);
  } else {
    createTask(taskData);
  }

  closeTaskModal();
}

function createTask(taskData) {
  const newTask = {
    id: Date.now().toString(),
    ...taskData,
    status: "todo",
    createdAt: new Date().toISOString(),
  };

  tasks.push(newTask);
  saveTasks();
  renderTask(newTask);
  updateTaskCounts();

  // Animate new task
  setTimeout(() => {
    const taskElement = document.getElementById(`task-${newTask.id}`);
    taskElement.style.animation = "slideUp 0.3s ease";
  }, 10);
}

function updateTask(taskId, taskData) {
  const taskIndex = tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) return;

  tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
  saveTasks();

  const taskElement = document.getElementById(`task-${taskId}`);
  const updatedTaskHTML = createTaskHTML(tasks[taskIndex]);
  taskElement.outerHTML = updatedTaskHTML;

  // Re-attach event listeners
  attachTaskEventListeners(document.getElementById(`task-${taskId}`));
}

function deleteTask(taskId) {
  const taskElement = document.getElementById(`task-${taskId}`);

  // Animate deletion
  taskElement.style.animation = "fadeOut 0.3s ease";

  setTimeout(() => {
    tasks = tasks.filter((t) => t.id !== taskId);
    saveTasks();
    taskElement.remove();
    updateTaskCounts();
  }, 300);
}

// Rendering Functions
function renderAllTasks() {
  // Clear containers
  todoTasks.innerHTML = "";
  inprogressTasks.innerHTML = "";
  doneTasks.innerHTML = "";

  // Render tasks by status
  tasks.forEach((task) => renderTask(task));
}

function renderTask(task) {
  const taskHTML = createTaskHTML(task);
  const container = getContainerByStatus(task.status);
  container.insertAdjacentHTML("beforeend", taskHTML);

  const taskElement = document.getElementById(`task-${task.id}`);
  attachTaskEventListeners(taskElement);
}

function createTaskHTML(task) {
  const dueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString()
    : "No due date";

  return `
        <div class="task-card status-${task.status}" id="task-${task.id}" draggable="true" data-task-id="${task.id}">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="task-btn edit-btn" onclick="openEditTaskModal('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="task-btn delete-btn" onclick="deleteTask('${task.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <span class="task-date">${dueDate}</span>
            </div>
        </div>
    `;
}

function attachTaskEventListeners(taskElement) {
  // Drag events
  taskElement.addEventListener("dragstart", handleDragStart);
  taskElement.addEventListener("dragend", handleDragEnd);
}

// Drag and Drop Functions
function initializeDragAndDrop() {
  const containers = document.querySelectorAll(".tasks-container");

  containers.forEach((container) => {
    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    container.addEventListener("dragleave", handleDragLeave);
  });
}

function handleDragStart(e) {
  draggedTask = e.target;
  e.target.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", e.target.innerHTML);
}

function handleDragEnd(e) {
  e.target.classList.remove("dragging");

  // Remove drag-over class from all containers
  document.querySelectorAll(".tasks-container").forEach((container) => {
    container.classList.remove("drag-over");
  });
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  e.dataTransfer.dropEffect = "move";
  e.currentTarget.classList.add("drag-over");

  return false;
}

function handleDragLeave(e) {
  if (e.target.classList.contains("tasks-container")) {
    e.target.classList.remove("drag-over");
  }
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  const container = e.currentTarget;
  container.classList.remove("drag-over");

  if (draggedTask && draggedTask !== e.target) {
    const taskId = draggedTask.dataset.taskId;
    const newStatus = container.parentElement.dataset.status;

    updateTaskStatus(taskId, newStatus);
  }

  return false;
}

function updateTaskStatus(taskId, newStatus) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return;

  const oldStatus = task.status;
  task.status = newStatus;
  saveTasks();

  // Move task to new container
  const container = getContainerByStatus(newStatus);
  container.appendChild(draggedTask);

  // Update task card class for new status color
  draggedTask.classList.remove(`status-${oldStatus}`);
  draggedTask.classList.add(`status-${newStatus}`);

  updateTaskCounts();

  // Animate the drop with color transition
  draggedTask.style.animation = "none";
  setTimeout(() => {
    draggedTask.style.animation = "slideUp 0.3s ease";
  }, 10);
}

// Helper Functions
function getContainerByStatus(status) {
  switch (status) {
    case "todo":
      return todoTasks;
    case "inprogress":
      return inprogressTasks;
    case "done":
      return doneTasks;
    default:
      return todoTasks;
  }
}

function updateTaskCounts() {
  const counts = {
    todo: 0,
    inprogress: 0,
    done: 0,
  };

  tasks.forEach((task) => {
    counts[task.status]++;
  });

  todoCount.textContent = counts.todo;
  inprogressCount.textContent = counts.inprogress;
  doneCount.textContent = counts.done;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Local Storage Functions
function saveTasks() {
  localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem("kanbanTasks");
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  } else {
    // Load sample tasks for demo
    tasks = [
      {
        id: "1",
        title: "Design new landing page",
        description:
          "Create a modern, responsive landing page design with animations",
        priority: "high",
        status: "todo",
        dueDate: "2024-12-25",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Implement user authentication",
        description: "Set up JWT-based authentication system",
        priority: "medium",
        status: "inprogress",
        dueDate: "2024-12-20",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        title: "Write documentation",
        description: "Document API endpoints and usage examples",
        priority: "low",
        status: "done",
        dueDate: "2024-12-15",
        createdAt: new Date().toISOString(),
      },
    ];
    saveTasks();
  }
}

// Add CSS animation for fadeOut
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: scale(1);
        }
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
`;
document.head.appendChild(style);
