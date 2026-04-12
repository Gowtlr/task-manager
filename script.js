const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const categorySelect = document.getElementById("categorySelect");
const prioritySelect = document.getElementById("prioritySelect");
const taskDate = document.getElementById("taskDate");
const taskTime = document.getElementById("taskTime");
const searchInput = document.getElementById("searchInput");
const autocompleteList = document.getElementById("autocompleteList");
const taskList = document.getElementById("taskList");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const sortSelect = document.getElementById("sortSelect");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const doneCount = document.getElementById("doneCount");
const lateCount = document.getElementById("lateCount");
const todayTasks = document.getElementById("todayTasks");
const progressText = document.getElementById("progressText");
const progressValue = document.getElementById("progressValue");
const progressFill = document.getElementById("progressFill");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const filterButtons = document.querySelectorAll(".filter-btn");

const editModal = document.getElementById("editModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const editTaskForm = document.getElementById("editTaskForm");
const editTaskInput = document.getElementById("editTaskInput");
const editCategorySelect = document.getElementById("editCategorySelect");
const editPrioritySelect = document.getElementById("editPrioritySelect");
const editTaskDate = document.getElementById("editTaskDate");
const editTaskTime = document.getElementById("editTaskTime");

function readStorageArray(key) {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    localStorage.removeItem(key);
    return [];
  }
}

function normalizeTask(task) {
  const normalizedCategory = ["Estudo", "Trabalho", "Pessoal"].includes(task?.category)
    ? task.category
    : "Pessoal";
  const normalizedPriority = ["Baixa", "M\u00E9dia", "Alta", "MÃ©dia"].includes(task?.priority)
    ? String(task.priority).replace("MÃ©dia", "M\u00E9dia")
    : "Baixa";

  return {
    id: Number(task?.id) || Date.now(),
    text: String(task?.text || "").trim(),
    category: normalizedCategory,
    priority: normalizedPriority,
    date: typeof task?.date === "string" ? task.date : "",
    time: typeof task?.time === "string" ? task.time : "",
    completed: Boolean(task?.completed)
  };
}

let tasks = readStorageArray("tasks_insane")
  .map(normalizeTask)
  .filter(task => task.text !== "");
let theme = localStorage.getItem("theme_insane") === "light" ? "light" : "dark";
let currentFilter = "all";
let editingTaskId = null;

function saveTasks() {
  localStorage.setItem("tasks_insane", JSON.stringify(tasks));
}

function saveTheme() {
  localStorage.setItem("theme_insane", theme);
}

function applyTheme() {
  const isLightTheme = theme === "light";
  document.body.classList.toggle("light", isLightTheme);
  themeIcon.textContent = isLightTheme ? "\uD83C\uDF19" : "\u2600\uFE0F";
  themeLabel.textContent = isLightTheme ? "Modo escuro" : "Modo claro";
  return;

  if (theme === "light") {
    document.body.classList.add("light");
    themeIcon.textContent = "🌙";
    themeLabel.textContent = "Modo escuro";
  } else {
    document.body.classList.remove("light");
    themeIcon.textContent = "☀️";
    themeLabel.textContent = "Modo claro";
  }
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatDateTime(date, time) {
  if (!date && !time) return "Sem data e hora";
  if (date && time) return `${formatDate(date)} às ${time}`;
  if (date) return `Data: ${formatDate(date)}`;
  return `Hora: ${time}`;
}

function isToday(dateString) {
  if (!dateString) return false;
  const today = new Date();
  const [year, month, day] = dateString.split("-").map(Number);

  return (
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day
  );
}

function isTaskLate(task) {
  if (task.completed || !task.date) return false;
  const finalTime = task.time || "23:59";
  return new Date(`${task.date}T${finalTime}`) < new Date();
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getPriorityClass(priority) {
  if (priority === "Baixa") return "priority-baixa";
  if (priority === "Média") return "priority-media";
  return "priority-alta";
}

function getPriorityCardClass(priority) {
  if (priority === "Baixa") return "priority-baixa-card";
  if (priority === "Média") return "priority-media-card";
  return "priority-alta-card";
}

function getCategoryClass(category) {
  if (category === "Estudo") return "category-estudo";
  if (category === "Trabalho") return "category-trabalho";
  return "category-pessoal";
}

function updateStats() {
  const total = tasks.length;
  const pending = tasks.filter(task => !task.completed).length;
  const done = tasks.filter(task => task.completed).length;
  const late = tasks.filter(task => isTaskLate(task)).length;
  const today = tasks.filter(task => isToday(task.date)).length;

  totalCount.textContent = total;
  pendingCount.textContent = pending;
  doneCount.textContent = done;
  lateCount.textContent = late;
  todayTasks.textContent = `${today} ${today === 1 ? "tarefa" : "tarefas"}`;

  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  progressText.textContent = `${progress}%`;
  progressValue.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
}

function getSearchFilteredTasks() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) return tasks;

  return tasks.filter(task =>
    String(task.text || "").toLowerCase().includes(term) ||
    String(task.category || "").toLowerCase().includes(term) ||
    String(task.priority || "").toLowerCase().includes(term)
  );
}

