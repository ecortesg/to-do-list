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
  renderTask(newTask);
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

function saveTasks() {
  localStorage.setItem("TASKS", JSON.stringify(tasks));
}

function loadTasks(): Task[] {
  const taskJSON = localStorage.getItem("TASKS");
  if (taskJSON == null) return [];
  return JSON.parse(taskJSON);
}

function renderTask(task: Task) {
  const taskElement = document.importNode(template.content, true);
  const listItem = taskElement.querySelector("li")!;
  const checkbox = taskElement.querySelector("input")!;
  const deleteButton = taskElement.querySelector("button")!;
  const label = taskElement.querySelector("label")!;
  const dragIcon = taskElement.querySelector("img")!;

  checkbox.id = task.id;
  checkbox.checked = task.complete;
  checkbox.addEventListener("change", () => {
    task.complete = checkbox.checked;
    saveTasks();
  });
  deleteButton.addEventListener("click", () => {
    list.removeChild(listItem);
    deleteTask(task.id);
    saveTasks();
  });
  ["dragstart", "touchmove"].forEach((evt) => {
    dragIcon.addEventListener(evt, () => {
      listItem.classList.add("dragging");
    });
  });
  ["dragend", "touchend"].forEach((evt) => {
    dragIcon.addEventListener(evt, () => {
      listItem.classList.remove("dragging");
    });
  });

  ["dragover", "touchmove"].forEach((evt) => {
    dragIcon.addEventListener(evt, (e: any) => {
      e.preventDefault();
      const y = e.type == "dragover" ? e.clientY : e.changedTouches[0].pageY;
      const afterElement = getDragAfterElement(list, y, e.type);
      const dragElement = document.querySelector<HTMLLIElement>(".dragging")!;
      const dragElementId = dragElement
        .querySelector("input")
        ?.getAttribute("id");

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
        const newIndex =
          tasks.findIndex((task) => task.id == afterElementId) - 1;
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
  });

  label.htmlFor = task.id;
  label.append(task.name);
  list.appendChild(taskElement);
}

function renderTasks() {
  clearElement(list);
  tasks.forEach(renderTask);
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
  y: number,
  eventType: string
): HTMLLIElement | null {
  const draggableElements = [
    ...container.querySelectorAll(".task:not(.dragging)"),
  ];

  return draggableElements.reduce(
    (closest, child): ClosestTask => {
      const box = child.getBoundingClientRect();
      let offset;
      if (eventType == "dragover") {
        offset = y - box.top - box.height / 2;
      } else {
        offset =
          y - box.top - box.height / 2 - document.documentElement.scrollTop;
      }
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
