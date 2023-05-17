type Task = { id: string; name: string; complete: boolean };
type ClosestTask = { offset: number; element: HTMLLIElement | null };

const list = document.querySelector<HTMLUListElement>("#list")!;
const form = document.querySelector<HTMLFormElement>("#new-task-form")!;
const input = document.querySelector<HTMLInputElement>("#new-task-title")!;
const template = document.querySelector<HTMLTemplateElement>("#task-template")!;
const uncheckAllButton =
  document.querySelector<HTMLButtonElement>("#uncheck-all-btn")!;
const deleteAllButton = document.querySelector("#delete-all-btn")!;

let tasks: Task[] = loadTasks();
renderTasks();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const taskName = input.value;
  if (taskName == "" || taskName == null) return;
  const newTask = createTask(taskName);
  tasks.push(newTask);
  saveTasks();
  renderTasks();
  input.value = "";
});

uncheckAllButton.addEventListener("click", () => {
  uncheckTasks();
  saveTasks();
  renderTasks();
});

deleteAllButton.addEventListener("click", () => {
  deleteTasks();
  saveTasks();
  renderTasks();
});

list?.addEventListener("dragover", (e) => {
  e.preventDefault();
  const afterElement = getDragAfterElement(list, e.clientY);
  const dragElement = document.querySelector<HTMLLIElement>(".dragging")!;
  const dragElementId = dragElement.querySelector("input")?.getAttribute("id");

  const taskIndex = tasks.findIndex((task) => task.id == dragElementId);

  if (afterElement == null) {
    list.appendChild(dragElement);
    //Remove task and append it to the end
    tasks.push(tasks.splice(taskIndex, 1)[0]);
  } else {
    list.insertBefore(dragElement, afterElement);
    const afterElementId = afterElement
      .querySelector("input")
      ?.getAttribute("id");
    const newIndex = tasks.findIndex((task) => task.id == afterElementId) - 1;
    //Remove task
    const taskToRelocate = tasks.splice(taskIndex, 1)[0];
    //Add task to new location
    if (newIndex >= 0) {
      tasks.splice(newIndex, 0, taskToRelocate);
    } else {
      tasks.unshift(taskToRelocate);
    }
  }
  saveTasks();
});

function saveTasks() {
  localStorage.setItem("TASKS", JSON.stringify(tasks));
}

function loadTasks(): Task[] {
  const taskJSON = localStorage.getItem("TASKS");
  if (taskJSON == null) return [];
  return JSON.parse(taskJSON);
}

function renderTasks() {
  clearElement(list);
  tasks.forEach((task) => {
    const taskElement = document.importNode(template.content, true);
    const listItem = taskElement.querySelector("li")!;
    const checkbox = taskElement.querySelector("input")!;
    const deleteButton = taskElement.querySelector("button")!;
    const label = taskElement.querySelector("label")!;

    checkbox.id = task.id;
    checkbox.checked = task.complete;
    checkbox.addEventListener("change", () => {
      task.complete = checkbox.checked;
      saveTasks();
    });
    deleteButton.addEventListener("click", () => {
      deleteTask(task.id);
      saveTasks();
      renderTasks();
    });
    listItem.addEventListener("dragstart", () => {
      listItem.classList.add("dragging");
    });

    listItem.addEventListener("dragend", () => {
      listItem.classList.remove("dragging");
    });
    label.htmlFor = task.id;
    label.append(task.name);
    list.appendChild(taskElement);
  });
}

function createTask(name: string): Task {
  return { id: Date.now().toString(), name: name, complete: false };
}

function deleteTask(id: string) {
  tasks = tasks.filter((elem) => elem.id != id);
}

function deleteTasks() {
  tasks = [];
}

function uncheckTasks() {
  tasks.forEach((elem) => (elem.complete = false));
}

function clearElement(element: HTMLElement) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function getDragAfterElement(
  container: HTMLUListElement,
  y: number
): HTMLLIElement | null {
  const draggableElements = [
    ...container.querySelectorAll(".task:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child): ClosestTask => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child } as ClosestTask;
      } else {
        return closest;
      }
    },
    {
      offset: Number.NEGATIVE_INFINITY,
    } as ClosestTask
  ).element;
}