function applyCurrentFilter(taskArray) {
  switch (currentFilter) {
    case "pending":
      return taskArray.filter(task => !task.completed);
    case "done":
      return taskArray.filter(task => task.completed);
    case "late":
      return taskArray.filter(task => isTaskLate(task));
    case "high":
      return taskArray.filter(task => task.priority === "Alta");
    case "study":
      return taskArray.filter(task => task.category === "Estudo");
    case "work":
      return taskArray.filter(task => task.category === "Trabalho");
    case "personal":
      return taskArray.filter(task => task.category === "Pessoal");
    default:
      return taskArray;
  }
}

function sortTasks(taskArray) {
  const priorityOrder = { Alta: 1, Média: 2, Baixa: 3 };
  const ordered = [...taskArray];

  if (sortSelect.value === "date") {
    ordered.sort((a, b) => {
      const aDate = a.date ? new Date(`${a.date}T${a.time || "23:59"}`).getTime() : Infinity;
      const bDate = b.date ? new Date(`${b.date}T${b.time || "23:59"}`).getTime() : Infinity;
      return aDate - bDate;
    });
  } else if (sortSelect.value === "recent") {
    ordered.sort((a, b) => b.id - a.id);
  } else {
    ordered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });
  }

  return ordered;
}

function renderAutocomplete(matches) {
  autocompleteList.innerHTML = "";

  if (!searchInput.value.trim() || matches.length === 0) {
    autocompleteList.style.display = "none";
    return;
  }

  matches.slice(0, 5).forEach(task => {
    const item = document.createElement("div");
    item.className = "autocomplete-item";
    item.textContent = `${task.text} • ${task.category}`;

    item.addEventListener("click", () => {
      searchInput.value = task.text;
      autocompleteList.style.display = "none";
      renderEverything();
    });

    autocompleteList.appendChild(item);
  });

  autocompleteList.style.display = "block";
}

function openEditModal(task) {
  editingTaskId = task.id;
  editTaskInput.value = task.text;
  editCategorySelect.value = task.category;
  editPrioritySelect.value = task.priority;
  editTaskDate.value = task.date || "";
  editTaskTime.value = task.time || "";
  editModal.classList.remove("hidden");
}

function closeEditModal() {
  editingTaskId = null;
  editModal.classList.add("hidden");
  editTaskForm.reset();
}

function renderTasks(displayedTasks) {
  taskList.innerHTML = "";

  if (displayedTasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📝</div>
        <div class="empty-state-title">Nenhuma tarefa encontrada</div>
        <p>Tente adicionar uma nova tarefa ou alterar os filtros.</p>
      </div>
    `;
    return;
  }

  const orderedTasks = sortTasks(displayedTasks);

  orderedTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${getPriorityCardClass(task.priority)}`;

    item.innerHTML = `
      <div class="task-main">
        <input
          type="checkbox"
          class="task-checkbox"
          ${task.completed ? "checked" : ""}
          aria-label="Marcar tarefa como concluída"
        />

        <div class="task-info">
          <div class="task-topline">
            <span class="category-badge ${getCategoryClass(task.category)}">${task.category}</span>
          </div>

          <div class="task-title ${task.completed ? "completed" : ""}">
            ${escapeHtml(task.text)}
          </div>

          <div class="task-meta">
            <span class="badge ${getPriorityClass(task.priority)}">
              Prioridade: ${task.priority}
            </span>
            <span class="badge">
              ${task.completed ? "Concluída" : "Pendente"}
            </span>
            ${isTaskLate(task) ? `<span class="badge priority-alta">Atrasada</span>` : ""}
          </div>

          <div class="task-datetime">
            ${formatDateTime(task.date, task.time)}
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn edit-btn" type="button" aria-label="Editar tarefa">✏️</button>
        <button class="icon-btn delete-btn" type="button" aria-label="Excluir tarefa">🗑️</button>
      </div>
    `;

    const checkbox = item.querySelector(".task-checkbox");
    const editButton = item.querySelector(".edit-btn");
    const deleteButton = item.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => toggleTask(task.id));
    editButton.addEventListener("click", () => openEditModal(task));
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(item);
  });
}

function renderEverything() {
  updateStats();
  const searchFiltered = getSearchFilteredTasks();
  const finalTasks = applyCurrentFilter(searchFiltered);
  renderTasks(finalTasks);
  renderAutocomplete(searchFiltered);
}

function addTask(event) {
  event.preventDefault();

  const text = taskInput.value.trim();
  const category = categorySelect.value;
  const priority = prioritySelect.value;
  const date = taskDate.value;
  const time = taskTime.value;

  if (!text || !category || !priority) return;

  tasks.push({
    id: Date.now(),
    text,
    category,
    priority,
    date,
    time,
    completed: false
  });

  saveTasks();
  taskForm.reset();
  renderEverything();
}

function toggleTask(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderEverything();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderEverything();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  renderEverything();
}

