import { useEffect } from 'react';
import useStore from './store/useStore';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import ResetModal from './components/ResetModal';
import TodayPage from './pages/TodayPage';
import InboxPage from './pages/InboxPage';
import BoardPage from './pages/BoardPage';
import ActionPlanPage from './pages/ActionPlanPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';

const PAGES = {
  today: TodayPage,
  inbox: InboxPage,
  board: BoardPage,
  action_plan: ActionPlanPage,
  stats: StatsPage,
  settings: SettingsPage,
};

export default function App() {
  const { currentPage, isLoading, init, activeModal, setCurrentPage } = useStore();

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const map = { '1': 'inbox', '2': 'board', '3': 'today', '4': 'action_plan', '5': 'stats', '6': 'settings' };
        if (map[e.key]) { e.preventDefault(); setCurrentPage(map[e.key]); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCurrentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Memuat Sios IDE…</p>
        </div>
      </div>
    );
  }

  const Page = PAGES[currentPage] || TodayPage;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      <TitleBar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-hidden">
          <Page />
        </main>
        {activeModal === 'daily_reset' && <ResetModal />}
      </div>
    </div>
  );
}
