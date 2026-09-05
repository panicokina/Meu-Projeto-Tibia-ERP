"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface Hunt {
  id: number;
  date: string;
  loot: number;
  supplies: number;
  balance: number;
  tc: number;
}

export default function Home() {
  const [analyzer, setAnalyzer] = useState("");
  const [tcPrice, setTcPrice] = useState(42500);

  const [loot, setLoot] = useState(0);
  const [supplies, setSupplies] = useState(0);
  const [balance, setBalance] = useState(0);
  const [hunts, setHunts] = useState(0);
  const [tibiaCoins, setTibiaCoins] = useState(0);

  const [history, setHistory] = useState<Hunt[]>([]);
  
  // Flag para controle de carregamento do localStorage
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Carrega os dados salvos do localStorage ao iniciar
  useEffect(() => {
    const saved = localStorage.getItem("tibiaERP");

    if (saved) {
      try {
        const data = JSON.parse(saved);

        setLoot(data.loot || 0);
        setSupplies(data.supplies || 0);
        setBalance(data.balance || 0);
        setHunts(data.hunts || 0);
        setTibiaCoins(data.tibiaCoins || 0);
        setTcPrice(data.tcPrice || 42500);
        setHistory(data.history || []);
      } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
      }
    }
    setIsLoaded(true); // Libera o app para salvar alterações apenas após carregar
  }, []);

  // 2. Salva no localStorage somente APÓS os dados iniciais serem carregados
  useEffect(() => {
    if (!isLoaded) return; // Evita sobrescrever os dados com os valores padrão zerados

    localStorage.setItem(
      "tibiaERP",
      JSON.stringify({
        loot,
        supplies,
        balance,
        hunts,
        tibiaCoins,
        tcPrice,
        history,
      })
    );
  }, [
    loot,
    supplies,
    balance,
    hunts,
    tibiaCoins,
    tcPrice,
    history,
    isLoaded,
  ]);

  function importHunt() {
    const lootMatch = analyzer.match(/Loot:\s*([\d.]+)/);
    const suppliesMatch = analyzer.match(/Supplies:\s*([\d.]+)/);
    const balanceMatch = analyzer.match(/Balance:\s*([\d.]+)/);

    const lootValue = lootMatch
      ? Number(lootMatch[1].replace(/\./g, ""))
      : 0;

    const suppliesValue = suppliesMatch
      ? Number(suppliesMatch[1].replace(/\./g, ""))
      : 0;

    const balanceValue = balanceMatch
      ? Number(balanceMatch[1].replace(/\./g, ""))
      : 0;

    const tcEarned = balanceValue / tcPrice;

    setLoot((prev) => prev + lootValue);
    setSupplies((prev) => prev + suppliesValue);
    setBalance((prev) => prev + balanceValue);
    setTibiaCoins((prev) => prev + tcEarned);
    setHunts((prev) => prev + 1);

    const newHunt: Hunt = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      loot: lootValue,
      supplies: suppliesValue,
      balance: balanceValue,
      tc: tcEarned,
    };

    setHistory((prev) => [newHunt, ...prev]);

    setAnalyzer("");
  }

  function clearData() {
    const confirmed = window.confirm(
      "Tem certeza que deseja apagar todos os dados?"
    );

    if (!confirmed) return;

    localStorage.removeItem("tibiaERP");

    setLoot(0);
    setSupplies(0);
    setBalance(0);
    setHunts(0);
    setTibiaCoins(0);
    setHistory([]);
  }

  const progress = Math.min(
    (tibiaCoins / 5000) * 100,
    100
  );

  return (
    <div className="flex min-h-screen bg-[#0B1020] text-white">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-4xl font-bold mb-8">
          Tibia ERP
        </h1>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2>Saldo Consolidado</h2>
            <p className="text-2xl text-green-400">
              {balance.toLocaleString("pt-BR")} GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2>Tibia Coins</h2>
            <p className="text-2xl text-yellow-400">
              {tibiaCoins.toFixed(1)} TC
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2>Loot Total</h2>
            <p className="text-2xl">
              {loot.toLocaleString("pt-BR")} GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2>Supplies</h2>
            <p className="text-2xl">
              {supplies.toLocaleString("pt-BR")} GP
            </p>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl">
            <h2>Hunts</h2>
            <p className="text-2xl">
              {hunts}
            </p>
          </div>
        </div>

        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-2">
            Meta 5000 Tibia Coins
          </h2>

          <p className="mb-3">
            {tibiaCoins.toFixed(1)} / 5000 TC
          </p>

          <div className="w-full bg-gray-700 h-4 rounded">
            <div
              className="bg-yellow-500 h-4 rounded"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p className="mt-2">
            {progress.toFixed(2)}%
          </p>
        </div>

        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-4">
            Valor Atual da Tibia Coin
          </h2>

          <input
            type="number"
            value={tcPrice}
            onChange={(e) =>
              setTcPrice(Number(e.target.value))
            }
            className="w-full bg-[#0B1020] p-3 rounded"
          />
        </div>

        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-4">
            Importar Hunt Analyzer
          </h2>

          <textarea
            value={analyzer}
            onChange={(e) =>
              setAnalyzer(e.target.value)
            }
            className="w-full h-64 bg-[#0B1020] p-4 rounded"
            placeholder="Cole aqui o Hunt Analyzer..."
          />

          <div className="flex gap-3 mt-4">
            <button
              onClick={importHunt}
              className="bg-yellow-500 text-black px-6 py-2 rounded font-bold"
            >
              Importar Hunt
            </button>

            <button
              onClick={clearData}
              className="bg-red-600 px-6 py-2 rounded font-bold"
            >
              Limpar Dados
            </button>
          </div>
        </div>

        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="text-2xl mb-4">
            Histórico de Hunts
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-700">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Loot</th>
                  <th className="pb-2">Supplies</th>
                  <th className="pb-2">Balance</th>
                  <th className="pb-2">TC</th>
                </tr>
              </thead>

              <tbody>
                {history.map((hunt) => (
                  <tr
                    key={hunt.id}
                    className="border-b border-slate-800"
                  >
                    <td className="py-2">{hunt.date}</td>

                    <td>
                      {hunt.loot.toLocaleString("pt-BR")}
                    </td>

                    <td>
                      {hunt.supplies.toLocaleString("pt-BR")}
                    </td>

                    <td>
                      {hunt.balance.toLocaleString("pt-BR")}
                    </td>

                    <td>
                      {hunt.tc.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}