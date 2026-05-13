import { useState } from 'react';
import { Plus, Search, Trash2, ArrowRight, Star, Inbox, Edit2, X } from 'lucide-react';
import useStore from '../store/useStore';
import Modal from '../components/Modal';

const COLUMNS = [
  { id: 'inbox',           label: '📥 Inbox' },
  { id: 'high_potential',  label: '⭐ Potensial Tinggi' },
  { id: 'needs_research',  label: '🔬 Perlu Riset' },
  { id: 'planned',         label: '📅 Direncanakan' },
  { id: 'parked',          label: '❄️ Parkir' },
  { id: 'archived',        label: '🗑️ Arsip' },
];

const COLOR_DOT = {
  default: 'bg-slate-400',
  red:     'bg-red-400',
  orange:  'bg-orange-400',
  yellow:  'bg-yellow-400',
  green:   'bg-green-400',
  blue:    'bg-blue-400',
  purple:  'bg-purple-400',
};

export default function InboxPage() {
  const { ideas, inboxSearch, setInboxSearch, addIdea, deleteIdea, moveIdea } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editIdea, setEditIdea] = useState(null);
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');

  const inboxIdeas = ideas
    .filter(i => i.column_id === 'inbox')
    .filter(i => !inboxSearch || i.content.toLowerCase().includes(inboxSearch.toLowerCase()));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    await addIdea({ content: content.trim(), color, column_id: 'inbox' });
    setContent(''); setColor('default'); setShowAdd(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Inbox className="w-5 h-5 text-indigo-500" /> Idea Inbox
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{inboxIdeas.length} ide belum disortir</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Tambah Ide
          </button>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={inboxSearch}
            onChange={e => setInboxSearch(e.target.value)}
            placeholder="Cari ide…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-lg outline-none placeholder-slate-400"
          />
          {inboxSearch && (
            <button onClick={() => setInboxSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ideas list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
        {inboxIdeas.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <Inbox className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Inbox kosong</p>
            <p className="text-xs mt-1 opacity-70">Tambah ide atau sambungkan WhatsApp/Telegram</p>
          </div>
        )}

        {inboxIdeas.map(idea => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            onEdit={() => setEditIdea(idea)}
            onDelete={() => deleteIdea(idea.id)}
            onMove={(col) => moveIdea(idea.id, col)}
          />
        ))}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <Modal title="Tambah Ide Baru" onClose={() => { setShowAdd(false); setContent(''); setColor('default'); }}>
          <form onSubmit={handleAdd} className="p-5 space-y-4">
            <textarea
              autoFocus
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tulis ide kamu di sini…"
              rows={4}
              className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none placeholder-slate-400 resize-none border border-slate-200 dark:border-slate-700"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Warna:</span>
              {Object.keys(COLOR_DOT).map(c => (
                <button
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full ${COLOR_DOT[c]} transition-all ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowAdd(false); setContent(''); }} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50">Batal</button>
              <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editIdea && (
        <EditIdeaModal idea={editIdea} onClose={() => setEditIdea(null)} />
      )}
    </div>
  );
}

function IdeaCard({ idea, onEdit, onDelete, onMove }) {
  const [showMenu, setShowMenu] = useState(false);
  const preview = idea.content.length > 160 ? idea.content.slice(0, 160) + '…' : idea.content;
  const dot = COLOR_DOT[idea.color] || COLOR_DOT.default;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 group hover:border-slate-300 dark:hover:border-slate-600 transition-all relative">
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0 mt-1`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">{preview}</p>
          <p className="text-xs text-slate-400 mt-2">{new Date(idea.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(s => !s)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              title="Pindah ke kolom"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-48">
                {COLUMNS.filter(c => c.id !== 'inbox').map(col => (
                  <button
                    key={col.id}
                    onClick={() => { onMove(col.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onDelete} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EditIdeaModal({ idea, onClose }) {
  const { updateIdea } = useStore();
  const [content, setContent] = useState(idea.content);
  const [notes, setNotes] = useState(idea.notes || '');
  const [color, setColor] = useState(idea.color || 'default');

  const handleSave = async (e) => {
    e.preventDefault();
    await updateIdea(idea.id, { content: content.trim(), notes: notes.trim(), color });
    onClose();
  };

  return (
    <Modal title="Edit Ide" onClose={onClose} size="lg">
      <form onSubmit={handleSave} className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Konten Ide</label>
          <textarea
            autoFocus
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none resize-none border border-slate-200 dark:border-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 block">Catatan Tambahan</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Catatan, referensi, atau pemikiran lanjutan…"
            className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none resize-none border border-slate-200 dark:border-slate-700 placeholder-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Warna:</span>
          {Object.keys(COLOR_DOT).map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full ${COLOR_DOT[c]} transition-all ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
