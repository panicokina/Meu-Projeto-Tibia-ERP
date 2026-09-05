"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Inicializa o cliente do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// XP BASE INICIAL FIXA DO GREEY KINA (Level 677)
const INITIAL_BASE_EXP = 5127830738;

// FÓRMULAS OFICIAIS DE XP DO TIBIA
function getXpForLevel(level: number): number {
  return (50 / 3) * (Math.pow(level, 3) - 6 * Math.pow(level, 2) + 17 * level - 12);
}

function getLevelProgress(level: number, currentExp: number) {
  if (level <= 0 || currentExp <= 0) return 0;
  
  const currentLvlXp = getXpForLevel(level);
  const nextLvlXp = getXpForLevel(level + 1);
  const xpRequiredForLvl = nextLvlXp - currentLvlXp;
  const xpGainedInLvl = currentExp - currentLvlXp;

  const percent = (xpGainedInLvl / xpRequiredForLvl) * 100;
  return Math.min(Math.max(percent, 0), 100);
}

export default function Home() {
  const CHARACTER_NAME = "Greey Kina"; 
  const OUTFIT_IMAGE_URL = "/greey-kina.png";

  // ÍCONES LOCAIS (Pasta public)
  const CRYSTAL_COIN_ICON = "/Crystal_Coin.gif";
  const TIBIA_COIN_ICON = "/Tibia_Coins.gif";
  const SANGUINE_BLUDGEON_ICON = "/Sanguine_Bludgeon.gif";
  const BOOTS_OF_HASTE_ICON = "/Boots_of_Haste.gif";
  const GREAT_MANA_POTION_ICON = "/Great_Mana_Potion.gif";
  const REALITY_REAVER_ICON = "/Reality_Reaver.gif";

  const [charData, setCharData] = useState<CharData>({
    name: CHARACTER_NAME,
    level: 677,
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
  const [totalXp, setTotalXp] = useState(0);

  const [history, setHistory] = useState<Hunt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Modal de autenticação
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  // Cálculo de Tibia Coins dinâmico
  const tibiaCoins = tcPrice > 0 ? balance / tcPrice : 0;

  // XP Atual Total do Char = XP Base Inicial (5.127.830.738) + XP Acumulada das Hunts
  const currentTotalExp = INITIAL_BASE_EXP + totalXp;

  // Porcentagem calculada automaticamente em tempo real
  const calculatedProgress = getLevelProgress(
    charData.level || 677,
    currentTotalExp
  );

  const fetchCharData = async () => {
    setCharData((prev) => ({ ...prev, loading: true, error: false }));
    try {
      const res = await fetch(
        `https://api.tibiadata.com/v4/character/${encodeURIComponent(CHARACTER_NAME)}`
      );
      const json = await res.json();
      const character = json.character?.character;

      if (character) {
        const lvl = character.level || 677;

        setCharData({
          name: character.name,
          level: lvl,
          vocation: character.vocation,
          world: character.world,
          progress: getLevelProgress(lvl, currentTotalExp),
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

  // 1. Carrega dados do Supabase
  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Chaves do Supabase não configuradas no .env.local");
        setIsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tibia_dashboard")
          .select("*")
          .eq("id", "main")
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Erro ao carregar do Supabase:", error);
        }

        if (data) {
          setLoot(Number(data.loot) || 0);
          setSupplies(Number(data.supplies) || 0);
          setBalance(Number(data.balance) || 0);
          setHunts(Number(data.hunts) || 0);
          setTcPrice(Number(data.tc_price) || 42500);
          setTotalXp(Number(data.total_xp) || 0);
          setHistory(data.history || []);
        }
      } catch (err) {
        console.error("Erro na conexão com Supabase:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadDataFromSupabase();
  }, []);

  // 2. Salva no Supabase sempre que houver alteração
  const saveDataToSupabase = async (
    newLoot: number,
    newSupplies: number,
    newBalance: number,
    newHunts: number,
    newTcPrice: number,
    newXp: number,
    newHistory: Hunt[]
  ) => {
    if (!supabaseUrl || !supabaseAnonKey) return;

    try {
      await supabase.from("tibia_dashboard").upsert({
        id: "main",
        loot: newLoot,
        supplies: newSupplies,
        balance: newBalance,
        hunts: newHunts,
        tibia_coins: newTcPrice > 0 ? newBalance / newTcPrice : 0,
        tc_price: newTcPrice,
        total_xp: newXp,
        history: newHistory,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Erro ao salvar no Supabase:", err);
    }
  };

  function importHunt() {
    setErrorMessage("");

    if (!analyzer.trim()) {
      setErrorMessage("Por favor, cole o texto do Hunt Analyzer antes de importar.");
      return;
    }

    const parseTibiaValue = (pattern: RegExp) => {
      const match = analyzer.match(pattern);
      if (!match) return 0;

      const rawValue = match[1].trim();
      const isNegative = rawValue.includes("-");

      const isKK = /kk/i.test(rawValue);
      const isK = /k/i.test(rawValue) && !isKK;

      let clean = rawValue.replace(/[^\d.,]/g, "");

      if (isK || isKK) {
        clean = clean.replace(",", ".");
        let num = parseFloat(clean) || 0;
        if (isK) num *= 1_000;
        if (isKK) num *= 1_000_000;
        return isNegative ? -num : num;
      }

      clean = clean.replace(/[.,]/g, "");
      let num = parseInt(clean, 10) || 0;

      return isNegative ? -num : num;
    };

    const hasLoot = /Loot:\s*/i.test(analyzer);
    const hasSupplies = /Supplies:\s*/i.test(analyzer);
    const hasBalance = /Balance:\s*/i.test(analyzer);
    const hasXp = /(?:^|[\r\n])\s*XP Gain:\s*/i.test(analyzer);

    if (!hasLoot || !hasSupplies || !hasBalance || !hasXp) {
      setErrorMessage(
        "Formato inválido! Certifique-se de copiar todo o bloco do Hunt Analyzer do Tibia."
      );
      return;
    }

    const lootValue = parseTibiaValue(/Loot:\s*([^\r\n]+)/i);
    const suppliesValue = parseTibiaValue(/Supplies:\s*([^\r\n]+)/i);
    const balanceValue = parseTibiaValue(/Balance:\s*([^\r\n]+)/i);
    const xpValue = parseTibiaValue(/(?:^|[\r\n])\s*XP Gain:\s*([^\r\n]+)/i);

    const tcEarned = tcPrice > 0 ? balanceValue / tcPrice : 0;

    const updatedLoot = loot + lootValue;
    const updatedSupplies = supplies + suppliesValue;
    const updatedBalance = balance + balanceValue;
    const updatedXp = totalXp + xpValue;
    const updatedHunts = hunts + 1;

    const newHunt: Hunt = {
      id: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      loot: lootValue,
      supplies: suppliesValue,
      balance: balanceValue,
      tc: tcEarned,
      xp: xpValue,
    };

    const updatedHistory = [newHunt, ...history];

    setLoot(updatedLoot);
    setSupplies(updatedSupplies);
    setBalance(updatedBalance);
    setTotalXp(updatedXp);
    setHunts(updatedHunts);
    setHistory(updatedHistory);
    setAnalyzer("");

    saveDataToSupabase(
      updatedLoot,
      updatedSupplies,
      updatedBalance,
      updatedHunts,
      tcPrice,
      updatedXp,
      updatedHistory
    );
  }

  function handleClearDataClick() {
    setShowAuthModal(true);
  }

  async function confirmClearData() {
    if (authUsername === "panicao" && authPassword === "panicao") {
      setLoot(0);
      setSupplies(0);
      setBalance(0);
      setHunts(0);
      setTotalXp(0);
      setHistory([]);
      setShowAuthModal(false);
      setAuthUsername("");
      setAuthPassword("");

      await saveDataToSupabase(0, 0, 0, 0, tcPrice, 0, []);
      alert("Dados apagados com sucesso do banco de dados!");
    } else {
      alert("Usuário ou senha incorretos! Tentativa de trollagem bloqueada. 🛡️");
    }
  }

  const handleTcPriceChange = (val: number) => {
    setTcPrice(val);
    saveDataToSupabase(loot, supplies, balance, hunts, val, totalXp, history);
  };

  const progressGoal = Math.min((tibiaCoins / 5000) * 100, 100);

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <main className="max-w-[1400px] mx-auto p-8 relative">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          DashBoard Panicão
        </h1>

        {/* TOP CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          
          {/* CARD DE PERFIL DO PERSONAGEM */}
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

              {/* FOTO DO CHAR */}
              <div className="my-3 flex justify-center items-center bg-[#0B1020] p-2 rounded-lg min-h-[140px] border border-slate-800">
                <img 
                  src={OUTFIT_IMAGE_URL} 
                  alt={`Foto do ${charData.name}`} 
                  className="h-36 object-contain rounded border border-yellow-500/20 shadow-md"
                />
              </div>

              {/* LEVEL E PROGRESSO DE XP CALCULADO AUTOMÁTICO */}
              <div className="mt-2">
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span>Level {charData.loading ? "..." : charData.level}</span>
                  <span className="text-yellow-400">
                    {calculatedProgress.toFixed(2)}% pro próx. lvl
                  </span>
                </div>
                <div className="w-full bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-2.5 transition-all duration-500" 
                    style={{ width: `${calculatedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS DO DASHBOARD */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* SALDO CONSOLIDADO */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Saldo Consolidado</h2>
              <div className="flex items-center gap-2">
                <img src={CRYSTAL_COIN_ICON} alt="Crystal Coin" className="w-6 h-6 object-contain" />
                <p className={`text-xl font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {balance.toLocaleString("pt-BR")} GP
                </p>
              </div>
            </div>

            {/* TIBIA COINS */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Tibia Coins</h2>
              <div className="flex items-center gap-2">
                <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold text-yellow-400">{tibiaCoins.toFixed(1)} TC</p>
              </div>
            </div>

            {/* XP ACUMULADA NAS HUNTS */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">XP Acumulada (Hunts)</h2>
              <div className="flex items-center gap-2">
                <img src={REALITY_REAVER_ICON} alt="Reality Reaver" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold text-emerald-400">
                  {totalXp >= 1_000_000
                    ? `${(totalXp / 1_000_000).toFixed(2)}kk`
                    : totalXp.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            {/* LOOT TOTAL */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Loot Total</h2>
              <div className="flex items-center gap-2">
                <img src={BOOTS_OF_HASTE_ICON} alt="Boots of Haste" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold">{loot.toLocaleString("pt-BR")} GP</p>
              </div>
            </div>

            {/* SUPPLIES */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Supplies</h2>
              <div className="flex items-center gap-2">
                <img src={GREAT_MANA_POTION_ICON} alt="Great Mana Potion" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold">{supplies.toLocaleString("pt-BR")} GP</p>
              </div>
            </div>

            {/* HUNTS REALIZADAS */}
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Hunts Realizadas</h2>
              <div className="flex items-center gap-2">
                <img src={SANGUINE_BLUDGEON_ICON} alt="Sanguine Bludgeon" className="w-7 h-7 object-contain" />
                <p className="text-xl font-bold">{hunts}</p>
              </div>
            </div>
          </div>

        </div>

        {/* META TIBIA COINS */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-5 h-5 object-contain" />
            <h2 className="font-semibold">Meta 5000 Tibia Coins</h2>
          </div>
          <p className="mb-3 text-gray-300">{tibiaCoins.toFixed(1)} / 5000 TC</p>
          <div className="w-full bg-gray-700 h-4 rounded">
            <div
              className="bg-yellow-500 h-4 rounded transition-all duration-300"
              style={{ width: `${progressGoal}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-400">{progressGoal.toFixed(2)}%</p>
        </div>

        {/* VALOR DA TIBIA COIN */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-5 h-5 object-contain" />
            <h2 className="font-semibold">Valor Atual da Tibia Coin</h2>
          </div>
          <input
            type="number"
            value={tcPrice}
            onChange={(e) => handleTcPriceChange(Number(e.target.value))}
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
              className="bg-yellow-500 text-black px-6 py-2 rounded font-bold hover:bg-yellow-400 transition flex items-center gap-2"
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
                    {history.map((hunt) => {
                      const huntTc = tcPrice > 0 ? hunt.balance / tcPrice : 0;
                      return (
                        <tr key={hunt.id} className="border-b border-slate-800 hover:bg-[#0B1020]/50">
                          <td className="py-2">{hunt.date}</td>
                          <td className="text-emerald-400 font-medium">
                            <div className="flex items-center gap-1.5">
                              <img src={REALITY_REAVER_ICON} alt="XP" className="w-4 h-4 object-contain" />
                              {(hunt.xp || 0) >= 1_000_000
                                ? `${((hunt.xp || 0) / 1_000_000).toFixed(2)}kk`
                                : (hunt.xp || 0).toLocaleString("pt-BR")}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <img src={BOOTS_OF_HASTE_ICON} alt="Loot" className="w-4 h-4 object-contain" />
                              {hunt.loot.toLocaleString("pt-BR")} GP
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <img src={GREAT_MANA_POTION_ICON} alt="Supplies" className="w-4 h-4 object-contain" />
                              {hunt.supplies.toLocaleString("pt-BR")} GP
                            </div>
                          </td>
                          <td className={hunt.balance >= 0 ? "text-green-400" : "text-red-400"}>
                            <div className="flex items-center gap-1.5">
                              <img src={CRYSTAL_COIN_ICON} alt="CC" className="w-4 h-4 object-contain" />
                              {hunt.balance.toLocaleString("pt-BR")} GP
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <img src={TIBIA_COIN_ICON} alt="TC" className="w-4 h-4 object-contain" />
                              {huntTc.toFixed(1)} TC
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE LOGIN */}
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