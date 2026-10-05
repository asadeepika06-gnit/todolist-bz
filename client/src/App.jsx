import { useEffect, useState } from "react";
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  isUsingLocalStorage,
} from "./api";
import { FILTERS } from "./filters";
import Sidebar from "./components/Sidebar";
import TodoForm from "./components/TodoForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localMode, setLocalMode] = useState(false);

  // Runs an API action and shows its error in the banner if it fails
  const run = async (action) => {
    try {
      setError("");
      await action();
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    run(async () => {
      setTodos(await getTodos());
      setLocalMode(isUsingLocalStorage());
    }).finally(() => setLoading(false));
  }, []);

  const handleAdd = (title) =>
    run(async () => {
      const newTodo = await createTodo(title);
      setTodos((prev) => [newTodo, ...prev]);
      setLocalMode(isUsingLocalStorage());
    });

  const handleUpdate = (id, data) =>
    run(async () => {
      const updated = await updateTodo(id, data);
      setTodos((prev) => prev.map((todo) => (todo._id === id ? updated : todo)));
      setLocalMode(isUsingLocalStorage());
    });

  const handleDelete = (id) =>
    run(async () => {
      await deleteTodo(id);
      setTodos((prev) => prev.filter((t) => t._id !== id));
      setLocalMode(isUsingLocalStorage());
    });

  const handleClearDone = () =>
    run(async () => {
      const done = todos.filter(FILTERS.done.test);
      await Promise.all(done.map((t) => deleteTodo(t._id)));
      setTodos((prev) => prev.filter((t) => !t.completed));
      setLocalMode(isUsingLocalStorage());
    });

  const filteredTodos = todos.filter(FILTERS[filter].test);

  return (
    <div className="layout">
      <Sidebar
        todos={todos}
        filter={filter}
        onFilter={setFilter}
        onClearDone={handleClearDone}
      />

      <main className="panel content">
        <header className="content-header">
          <h2>{FILTERS[filter].label}</h2>
          <span className="content-count">
            {filteredTodos.length} {filteredTodos.length === 1 ? "task" : "tasks"}
          </span>
        </header>

        <TodoForm onAdd={handleAdd} />

        {localMode && (
          <p className="storage-note" role="status">
            Saved on this device. Connect MongoDB to sync todos with the server.
          </p>
        )}

        {error && (
          <div className="error" role="alert">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        {loading ? (
          <p className="empty">Loading...</p>
        ) : filteredTodos.length === 0 ? (
          <div className="empty">
            <img src="/logo.png" alt="" />
            <p>
              {filter === "done"
                ? "Nothing completed yet"
                : "You're all caught up. Add a task above."}
            </p>
          </div>
        ) : (
          <ul className="todo-list">
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo._id}
                todo={todo}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
