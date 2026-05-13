import { useEffect } from 'react';
import { BarChart2, Lightbulb, CheckSquare, Flame, Target, TrendingUp } from 'lucide-react';
import useStore from '../store/useStore';

export default function StatsPage() {
  const { stats, loadStats, ideas, todos, minorAgendas, lifeMilestones } = useStore();

  useEffect(() => {
    loadStats();
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const totalToday = todos.filter(t => !t.parent_id).length;
  const doneToday = todos.filter(t => !t.parent_id && t.status === 'done').length;
  const pct = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;

  const topStreak = Math.max(0, ...minorAgendas.map(a => a.streak_count || 0));
  const totalIdeas = ideas.length;
  const milestonesDone = lifeMilestones.filter(m => m.status === 'achieved').length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Statistik</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">Gambaran produktivitas kamu</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            icon={CheckSquare} iconColor="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10"
            value={`${doneToday}/${totalToday}`}
            label="Task Selesai Hari Ini"
            sub={`${pct}% completion rate`}
          />
          <KpiCard
            icon={Lightbulb} iconColor="text-yellow-500" bg="bg-yellow-50 dark:bg-yellow-500/10"
            value={totalIdeas}
            label="Total Ide"
            sub={`${ideas.filter(i => i.column_id === 'inbox').length} di inbox`}
          />
          <KpiCard
            icon={Flame} iconColor="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10"
            value={topStreak}
            label="Streak Terpanjang"
            sub="hari berturut-turut"
          />
          <KpiCard
            icon={Target} iconColor="text-green-500" bg="bg-green-50 dark:bg-green-500/10"
            value={milestonesDone}
            label="Milestone Tercapai"
            sub={`dari ${lifeMilestones.length} total`}
          />
        </div>

        {/* Today's Progress */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Progress Hari Ini</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-slate-900 dark:text-white">{pct}%</span>
              <span className="text-sm text-slate-400">{doneToday} dari {totalToday} task</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                }}
              />
            </div>
            {pct === 100 && <p className="text-xs text-green-500 mt-2 font-medium">🎉 Semua task selesai! Luar biasa!</p>}
          </div>
        </section>

        {/* Weekly History */}
        {stats?.weekHistory && stats.weekHistory.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> History 7 Hari Terakhir
            </h2>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-end justify-between gap-1 h-24">
                {stats.weekHistory.map((day, i) => {
                  const rate = day.total > 0 ? (day.done / day.total) * 100 : 0;
                  const dayLabel = new Date(day.day).toLocaleDateString('id-ID', { weekday: 'short' });
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center h-16">
                        <div
                          className="w-full max-w-6 rounded-t-lg bg-indigo-500/70 transition-all hover:bg-indigo-500"
                          style={{ height: `${Math.max(4, rate)}%` }}
                          title={`${Math.round(rate)}% (${day.done}/${day.total})`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Ideas by Column */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Ide per Kolom</h2>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            {[
              { id: 'inbox',          label: '📥 Inbox' },
              { id: 'high_potential', label: '⭐ Potensial Tinggi' },
              { id: 'needs_research', label: '🔬 Perlu Riset' },
              { id: 'planned',        label: '📅 Direncanakan' },
              { id: 'parked',         label: '❄️ Parkir' },
              { id: 'archived',       label: '🗑️ Arsip' },
            ].map(col => {
              const count = ideas.filter(i => i.column_id === col.id).length;
              const pctCol = totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0;
              return (
                <div key={col.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{col.label}</span>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400/60 rounded-full transition-all" style={{ width: `${pctCol}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Minor Agenda Streaks */}
        {minorAgendas.filter(a => a.streak_count > 0).length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" /> Streak Aktif
            </h2>
            <div className="space-y-2">
              {minorAgendas.filter(a => a.streak_count > 0).sort((a, b) => b.streak_count - a.streak_count).map(a => (
                <div key={a.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex-1">{a.title}</span>
                  <span className="text-sm font-semibold text-orange-500 flex items-center gap-1 shrink-0 ml-2">
                    <Flame className="w-4 h-4" />{a.streak_count}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, iconColor, bg, value, label, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
