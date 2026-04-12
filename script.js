const taskTextInput = document.getElementById("taskTextInput");
const taskPrioritySelect = document.getElementById("taskPrioritySelect");
const taskDateInput = document.getElementById("taskDateInput");
const taskTimeInput = document.getElementById("taskTimeInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const taskList = document.getElementById("taskList");
const emptyMessage = document.getElementById("emptyMessage");
const filterButtons = document.querySelectorAll(".filter-btn");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const doneCount = document.getElementById("doneCount");
const overdueCount = document.getElementById("overdueCount");

let tasks = [];
let currentFilter = "all";
let searchTerm = "";
let currentTheme = "dark";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
  const savedTasks = localStorage.getItem("tasks");

  if (!savedTasks) {
    return;
  }

  let parsedTasks;

  try {
    parsedTasks = JSON.parse(savedTasks);
  } catch (error) {
    localStorage.removeItem("tasks");
    return;
  }

  if (!Array.isArray(parsedTasks)) {
    return;
  }

  tasks = parsedTasks
    .map(normalizeTask)
    .filter(task => task.text !== "");
}

function saveTheme() {
  localStorage.setItem("theme", currentTheme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light" || savedTheme === "dark") {
    currentTheme = savedTheme;
  }
}

function applyTheme() {
  if (currentTheme === "light") {
    document.body.classList.add("light-theme");
    themeToggleBtn.textContent = "🌙 Modo escuro";
  } else {
    document.body.classList.remove("light-theme");
    themeToggleBtn.textContent = "☀️ Modo claro";
  }
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  saveTheme();
  applyTheme();
}

function normalizePriority(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (normalized === "alta" || normalized === "high") {
    return "high";
  }

  if (normalized === "baixa" || normalized === "low") {
    return "low";
  }

  return "medium";
}

function priorityLabel(priority) {
  if (priority === "high") {
    return "Alta";
  }

  if (priority === "low") {
    return "Baixa";
  }

  return "Média";
}

function generateTaskId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task) {
  return {
    id: task.id || generateTaskId(),
    text: String(task.text || "").trim(),
    done: Boolean(task.done),
    priority: normalizePriority(task.priority),
    dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
    dueTime: typeof task.dueTime === "string" ? task.dueTime : ""
  };
}

function getTodayLocalDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentLocalDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidTimeString(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function formatDate(dateString) {
  if (!dateString) {
    return "Sem data";
  }

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function formatTime(timeString) {
  if (!timeString) {
    return "Sem horário";
  }

  return timeString;
}

function isOverdue(task) {
  if (task.done || !task.dueDate) {
    return false;
  }

  if (task.dueTime) {
    const taskDateTime = `${task.dueDate}T${task.dueTime}`;
    return taskDateTime < getCurrentLocalDateTime();
  }

  return task.dueDate < getTodayLocalDate();
}

function updateCounts() {
  const total = tasks.length;
  const pending = tasks.filter(task => !task.done).length;
  const done = tasks.filter(task => task.done).length;
  const overdue = tasks.filter(task => isOverdue(task)).length;

  totalCount.textContent = total;
  pendingCount.textContent = pending;
  doneCount.textContent = done;
  overdueCount.textContent = overdue;
}

function sortTasks(taskArray) {
  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2
  };

  return [...taskArray].sort((firstTask, secondTask) => {
    if (firstTask.done !== secondTask.done) {
      return Number(firstTask.done) - Number(secondTask.done);
    }

    if (priorityOrder[firstTask.priority] !== priorityOrder[secondTask.priority]) {
      return priorityOrder[firstTask.priority] - priorityOrder[secondTask.priority];
    }

    if (firstTask.dueDate && secondTask.dueDate) {
      const firstDateTime = `${firstTask.dueDate}T${firstTask.dueTime || "23:59"}`;
      const secondDateTime = `${secondTask.dueDate}T${secondTask.dueTime || "23:59"}`;

      if (firstDateTime !== secondDateTime) {
        return firstDateTime.localeCompare(secondDateTime);
      }
    }

    if (firstTask.dueDate && !secondTask.dueDate) {
      return -1;
    }

    if (!firstTask.dueDate && secondTask.dueDate) {
      return 1;
    }

    return firstTask.text.localeCompare(secondTask.text, "pt-BR");
  });
}

function getBaseFilteredTasks() {
  let filteredTasks = [...tasks];

  if (currentFilter === "pending") {
    filteredTasks = filteredTasks.filter(task => !task.done);
  } else if (currentFilter === "done") {
    filteredTasks = filteredTasks.filter(task => task.done);
  }

  return sortTasks(filteredTasks);
}

function updateSearchSuggestions() {
  searchSuggestions.innerHTML = "";

  if (searchTerm === "") {
    searchSuggestions.style.display = "none";
    return;
  }

  const matchedTasks = getBaseFilteredTasks()
    .filter(task => task.text.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(0, 5);

  if (matchedTasks.length === 0) {
    searchSuggestions.style.display = "none";
    return;
  }

  matchedTasks.forEach(task => {
    const suggestionItem = document.createElement("div");
    suggestionItem.classList.add("search-suggestion-item");

    const suggestionTitle = document.createElement("span");
    suggestionTitle.classList.add("search-suggestion-title");
    suggestionTitle.textContent = task.text;

    const suggestionMeta = document.createElement("span");
    suggestionMeta.classList.add("search-suggestion-meta");
    suggestionMeta.textContent = [
      `Prioridade: ${priorityLabel(task.priority)}`,
      `Data: ${formatDate(task.dueDate)}`,
      `Horário: ${formatTime(task.dueTime)}`
    ].join(" • ");

    suggestionItem.appendChild(suggestionTitle);
    suggestionItem.appendChild(suggestionMeta);

    suggestionItem.addEventListener("click", () => {
      searchInput.value = task.text;
      searchTerm = task.text;
      searchSuggestions.style.display = "none";
      renderTasks();
    });

    searchSuggestions.appendChild(suggestionItem);
  });

  searchSuggestions.style.display = "block";
}

function hideSearchSuggestions() {
  searchSuggestions.style.display = "none";
}

function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = getBaseFilteredTasks();

  if (searchTerm !== "") {
    filteredTasks = filteredTasks.filter(task =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filteredTasks.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }

  filteredTasks.forEach(task => {
    const taskItem = document.createElement("li");
    taskItem.classList.add("task-item");

    const taskContent = document.createElement("div");
    taskContent.classList.add("task-content");

    const taskText = document.createElement("span");
    taskText.classList.add("task-text");

    if (task.done) {
      taskText.classList.add("done");
    }

    taskText.textContent = task.text;

    const taskMeta = document.createElement("div");
    taskMeta.classList.add("task-meta");

    const priorityBadge = document.createElement("span");
    priorityBadge.classList.add("priority-badge", task.priority);
    priorityBadge.textContent = `Prioridade: ${priorityLabel(task.priority)}`;

    const dateBadge = document.createElement("span");
    dateBadge.classList.add("date-badge");
    dateBadge.textContent = `Data: ${formatDate(task.dueDate)}`;

    const timeBadge = document.createElement("span");
    timeBadge.classList.add("time-badge");
    timeBadge.textContent = `Horário: ${formatTime(task.dueTime)}`;

    taskMeta.appendChild(priorityBadge);
    taskMeta.appendChild(dateBadge);
    taskMeta.appendChild(timeBadge);

    if (isOverdue(task)) {
      const overdueBadge = document.createElement("span");
      overdueBadge.classList.add("overdue-badge");
      overdueBadge.textContent = "Atrasada";
      taskMeta.appendChild(overdueBadge);
    }

    taskContent.appendChild(taskText);
    taskContent.appendChild(taskMeta);

    const taskActions = document.createElement("div");
    taskActions.classList.add("task-actions");

    const editBtn = document.createElement("button");
    editBtn.classList.add("edit-btn");
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => editTask(task.id));

    const completeBtn = document.createElement("button");
    completeBtn.classList.add("complete-btn");
    completeBtn.textContent = task.done ? "Desfazer" : "Concluir";
    completeBtn.addEventListener("click", () => toggleTask(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("delete-btn");
    deleteBtn.textContent = "Excluir";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    taskActions.appendChild(editBtn);
    taskActions.appendChild(completeBtn);
    taskActions.appendChild(deleteBtn);

    taskItem.appendChild(taskContent);
    taskItem.appendChild(taskActions);

    taskList.appendChild(taskItem);
  });

  updateCounts();
}

function addTask() {
  const taskText = taskTextInput.value.trim();
  const taskDate = taskDateInput.value;
  const taskTime = taskTimeInput.value;
  const taskPriority = taskPrioritySelect.value;

  if (taskText === "") {
    alert("Digite uma tarefa.");
    return;
  }

  if (taskPriority === "") {
    alert("Selecione uma prioridade.");
    return;
  }

  if (taskTime !== "" && taskDate === "") {
    alert("Escolha uma data antes de definir um horário.");
    return;
  }

  tasks.push({
    id: generateTaskId(),
    text: taskText,
    done: false,
    priority: normalizePriority(taskPriority),
    dueDate: taskDate,
    dueTime: taskTime
  });

  saveTasks();
  taskTextInput.value = "";
  taskPrioritySelect.value = "";
  taskDateInput.value = "";
  taskTimeInput.value = "";
  renderTasks();
  updateSearchSuggestions();
}

function toggleTask(taskId) {
  const selectedTask = tasks.find(task => task.id === taskId);

  if (!selectedTask) {
    return;
  }

  selectedTask.done = !selectedTask.done;
  saveTasks();
  renderTasks();
  updateSearchSuggestions();
}

function deleteTask(taskId) {
  tasks = tasks.filter(task => task.id !== taskId);
  saveTasks();
  renderTasks();
  updateSearchSuggestions();
}

function editTask(taskId) {
  const selectedTask = tasks.find(task => task.id === taskId);

  if (!selectedTask) {
    return;
  }

  const newText = prompt("Edite o texto da tarefa:", selectedTask.text);

  if (newText === null) {
    return;
  }

  if (newText.trim() === "") {
    alert("A tarefa não pode ficar vazia.");
    return;
  }

  const newPriority = prompt(
    "Digite a prioridade: alta, media ou baixa",
    priorityLabel(selectedTask.priority).toLowerCase()
  );

  if (newPriority === null) {
    return;
  }

  const normalizedPriority = newPriority
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!["alta", "media", "baixa", "high", "medium", "low"].includes(normalizedPriority)) {
    alert("Prioridade inválida. Use alta, media ou baixa.");
    return;
  }

  const newDate = prompt(
    "Digite a data no formato AAAA-MM-DD ou deixe vazio para remover:",
    selectedTask.dueDate
  );

  if (newDate === null) {
    return;
  }

  const trimmedDate = newDate.trim();

  if (trimmedDate !== "" && !isValidDateString(trimmedDate)) {
    alert("Data inválida. Use o formato AAAA-MM-DD.");
    return;
  }

  const newTime = prompt(
    "Digite o horário no formato HH:MM ou deixe vazio para remover:",
    selectedTask.dueTime
  );

  if (newTime === null) {
    return;
  }

  const trimmedTime = newTime.trim();

  if (trimmedTime !== "" && !isValidTimeString(trimmedTime)) {
    alert("Horário inválido. Use o formato HH:MM.");
    return;
  }

  if (trimmedDate === "" && trimmedTime !== "") {
    alert("Defina uma data para usar horário.");
    return;
  }

  selectedTask.text = newText.trim();
  selectedTask.priority = normalizePriority(newPriority);
  selectedTask.dueDate = trimmedDate;
  selectedTask.dueTime = trimmedTime;

  saveTasks();
  renderTasks();
  updateSearchSuggestions();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
  updateSearchSuggestions();
}

addTaskBtn.addEventListener("click", addTask);

taskTextInput.addEventListener("keypress", event => {
  if (event.key === "Enter") {
    addTask();
  }
});

clearDoneBtn.addEventListener("click", clearCompletedTasks);

searchInput.addEventListener("input", event => {
  searchTerm = event.target.value.trim();
  updateSearchSuggestions();
  renderTasks();
});

searchInput.addEventListener("focus", () => {
  updateSearchSuggestions();
});

document.addEventListener("click", event => {
  if (!event.target.closest(".search-area")) {
    hideSearchSuggestions();
  }
});

themeToggleBtn.addEventListener("click", toggleTheme);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(filterButton => {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTasks();
    updateSearchSuggestions();
  });
});

loadTasks();
loadTheme();
applyTheme();
renderTasks();
