import { useState } from 'react';
import { Plus, Trash2, Edit2, Target, Zap, CheckCircle, Circle, Clock, Flame, ChevronDown, ChevronRight } from 'lucide-react';
import useStore from '../store/useStore';
import Modal from '../components/Modal';

const TABS = [
  { id: 'milestone', label: 'Life Milestone' },
  { id: 'mayor',     label: 'Mayor Agenda' },
  { id: 'minor',     label: 'Minor Agenda' },
];

const MILESTONE_COLORS = {
  indigo: 'bg-indigo-500', purple: 'bg-purple-500', blue: 'bg-blue-500',
  green: 'bg-green-500',   orange: 'bg-orange-500', red: 'bg-red-500',
};

const STATUS_LABEL = {
  not_started: { label: 'Belum Dimulai', color: 'text-slate-400', icon: Circle },
  in_progress:  { label: 'Sedang Berjalan', color: 'text-indigo-500', icon: Zap },
  achieved:     { label: 'Tercapai', color: 'text-green-500', icon: CheckCircle },
  revised:      { label: 'Direvisi', color: 'text-amber-500', icon: Edit2 },
};

const TIME_LABEL = { morning: '🌅 Pagi', afternoon: '☀️ Siang', evening: '🌙 Malam' };

export default function ActionPlanPage() {
  const [tab, setTab] = useState('milestone');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Action Plan</h1>
        </div>
        <p className="text-xs text-slate-400 mb-3">Life Milestone → Mayor Agenda → Minor Agenda → Daily Task</p>
        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-sm transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-medium' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {tab === 'milestone' && <MilestoneTab />}
        {tab === 'mayor'     && <MayorTab />}
        {tab === 'minor'     && <MinorTab />}
      </div>
    </div>
  );
}

// ── Milestone Tab ─────────────────────────────────────────────────────────────

