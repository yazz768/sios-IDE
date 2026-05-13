import useStore from '../store/useStore';
import { Inbox, LayoutGrid, CheckSquare, Target, BarChart2, Settings, Sun, Moon, Zap } from 'lucide-react';

const NAV = [
  { id: 'today',       label: 'Today',       icon: CheckSquare, hint: '⌘3' },
  { id: 'inbox',       label: 'Inbox',       icon: Inbox,       hint: '⌘1' },
  { id: 'board',       label: 'Board',       icon: LayoutGrid,  hint: '⌘2' },
  { id: 'action_plan', label: 'Action Plan', icon: Target,      hint: '⌘4' },
  { id: 'stats',       label: 'Statistik',   icon: BarChart2,   hint: '⌘5' },
];

export default function Sidebar() {
  const { currentPage, setCurrentPage, theme, toggleTheme, ideas, todos } = useStore();

  const inboxCount = ideas.filter(i => i.column_id === 'inbox').length;
  const todoCount = todos.filter(t => !t.parent_id && t.status !== 'done').length;

  const badge = (id) => {
    if (id === 'inbox') return inboxCount > 0 ? inboxCount : null;
    if (id === 'today') return todoCount > 0 ? todoCount : null;
    return null;
  };

  return (
    <aside className="w-52 shrink-0 h-full flex flex-col bg-white dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-700/60">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
          <Zap className="w-4 h-4 text-white" fill="white" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">Sios IDE</p>
          <p className="text-[10px] text-slate-400 leading-tight">Productivity System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, icon: Icon, hint }) => {
          const active = currentPage === id;
          const count = badge(id);
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                active
                  ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {count != null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  active ? 'bg-white/20 text-white' : 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-2 space-y-0.5 border-t border-slate-200 dark:border-slate-700/60 shrink-0">
        <button
          onClick={() => setCurrentPage('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            currentPage === 'settings'
              ? 'bg-indigo-500 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
          <span className="text-[10px] opacity-50 ml-auto">⌘6</span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
}
