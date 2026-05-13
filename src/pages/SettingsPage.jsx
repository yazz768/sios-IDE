import { useState } from 'react';
import { Settings, Bell, Clock, MessageSquare, Eye, EyeOff, Save, CheckCircle, XCircle, Loader2, Wifi } from 'lucide-react';
import useStore from '../store/useStore';

export default function SettingsPage() {
  const { settings, updateSetting, theme, setTheme } = useStore();
  const [saved, setSaved] = useState(false);

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="h-full flex flex-col">
      <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30 flex items-center gap-2">
        <Settings className="w-5 h-5 text-indigo-500" />
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Settings</h1>
        {saved && (
          <span className="ml-auto flex items-center gap-1.5 text-green-500 text-sm animate-pulse">
            <CheckCircle className="w-4 h-4" /> Tersimpan
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-5 space-y-6">
        {/* Appearance */}
        <Section title="Tampilan" icon={Eye}>
          <SettingRow label="Mode Tampilan" sub="Pilih tema terang atau gelap">
            <div className="flex bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1">
              {['light', 'dark'].map(t => (
                <button key={t}
                  onClick={() => { setTheme(t); showSaved(); }}
                  className={`px-4 py-1.5 rounded-lg text-sm transition-all ${theme === t ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm font-medium' : 'text-slate-500 dark:text-slate-400'}`}
                >
                  {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Daily Reset */}
        <Section title="Reset Harian" icon={Clock}>
          <SettingRow label="Jam Reset Otomatis" sub="To-do list direset setiap hari pada jam ini">
            <input
              type="time"
              defaultValue={settings.reset_time || '00:00'}
              onChange={async (e) => { await updateSetting('reset_time', e.target.value); showSaved(); }}
              className="field w-32"
            />
          </SettingRow>
          <SettingRow label="Morning Nudge" sub="Notifikasi pengingat to-do di pagi hari">
            <input
              type="time"
              defaultValue={settings.morning_nudge || '07:00'}
              onChange={async (e) => { await updateSetting('morning_nudge', e.target.value); showSaved(); }}
              className="field w-32"
            />
          </SettingRow>
        </Section>

        {/* Notifications */}
        <Section title="Notifikasi" icon={Bell}>
          <SettingRow label="Aktifkan Notifikasi Desktop" sub="Notifikasi untuk ide baru dan reminder">
            <Toggle
              value={settings.notifications_enabled !== false}
              onChange={async (v) => { await updateSetting('notifications_enabled', v); showSaved(); }}
            />
          </SettingRow>
        </Section>

        {/* Telegram */}
        <Section title="Integrasi Telegram Bot" icon={MessageSquare}>
          <p className="text-xs text-slate-400 -mt-1 mb-1">
            Buat bot via <span className="font-mono text-indigo-500">@BotFather</span>, salin Token, lalu aktifkan polling.
            Kirim pesan dengan prefix yang ditentukan agar masuk ke Inbox.
          </p>
          <TelegramSettings showSaved={showSaved} />
        </Section>

        {/* WhatsApp */}
        <Section title="Integrasi WhatsApp (Fonnte)" icon={MessageSquare}>
          <p className="text-xs text-slate-400 -mt-1 mb-1">
            Daftar di <span className="font-mono text-indigo-500">fonnte.com</span>, buat device, salin API Key.
            Kirim pesan dengan prefix yang ditentukan.
          </p>
          <WhatsAppSettings showSaved={showSaved} />
        </Section>

        {/* Column Names */}
        <Section title="Nama Kolom Board">
          <p className="text-xs text-slate-400 -mt-1">Kustomisasi nama 6 kolom Idea Board</p>
          <ColumnNamesSettings showSaved={showSaved} />
        </Section>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TelegramSettings({ showSaved }) {
  const { settings, updateSetting } = useStore();
  const tg = settings.telegram || {};
  const [token, setToken] = useState(tg.token || '');
  const [prefix, setPrefix] = useState(tg.prefix || 'IDE:');
  const [interval, setInterval] = useState(tg.polling_interval || 30);
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'fail'
  const [botName, setBotName] = useState('');

  const handleTest = async () => {
    if (!token.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch(`https://api.telegram.org/bot${token.trim()}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setStatus('ok');
        setBotName(`@${data.result.username}`);
      } else {
        setStatus('fail');
        setBotName(data.description || 'Token tidak valid');
      }
    } catch {
      setStatus('fail');
      setBotName('Gagal terhubung ke server');
    }
  };

  const handleSave = async () => {
    await updateSetting('telegram', {
      token: token.trim(), prefix: prefix.trim(),
      polling_interval: parseInt(interval) || 30, active: !!token.trim(),
    });
    showSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Bot Token</label>
        <div className="relative">
          <input type={showToken ? 'text' : 'password'} value={token}
            onChange={e => { setToken(e.target.value); setStatus(null); }}
            placeholder="1234567890:AAFxxxxxxxxx" className="field pr-10" />
          <button type="button" onClick={() => setShowToken(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Prefix Filter</label><input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="IDE:" className="field" /></div>
        <div><label className="label">Polling (detik)</label><input type="number" min="10" max="120" value={interval} onChange={e => setInterval(e.target.value)} className="field" /></div>
      </div>

      {/* Status indicator */}
      {status && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          status === 'ok'      ? 'bg-green-500/10 text-green-500' :
          status === 'fail'    ? 'bg-red-500/10 text-red-400' :
                                 'bg-slate-500/10 text-slate-400'
        }`}>
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'ok'      && <CheckCircle className="w-4 h-4" />}
          {status === 'fail'    && <XCircle className="w-4 h-4" />}
          <span>{status === 'loading' ? 'Mengecek koneksi…' : botName}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleTest} disabled={!token.trim() || status === 'loading'}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
          <Wifi className="w-4 h-4" /> Test Koneksi
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors">
          <Save className="w-4 h-4" /> Simpan
        </button>
      </div>
    </div>
  );
}

function WhatsAppSettings({ showSaved }) {
  const { settings, updateSetting } = useStore();
  const wa = settings.whatsapp || {};
  const [apiKey, setApiKey] = useState(wa.api_key || '');
  const [prefix, setPrefix] = useState(wa.prefix || 'IDE:');
  const [interval, setInterval] = useState(wa.polling_interval || 30);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'fail'
  const [statusMsg, setStatusMsg] = useState('');

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('https://api.fonnte.com/get-devices', {
        method: 'GET',
        headers: { Authorization: apiKey.trim() },
      });
      const data = await res.json();
      if (res.ok && data.status) {
        const devices = data.data || [];
        const connected = devices.filter(d => d.status === 'connect');
        setStatus('ok');
        setStatusMsg(connected.length > 0
          ? `Terhubung — ${connected.length} device aktif`
          : 'API Key valid, belum ada device terhubung');
      } else {
        setStatus('fail');
        setStatusMsg(data.reason || 'API Key tidak valid');
      }
    } catch {
      setStatus('fail');
      setStatusMsg('Gagal terhubung ke server Fonnte');
    }
  };

  const handleSave = async () => {
    await updateSetting('whatsapp', {
      api_key: apiKey.trim(), prefix: prefix.trim(),
      polling_interval: parseInt(interval) || 30, active: !!apiKey.trim(),
    });
    showSaved();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label">Fonnte API Key</label>
        <div className="relative">
          <input type={showKey ? 'text' : 'password'} value={apiKey}
            onChange={e => { setApiKey(e.target.value); setStatus(null); }}
            placeholder="xxxxxxxxxxxxxxxx" className="field pr-10" />
          <button type="button" onClick={() => setShowKey(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Prefix Filter</label><input value={prefix} onChange={e => setPrefix(e.target.value)} placeholder="IDE:" className="field" /></div>
        <div><label className="label">Polling (detik)</label><input type="number" min="10" max="120" value={interval} onChange={e => setInterval(e.target.value)} className="field" /></div>
      </div>

      {/* Status indicator */}
      {status && (
        <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
          status === 'ok'   ? 'bg-green-500/10 text-green-500' :
          status === 'fail' ? 'bg-red-500/10 text-red-400' :
                              'bg-slate-500/10 text-slate-400'
        }`}>
          {status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === 'ok'      && <CheckCircle className="w-4 h-4" />}
          {status === 'fail'    && <XCircle className="w-4 h-4" />}
          <span>{status === 'loading' ? 'Mengecek koneksi…' : statusMsg}</span>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={handleTest} disabled={!apiKey.trim() || status === 'loading'}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
          <Wifi className="w-4 h-4" /> Test Koneksi
        </button>
        <button onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
          <Save className="w-4 h-4" /> Simpan
        </button>
      </div>
    </div>
  );
}

function ColumnNamesSettings({ showSaved }) {
  const { settings, updateSetting } = useStore();
  const defaults = {
    inbox: '📥 Inbox', high_potential: '⭐ Potensial Tinggi',
    needs_research: '🔬 Perlu Riset', planned: '📅 Direncanakan',
    parked: '❄️ Parkir', archived: '🗑️ Arsip/Gugur',
  };
  const [names, setNames] = useState(settings.column_names || defaults);

  return (
    <div className="space-y-2">
      {Object.entries(defaults).map(([key, def]) => (
        <div key={key}>
          <label className="text-[10px] text-slate-400 mb-0.5 block uppercase tracking-wide">{key.replace('_', ' ')}</label>
          <input value={names[key] || def} onChange={e => setNames(p => ({ ...p, [key]: e.target.value }))} className="field" />
        </div>
      ))}
      <button
        onClick={async () => { await updateSetting('column_names', names); showSaved(); }}
        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors mt-2"
      >
        <Save className="w-4 h-4" /> Simpan Nama Kolom
      </button>
    </div>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-indigo-500" />}
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, sub, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-300">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${value ? 'left-6' : 'left-1'}`} />
    </button>
  );
}