function MilestoneTab() {
  const { lifeMilestones, addMilestone, updateMilestone, deleteMilestone } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Tonggak-tonggak besar hidupmu</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Tambah Milestone
        </button>
      </div>

      {lifeMilestones.length === 0 && (
        <EmptyState icon={Target} text="Belum ada Life Milestone" sub='Mulai dengan "Di umur 20 tahun, saya ingin…"' />
      )}

      {lifeMilestones.map(m => {
        const S = STATUS_LABEL[m.status] || STATUS_LABEL.not_started;
        const SIcon = S.icon;
        return (
          <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${MILESTONE_COLORS[m.color] || 'bg-indigo-500'} shrink-0 mt-1`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-slate-900 dark:text-white text-sm">{m.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditItem(m)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteMilestone(m.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {m.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{m.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  {(m.target_age || m.target_year) && (
                    <span className="text-xs text-slate-400">🎯 {m.target_age ? `Usia ${m.target_age}` : `Tahun ${m.target_year}`}</span>
                  )}
                  <span className={`flex items-center gap-1 text-xs ${S.color}`}>
                    <SIcon className="w-3 h-3" />{S.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {showAdd && <MilestoneFormModal onClose={() => setShowAdd(false)} onSave={async (data) => { await addMilestone(data); setShowAdd(false); }} />}
      {editItem && <MilestoneFormModal initial={editItem} onClose={() => setEditItem(null)} onSave={async (data) => { await updateMilestone(editItem.id, data); setEditItem(null); }} />}
    </div>
  );
}

function MilestoneFormModal({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [targetAge, setTargetAge] = useState(initial?.target_age || '');
  const [targetYear, setTargetYear] = useState(initial?.target_year || '');
  const [status, setStatus] = useState(initial?.status || 'not_started');
  const [color, setColor] = useState(initial?.color || 'indigo');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), target_age: parseInt(targetAge) || null, target_year: parseInt(targetYear) || null, status, color });
  };

  return (
    <Modal title={initial ? 'Edit Milestone' : 'Tambah Life Milestone'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Field label="Judul Milestone">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Di umur 25 tahun…" className="field" />
        </Field>
        <Field label="Deskripsi">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Kondisi ideal yang ingin dicapai…" className="field resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target Usia"><input type="number" value={targetAge} onChange={e => setTargetAge(e.target.value)} placeholder="25" className="field" /></Field>
          <Field label="Target Tahun"><input type="number" value={targetYear} onChange={e => setTargetYear(e.target.value)} placeholder="2030" className="field" /></Field>
        </div>
        <Field label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)} className="field cursor-pointer">
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </Field>
        <Field label="Warna">
          <div className="flex gap-2 mt-1">
            {Object.entries(MILESTONE_COLORS).map(([c, cls]) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full ${cls} transition-all ${color === c ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`} />
            ))}
          </div>
        </Field>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Mayor Tab ─────────────────────────────────────────────────────────────────

function MayorTab() {
  const { mayorAgendas, lifeMilestones, addMayorAgenda, updateMayorAgenda, deleteMayorAgenda } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const milestoneTitle = (id) => lifeMilestones.find(m => m.id === id)?.title || id;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Kebiasaan dan tindakan rutin per minggu/bulan</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Tambah Mayor Agenda
        </button>
      </div>

      {mayorAgendas.length === 0 && (
        <EmptyState icon={Zap} text="Belum ada Mayor Agenda" sub='Contoh: "Upload 3 video per minggu"' />
      )}

      {mayorAgendas.map(a => (
        <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 dark:text-white text-sm">{a.title}</h3>
              {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                  {a.target_count}× {a.frequency === 'weekly' ? 'per minggu' : 'per bulan'}
                </span>
                {a.milestone_ids?.slice(0, 2).map(mid => (
                  <span key={mid} className="text-xs text-slate-400 truncate max-w-32">🎯 {milestoneTitle(mid)}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditItem(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteMayorAgenda(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      ))}

      {showAdd && <MayorFormModal onClose={() => setShowAdd(false)} onSave={async (d) => { await addMayorAgenda(d); setShowAdd(false); }} />}
      {editItem && <MayorFormModal initial={editItem} onClose={() => setEditItem(null)} onSave={async (d) => { await updateMayorAgenda(editItem.id, d); setEditItem(null); }} />}
    </div>
  );
}

function MayorFormModal({ initial, onClose, onSave }) {
  const { lifeMilestones } = useStore();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [frequency, setFrequency] = useState(initial?.frequency || 'weekly');
  const [targetCount, setTargetCount] = useState(initial?.target_count || 1);
  const [selectedMilestones, setSelectedMilestones] = useState(initial?.milestone_ids || []);

  const toggleMilestone = (id) => {
    setSelectedMilestones(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), frequency, target_count: parseInt(targetCount) || 1, milestone_ids: selectedMilestones });
  };

  return (
    <Modal title={initial ? 'Edit Mayor Agenda' : 'Tambah Mayor Agenda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Field label="Judul Agenda">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Upload 3 video per minggu…" className="field" />
        </Field>
        <Field label="Deskripsi">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="field resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Frekuensi">
            <select value={frequency} onChange={e => setFrequency(e.target.value)} className="field cursor-pointer">
              <option value="weekly">Per Minggu</option>
              <option value="monthly">Per Bulan</option>
            </select>
          </Field>
          <Field label="Target Jumlah">
            <input type="number" min="1" value={targetCount} onChange={e => setTargetCount(e.target.value)} className="field" />
          </Field>
        </div>
        {lifeMilestones.length > 0 && (
          <Field label="Hubungkan ke Milestone (opsional)">
            <div className="space-y-1.5 mt-1">
              {lifeMilestones.map(m => (
                <label key={m.id} className="flex items-center gap-2.5 cursor-pointer group">
                  <input type="checkbox" checked={selectedMilestones.includes(m.id)} onChange={() => toggleMilestone(m.id)} className="w-4 h-4 accent-indigo-500 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{m.title}</span>
                </label>
              ))}
            </div>
          </Field>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Minor Tab ─────────────────────────────────────────────────────────────────

function MinorTab() {
  const { minorAgendas, mayorAgendas, addMinorAgenda, updateMinorAgenda, deleteMinorAgenda, markMinorDone } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const mayorTitle = (id) => mayorAgendas.find(a => a.id === id)?.title;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">Kebiasaan harian yang mendukung Mayor Agenda</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors">
          <Plus className="w-3.5 h-3.5" /> Tambah Minor Agenda
        </button>
      </div>

      {minorAgendas.length === 0 && (
        <EmptyState icon={Flame} text="Belum ada Minor Agenda" sub='Contoh: "2 jam produksi konten setiap hari"' />
      )}

      {minorAgendas.map(a => {
        const today = new Date().toISOString().split('T')[0];
        const doneToday = a.last_done_date === today;
        return (
          <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => markMinorDone(a.id)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  doneToday ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                }`}
              >
                {doneToday && <span className="text-white text-[9px]">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-medium text-sm ${doneToday ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{a.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setEditItem(a)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteMinorAgenda(a.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {a.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{a.description}</p>}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{a.duration_minutes}m</span>
                  <span className="text-xs text-slate-400">{TIME_LABEL[a.time_of_day] || a.time_of_day}</span>
                  {a.streak_count > 0 && (
                    <span className="text-xs flex items-center gap-1 text-orange-500 font-medium">
                      <Flame className="w-3 h-3" />{a.streak_count} hari
                    </span>
                  )}
                  {a.mayor_agenda_id && mayorTitle(a.mayor_agenda_id) && (
                    <span className="text-xs text-slate-400 truncate max-w-40">⚡ {mayorTitle(a.mayor_agenda_id)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {showAdd && <MinorFormModal onClose={() => setShowAdd(false)} onSave={async (d) => { await addMinorAgenda(d); setShowAdd(false); }} />}
      {editItem && <MinorFormModal initial={editItem} onClose={() => setEditItem(null)} onSave={async (d) => { await updateMinorAgenda(editItem.id, d); setEditItem(null); }} />}
    </div>
  );
}

function MinorFormModal({ initial, onClose, onSave }) {
  const { mayorAgendas } = useStore();
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [mayorId, setMayorId] = useState(initial?.mayor_agenda_id || '');
  const [duration, setDuration] = useState(initial?.duration_minutes || 30);
  const [timeOfDay, setTimeOfDay] = useState(initial?.time_of_day || 'morning');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), mayor_agenda_id: mayorId || null, duration_minutes: parseInt(duration) || 30, time_of_day: timeOfDay });
  };

  return (
    <Modal title={initial ? 'Edit Minor Agenda' : 'Tambah Minor Agenda'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <Field label="Judul Kebiasaan">
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="2 jam produksi konten setiap hari…" className="field" />
        </Field>
        <Field label="Deskripsi">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="field resize-none" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Durasi (menit)">
            <input type="number" min="1" value={duration} onChange={e => setDuration(e.target.value)} className="field" />
          </Field>
          <Field label="Waktu">
            <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)} className="field cursor-pointer">
              <option value="morning">🌅 Pagi</option>
              <option value="afternoon">☀️ Siang</option>
              <option value="evening">🌙 Malam</option>
            </select>
          </Field>
        </div>
        {mayorAgendas.length > 0 && (
          <Field label="Mayor Agenda (opsional)">
            <select value={mayorId} onChange={e => setMayorId(e.target.value)} className="field cursor-pointer">
              <option value="">— Pilih Mayor Agenda —</option>
              {mayorAgendas.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </Field>
        )}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Batal</button>
          <button type="submit" className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, text, sub }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400">
      <Icon className="w-10 h-10 mb-3 opacity-20" />
      <p className="text-sm">{text}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}
