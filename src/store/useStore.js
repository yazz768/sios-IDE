import { create } from 'zustand';
import * as db from '../db/database';
import { format } from 'date-fns';
import { startTelegramPolling, stopTelegramPolling } from '../services/telegramPoller';

function today() {
  return format(new Date(), 'yyyy-MM-dd');
}

const useStore = create((set, get) => ({
  // ── UI ──────────────────────────────────────────────────────────────────────
  currentPage: 'today',
  theme: 'dark',
  isLoading: true,
  activeModal: null,
  modalData: null,
  boardSearch: '',
  inboxSearch: '',

  // ── Data ─────────────────────────────────────────────────────────────────────
  ideas: [],
  todos: [],
  lifeMilestones: [],
  mayorAgendas: [],
  minorAgendas: [],
  settings: {},
  stats: null,

  // ── UI Actions ───────────────────────────────────────────────────────────────
  setCurrentPage: (page) => set({ currentPage: page }),

  setTheme: async (theme) => {
    set({ theme });
    await db.setSetting('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },

  toggleTheme: async () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    await get().setTheme(next);
  },

  openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setBoardSearch: (q) => set({ boardSearch: q }),
  setInboxSearch: (q) => set({ inboxSearch: q }),

  // ── Init ─────────────────────────────────────────────────────────────────────
  init: async () => {
    set({ isLoading: true });
    try {
      await db.initDatabase();
      const settings = await db.getAllSettings();
      const theme = settings.theme || 'dark';
      document.documentElement.classList.toggle('dark', theme === 'dark');

      const [ideas, todos, lifeMilestones, mayorAgendas, minorAgendas] = await Promise.all([
        db.getIdeas(),
        db.getTodayTodos(today()),
        db.getLifeMilestones(),
        db.getMayorAgendas(),
        db.getMinorAgendas(),
      ]);

      set({ ideas, todos, lifeMilestones, mayorAgendas, minorAgendas, settings, theme, isLoading: false });
      get().scheduleResetCheck();
      if (settings.telegram?.active && settings.telegram?.token) {
        startTelegramPolling(settings.telegram, () => get().loadIdeas());
      }
    } catch (err) {
      console.error('Init failed:', err);
      set({ isLoading: false });
    }
  },

  scheduleResetCheck: () => {
    const { settings } = get();
    const resetTime = settings.reset_time || '00:00';
    const [h, m] = resetTime.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;
    setTimeout(() => {
      const lastReset = localStorage.getItem('sios_last_reset');
      const todayStr = today();
      if (lastReset !== todayStr) {
        set({ activeModal: 'daily_reset' });
      }
      get().scheduleResetCheck();
    }, delay);
  },

  performReset: async (carryOverIds = []) => {
    const todayStr = today();
    await db.archiveTodos(todayStr, carryOverIds);
    localStorage.setItem('sios_last_reset', todayStr);
    await get().loadTodos();
    get().closeModal();
  },

  // ── Ideas ─────────────────────────────────────────────────────────────────────
  loadIdeas: async () => {
    const ideas = await db.getIdeas();
    set({ ideas });
  },

  addIdea: async (idea) => {
    await db.createIdea(idea);
    await get().loadIdeas();
  },

  updateIdea: async (id, updates) => {
    await db.updateIdea(id, updates);
    await get().loadIdeas();
  },

  deleteIdea: async (id) => {
    await db.deleteIdea(id);
    await get().loadIdeas();
  },

  moveIdea: async (id, columnId) => {
    await db.updateIdea(id, { column_id: columnId });
    await get().loadIdeas();
  },

  ideaToTask: async (idea) => {
    const todayStr = today();
    await db.createTodo({
      title: (idea.content || '').split('\n')[0].slice(0, 120),
      description: idea.content,
      date: todayStr,
      priority: 'medium',
      idea_id: idea.id,
    });
    await db.updateIdea(idea.id, { column_id: 'planned' });
    await get().loadIdeas();
    await get().loadTodos();
  },

  // ── Todos ─────────────────────────────────────────────────────────────────────
  loadTodos: async (date) => {
    const todos = await db.getTodayTodos(date || today());
    set({ todos });
  },

  addTodo: async (todo) => {
    await db.createTodo({ date: today(), ...todo });
    await get().loadTodos();
  },

  updateTodo: async (id, updates) => {
    await db.updateTodo(id, updates);
    await get().loadTodos();
  },

  deleteTodo: async (id) => {
    await db.deleteTodo(id);
    await get().loadTodos();
  },

  toggleTodo: async (id) => {
    const todo = get().todos.find(t => t.id === id);
    if (!todo) return;
    const next = todo.status === 'done' ? 'pending' : 'done';
    await db.updateTodo(id, { status: next });
    await get().loadTodos();
  },

  // ── Action Plan ──────────────────────────────────────────────────────────────
  loadActionPlan: async () => {
    const [lifeMilestones, mayorAgendas, minorAgendas] = await Promise.all([
      db.getLifeMilestones(),
      db.getMayorAgendas(),
      db.getMinorAgendas(),
    ]);
    set({ lifeMilestones, mayorAgendas, minorAgendas });
  },

  addMilestone: async (m) => { await db.createLifeMilestone(m); await get().loadActionPlan(); },
  updateMilestone: async (id, u) => { await db.updateLifeMilestone(id, u); await get().loadActionPlan(); },
  deleteMilestone: async (id) => { await db.deleteLifeMilestone(id); await get().loadActionPlan(); },

  addMayorAgenda: async (a) => { await db.createMayorAgenda(a); await get().loadActionPlan(); },
  updateMayorAgenda: async (id, u) => { await db.updateMayorAgenda(id, u); await get().loadActionPlan(); },
  deleteMayorAgenda: async (id) => { await db.deleteMayorAgenda(id); await get().loadActionPlan(); },

  addMinorAgenda: async (a) => { await db.createMinorAgenda(a); await get().loadActionPlan(); },
  updateMinorAgenda: async (id, u) => { await db.updateMinorAgenda(id, u); await get().loadActionPlan(); },
  deleteMinorAgenda: async (id) => { await db.deleteMinorAgenda(id); await get().loadActionPlan(); },

  markMinorDone: async (id) => { await db.markMinorAgendaDone(id); await get().loadActionPlan(); },

  // ── Stats ─────────────────────────────────────────────────────────────────────
  loadStats: async () => {
    const stats = await db.getStats();
    set({ stats });
  },

  // ── Settings ──────────────────────────────────────────────────────────────────
  updateSetting: async (key, value) => {
    await db.setSetting(key, value);
    const settings = await db.getAllSettings();
    set({ settings });
    if (key === 'telegram') {
      stopTelegramPolling();
      if (value?.active && value?.token) {
        startTelegramPolling(value, () => get().loadIdeas());
      }
    }
  },
}));

export default useStore;
