const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskDate = document.getElementById("taskDate");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const filterButtons = document.querySelectorAll(".filter-btn");
const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const doneCount = document.getElementById("doneCount");
const overdueCount = document.getElementById("overdueCount");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const emptyMessage = document.getElementById("emptyMessage");

let tasks = [];
let currentFilter = "all";

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function normalizePriority(value) {
  const normalized = String(value || "medium")
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

function getTodayLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isValidDateString(dateString) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
}

function formatDate(dateString) {
  if (!dateString) {
    return "Sem prazo";
  }

  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function isOverdue(task) {
  if (!task.dueDate || task.done) {
    return false;
  }

  return task.dueDate < getTodayLocalDate();
}

function normalizeTask(task) {
  return {
    id: task.id || Date.now() + Math.random(),
    text: String(task.text || "").trim(),
    done: Boolean(task.done),
    priority: normalizePriority(task.priority),
    dueDate: typeof task.dueDate === "string" ? task.dueDate : ""
  };
}

function loadTasks() {
  const savedTasks = localStorage.getItem("tasks");

  if (!savedTasks) {
    return;
  }

  const parsedTasks = JSON.parse(savedTasks);

  if (!Array.isArray(parsedTasks)) {
    return;
  }

  tasks = parsedTasks.map(normalizeTask).filter(task => task.text !== "");
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

  return [...taskArray].sort((a, b) => {
    if (a.done !== b.done) {
      return Number(a.done) - Number(b.done);
    }

    if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate);
    }

    if (a.dueDate && !b.dueDate) {
      return -1;
    }

    if (!a.dueDate && b.dueDate) {
      return 1;
    }

    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function renderTasks() {
  taskList.innerHTML = "";

  let filteredTasks = [...tasks];

  if (currentFilter === "pending") {
    filteredTasks = filteredTasks.filter(task => !task.done);
  } else if (currentFilter === "done") {
    filteredTasks = filteredTasks.filter(task => task.done);
  }

  filteredTasks = sortTasks(filteredTasks);

  if (filteredTasks.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }

  filteredTasks.forEach(task => {
    const li = document.createElement("li");
    li.classList.add("task-item");

    const content = document.createElement("div");
    content.classList.add("task-content");

    const textSpan = document.createElement("span");
    textSpan.classList.add("task-text");

    if (task.done) {
      textSpan.classList.add("done");
    }

    textSpan.textContent = task.text;

    const meta = document.createElement("div");
    meta.classList.add("task-meta");

    const priorityBadge = document.createElement("span");
    priorityBadge.classList.add("priority-badge", task.priority);
    priorityBadge.textContent = `Prioridade: ${priorityLabel(task.priority)}`;

    const dateBadge = document.createElement("span");
    dateBadge.classList.add("date-badge");
    dateBadge.textContent = `Prazo: ${formatDate(task.dueDate)}`;

    meta.appendChild(priorityBadge);
    meta.appendChild(dateBadge);

    if (isOverdue(task)) {
      const overdueBadge = document.createElement("span");
      overdueBadge.classList.add("overdue-badge");
      overdueBadge.textContent = "Atrasada";
      meta.appendChild(overdueBadge);
    }

    content.appendChild(textSpan);
    content.appendChild(meta);

    const actions = document.createElement("div");
    actions.classList.add("task-actions");

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

    actions.appendChild(editBtn);
    actions.appendChild(completeBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(content);
    li.appendChild(actions);

    taskList.appendChild(li);
  });

  updateCounts();
}

function addTask() {
  const text = taskInput.value.trim();

  if (text === "") {
    alert("Digite uma tarefa.");
    return;
  }

  tasks.push({
    id: Date.now(),
    text: text,
    done: false,
    priority: normalizePriority(taskPriority.value),
    dueDate: taskDate.value
  });

  saveTasks();
  taskInput.value = "";
  taskPriority.value = "medium";
  taskDate.value = "";
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(task => task.id === id);

  if (!task) {
    return;
  }

  task.done = !task.done;
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
}

function editTask(id) {
  const task = tasks.find(task => task.id === id);

  if (!task) {
    return;
  }

  const newText = prompt("Edite o texto da tarefa:", task.text);

  if (newText === null) {
    return;
  }

  if (newText.trim() === "") {
    alert("A tarefa não pode ficar vazia.");
    return;
  }

  const newPriorityInput = prompt(
    "Digite a prioridade: alta, media ou baixa",
    priorityLabel(task.priority).toLowerCase()
  );

  if (newPriorityInput === null) {
    return;
  }

  const normalizedPriorityInput = newPriorityInput
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!["alta", "media", "baixa", "high", "medium", "low"].includes(normalizedPriorityInput)) {
    alert("Prioridade inválida. Use alta, media ou baixa.");
    return;
  }

  const newDateInput = prompt(
    "Digite o prazo no formato AAAA-MM-DD ou deixe vazio para remover:",
    task.dueDate
  );

  if (newDateInput === null) {
    return;
  }

  const trimmedDate = newDateInput.trim();

  if (trimmedDate !== "" && !isValidDateString(trimmedDate)) {
    alert("Data inválida. Use o formato AAAA-MM-DD.");
    return;
  }

  task.text = newText.trim();
  task.priority = normalizePriority(newPriorityInput);
  task.dueDate = trimmedDate;

  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  tasks = tasks.filter(task => !task.done);
  saveTasks();
  renderTasks();
}

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    addTask();
  }
});

clearDoneBtn.addEventListener("click", clearCompletedTasks);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

loadTasks();
renderTasks();