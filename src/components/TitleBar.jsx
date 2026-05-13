import { getCurrentWindow } from '@tauri-apps/api/window';

const win = getCurrentWindow();

export default function TitleBar() {
  return (
    <div
      data-tauri-drag-region
      className="h-8 shrink-0 relative flex items-center px-3 bg-slate-900 border-b border-slate-700/40 select-none"
    >
      {/* Center title */}
      <span data-tauri-drag-region className="absolute left-1/2 -translate-x-1/2 text-[11px] text-slate-500 font-medium">
        Sios IDE
      </span>

      {/* Window controls — right side */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => win.minimize()}
          className="w-3.5 h-3.5 rounded-full bg-yellow-400 hover:bg-yellow-300 transition-colors"
          title="Minimize"
        />
        <button
          onClick={() => win.toggleMaximize()}
          className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-green-400 transition-colors"
          title="Maximize"
        />
        <button
          onClick={() => win.close()}
          className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
          title="Close"
        />
      </div>
    </div>
  );
}
