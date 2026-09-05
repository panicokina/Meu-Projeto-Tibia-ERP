"use client";

import { useEffect, useState } from "react";

interface Hunt {
  id: number;
  date: string;
  loot: number;
  supplies: number;
  balance: number;
  tc: number;
  xp: number;
}

interface CharData {
  name: string;
  level: number;
  vocation: string;
  world: string;
  progress: number;
  loading: boolean;
  error: boolean;
}

export default function Home() {
  const CHARACTER_NAME = "Greey Kina"; 
  
  // Aponta diretamente para a foto salva na pasta /public
  const OUTFIT_IMAGE_URL = "/greey-kina.png";

  const [charData, setCharData] = useState<CharData>({
    name: CHARACTER_NAME,
    level: 0,
    vocation: "Carregando...",
    world: "Carregando...",
    progress: 0,
    loading: true,
    error: false,
  });

  const [analyzer, setAnalyzer] = useState("");
  const [tcPrice, setTcPrice] = useState(42500);

  const [loot, setLoot] = useState(0);
  const [supplies, setSupplies] = useState(0);
  const [balance, setBalance] = useState(0);
  const [hunts, setHunts] = useState(0);
  const [tibiaCoins, setTibiaCoins] = useState(0);
  const [totalXp, setTotalXp] = useState(0);

  const [history, setHistory] = useState<Hunt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal de autenticação
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // Busca os dados em tempo real na API do TibiaData
  const fetchCharData = async () => {
    setCharData((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const res = await fetch(
        `https://api.tibiadata.com/v4/character/${encodeURIComponent(CHARACTER_NAME)}`
      );
      const json = await res.json();
      const character = json.character?.character;

      if (character) {
        setCharData({
          name: character.name,
          level: character.level,
          vocation: character.vocation,
          world: character.world,
          progress: character.level_percent || 0,
          loading: false,
          error: false,
        });
      } else {
        setCharData((prev) => ({ ...prev, loading: false, error: true }));
      }
    } catch (err) {
      console.error("Erro ao buscar dados do Tibia:", err);
      setCharData((prev) => ({ ...prev, loading: false, error: true }));
    }
  };

  useEffect(() => {
    fetchCharData();
  }, []);

  // 1. Carrega os dados do localStorage
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
        setTotalXp(data.totalXp || 0);
        setHistory(data.history || []);
      } catch (error) {
        console.error("Erro ao carregar dados do localStorage:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. Salva no localStorage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(
      "tibiaERP",
      JSON.stringify({
        loot,
        supplies,
        balance,
        hunts,
        tibiaCoins,
        tcPrice,
        totalXp,
        history,
      })
    );
  }, [loot, supplies, balance, hunts, tibiaCoins, tcPrice, totalXp, history, isLoaded]);

  function importHunt() {
    setErrorMessage("");

    if (!analyzer.trim()) {
      setErrorMessage("Por favor, cole o texto do Hunt Analyzer antes de importar.");
      return;
    }

    const hasLoot = /Loot:\s*/.test(analyzer);
    const hasSupplies = /Supplies:\s*/.test(analyzer);
    const hasBalance = /Balance:\s*/.test(analyzer);
    const hasXp = /(?:^|\n)\s*XP Gain:\s*/.test(analyzer);

    if (!hasLoot || !hasSupplies || !hasBalance || !hasXp) {
      setErrorMessage(
        "Formato inválido! Certifique-se de copiar todo o bloco do Hunt Analyzer do Tibia."
      );
      return;
    }

    const lootMatch = analyzer.match(/Loot:\s*([\d.]+)/);
    const suppliesMatch = analyzer.match(/Supplies:\s*([\d.]+)/);
    const balanceMatch = analyzer.match(/Balance:\s*([\d.]+)/);
    const xpMatch = analyzer.match(/(?:^|\n)\s*XP Gain:\s*([\d.]+)/);

    const lootValue = lootMatch ? Number(lootMatch[1].replace(/\./g, "")) : 0;
    const suppliesValue = suppliesMatch ? Number(suppliesMatch[1].replace(/\./g, "")) : 0;
    const balanceValue = balanceMatch ? Number(balanceMatch[1].replace(/\./g, "")) : 0;
    const xpValue = xpMatch ? Number(xpMatch[1].replace(/\./g, "")) : 0;

    const tcEarned = balanceValue / tcPrice;

    setLoot((prev) => prev + lootValue);
    setSupplies((prev) => prev + suppliesValue);
    setBalance((prev) => prev + balanceValue);
    setTibiaCoins((prev) => prev + tcEarned);
    setTotalXp((prev) => prev + xpValue);
    setHunts((prev) => prev + 1);

    const newHunt: Hunt = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      loot: lootValue,
      supplies: suppliesValue,
      balance: balanceValue,
      tc: tcEarned,
      xp: xpValue,
    };

    setHistory((prev) => [newHunt, ...prev]);
    setAnalyzer("");
  }

  function handleClearDataClick() {
    setShowAuthModal(true);
  }

  function confirmClearData() {
    if (authUsername === "panicao" && authPassword === "panicao") {
      localStorage.removeItem("tibiaERP");
      setLoot(0);
      setSupplies(0);
      setBalance(0);
      setHunts(0);
      setTibiaCoins(0);
      setTotalXp(0);
      setHistory([]);
      setShowAuthModal(false);
      setAuthUsername("");
      setAuthPassword("");
      alert("Dados apagados com sucesso!");
    } else {
      alert("Usuário ou senha incorretos! Tentativa de trollagem bloqueada. 🛡️");
    }
  }

  const progressGoal = Math.min((tibiaCoins / 5000) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <main className="max-w-[1400px] mx-auto p-8 relative">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          DashBoard Panicão
        </h1>

        {/* TOP CARDS GRID: Personagem + Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          
          {/* CARD DE PERFIL DO PERSONAGEM (GREEY KINA) */}
          <div className="bg-[#151B31] p-5 rounded-xl border border-yellow-500/30 xl:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">{charData.name}</h2>
                  <p className="text-xs text-gray-400">{charData.vocation} • {charData.world}</p>
                </div>
                <button 
                  onClick={fetchCharData}
                  className="text-xs bg-slate-800 hover:bg-slate-700 p-2 rounded text-gray-300 hover:text-white transition"
                  title="Sincronizar com Tibia.com"
                >
                  🔄 Sincronizar
                </button>
              </div>

              {/* FOTO / OUTFIT DO CHAR */}
              <div className="my-3 flex justify-center items-center bg-[#0B1020] p-2 rounded-lg min-h-[140px] border border-slate-800">
                <img 
                  src={OUTFIT_IMAGE_URL} 
                  alt={`Foto do ${charData.name}`} 
                  className="h-36 object-contain rounded border border-yellow-500/20 shadow-md"
                />
              </div>

              {/* LEVEL E BARRA DE PROGRESSO DE XP */}
              <div className="mt-2">
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Level {charData.loading ? "..." : charData.level}</span>
                  <span className="text-yellow-400">{charData.progress}% pro próx. lvl</span>
                </div>
                <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-2.5 transition-all duration-500" 
                    style={{ width: `${charData.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS DO DASHBOARD */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Saldo Consolidado</h2>
              <p className="text-xl font-bold text-green-400">{balance.toLocaleString("pt-BR")} GP</p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Tibia Coins</h2>
              <p className="text-xl font-bold text-yellow-400">{tibiaCoins.toFixed(1)} TC</p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">XP Acumulada</h2>
              <p className="text-xl font-bold text-emerald-400">{totalXp.toLocaleString("pt-BR")}</p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Loot Total</h2>
              <p className="text-xl font-bold">{loot.toLocaleString("pt-BR")} GP</p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Supplies</h2>
              <p className="text-xl font-bold">{supplies.toLocaleString("pt-BR")} GP</p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Hunts Realizadas</h2>
              <p className="text-xl font-bold">{hunts}</p>
            </div>
          </div>

        </div>

        {/* META TIBIA COINS */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-2 font-semibold">Meta 5000 Tibia Coins</h2>
          <p className="mb-3 text-gray-300">{tibiaCoins.toFixed(1)} / 5000 TC</p>
          <div className="w-full bg-gray-700 h-4 rounded">
            <div
              className="bg-yellow-500 h-4 rounded transition-all duration-300"
              style={{ width: `${progressGoal}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-400">{progressGoal.toFixed(2)}%</p>
        </div>

        {/* VALOR TC */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-4 font-semibold">Valor Atual da Tibia Coin</h2>
          <input
            type="number"
            value={tcPrice}
            onChange={(e) => setTcPrice(Number(e.target.value))}
            className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* IMPORTAR HUNT */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <h2 className="mb-4 font-semibold">Importar Hunt Analyzer</h2>
          <textarea
            value={analyzer}
            onChange={(e) => {
              setAnalyzer(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            className="w-full h-64 bg-[#0B1020] p-4 rounded border border-gray-800 focus:outline-none focus:border-yellow-500"
            placeholder="Cole aqui o Hunt Analyzer do Tibia..."
          />
          {errorMessage && (
            <p className="mt-2 text-red-400 font-medium text-sm">⚠️ {errorMessage}</p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={importHunt}
              className="bg-yellow-500 text-black px-6 py-2 rounded font-bold hover:bg-yellow-400 transition"
            >
              Importar Hunt
            </button>
            <button
              onClick={handleClearDataClick}
              className="bg-red-600 px-6 py-2 rounded font-bold hover:bg-red-500 transition"
            >
              Limpar Dados
            </button>
          </div>
        </div>

        {/* HISTÓRICO EXPANDÍVEL */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Histórico de Hunts ({history.length})</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="bg-slate-800 hover:bg-slate-700 text-gray-200 px-4 py-2 rounded font-semibold text-sm transition border border-slate-700"
            >
              {showHistory ? "▲ Ocultar Histórico" : "▼ Exibir Histórico"}
            </button>
          </div>

          {showHistory && (
            <div className="mt-6 overflow-x-auto">
              {history.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Nenhuma hunt registrada até o momento.</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-700 text-gray-400">
                      <th className="pb-2">Data</th>
                      <th className="pb-2">XP</th>
                      <th className="pb-2">Loot</th>
                      <th className="pb-2">Supplies</th>
                      <th className="pb-2">Balance</th>
                      <th className="pb-2">TC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((hunt) => (
                      <tr key={hunt.id} className="border-b border-slate-800 hover:bg-[#0B1020]/50">
                        <td className="py-2">{hunt.date}</td>
                        <td className="text-emerald-400 font-medium">
                          {(hunt.xp || 0).toLocaleString("pt-BR")}
                        </td>
                        <td>{hunt.loot.toLocaleString("pt-BR")} GP</td>
                        <td>{hunt.supplies.toLocaleString("pt-BR")} GP</td>
                        <td>{hunt.balance.toLocaleString("pt-BR")} GP</td>
                        <td>{hunt.tc.toFixed(1)} TC</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE LOGIN PARA APAGAR OS DADOS */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151B31] p-6 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-red-500">Área Restrita</h2>
            <p className="mb-6 text-sm text-gray-400">Insira as credenciais de dono para apagar o banco de dados.</p>
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-300">Usuário</label>
              <input 
                type="text" 
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none focus:border-red-500 text-white"
                placeholder="Digite o usuário..."
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-1 text-gray-300">Senha</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none focus:border-red-500 text-white"
                placeholder="Digite a senha..."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthUsername("");
                  setAuthPassword("");
                }}
                className="px-4 py-2 rounded font-bold text-gray-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmClearData}
                className="bg-red-600 px-6 py-2 rounded font-bold hover:bg-red-500 transition text-white"
              >
                Apagar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}