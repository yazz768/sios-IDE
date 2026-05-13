import { useState } from 'react';
import {
  DndContext, DragOverlay, pointerWithin, rectIntersection, MouseSensor, TouchSensor, useSensor, useSensors, useDroppable,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Search, X, Trash2, CheckSquare, Edit2 } from 'lucide-react';
import useStore from '../store/useStore';
import Modal from '../components/Modal';

const COLUMN_DEFS = [
  { id: 'inbox',          label: '📥 Inbox',           color: 'text-slate-500' },
  { id: 'high_potential', label: '⭐ Potensial Tinggi', color: 'text-yellow-500' },
  { id: 'needs_research', label: '🔬 Perlu Riset',      color: 'text-blue-500' },
  { id: 'planned',        label: '📅 Direncanakan',     color: 'text-indigo-500' },
  { id: 'parked',         label: '❄️ Parkir',           color: 'text-cyan-500' },
  { id: 'archived',       label: '🗑️ Arsip/Gugur',      color: 'text-slate-400' },
];

const COLOR_DOT = {
  default: 'bg-slate-400',
  red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-yellow-400',
  green: 'bg-green-400', blue: 'bg-blue-400', purple: 'bg-purple-400',
};

export default function BoardPage() {
  const { ideas, boardSearch, setBoardSearch, addIdea, moveIdea, deleteIdea, ideaToTask } = useStore();
  const [activeId, setActiveId] = useState(null);
  const [addCol, setAddCol] = useState(null);
  const [editIdea, setEditIdea] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const filtered = (colId) =>
    ideas
      .filter(i => i.column_id === colId)
      .filter(i => !boardSearch || i.content.toLowerCase().includes(boardSearch.toLowerCase()));

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const activeIdea = ideas.find(i => i.id === active.id);
    if (!activeIdea) return;
    const targetColId = COLUMN_DEFS.find(c => c.id === over.id)?.id
      || ideas.find(i => i.id === over.id)?.column_id;
    if (targetColId && targetColId !== activeIdea.column_id) {
      moveIdea(active.id, targetColId);
    }
  };

  const draggedIdea = activeId ? ideas.find(i => i.id === activeId) : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30 flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white shrink-0">Idea Board</h1>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={boardSearch}
            onChange={e => setBoardSearch(e.target.value)}
            placeholder="Cari di semua kolom…"
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-lg outline-none placeholder-slate-400"
          />
          {boardSearch && (
            <button onClick={() => setBoardSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => pointerWithin(args).length ? pointerWithin(args) : rectIntersection(args)}
          onDragStart={({ active }) => setActiveId(active.id)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="flex gap-3 p-4 h-full min-w-max">
            {COLUMN_DEFS.map(col => (
              <BoardColumn
                key={col.id}
                col={col}
                ideas={filtered(col.id)}
                onAddIdea={() => setAddCol(col.id)}
                onEditIdea={setEditIdea}
                onDeleteIdea={deleteIdea}
                onMakeTask={ideaToTask}
              />
            ))}
          </div>
          <DragOverlay>
            {draggedIdea && (
              <div className="drag-overlay bg-white dark:bg-slate-800 rounded-xl border border-indigo-400 shadow-2xl p-3 w-64 opacity-90 rotate-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{draggedIdea.content}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Idea Modal */}
      {addCol && (
        <AddIdeaModal
          columnId={addCol}
          columnLabel={COLUMN_DEFS.find(c => c.id === addCol)?.label}
          onClose={() => setAddCol(null)}
          onAdd={async (content, color) => {
            await addIdea({ content, color, column_id: addCol });
            setAddCol(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {editIdea && (
        <EditBoardIdeaModal idea={editIdea} onClose={() => setEditIdea(null)} />
      )}
    </div>
  );
}

function BoardColumn({ col, ideas, onAddIdea, onEditIdea, onDeleteIdea, onMakeTask }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`w-64 shrink-0 flex flex-col rounded-2xl overflow-hidden border transition-colors ${
        isOver
          ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-500/60'
          : 'bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
      }`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
        <span className={`text-sm font-semibold truncate ${col.color}`}>{col.label}</span>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{ideas.length}</span>
          <button
            onClick={onAddIdea}
            className="p-1 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <SortableContext items={ideas.map(i => i.id)} strategy={verticalListSortingStrategy} id={col.id}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-16">
          {ideas.map(idea => (
            <SortableCard
              key={idea.id}
              idea={idea}
              isPlanned={col.id === 'planned'}
              onEdit={() => onEditIdea(idea)}
              onDelete={() => onDeleteIdea(idea.id)}
              onMakeTask={() => onMakeTask(idea)}
            />
          ))}
        </div>
      </SortableContext>

      <div className="h-1 shrink-0" />
    </div>
  );
}

function SortableCard({ idea, isPlanned, onEdit, onDelete, onMakeTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const dot = COLOR_DOT[idea.color] || COLOR_DOT.default;
  const preview = idea.content.length > 140 ? idea.content.slice(0, 140) + '…' : idea.content;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 group hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
            <span className="text-xs text-slate-400">{new Date(idea.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed break-words">{preview}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {isPlanned && (
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onMakeTask}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
          >
            <CheckSquare className="w-3 h-3" /> Task
          </button>
        )}
        <button onPointerDown={e => e.stopPropagation()} onClick={onEdit} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ml-auto">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onPointerDown={e => e.stopPropagation()} onClick={onDelete} className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function AddIdeaModal({ columnLabel, onClose, onAdd }) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState('default');
  return (
    <Modal title={`Tambah ke ${columnLabel}`} onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (content.trim()) onAdd(content.trim(), color); }} className="p-5 space-y-4">
        <textarea autoFocus value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Isi ide…"
          className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none resize-none border border-slate-200 dark:border-slate-700 placeholder-slate-400" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Warna:</span>
          {Object.keys(COLOR_DOT).map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full ${COLOR_DOT[c]} ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'} transition-all`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Tambah</button>
        </div>
      </form>
    </Modal>
  );
}

function EditBoardIdeaModal({ idea, onClose }) {
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
        <textarea autoFocus value={content} onChange={e => setContent(e.target.value)} rows={5}
          className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none resize-none border border-slate-200 dark:border-slate-700" />
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Catatan tambahan…"
          className="w-full text-sm bg-slate-50 dark:bg-slate-700/60 text-slate-900 dark:text-white rounded-xl p-3 outline-none resize-none border border-slate-200 dark:border-slate-700 placeholder-slate-400" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Warna:</span>
          {Object.keys(COLOR_DOT).map(c => (
            <button key={c} type="button" onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full ${COLOR_DOT[c]} ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'} transition-all`} />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