function updateTask(event) {
  event.preventDefault();

  const trimmedText = editTaskInput.value.trim();

  if (!trimmedText || !editCategorySelect.value || !editPrioritySelect.value) {
    return;
  }

  tasks = tasks.map(task => {
    if (task.id !== editingTaskId) return task;

    return {
      ...task,
      text: trimmedText,
      category: editCategorySelect.value,
      priority: editPrioritySelect.value,
      date: editTaskDate.value,
      time: editTaskTime.value
    };
  });

  saveTasks();
  closeEditModal();
  renderEverything();
}

function applyTheme() {
  const isLightTheme = theme === "light";
  document.body.classList.toggle("light", isLightTheme);
  themeIcon.textContent = isLightTheme ? "\uD83C\uDF19" : "\u2600\uFE0F";
  themeLabel.textContent = isLightTheme ? "Modo escuro" : "Modo claro";
}

function formatDateTime(date, time) {
  if (!date && !time) return "Sem data e hora";
  if (date && time) return `${formatDate(date)} \u00E0s ${time}`;
  if (date) return `Data: ${formatDate(date)}`;
  return `Hora: ${time}`;
}

function getPriorityClass(priority) {
  if (priority === "Baixa") return "priority-baixa";
  if (priority === "M\u00E9dia") return "priority-media";
  return "priority-alta";
}

function getPriorityCardClass(priority) {
  if (priority === "Baixa") return "priority-baixa-card";
  if (priority === "M\u00E9dia") return "priority-media-card";
  return "priority-alta-card";
}

function sortTasks(taskArray) {
  const priorityOrder = { Alta: 1, ["M\u00E9dia"]: 2, Baixa: 3 };
  const ordered = [...taskArray];

  if (sortSelect.value === "date") {
    ordered.sort((a, b) => {
      const aDate = a.date ? new Date(`${a.date}T${a.time || "23:59"}`).getTime() : Infinity;
      const bDate = b.date ? new Date(`${b.date}T${b.time || "23:59"}`).getTime() : Infinity;
      return aDate - bDate;
    });
  } else if (sortSelect.value === "recent") {
    ordered.sort((a, b) => b.id - a.id);
  } else {
    ordered.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed - b.completed;
      return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
    });
  }

  return ordered;
}

function renderTasks(displayedTasks) {
  taskList.innerHTML = "";

  if (displayedTasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">&#128221;</div>
        <div class="empty-state-title">Nenhuma tarefa encontrada</div>
        <p>Tente adicionar uma nova tarefa ou alterar os filtros.</p>
      </div>
    `;
    return;
  }

  const orderedTasks = sortTasks(displayedTasks);

  orderedTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${getPriorityCardClass(task.priority)}`;

    item.innerHTML = `
      <div class="task-main">
        <input
          type="checkbox"
          class="task-checkbox"
          ${task.completed ? "checked" : ""}
          aria-label="Marcar tarefa como conclu&iacute;da"
        />

        <div class="task-info">
          <div class="task-topline">
            <span class="category-badge ${getCategoryClass(task.category)}">${task.category}</span>
          </div>

          <div class="task-title ${task.completed ? "completed" : ""}">
            ${escapeHtml(task.text)}
          </div>

          <div class="task-meta">
            <span class="badge ${getPriorityClass(task.priority)}">
              Prioridade: ${task.priority}
            </span>
            <span class="badge">
              ${task.completed ? "Conclu\u00EDda" : "Pendente"}
            </span>
            ${isTaskLate(task) ? `<span class="badge priority-alta">Atrasada</span>` : ""}
          </div>

          <div class="task-datetime">
            ${formatDateTime(task.date, task.time)}
          </div>
        </div>
      </div>

      <div class="task-actions">
        <button class="icon-btn edit-btn" type="button" aria-label="Editar tarefa">&#9997;&#65039;</button>
        <button class="icon-btn delete-btn" type="button" aria-label="Excluir tarefa">&#128465;&#65039;</button>
      </div>
    `;

    const checkbox = item.querySelector(".task-checkbox");
    const editButton = item.querySelector(".edit-btn");
    const deleteButton = item.querySelector(".delete-btn");

    checkbox.addEventListener("change", () => toggleTask(task.id));
    editButton.addEventListener("click", () => openEditModal(task));
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(item);
  });
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderEverything();
  });
});

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  saveTheme();
  applyTheme();
});

taskForm.addEventListener("submit", addTask);
editTaskForm.addEventListener("submit", updateTask);
searchInput.addEventListener("input", renderEverything);
sortSelect.addEventListener("change", renderEverything);
clearDoneBtn.addEventListener("click", clearCompletedTasks);
closeModalBtn.addEventListener("click", closeEditModal);

editModal.addEventListener("click", event => {
  if (event.target === editModal) {
    closeEditModal();
  }
});

document.addEventListener("click", event => {
  const clickedInsideSearch =
    autocompleteList.contains(event.target) ||
    searchInput.contains(event.target);

  if (!clickedInsideSearch) {
    autocompleteList.style.display = "none";
  }
});

applyTheme();
renderEverything();
