import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'todos.json');

app.use(cors());
app.use(express.json());

async function readTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeTodos(todos) {
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf8');
}

app.get('/api/todos', async (req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Todo text is required' });
    }

    const todos = await readTodos();
    const newTodo = {
      id: Date.now().toString(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    todos.push(newTodo);
    await writeTodos(todos);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { completed, text } = req.body;

    const todos = await readTodos();
    const todoIndex = todos.findIndex(t => t.id === id);

    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    if (completed !== undefined) {
      todos[todoIndex].completed = completed;
    }
    if (text !== undefined) {
      todos[todoIndex].text = text.trim();
    }

    await writeTodos(todos);
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const todos = await readTodos();
    const filteredTodos = todos.filter(t => t.id !== id);

    if (filteredTodos.length === todos.length) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    await writeTodos(filteredTodos);
    res.json({ message: 'Todo deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
