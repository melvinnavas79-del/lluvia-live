import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SYMBOLS = ['7️⃣', '💎', '🍒', '🔔', '⭐', '🍋', '🍊', '🃏'];
const PAYOUTS = {
  '7️⃣7️⃣7️⃣': { mult: 50, name: 'MEGA JACKPOT 777' },
  '💎💎💎': { mult: 25, name: 'DIAMOND RUSH' },
  '🍒🍒🍒': { mult: 10, name: 'CHERRY BLAST' },
  '🔔🔔🔔': { mult: 8, name: 'BELL RINGER' },
  '⭐⭐⭐': { mult: 15, name: 'STAR POWER' },
  '🍋🍋🍋': { mult: 5, name: 'LEMON DROP' },
  '🍊🍊🍊': { mult: 5, name: 'ORANGE CRUSH' },
  '🃏🃏🃏': { mult: 20, name: 'WILD CARD' },
};

const SlotMachine = ({ onBack }) => {
  const { user, updateUser } = useUser();
  const [reels, setReels] = useState(['7️⃣', '💎', '🍒']);
  const [spinning, setSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(1000);
  const [result, setResult] = useState(null);
  const [showJackpot, setShowJackpot] = useState(false);
  const [spinHistory, setSpinHistory] = useState([]);
  const animRef = useRef(null);

  const spin = async () => {
    if (spinning) return;
    if (user.coins < betAmount) return alert('No tienes suficientes monedas');

    setSpinning(true);
    setResult(null);
    setShowJackpot(false);

    // Animate reels
    let count = 0;
    const animate = () => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      count++;
      if (count < 20) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);

    // Call backend
    try {
      const res = await axios.post(`${API}/games/slot-machine`, {
        user_id: user.id,
        bet_amount: betAmount
      });

      // Stop animation after delay
      setTimeout(() => {
        cancelAnimationFrame(animRef.current);
        setReels(res.data.reels);
        setResult(res.data);
        updateUser({ coins: res.data.new_balance });
        setSpinning(false);

        if (res.data.multiplier >= 10) {
          setShowJackpot(true);
          setTimeout(() => setShowJackpot(false), 3000);
        }

        setSpinHistory(prev => [res.data, ...prev].slice(0, 10));
      }, 1500);
    } catch (err) {
      setSpinning(false);
      alert(err.response?.data?.detail || 'Error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-950 to-gray-900 pb-24">
      {/* Jackpot Animation */}
      {showJackpot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-pulse">
          <div className="text-center">
            <div className="text-8xl mb-4">🎰</div>
            <h1 className="text-5xl font-black text-yellow-400 mb-2" style={{textShadow: '0 0 40px rgba(234,179,8,0.8)'}}>
              {result?.jackpot_name}
            </h1>
            <p className="text-3xl text-green-400 font-bold">+{result?.winnings?.toLocaleString()} monedas</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={onBack} className="bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold">
            ← Volver
          </button>
          <div className="bg-yellow-600/30 border-2 border-yellow-500 rounded-full px-5 py-2">
            <span className="text-yellow-300 font-bold">💰 {user.coins?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4">
        {/* Machine Frame */}
        <div className="bg-gradient-to-b from-yellow-700 via-yellow-800 to-yellow-900 rounded-3xl p-2 shadow-2xl border-4 border-yellow-600">
          {/* Top Label */}
          <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-700 rounded-t-2xl py-3 text-center border-b-4 border-yellow-500">
            <h1 className="text-3xl font-black text-yellow-300 tracking-wider" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
              ☔ LLUVIA 777 ☔
            </h1>
            <p className="text-yellow-200/80 text-xs font-bold tracking-widest">MEGA JACKPOT CASINO</p>
          </div>

          {/* Reels Display */}
          <div className="bg-gray-950 mx-2 my-3 rounded-xl p-4 border-4 border-gray-700 shadow-inner">
            <div className="flex justify-center gap-3">
              {reels.map((symbol, i) => (
                <div
                  key={i}
                  className={`w-24 h-28 bg-gradient-to-b from-white to-gray-100 rounded-xl flex items-center justify-center border-4 border-gray-400 shadow-lg ${
                    spinning ? 'animate-bounce' : ''
                  }`}
                  style={{animationDelay: `${i * 0.1}s`}}
                >
                  <span className="text-5xl">{symbol}</span>
                </div>
              ))}
            </div>

            {/* Win Line */}
            <div className="flex justify-center mt-2">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Result */}
          {result && !spinning && (
            <div className={`mx-2 mb-2 p-3 rounded-xl text-center ${
              result.net > 0 
                ? 'bg-green-900/50 border-2 border-green-500' 
                : result.net === 0 
                  ? 'bg-yellow-900/50 border-2 border-yellow-500'
                  : 'bg-red-900/50 border-2 border-red-500'
            }`}>
              <div className={`text-lg font-black ${
                result.net > 0 ? 'text-green-400' : result.net === 0 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {result.jackpot_name || (result.net > 0 ? 'GANASTE' : result.net === 0 ? 'EMPATE' : 'SIN SUERTE')}
              </div>
              <div className="text-white text-sm">
                {result.net > 0 ? `+${result.net.toLocaleString()}` : result.net.toLocaleString()} monedas
              </div>
            </div>
          )}

          {/* Bet Selection */}
          <div className="mx-2 mb-3">
            <div className="flex items-center justify-center gap-2 mb-3">
              {[500, 1000, 5000, 10000, 50000].map(amount => (
                <button
                  key={amount}
                  onClick={() => setBetAmount(amount)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    betAmount === amount
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {amount >= 1000 ? `${amount / 1000}K` : amount}
                </button>
              ))}
            </div>
          </div>

          {/* SPIN Button */}
          <div className="px-2 pb-3">
            <button
              onClick={spin}
              disabled={spinning}
              className={`w-full py-5 rounded-2xl text-2xl font-black tracking-widest transition-all ${
                spinning
                  ? 'bg-gray-700 text-gray-500'
                  : 'bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-yellow-300 hover:from-red-500 hover:to-red-500 shadow-lg shadow-red-500/40 active:scale-95'
              }`}
              style={!spinning ? {textShadow: '2px 2px 4px rgba(0,0,0,0.5)'} : {}}
            >
              {spinning ? '⏳ GIRANDO...' : '🎰 GIRAR'}
            </button>
          </div>
        </div>

        {/* Payout Table */}
        <div className="mt-6 bg-gray-900/80 rounded-2xl p-4 border border-gray-700">
          <h3 className="text-yellow-400 font-bold text-center mb-3">💰 TABLA DE PAGOS</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PAYOUTS).map(([combo, info]) => (
              <div key={combo} className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
                <span className="text-lg">{combo}</span>
                <span className="text-yellow-400 text-sm font-bold">x{info.mult}</span>
              </div>
            ))}
            <div className="col-span-2 flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-400">2 iguales</span>
              <span className="text-yellow-400 text-sm font-bold">x2</span>
            </div>
          </div>
        </div>

        {/* History */}
        {spinHistory.length > 0 && (
          <div className="mt-4 bg-gray-900/80 rounded-2xl p-4 border border-gray-700">
            <h3 className="text-gray-400 font-bold text-center mb-2 text-sm">Últimas tiradas</h3>
            <div className="space-y-1">
              {spinHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-lg">{h.reels?.join(' ')}</span>
                  <span className={h.net > 0 ? 'text-green-400 font-bold' : 'text-red-400'}>
                    {h.net > 0 ? '+' : ''}{h.net?.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotMachine;
