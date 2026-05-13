import Database from '@tauri-apps/plugin-sql';

let db = null;

export async function initDatabase() {
  db = await Database.load('sqlite:sios.db');
  await createTables();
  return db;
}

export function getDb() {
  return db;
}

async function createTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      title TEXT DEFAULT '',
      source TEXT DEFAULT 'manual',
      column_id TEXT DEFAULT 'inbox',
      tags TEXT DEFAULT '[]',
      color TEXT DEFAULT 'default',
      notes TEXT DEFAULT '',
      links TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS todo_items (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      date TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      estimated_minutes INTEGER DEFAULT 0,
      parent_id TEXT,
      idea_id TEXT,
      minor_agenda_id TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS todo_history (
      id TEXT PRIMARY KEY,
      original_id TEXT,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      priority TEXT DEFAULT 'medium',
      completed INTEGER DEFAULT 0,
      reset_date TEXT NOT NULL,
      carry_over INTEGER DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS life_milestones (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_age INTEGER,
      target_year INTEGER,
      status TEXT DEFAULT 'not_started',
      color TEXT DEFAULT 'indigo',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS mayor_agendas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      frequency TEXT DEFAULT 'weekly',
      target_count INTEGER DEFAULT 1,
      milestone_ids TEXT DEFAULT '[]',
      start_date TEXT,
      end_date TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS minor_agendas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      mayor_agenda_id TEXT,
      duration_minutes INTEGER DEFAULT 30,
      time_of_day TEXT DEFAULT 'morning',
      streak_count INTEGER DEFAULT 0,
      last_done_date TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS api_connections (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      api_key_encrypted TEXT,
      filter_prefix TEXT,
      polling_interval INTEGER DEFAULT 30,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    )`,
  ];

  for (const q of queries) {
    await db.execute(q);
  }

  const defaults = [
    ['theme', '"dark"'],
    ['reset_time', '"00:00"'],
    ['morning_nudge', '"07:00"'],
    ['notifications_enabled', 'true'],
    ['column_names', JSON.stringify({
      inbox: '📥 Inbox',
      high_potential: '⭐ Potensial Tinggi',
      needs_research: '🔬 Perlu Riset',
      planned: '📅 Direncanakan',
      parked: '❄️ Parkir',
      archived: '🗑️ Arsip/Gugur',
    })],
  ];
  for (const [key, value] of defaults) {
    await db.execute('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }
}

// ── Ideas ─────────────────────────────────────────────────────────────────────

export async function getIdeas() {
  const rows = await db.select('SELECT * FROM ideas ORDER BY created_at DESC');
  return rows.map(parseIdea);
}

export async function createIdea(idea) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO ideas (id,content,title,source,column_id,tags,color,notes,links,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [id, idea.content, idea.title || '', idea.source || 'manual', idea.column_id || 'inbox',
     JSON.stringify(idea.tags || []), idea.color || 'default', idea.notes || '',
     JSON.stringify(idea.links || []), now, now]
  );
  return { id, ...idea, tags: idea.tags || [], links: idea.links || [], created_at: now, updated_at: now };
}

export async function updateIdea(id, updates) {
  const now = new Date().toISOString();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => {
    const v = updates[k];
    return Array.isArray(v) ? JSON.stringify(v) : v;
  });
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.execute(`UPDATE ideas SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id]);
}

export async function deleteIdea(id) {
  await db.execute('DELETE FROM ideas WHERE id = ?', [id]);
}

function parseIdea(row) {
  return { ...row, tags: safeJson(row.tags, []), links: safeJson(row.links, []) };
}

// ── Todos ─────────────────────────────────────────────────────────────────────

export async function getTodayTodos(date) {
  return db.select(
    'SELECT * FROM todo_items WHERE date = ? ORDER BY sort_order ASC, created_at ASC',
    [date]
  );
}

