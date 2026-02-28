import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("aham.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    journal_text TEXT,
    mood TEXT,
    sleep_start TEXT,
    sleep_end TEXT,
    reflection_json TEXT,
    image_data TEXT
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- daily, weekly, monthly
    title TEXT,
    completed INTEGER DEFAULT 0,
    period_key TEXT -- e.g., '2023-W42' or '2023-10'
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    title TEXT,
    completed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS routine_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS routine_template_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER,
    title TEXT,
    FOREIGN KEY(template_id) REFERENCES routine_templates(id) ON DELETE CASCADE
  );

  -- HealthVista-AI Tables
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    age INTEGER,
    gender TEXT,
    weight REAL,
    height REAL,
    goal TEXT,
    conditions TEXT,
    target_calories INTEGER,
    target_protein INTEGER,
    target_carbs INTEGER,
    target_fat INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT DEFAULT (date('now')),
    type TEXT, -- 'meal', 'exercise', 'sleep', 'water', 'mood'
    content TEXT, -- JSON string of the log details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- neuro-health2.0 Tables
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    name TEXT,
    neural_points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    last_log_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT, -- 'mood', 'sleep', 'activity', 'eating', 'brain_waves', 'routine'
    value TEXT, -- JSON stringified data
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT, -- 'user', 'model'
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const PORT = 3000;

  // API Routes
  app.get("/api/entries/:date", (req, res) => {
    const entry = db.prepare("SELECT * FROM entries WHERE date = ?").get(req.params.date);
    res.json(entry || null);
  });

  app.post("/api/entries", (req, res) => {
    const { date, journal_text, mood, sleep_start, sleep_end, reflection_json, image_data } = req.body;
    const stmt = db.prepare(`
      INSERT INTO entries (date, journal_text, mood, sleep_start, sleep_end, reflection_json, image_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        journal_text=excluded.journal_text,
        mood=excluded.mood,
        sleep_start=excluded.sleep_start,
        sleep_end=excluded.sleep_end,
        reflection_json=excluded.reflection_json,
        image_data=COALESCE(excluded.image_data, entries.image_data)
    `);
    stmt.run(date, journal_text, mood, sleep_start, sleep_end, reflection_json, image_data);
    res.json({ success: true });
  });

  app.get("/api/entries", (req, res) => {
    const entries = db.prepare("SELECT * FROM entries ORDER BY date DESC").all();
    res.json(entries);
  });

  app.get("/api/targets/:period", (req, res) => {
    const targets = db.prepare("SELECT * FROM targets WHERE period_key = ?").all(req.params.period);
    res.json(targets);
  });

  app.post("/api/targets", (req, res) => {
    const { type, title, period_key } = req.body;
    const stmt = db.prepare("INSERT INTO targets (type, title, period_key) VALUES (?, ?, ?)");
    const result = stmt.run(type, title, period_key);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/targets/:id", (req, res) => {
    const { completed } = req.body;
    db.prepare("UPDATE targets SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/targets/:id", (req, res) => {
    db.prepare("DELETE FROM targets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/tasks/:date", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE date = ?").all(req.params.date);
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { date, title } = req.body;
    const stmt = db.prepare("INSERT INTO tasks (date, title) VALUES (?, ?)");
    const result = stmt.run(date, title);
    res.json({ id: result.lastInsertRowid });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { completed } = req.body;
    db.prepare("UPDATE tasks SET completed = ? WHERE id = ?").run(completed ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Routine Templates API
  app.get("/api/routine-templates", (req, res) => {
    const templates = db.prepare("SELECT * FROM routine_templates").all();
    const result = templates.map(t => ({
      ...t,
      tasks: db.prepare("SELECT * FROM routine_template_tasks WHERE template_id = ?").all(t.id)
    }));
    res.json(result);
  });

  app.post("/api/routine-templates", (req, res) => {
    const { name, tasks } = req.body;
    const info = db.prepare("INSERT INTO routine_templates (name) VALUES (?)").run(name);
    const templateId = info.lastInsertRowid;
    const stmt = db.prepare("INSERT INTO routine_template_tasks (template_id, title) VALUES (?, ?)");
    for (const taskTitle of tasks) {
      stmt.run(templateId, taskTitle);
    }
    res.json({ id: templateId });
  });

  app.delete("/api/routine-templates/:id", (req, res) => {
    db.prepare("DELETE FROM routine_templates WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/apply-template", (req, res) => {
    const { date, templateId } = req.body;
    const templateTasks = db.prepare("SELECT title FROM routine_template_tasks WHERE template_id = ?").all(templateId);
    const stmt = db.prepare("INSERT INTO tasks (date, title) VALUES (?, ?)");
    for (const task of templateTasks) {
      stmt.run(date, task.title);
    }
    res.json({ success: true });
  });

  // --- HealthVista-AI API Routes ---
  app.get("/api/profile", (req, res) => {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    res.json(profile || null);
  });

  app.post("/api/profile", (req, res) => {
    const { age, gender, weight, height, goal, conditions, target_calories, target_protein, target_carbs, target_fat } = req.body;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO profile (id, age, gender, weight, height, goal, conditions, target_calories, target_protein, target_carbs, target_fat)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(age, gender, weight, height, goal, conditions, target_calories, target_protein, target_carbs, target_fat);
    res.json({ success: true });
  });

  app.get("/api/healthvista-logs", (req, res) => {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const logs = db.prepare("SELECT * FROM daily_logs WHERE date = ? ORDER BY created_at ASC").all(date);
    res.json(logs.map(log => ({ ...log, content: JSON.parse(log.content as string) })));
  });

  app.post("/api/healthvista-logs", (req, res) => {
    const { type, content, date } = req.body;
    const logDate = date || new Date().toISOString().split('T')[0];
    const stmt = db.prepare("INSERT INTO daily_logs (type, content, date) VALUES (?, ?, ?)");
    stmt.run(type, JSON.stringify(content), logDate);
    res.json({ success: true });
  });

  app.delete("/api/healthvista-logs/:id", (req, res) => {
    db.prepare("DELETE FROM daily_logs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/reset-day", (req, res) => {
    const date = req.body.date || new Date().toISOString().split('T')[0];
    db.prepare("DELETE FROM daily_logs WHERE date = ?").run(date);
    res.json({ success: true });
  });

  // --- neuro-health2.0 API Routes ---
  app.get("/api/user", (req, res) => {
    const email = "muzaffarabbas34148@gmail.com"; // Hardcoded for this session
    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      db.prepare("INSERT INTO users (email, name) VALUES (?, ?)").run(email, "User");
      user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    }
    res.json(user);
  });

  app.get("/api/neuro-logs", (req, res) => {
    const email = "muzaffarabbas34148@gmail.com";
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) return res.json([]);
    const logs = db.prepare("SELECT * FROM logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 100").all(user.id);
    res.json(logs);
  });

  app.post("/api/neuro-logs", (req, res) => {
    const email = "muzaffarabbas34148@gmail.com";
    const { type, value } = req.body;
    const user = db.prepare("SELECT id, neural_points, streak, last_log_date FROM users WHERE email = ?").get(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    db.prepare("INSERT INTO logs (user_id, type, value) VALUES (?, ?, ?)").run(user.id, type, JSON.stringify(value));

    // Update Neural Points and Streak
    const today = new Date().toISOString().split('T')[0];
    let newPoints = user.neural_points + 10;
    let newStreak = user.streak;

    if (user.last_log_date !== today) {
      newStreak = (user.last_log_date === new Date(Date.now() - 86400000).toISOString().split('T')[0]) ? user.streak + 1 : 1;
      newPoints += 50; // Bonus for daily log
    }

    db.prepare("UPDATE users SET neural_points = ?, streak = ?, last_log_date = ? WHERE id = ?").run(newPoints, newStreak, today, user.id);

    res.json({ success: true, neural_points: newPoints, streak: newStreak });
  });

  app.get("/api/chat-history", (req, res) => {
    const email = "muzaffarabbas34148@gmail.com";
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) return res.json([]);
    const history = db.prepare("SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at ASC").all(user.id);
    res.json(history);
  });

  app.post("/api/chat-history", (req, res) => {
    const email = "muzaffarabbas34148@gmail.com";
    const { role, content } = req.body;
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (!user) return res.status(404).json({ error: "User not found" });
    db.prepare("INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)").run(user.id, role, content);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
