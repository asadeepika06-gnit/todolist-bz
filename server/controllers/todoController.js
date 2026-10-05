const Todo = require("../models/Todo");
const mongoose = require("mongoose");

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load todos" });
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ message: "A non-empty title is required" });
    }

    const todo = await Todo.create({ title });
    res.status(201).json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create todo" });
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid todo ID" });
    }

    const updates = {};
    if (Object.hasOwn(req.body ?? {}, "title")) {
      if (typeof req.body.title !== "string" || !req.body.title.trim()) {
        return res.status(400).json({ message: "Title must be a non-empty string" });
      }
      updates.title = req.body.title.trim();
    }
    if (Object.hasOwn(req.body ?? {}, "completed")) {
      if (typeof req.body.completed !== "boolean") {
        return res.status(400).json({ message: "Completed must be a boolean" });
      }
      updates.completed = req.body.completed;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Provide a title or completed value to update" });
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(todo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update todo" });
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid todo ID" });
    }

    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json({ message: "Todo deleted", id: todo._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete todo" });
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
