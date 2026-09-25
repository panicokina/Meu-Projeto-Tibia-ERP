"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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

// Fórmula oficial do Tibia: experiência total necessária para atingir um level.
const experienceForLevel = (level: number) => {
  const formulaLevel = Math.max(0, level - 1);
  return Math.floor(
    (50 * formulaLevel ** 3 - 150 * formulaLevel ** 2 + 400 * formulaLevel) / 3
  );
};

const progressFromExperience = (experience: number) => {
  const safeExperience = Math.max(0, experience);
  let lowerLevel = 1;
  let upperLevel = 2;

  while (experienceForLevel(upperLevel) <= safeExperience) {
    lowerLevel = upperLevel;
    upperLevel *= 2;
  }

  while (lowerLevel + 1 < upperLevel) {
    const middleLevel = Math.floor((lowerLevel + upperLevel) / 2);

    if (experienceForLevel(middleLevel) <= safeExperience) {
      lowerLevel = middleLevel;
    } else {
      upperLevel = middleLevel;
    }
  }

  const levelExperience = experienceForLevel(lowerLevel);
  const nextLevelExperience = experienceForLevel(lowerLevel + 1);
  const percentage =
    ((safeExperience - levelExperience) /
      (nextLevelExperience - levelExperience)) *
    100;

  return {
    level: lowerLevel,
    percentage: Number(Math.min(100, Math.max(0, percentage)).toFixed(4)),
  };
};

