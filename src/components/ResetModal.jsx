import { useState } from 'react';
import useStore from '../store/useStore';
import Modal from './Modal';
import { RefreshCw, Archive } from 'lucide-react';

export default function ResetModal() {
  const { todos, performReset, closeModal } = useStore();
  const pending = todos.filter(t => !t.parent_id && t.status !== 'done');
  const [carryOver, setCarryOver] = useState(new Set(pending.map(t => t.id)));

  const toggle = (id) => {
    setCarryOver(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const PRIORITY_LABEL = { high: '🔴', medium: '🟡', low: '🟢' };

  return (
    <Modal title="Reset Harian" onClose={closeModal}>
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Waktunya reset! Pilih task yang ingin dibawa ke hari berikutnya.
          Task yang tidak dipilih akan diarsipkan.
        </p>

        {pending.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm">
            <Archive className="w-10 h-10 mx-auto mb-2 opacity-30" />
            Semua task sudah selesai! 🎉
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{pending.length} task belum selesai</span>
              <div className="flex gap-2">
                <button onClick={() => setCarryOver(new Set(pending.map(t => t.id)))} className="text-xs text-indigo-500 hover:underline">Pilih Semua</button>
                <button onClick={() => setCarryOver(new Set())} className="text-xs text-slate-400 hover:underline">Batal Semua</button>
              </div>
            </div>
            {pending.map(t => (
              <label key={t.id} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={carryOver.has(t.id)}
                  onChange={() => toggle(t.id)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{t.title}</span>
                <span className="text-xs">{PRIORITY_LABEL[t.priority] || '🟡'}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={closeModal} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
            Nanti Saja
          </button>
          <button
            onClick={() => performReset(Array.from(carryOver))}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Sekarang
          </button>
        </div>
      </div>
    </Modal>
  );
}