export async function createTodo(todo) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const maxRes = await db.select(
    'SELECT COALESCE(MAX(sort_order),0) as m FROM todo_items WHERE date = ?',
    [todo.date]
  );
  const sortOrder = (maxRes[0]?.m || 0) + 1;
  await db.execute(
    `INSERT INTO todo_items (id,title,description,date,priority,status,estimated_minutes,parent_id,idea_id,minor_agenda_id,sort_order,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [id, todo.title, todo.description || '', todo.date, todo.priority || 'medium',
     'pending', todo.estimated_minutes || 0, todo.parent_id || null, todo.idea_id || null,
     todo.minor_agenda_id || null, sortOrder, now, now]
  );
  return { id, ...todo, status: 'pending', sort_order: sortOrder, created_at: now, updated_at: now };
}

export async function updateTodo(id, updates) {
  const now = new Date().toISOString();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => updates[k]);
  const setClause = fields.map(f => `${f} = ?`).join(', ');
  await db.execute(`UPDATE todo_items SET ${setClause}, updated_at = ? WHERE id = ?`, [...values, now, id]);
}

export async function deleteTodo(id) {
  await db.execute('DELETE FROM todo_items WHERE id = ?', [id]);
  await db.execute('DELETE FROM todo_items WHERE parent_id = ?', [id]);
}

export async function archiveTodos(date, carryOverIds = []) {
  const todos = await getTodayTodos(date);
  const today = new Date().toISOString();

  for (const t of todos) {
    const isCompleted = t.status === 'done';
    const shouldCarry = carryOverIds.includes(t.id);
    await db.execute(
      `INSERT INTO todo_history (id,original_id,title,description,priority,completed,reset_date,carry_over)
       VALUES (?,?,?,?,?,?,?,?)`,
      [crypto.randomUUID(), t.id, t.title, t.description, t.priority,
       isCompleted ? 1 : 0, today, shouldCarry ? 1 : 0]
    );
    if (!shouldCarry || isCompleted) {
      await db.execute('DELETE FROM todo_items WHERE id = ?', [t.id]);
    }
  }
}

export async function getTodoHistory(limit = 60) {
  return db.select(
    'SELECT * FROM todo_history ORDER BY reset_date DESC LIMIT ?',
    [limit]
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(key) {
  const r = await db.select('SELECT value FROM settings WHERE key = ?', [key]);
  return r.length > 0 ? safeJson(r[0].value) : null;
}

export async function setSetting(key, value) {
  await db.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, JSON.stringify(value)]
  );
}

export async function getAllSettings() {
  const rows = await db.select('SELECT * FROM settings');
  return Object.fromEntries(rows.map(r => [r.key, safeJson(r.value)]));
}

// ── Life Milestones ───────────────────────────────────────────────────────────

export async function getLifeMilestones() {
  return db.select('SELECT * FROM life_milestones ORDER BY target_year ASC, target_age ASC, created_at ASC');
}

export async function createLifeMilestone(m) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO life_milestones (id,title,description,target_age,target_year,status,color,sort_order,created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id, m.title, m.description || '', m.target_age || null, m.target_year || null,
     'not_started', m.color || 'indigo', 0, now]
  );
  return { id, ...m, status: 'not_started', created_at: now };
}

export async function updateLifeMilestone(id, updates) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => updates[k]);
  await db.execute(
    `UPDATE life_milestones SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteLifeMilestone(id) {
  await db.execute('DELETE FROM life_milestones WHERE id = ?', [id]);
}

// ── Mayor Agendas ─────────────────────────────────────────────────────────────

export async function getMayorAgendas() {
  const rows = await db.select('SELECT * FROM mayor_agendas ORDER BY created_at DESC');
  return rows.map(r => ({ ...r, milestone_ids: safeJson(r.milestone_ids, []) }));
}

export async function createMayorAgenda(a) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO mayor_agendas (id,title,description,frequency,target_count,milestone_ids,start_date,end_date,sort_order,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, a.title, a.description || '', a.frequency || 'weekly', a.target_count || 1,
     JSON.stringify(a.milestone_ids || []), a.start_date || null, a.end_date || null, 0, now]
  );
  return { id, ...a, milestone_ids: a.milestone_ids || [], created_at: now };
}

export async function updateMayorAgenda(id, updates) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => {
    const v = updates[k];
    return Array.isArray(v) ? JSON.stringify(v) : v;
  });
  await db.execute(
    `UPDATE mayor_agendas SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteMayorAgenda(id) {
  await db.execute('DELETE FROM mayor_agendas WHERE id = ?', [id]);
  await db.execute('UPDATE minor_agendas SET mayor_agenda_id = NULL WHERE mayor_agenda_id = ?', [id]);
}

// ── Minor Agendas ─────────────────────────────────────────────────────────────

export async function getMinorAgendas() {
  return db.select('SELECT * FROM minor_agendas ORDER BY time_of_day ASC, streak_count DESC');
}

export async function createMinorAgenda(a) {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO minor_agendas (id,title,description,mayor_agenda_id,duration_minutes,time_of_day,streak_count,last_done_date,sort_order,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [id, a.title, a.description || '', a.mayor_agenda_id || null, a.duration_minutes || 30,
     a.time_of_day || 'morning', 0, null, 0, now]
  );
  return { id, ...a, streak_count: 0, created_at: now };
}

export async function updateMinorAgenda(id, updates) {
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
  const values = fields.map(k => updates[k]);
  await db.execute(
    `UPDATE minor_agendas SET ${fields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`,
    [...values, id]
  );
}

export async function deleteMinorAgenda(id) {
  await db.execute('DELETE FROM minor_agendas WHERE id = ?', [id]);
}

export async function markMinorAgendaDone(id) {
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.select('SELECT * FROM minor_agendas WHERE id = ?', [id]);
  if (!rows.length) return;
  const a = rows[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  let streak = 1;
  if (a.last_done_date === yStr) streak = (a.streak_count || 0) + 1;
  else if (a.last_done_date === today) streak = a.streak_count || 1;
  await db.execute(
    'UPDATE minor_agendas SET streak_count = ?, last_done_date = ? WHERE id = ?',
    [streak, today, id]
  );
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const [totalIdeas, todayTotal, todayDone, weekHistory, topStreak, milestones] =
    await Promise.all([
      db.select('SELECT COUNT(*) as c FROM ideas'),
      db.select('SELECT COUNT(*) as c FROM todo_items WHERE date = ? AND parent_id IS NULL', [today]),
      db.select('SELECT COUNT(*) as c FROM todo_items WHERE date = ? AND status = "done" AND parent_id IS NULL', [today]),
      db.select(
        `SELECT DATE(reset_date) as day, SUM(completed) as done, COUNT(*) as total
         FROM todo_history WHERE reset_date >= ? GROUP BY DATE(reset_date) ORDER BY day ASC`,
        [weekAgoStr]
      ),
      db.select('SELECT MAX(streak_count) as m FROM minor_agendas'),
      db.select('SELECT status, COUNT(*) as c FROM life_milestones GROUP BY status'),
    ]);

  return {
    totalIdeas: totalIdeas[0]?.c || 0,
    todayTotal: todayTotal[0]?.c || 0,
    todayDone: todayDone[0]?.c || 0,
    weekHistory,
    topStreak: topStreak[0]?.m || 0,
    milestones,
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

function safeJson(str, fallback = null) {
  try { return JSON.parse(str); } catch { return fallback ?? str; }
}
