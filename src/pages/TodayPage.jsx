import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Plus, Check, Trash2, ChevronDown, ChevronRight, Clock, RefreshCw, CheckSquare } from 'lucide-react';
import useStore from '../store/useStore';

const PRIORITY = {
  high:   { label: '🔴 Tinggi',  color: 'text-red-500',    bg: 'bg-red-500/10' },
  medium: { label: '🟡 Sedang',  color: 'text-amber-500',  bg: 'bg-amber-500/10' },
  low:    { label: '🟢 Rendah',  color: 'text-green-500',  bg: 'bg-green-500/10' },
};

export default function TodayPage() {
  const { todos, addTodo, toggleTodo, deleteTodo, openModal } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [estimate, setEstimate] = useState('');
  const [expanded, setExpanded] = useState(null);
  const inputRef = useRef(null);

  const dateLabel = format(new Date(), "EEEE, d MMMM yyyy", { locale: idLocale });
  const rootTasks = todos.filter(t => !t.parent_id);
  const done = rootTasks.filter(t => t.status === 'done').length;
  const total = rootTasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const subtasksOf = (id) => todos.filter(t => t.parent_id === id);

  useEffect(() => {
    if (showForm) inputRef.current?.focus();
  }, [showForm]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') { e.preventDefault(); setShowForm(true); }
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTodo({ title: title.trim(), priority, estimated_minutes: parseInt(estimate) || 0 });
    setTitle(''); setEstimate(''); setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Today</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('daily_reset')}
              title="Manual reset"
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
            {done}/{total} · {pct}%
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {showForm && (
          <form onSubmit={handleAdd} className="bg-white dark:bg-slate-800 rounded-xl border border-indigo-400 dark:border-indigo-500/60 p-4 shadow-sm">
            <input
              ref={inputRef}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nama task…"
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none mb-3"
              onKeyDown={e => { if (e.key === 'Escape') { setShowForm(false); e.stopPropagation(); } }}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none border-0 cursor-pointer"
              >
                {Object.entries(PRIORITY).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                type="number" min="1"
                value={estimate}
                onChange={e => setEstimate(e.target.value)}
                placeholder="Menit…"
                className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 w-20 outline-none"
              />
              <div className="flex-1" />
              <button type="button" onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1.5">Batal</button>
              <button type="submit" className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg">Tambah</button>
            </div>
          </form>
        )}

        {rootTasks.length === 0 && !showForm && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <CheckSquare className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Belum ada task hari ini</p>
            <p className="text-xs mt-1 opacity-70">Tekan ⌘T untuk tambah</p>
          </div>
        )}

        {rootTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            subtasks={subtasksOf(task.id)}
            isExpanded={expanded === task.id}
            onExpand={() => setExpanded(expanded === task.id ? null : task.id)}
            onToggle={() => toggleTodo(task.id)}
            onDelete={() => deleteTodo(task.id)}
            onAddSub={async (t) => { await addTodo({ title: t, parent_id: task.id, priority: 'medium' }); setExpanded(task.id); }}
            onToggleSub={(id) => toggleTodo(id)}
            onDeleteSub={(id) => deleteTodo(id)}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ task, subtasks, isExpanded, onExpand, onToggle, onDelete, onAddSub, onToggleSub, onDeleteSub }) {
  const [showSubForm, setShowSubForm] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const done = task.status === 'done';
  const p = PRIORITY[task.priority] || PRIORITY.medium;

  const handleAddSub = (e) => {
    e.preventDefault();
    if (!subTitle.trim()) return;
    onAddSub(subTitle.trim());
    setSubTitle('');
    setShowSubForm(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border transition-all ${done ? 'border-slate-200/60 dark:border-slate-700/40 opacity-60' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}>
      {/* Main row */}
      <div className="flex items-start gap-3 p-3.5">
        <button
          onClick={onToggle}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
          }`}
        >
          {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${done ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>{task.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${p.color}`}>{task.priority === 'high' ? '🔴' : task.priority === 'low' ? '🟢' : '🟡'}</span>
            {task.estimated_minutes > 0 && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5">
                <Clock className="w-3 h-3" />{task.estimated_minutes}m
              </span>
            )}
            {subtasks.length > 0 && (
              <span className="text-xs text-slate-400">{subtasks.filter(s => s.status === 'done').length}/{subtasks.length}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {(subtasks.length > 0 || isExpanded) && (
            <button onClick={onExpand} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={() => { setShowSubForm(s => !s); setExpanded && onExpand(); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Tambah subtask">
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {(isExpanded || showSubForm) && subtasks.map(sub => (
        <div key={sub.id} className="flex items-center gap-3 px-3.5 pb-1.5 pl-12">
          <button
            onClick={() => onToggleSub(sub.id)}
            className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              sub.status === 'done' ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400'
            }`}
          >
            {sub.status === 'done' && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
          </button>
          <span className={`text-xs flex-1 ${sub.status === 'done' ? 'line-through text-slate-400' : 'text-slate-600 dark:text-slate-300'}`}>{sub.title}</span>
          <button onClick={() => onDeleteSub(sub.id)} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add subtask form */}
      {showSubForm && (
        <form onSubmit={handleAddSub} className="flex items-center gap-2 px-3.5 pb-3 pl-12">
          <input
            autoFocus
            value={subTitle}
            onChange={e => setSubTitle(e.target.value)}
            placeholder="Nama subtask…"
            className="flex-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 outline-none"
            onKeyDown={e => { if (e.key === 'Escape') setShowSubForm(false); }}
          />
          <button type="submit" className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg">+</button>
        </form>
      )}
    </div>
  );
}
