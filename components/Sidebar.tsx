export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#0E1325] border-r border-slate-800 h-screen p-4">
      <div className="mb-10">
        <h2 className="text-yellow-500 text-2xl font-bold">
          Tibia ERP
        </h2>

        <p className="text-slate-400 text-sm">
          Hunt Tracker
        </p>
      </div>

      <nav className="space-y-3">
        <button className="w-full text-left p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
          Dashboard
        </button>

        <button className="w-full text-left p-3 rounded-lg hover:bg-slate-800">
          Registrar Hunt
        </button>

        <button className="w-full text-left p-3 rounded-lg hover:bg-slate-800">
          Histórico
        </button>

        <button className="w-full text-left p-3 rounded-lg hover:bg-slate-800">
          Configurações
        </button>
      </nav>
    </aside>
  );
}