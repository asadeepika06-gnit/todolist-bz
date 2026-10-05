const API_URL = "/api/todos";
const TODOS_KEY = "todo-app:todos";
const STORAGE_MODE_KEY = "todo-app:storage-mode";

const readLocalTodos = () => {
  try {
    const todos = JSON.parse(localStorage.getItem(TODOS_KEY) || "[]");
    return Array.isArray(todos) ? todos : [];
  } catch {
    return [];
  }
};

const writeLocalTodos = (todos) => {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
  return todos;
};

const shouldUseLocalStorage = () =>
  localStorage.getItem(STORAGE_MODE_KEY) === "local";

const switchToLocalStorage = (todos = []) => {
  localStorage.setItem(STORAGE_MODE_KEY, "local");
  if (!localStorage.getItem(TODOS_KEY)) writeLocalTodos(todos);
};

const request = async (url, options) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const error = new Error("The server returned an unreadable response");
      error.status = res.status;
      throw error;
    }
  }
  if (!res.ok) {
    const error = new Error(data?.message || `Request failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
};

const serverUnavailable = (error) =>
  error instanceof TypeError || error instanceof SyntaxError || error.status >= 500;

const withLocalFallback = async (remoteAction, localAction) => {
  if (shouldUseLocalStorage()) return localAction();
  try {
    const result = await remoteAction();
    return result;
  } catch (error) {
    if (!serverUnavailable(error)) throw error;
    switchToLocalStorage();
    return localAction();
  }
};

const localGetTodos = () => readLocalTodos();

const localCreateTodo = (title) => {
  const todo = {
    _id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  writeLocalTodos([todo, ...readLocalTodos()]);
  return todo;
};

const localUpdateTodo = (id, data) => {
  let updated;
  const todos = readLocalTodos().map((todo) => {
    if (todo._id !== id) return todo;
    updated = { ...todo, ...data };
    return updated;
  });
  writeLocalTodos(todos);
  if (!updated) throw new Error("Todo not found on this device");
  return updated;
};

const localDeleteTodo = (id) => {
  writeLocalTodos(readLocalTodos().filter((todo) => todo._id !== id));
  return { message: "Todo deleted", id };
};

export const getTodos = () =>
  withLocalFallback(
    async () => {
      const todos = await request(API_URL);
      writeLocalTodos(todos);
      return todos;
    },
    localGetTodos
  );

export const createTodo = (title) =>
  withLocalFallback(
    async () => {
      const todo = await request(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      writeLocalTodos([todo, ...readLocalTodos()]);
      return todo;
    },
    () => localCreateTodo(title)
  );

export const updateTodo = (id, data) =>
  withLocalFallback(
    async () => {
      const todo = await request(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      writeLocalTodos(readLocalTodos().map((item) => (item._id === id ? todo : item)));
      return todo;
    },
    () => localUpdateTodo(id, data)
  );

export const deleteTodo = (id) =>
  withLocalFallback(
    async () => {
      const result = await request(`${API_URL}/${id}`, { method: "DELETE" });
      writeLocalTodos(readLocalTodos().filter((todo) => todo._id !== id));
      return result;
    },
    () => localDeleteTodo(id)
  );

export const isUsingLocalStorage = () => shouldUseLocalStorage();