export default function Home() {
  const CHARACTER_NAME = "Greey Kina";
  const OUTFIT_IMAGE_URL = "/greey-kina.png";

  const CRYSTAL_COIN_ICON = "/Crystal_Coin.gif";
  const TIBIA_COIN_ICON = "/Tibia_Coins.gif";
  const SANGUINE_BLUDGEON_ICON = "/Sanguine_Bludgeon.gif";
  const BOOTS_OF_HASTE_ICON = "/Boots_of_Haste.gif";
  const GREAT_MANA_POTION_ICON = "/Great_Mana_Potion.gif";
  const REALITY_REAVER_ICON = "/Reality_Reaver.gif";

  // ÍCONES OFICIAIS COM SUPORTE A DIRETO DA WIKI SEM BLOQUEIO DE REFERRER
  const POWERFUL_STRIKE_ICON = "https://tibia.fandom.com/wiki/Special:FilePath/Powerful_Strike.png";
  const POWERFUL_VOID_ICON = "https://tibia.fandom.com/wiki/Special:FilePath/Powerful_Void.png";
  const POWERFUL_VAMPIRISM_ICON = "https://tibia.fandom.com/wiki/Special:FilePath/Powerful_Vampirism.png";
  const GOLD_TOKEN_ICON = "https://tibia.fandom.com/wiki/Special:FilePath/Gold_Token.gif";

  const [charData] = useState({
    name: CHARACTER_NAME,
    vocation: "Elite Knight",
    world: "Inabra",
  });

  const [currentExperience, setCurrentExperience] = useState<number>(5_277_341_338);
  const currentProgress = progressFromExperience(currentExperience);
  const currentLevel = currentProgress.level;
  const manualPercentage = currentProgress.percentage;

  const [analyzer, setAnalyzer] = useState("");
  const [tcPrice, setTcPrice] = useState(42500);

  const [loot, setLoot] = useState(0);
  const [supplies, setSupplies] = useState(0);
  const [balance, setBalance] = useState(0);
  const [hunts, setHunts] = useState(0);
  const [totalXpGained, setTotalXpGained] = useState(0);

  const [soldTcTotal, setSoldTcTotal] = useState(0);
  const [soldBrlTotal, setSoldBrlTotal] = useState(0);

  const [history, setHistory] = useState<Hunt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // ESTADOS DA CALCULADORA DE IMBUEMENT
  const [gtPrice, setGtPrice] = useState(47000);
  const [strikeQty, setStrikeQty] = useState(0);
  const [voidQty, setVoidQty] = useState(0);
  const [vampirismQty, setVampirismQty] = useState(0);

  // PREÇOS DE CREATURE PRODUCTS (Valores Inabra em GP)
  // Strike
  const [protectiveCharmPrice, setProtectiveCharmPrice] = useState(2500);
  const [sabretoothPrice, setSabretoothPrice] = useState(4000);
  const [vexclawTalonPrice, setVexclawTalonPrice] = useState(1000);

  // Void
  const [ropeBeltPrice, setRopeBeltPrice] = useState(2500);
  const [silencerClawPrice, setSilencerClawPrice] = useState(3000);
  const [grimeleechWingPrice, setGrimeleechWingPrice] = useState(1200);

  // Vampirism
  const [vampireTeethPrice, setVampireTeethPrice] = useState(2300);
  const [bloodyPincerPrice, setBloodyPincerPrice] = useState(7000);
  const [deadBrainPrice, setDeadBrainPrice] = useState(1200);

  // Modais
  const [showSellModal, setShowSellModal] = useState(false);
  const [tcToSellInput, setTcToSellInput] = useState("");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [actionToConfirm, setActionToConfirm] = useState<"clearAll" | "deleteHunt" | null>(null);
  const [huntToDelete, setHuntToDelete] = useState<Hunt | null>(null);

  const tibiaCoins = tcPrice > 0 ? balance / tcPrice : 0;
  const realMoney = tibiaCoins * (50 / 250);

  // CÁLCULOS DE CUSTO INDIVIDUAL DOS ITENS + SHRINE TAXA DE 150k
  const strikeItemCost = (20 * protectiveCharmPrice) + (25 * sabretoothPrice) + (5 * vexclawTalonPrice) + 150000;
  const voidItemCost = (25 * ropeBeltPrice) + (25 * silencerClawPrice) + (5 * grimeleechWingPrice) + 150000;
  const vampirismItemCost = (25 * vampireTeethPrice) + (25 * bloodyPincerPrice) + (5 * deadBrainPrice) + 150000;

  // CUSTO POR GOLD TOKEN (6 GTs + 250k taxa shrine)
  const gtFeePerImbuement = (6 * gtPrice) + 250000;

  // CUSTOS TOTALIZADOS BASEADOS NA QUANTIDADE SELECIONADA
  const totalCostGT = (strikeQty + voidQty + vampirismQty) * gtFeePerImbuement;
  const totalCostItems = (strikeQty * strikeItemCost) + (voidQty * voidItemCost) + (vampirismQty * vampirismItemCost);

  const totalImbuementsSelected = strikeQty + voidQty + vampirismQty;
  const isGtCheaper = totalCostGT <= totalCostItems;
  const bestTotalCost = totalImbuementsSelected > 0 ? (isGtCheaper ? totalCostGT : totalCostItems) : 0;

  useEffect(() => {
    async function loadDataFromSupabase() {
      if (!supabaseUrl || !supabaseAnonKey) {
        setIsLoaded(true);
        return;
      }

      try {
        const { data } = await supabase
          .from("tibia_dashboard")
          .select("*")
          .eq("id", "main")
          .single();

        if (data) {
          setLoot(Number(data.loot) || 0);
          setSupplies(Number(data.supplies) || 0);
          setBalance(Number(data.balance) || 0);
          setHunts(Number(data.hunts) || 0);
          setTcPrice(Number(data.tc_price) || 42500);
          setTotalXpGained(Number(data.total_xp) || 0);
          const savedExperience = Number(data.current_experience);
          if (Number.isFinite(savedExperience) && savedExperience > 0) {
            setCurrentExperience(savedExperience);
          }
          setHistory(data.history || []);
          setSoldTcTotal(Number(data.sold_tc_total) || 0);
          setSoldBrlTotal(Number(data.sold_brl_total) || 0);
        }
      } catch (err) {
        console.error("Erro na conexão com Supabase:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadDataFromSupabase();
  }, []);

  const saveDataToSupabase = async (
    newLoot: number,
    newSupplies: number,
    newBalance: number,
    newHunts: number,
    newTcPrice: number,
    newXpGainedTotal: number,
    newHistory: Hunt[],
    newLevel: number = currentLevel,
    newPercentage: number = manualPercentage,
    newSoldTcTotal: number = soldTcTotal,
    newSoldBrlTotal: number = soldBrlTotal,
    newCurrentExperience: number = currentExperience
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
        total_xp: newXpGainedTotal,
        current_level: newLevel,
        manual_percentage: newPercentage,
        current_experience: newCurrentExperience,
        history: newHistory,
        sold_tc_total: newSoldTcTotal,
        sold_brl_total: newSoldBrlTotal,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Erro ao salvar no Supabase:", err);
    }
  };

  const applyImbuementDeduction = async () => {
    if (totalImbuementsSelected <= 0) {
      alert("Selecione ao menos 1 imbuement para renovar.");
      return;
    }

    const updatedBalance = balance - bestTotalCost;

    setBalance(updatedBalance);
    setStrikeQty(0);
    setVoidQty(0);
    setVampirismQty(0);

    await saveDataToSupabase(
      loot,
      supplies,
      updatedBalance,
      hunts,
      tcPrice,
      totalXpGained,
      history,
      currentLevel,
      manualPercentage,
      soldTcTotal,
      soldBrlTotal,
      currentExperience
    );

    alert(`Despesa de Imbuement de ${bestTotalCost.toLocaleString("pt-BR")} GP abatida do Saldo e das TCs com sucesso!`);
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
    const updatedXpGainedTotal = totalXpGained + xpValue;
    const updatedHunts = hunts + 1;
    const updatedExperience = currentExperience + xpValue;
    const updatedProgress = progressFromExperience(updatedExperience);

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
    setTotalXpGained(updatedXpGainedTotal);
    setHunts(updatedHunts);
    setHistory(updatedHistory);
    setCurrentExperience(updatedExperience);
    setAnalyzer("");

    saveDataToSupabase(
      updatedLoot,
      updatedSupplies,
      updatedBalance,
      updatedHunts,
      tcPrice,
      updatedXpGainedTotal,
      updatedHistory,
      updatedProgress.level,
      updatedProgress.percentage,
      soldTcTotal,
      soldBrlTotal,
      updatedExperience
    );
  }

  const confirmSellTc = async () => {
    const tcQty = parseInt(tcToSellInput, 10);
    if (isNaN(tcQty) || tcQty <= 0) {
      alert("Por favor, digite uma quantidade válida de Tibia Coins.");
      return;
    }

    const brlArrecadado = tcQty * (50 / 250);

    const updatedSoldTc = soldTcTotal + tcQty;
    const updatedSoldBrl = soldBrlTotal + brlArrecadado;

    setBalance(0);
    setLoot(0);
    setSupplies(0);
    setSoldTcTotal(updatedSoldTc);
    setSoldBrlTotal(updatedSoldBrl);

    await saveDataToSupabase(
      0,
      0,
      0,
      hunts,
      tcPrice,
      totalXpGained,
      history,
      currentLevel,
      manualPercentage,
      updatedSoldTc,
      updatedSoldBrl
    );

    setShowSellModal(false);
    setTcToSellInput("");
    alert(`Lançamento realizado! ${tcQty} TCs vendidas por R$ ${brlArrecadado.toFixed(2)}.`);
  };

  function handleClearDataClick() {
    setActionToConfirm("clearAll");
    setHuntToDelete(null);
    setShowAuthModal(true);
  }

  function handleDeleteHuntClick(hunt: Hunt) {
    setActionToConfirm("deleteHunt");
    setHuntToDelete(hunt);
    setShowAuthModal(true);
  }

  async function confirmAuthAction() {
    if (authUsername === "panicao" && authPassword === "panicao") {
      if (actionToConfirm === "clearAll") {
        setLoot(0);
        setSupplies(0);
        setBalance(0);
        setHunts(0);
        setTotalXpGained(0);
        setSoldTcTotal(0);
        setSoldBrlTotal(0);
        setHistory([]);
        await saveDataToSupabase(0, 0, 0, 0, tcPrice, 0, [], currentLevel, manualPercentage, 0, 0);
        alert("Todos os dados foram apagados com sucesso!");
      } else if (actionToConfirm === "deleteHunt" && huntToDelete) {
        const updatedHistory = history.filter((h) => h.id !== huntToDelete.id);
        const updatedLoot = loot - huntToDelete.loot;
        const updatedSupplies = supplies - huntToDelete.supplies;
        const updatedBalance = balance - huntToDelete.balance;
        const updatedXpGainedTotal = totalXpGained - (huntToDelete.xp || 0);
        const updatedHunts = Math.max(hunts - 1, 0);
        const updatedExperience = Math.max(
          0,
          currentExperience - (huntToDelete.xp || 0)
        );
        const updatedProgress = progressFromExperience(updatedExperience);

        setLoot(updatedLoot);
        setSupplies(updatedSupplies);
        setBalance(updatedBalance);
        setTotalXpGained(updatedXpGainedTotal);
        setHunts(updatedHunts);
        setHistory(updatedHistory);
        setCurrentExperience(updatedExperience);

        await saveDataToSupabase(
          updatedLoot,
          updatedSupplies,
          updatedBalance,
          updatedHunts,
          tcPrice,
          updatedXpGainedTotal,
          updatedHistory,
          updatedProgress.level,
          updatedProgress.percentage,
          soldTcTotal,
          soldBrlTotal,
          updatedExperience
        );
        alert("Hunt removida com sucesso!");
      }

      setShowAuthModal(false);
      setAuthUsername("");
      setAuthPassword("");
      setActionToConfirm(null);
      setHuntToDelete(null);
    } else {
      alert("Usuário ou senha incorretos!");
    }
  }

  const handleTcPriceChange = (val: number) => {
    setTcPrice(val);
    saveDataToSupabase(loot, supplies, balance, hunts, val, totalXpGained, history, currentLevel, manualPercentage);
  };

  const tcToSellNum = parseInt(tcToSellInput, 10) || 0;
  const brlToReceive = tcToSellNum * (50 / 250);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0B1020] text-white flex items-center justify-center font-semibold">
        Carregando Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-white">
      <main className="max-w-[1400px] mx-auto p-8 relative">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          DashBoard Panicão
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
          
          {/* CARD DE PERFIL */}
          <div className="bg-[#151B31] p-5 rounded-xl border border-yellow-500/30 xl:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">{charData.name}</h2>
                  <p className="text-xs text-gray-400">{charData.vocation} • {charData.world}</p>
                </div>
              </div>

              <div className="my-3 flex justify-center items-center bg-[#0B1020] p-2 rounded-lg min-h-[140px] border border-slate-800">
                <img 
                  src={OUTFIT_IMAGE_URL} 
                  alt={`Foto do ${charData.name}`} 
                  className="h-36 object-contain rounded border border-yellow-500/20 shadow-md"
                />
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-300">Level Atual</span>
                <span className="text-2xl font-bold text-yellow-400 font-mono">
                  {currentLevel}
                </span>
              </div>

              <div className="bg-[#0B1020] p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-300">
                  <span>Progresso do Level ({currentLevel + 1})</span>
                  <span className="text-emerald-400 font-mono">
                    {manualPercentage.toFixed(2)}%
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${manualPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>{manualPercentage.toFixed(2)}% Concluído</span>
                  <span>{(100 - manualPercentage).toFixed(2)}% Restante</span>
                </div>
              </div>
            </div>
          </div>

          {/* MÉTRICAS */}
          <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Saldo Consolidado</h2>
              <div className="flex items-center gap-2">
                <img src={CRYSTAL_COIN_ICON} alt="Crystal Coin" className="w-6 h-6 object-contain" />
                <p className={`text-xl font-bold ${balance >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {balance.toLocaleString("pt-BR")} GP
                </p>
              </div>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Tibia Coins</h2>
              <div className="flex items-center gap-2">
                <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold text-yellow-400">{tibiaCoins.toFixed(1)} TC</p>
              </div>
              <p className="text-xs text-emerald-400 font-semibold mt-1">
                ≈ R$ {realMoney.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">XP Ganha (Hunts)</h2>
              <div className="flex items-center gap-2">
                <img src={REALITY_REAVER_ICON} alt="Reality Reaver" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold text-emerald-400">
                  {totalXpGained >= 1_000_000
                    ? `${(totalXpGained / 1_000_000).toFixed(2)}kk`
                    : totalXpGained.toLocaleString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Loot Total</h2>
              <div className="flex items-center gap-2">
                <img src={BOOTS_OF_HASTE_ICON} alt="Boots of Haste" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold">{loot.toLocaleString("pt-BR")} GP</p>
              </div>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Supplies</h2>
              <div className="flex items-center gap-2">
                <img src={GREAT_MANA_POTION_ICON} alt="Great Mana Potion" className="w-6 h-6 object-contain" />
                <p className="text-xl font-bold">{supplies.toLocaleString("pt-BR")} GP</p>
              </div>
            </div>

            <div className="bg-[#151B31] p-5 rounded-xl flex flex-col justify-center">
              <h2 className="text-gray-400 text-sm mb-1">Hunts Realizadas</h2>
              <div className="flex items-center gap-2">
                <img src={SANGUINE_BLUDGEON_ICON} alt="Sanguine Bludgeon" className="w-7 h-7 object-contain" />
                <p className="text-xl font-bold">{hunts}</p>
              </div>
            </div>
          </div>

        </div>

        {/* MÓDULO CALCULADORA DE IMBUEMENT & COMPARADOR DETALHADO */}
        <div className="mt-6 bg-[#151B31] p-6 rounded-xl border border-cyan-500/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={GOLD_TOKEN_ICON} 
                alt="Gold Token" 
                referrerPolicy="no-referrer"
                className="w-8 h-8 object-contain" 
              />
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">Calculadora & Despesa de Imbuements</h2>
                <p className="text-xs text-gray-400">Compare Gold Tokens vs. Produtos de Criatura em tempo real</p>
              </div>
            </div>
            <div className="bg-[#0B1020] px-4 py-2 rounded border border-slate-700 text-right">
              <label className="block text-[11px] text-gray-400">Preço Gold Token (GP):</label>
              <input
                type="number"
                value={gtPrice}
                onChange={(e) => setGtPrice(Math.max(0, Number(e.target.value) || 0))}
                className="bg-transparent text-right font-mono font-bold text-yellow-400 focus:outline-none w-28"
              />
            </div>
          </div>

          {/* GRID COM OS 3 IMBUEMENTS E SEUS RESPECTIVOS PRODUTOS DE CRIATURA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            
            {/* POWERFUL STRIKE (CRÍTICO) */}
            <div className="bg-[#0B1020] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <img 
                      src={POWERFUL_STRIKE_ICON} 
                      alt="Powerful Strike" 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 object-contain" 
                    />
                    <div>
                      <h3 className="font-bold text-yellow-400 text-sm">Powerful Strike</h3>
                      <p className="text-[10px] text-gray-400">Crit (+30%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Qtd:</span>
                    <input
                      type="number"
                      min="0"
                      value={strikeQty}
                      onChange={(e) => setStrikeQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-12 bg-[#151B31] p-1 text-center rounded border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">20x Protective Charm</span>
                    <input
                      type="number"
                      value={protectiveCharmPrice}
                      onChange={(e) => setProtectiveCharmPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">25x Sabretooth</span>
                    <input
                      type="number"
                      value={sabretoothPrice}
                      onChange={(e) => setSabretoothPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">5x Vexclaw Talon</span>
                    <input
                      type="number"
                      value={vexclawTalonPrice}
                      onChange={(e) => setVexclawTalonPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-gray-400">Taxa Shrine:</span>
                    <span className="text-gray-300 font-mono">150.000 GP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-gray-400">Custo Total Itens:</span>
                <span className="font-mono font-bold text-emerald-400">{strikeItemCost.toLocaleString("pt-BR")} GP</span>
              </div>
            </div>

            {/* POWERFUL VOID (MANA) */}
            <div className="bg-[#0B1020] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <img 
                      src={POWERFUL_VOID_ICON} 
                      alt="Powerful Void" 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 object-contain" 
                    />
                    <div>
                      <h3 className="font-bold text-cyan-400 text-sm">Powerful Void</h3>
                      <p className="text-[10px] text-gray-400">Mana Leech (+8%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Qtd:</span>
                    <input
                      type="number"
                      min="0"
                      value={voidQty}
                      onChange={(e) => setVoidQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-12 bg-[#151B31] p-1 text-center rounded border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">25x Rope Belt</span>
                    <input
                      type="number"
                      value={ropeBeltPrice}
                      onChange={(e) => setRopeBeltPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">25x Silencer Claw</span>
                    <input
                      type="number"
                      value={silencerClawPrice}
                      onChange={(e) => setSilencerClawPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">5x Grimeleech Wing</span>
                    <input
                      type="number"
                      value={grimeleechWingPrice}
                      onChange={(e) => setGrimeleechWingPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-gray-400">Taxa Shrine:</span>
                    <span className="text-gray-300 font-mono">150.000 GP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-gray-400">Custo Total Itens:</span>
                <span className="font-mono font-bold text-emerald-400">{voidItemCost.toLocaleString("pt-BR")} GP</span>
              </div>
            </div>

            {/* POWERFUL VAMPIRISM (LIFE) */}
            <div className="bg-[#0B1020] p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <img 
                      src={POWERFUL_VAMPIRISM_ICON} 
                      alt="Powerful Vampirism" 
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 object-contain" 
                    />
                    <div>
                      <h3 className="font-bold text-red-400 text-sm">Powerful Vampirism</h3>
                      <p className="text-[10px] text-gray-400">Life Leech (+25%)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Qtd:</span>
                    <input
                      type="number"
                      min="0"
                      value={vampirismQty}
                      onChange={(e) => setVampirismQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-12 bg-[#151B31] p-1 text-center rounded border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">25x Vampire Teeth</span>
                    <input
                      type="number"
                      value={vampireTeethPrice}
                      onChange={(e) => setVampireTeethPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">25x Bloody Pincer</span>
                    <input
                      type="number"
                      value={bloodyPincerPrice}
                      onChange={(e) => setBloodyPincerPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">5x Dead Brain</span>
                    <input
                      type="number"
                      value={deadBrainPrice}
                      onChange={(e) => setDeadBrainPrice(Number(e.target.value) || 0)}
                      className="w-20 bg-[#151B31] p-1 text-right rounded border border-slate-800 text-gray-200 font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-gray-400">Taxa Shrine:</span>
                    <span className="text-gray-300 font-mono">150.000 GP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-gray-400">Custo Total Itens:</span>
                <span className="font-mono font-bold text-emerald-400">{vampirismItemCost.toLocaleString("pt-BR")} GP</span>
              </div>
            </div>

          </div>

          {/* DICA DE ECONOMIA E BOTÃO DE ABATIMENTO */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#0B1020] p-4 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-gray-400 mb-1">
                Comparativo de Custo Total ({totalImbuementsSelected} imbuement{totalImbuementsSelected !== 1 ? "s" : ""}):
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>Via GT (6x + 250k): <strong className="text-yellow-400 font-mono">{totalCostGT.toLocaleString("pt-BR")} GP</strong></span>
                <span>•</span>
                <span>Via Itens de Criatura: <strong className="text-emerald-400 font-mono">{totalCostItems.toLocaleString("pt-BR")} GP</strong></span>
              </div>
              <p className="text-sm font-bold mt-1">
                {totalImbuementsSelected === 0 ? (
                  <span className="text-gray-400">Selecione ao menos 1 imbuement acima para comparar.</span>
                ) : isGtCheaper ? (
                  <span className="text-yellow-400">💡 Vale mais a pena usar Gold Tokens! (Economia de {Math.abs(totalCostItems - totalCostGT).toLocaleString("pt-BR")} GP)</span>
                ) : (
                  <span className="text-emerald-400">💡 Vale mais a pena comprar Produtos de Criatura! (Economia de {Math.abs(totalCostGT - totalCostItems).toLocaleString("pt-BR")} GP)</span>
                )}
              </p>
            </div>

            <button
              onClick={applyImbuementDeduction}
              className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-lg font-bold transition shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              Abater Despesa ({bestTotalCost.toLocaleString("pt-BR")} GP)
            </button>
          </div>
        </div>

        {/* BOTÃO / CARD VENDER TIBIA COIN E MÉTRICAS DE VENDAS */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => setShowSellModal(true)}
            className="bg-[#151B31] hover:bg-[#1c2440] p-6 rounded-xl border border-yellow-500/40 cursor-pointer transition flex items-center justify-between group shadow-lg"
          >
            <div className="flex items-center gap-4">
              <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
              <div>
                <h2 className="text-xl font-bold text-yellow-400">Vender Tibia Coin</h2>
                <p className="text-xs text-gray-400">Clique para lançar a venda e resetar os saldos de hunt</p>
              </div>
            </div>
            <span className="text-2xl text-yellow-400 font-bold group-hover:translate-x-1 transition-transform">→</span>
          </div>

          <div className="bg-[#151B31] p-6 rounded-xl border border-slate-800 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <img src={TIBIA_COIN_ICON} alt="Tibia Coin Vendida" className="w-5 h-5 object-contain" />
              <h2 className="text-sm font-semibold text-gray-300">Total de TCs Vendidas & Arrecadado</h2>
            </div>
            <div className="flex justify-between items-end mt-2">
              <p className="text-2xl font-bold text-yellow-400 font-mono">{soldTcTotal} TC</p>
              <p className="text-xl font-bold text-emerald-400 font-mono">
                R$ {soldBrlTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* PREÇO TC */}
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
            className="w-full h-64 bg-[#0B1020] p-4 rounded border border-gray-800 focus:outline-none focus:border-yellow-500 font-mono text-sm"
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
              Limpar Tudo
            </button>
          </div>
        </div>

        {/* HISTÓRICO DE HUNTS */}
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
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-700 text-gray-400">
                      <th className="pb-2">Data</th>
                      <th className="pb-2">XP</th>
                      <th className="pb-2">Loot</th>
                      <th className="pb-2">Supplies</th>
                      <th className="pb-2">Balance</th>
                      <th className="pb-2">TC</th>
                      <th className="pb-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((hunt) => {
                      const huntTc = tcPrice > 0 ? hunt.balance / tcPrice : 0;
                      return (
                        <tr key={hunt.id} className="border-b border-slate-800 hover:bg-[#0B1020]/50">
                          <td className="py-3 text-sm">{hunt.date}</td>
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
                          <td className="text-center">
                            <button
                              onClick={() => handleDeleteHuntClick(hunt)}
                              className="bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white px-2.5 py-1 rounded text-xs font-bold transition border border-red-500/30"
                              title="Excluir apenas esta hunt"
                            >
                              ✕
                            </button>
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

      {/* MODAL POP-UP DE VENDER TIBIA COIN */}
      {showSellModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151B31] p-6 rounded-xl w-full max-w-md border border-yellow-500/40 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img src={TIBIA_COIN_ICON} alt="Tibia Coin" className="w-8 h-8 object-contain" />
              <h2 className="text-2xl font-bold text-yellow-400">Vender Tibia Coin</h2>
            </div>

            <div className="bg-[#0B1020] p-4 rounded-lg border border-slate-800 mb-4 flex justify-between items-center">
              <span className="text-sm text-gray-400">Saldo de TC Atual:</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">{tibiaCoins.toFixed(1)} TC</span>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">
                Quantas TC você vai vender?
              </label>
              <input
                type="number"
                value={tcToSellInput}
                onChange={(e) => setTcToSellInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 1000"
                className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none focus:border-yellow-500 font-mono text-lg text-white"
              />
            </div>

            <div className="bg-[#0B1020] p-4 rounded-lg border border-slate-800 mb-6 flex justify-between items-center">
              <span className="text-sm text-gray-400">Quantos R$ foi arrecadado:</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">
                R$ {brlToReceive.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setTcToSellInput("");
                }}
                className="px-4 py-2 rounded text-gray-400 hover:text-white text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSellTc}
                className="bg-yellow-500 text-black px-6 py-2 rounded font-bold text-sm hover:bg-yellow-400 transition"
              >
                Lançar e Resetar Saldos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AUTENTICAÇÃO */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151B31] p-6 rounded-xl w-full max-w-sm border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-red-500">
              {actionToConfirm === "clearAll" ? "Apagar Tudo" : "Apagar Hunt"}
            </h2>
            <p className="mb-6 text-sm text-gray-400">
              {actionToConfirm === "clearAll"
                ? "Insira as credenciais para apagar todos os dados do dashboard."
                : `Insira as credenciais para excluir a hunt do dia ${huntToDelete?.date || ""}.`}
            </p>
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-300">Usuário</label>
              <input 
                type="text" 
                value={authUsername}
                onChange={(e) => setAuthUsername(e.target.value)}
                className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none text-white"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm mb-1 text-gray-300">Senha</label>
              <input 
                type="password" 
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#0B1020] p-3 rounded border border-gray-800 focus:outline-none text-white"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthUsername("");
                  setAuthPassword("");
                  setActionToConfirm(null);
                  setHuntToDelete(null);
                }}
                className="px-4 py-2 rounded text-gray-400 hover:text-white text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAuthAction}
                className="bg-red-600 px-6 py-2 rounded font-bold text-white text-sm hover:bg-red-500 transition"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}