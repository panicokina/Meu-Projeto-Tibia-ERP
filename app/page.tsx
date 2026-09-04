import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#0B1020] text-white">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-4xl font-bold mb-8">
          Dashboard
        </h1>

        <div className="grid grid-cols-5 gap-4">

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2 className="text-gray-400">
              Saldo Consolidado
            </h2>

            <p className="text-3xl font-bold text-green-400">
              0 GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2 className="text-gray-400">
              Tibia Coins
            </h2>

            <p className="text-3xl font-bold text-yellow-400">
              0 TC
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2 className="text-gray-400">
              Loot Total
            </h2>

            <p className="text-3xl font-bold">
              0 GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2 className="text-gray-400">
              Supplies
            </h2>

            <p className="text-3xl font-bold">
              0 GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2 className="text-gray-400">
              Hunts
            </h2>

            <p className="text-3xl font-bold">
              0
            </p>
          </div>

        </div>

        <div className="mt-10 bg-[#151B31] p-6 rounded-xl">
          <h2 className="text-2xl mb-4">
            Importar Hunt Analyzer
          </h2>

          <textarea
            className="w-full h-64 bg-[#0B1020] border border-slate-700 rounded-lg p-4"
            placeholder="Cole aqui o Hunt Analyzer..."
          />

          <button className="mt-4 bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold">
            Importar Hunt
          </button>

        </div>

      </main>

    </div>
  );
}