import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GamesView = ({ onBack, onNavigate }) => {
  const { user, updateUser } = useUser();
  const [selectedGame, setSelectedGame] = useState(null);
  const [betAmount, setBetAmount] = useState(500);
  const [gameResult, setGameResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [triviaQ, setTriviaQ] = useState(null);
  const [rpsChoice, setRpsChoice] = useState(null);
  const [cardGuess, setCardGuess] = useState(null);

  const games = [
    { id: 'slots', name: 'Lluvia 777', icon: '🎰', color: 'from-red-700 to-yellow-600', desc: 'Tragamonedas Casino Real', special: true },
    { id: 'ruleta', name: 'Ruleta de la Suerte', icon: '🎡', color: 'from-yellow-500 to-orange-600', desc: 'Gira y gana hasta x10' },
    { id: 'dados', name: 'Dados', icon: '🎲', color: 'from-red-500 to-pink-600', desc: 'Tira dados y gana' },
    { id: 'rps', name: 'Piedra, Papel, Tijera', icon: '✊', color: 'from-green-500 to-emerald-600', desc: 'Juega contra la máquina' },
    { id: 'trivia', name: 'Trivia', icon: '❓', color: 'from-blue-500 to-indigo-600', desc: 'Responde y gana x3' },
    { id: 'carta', name: 'Carta Mayor', icon: '🃏', color: 'from-purple-500 to-violet-600', desc: '¿Mayor o menor?' },
  ];

  const resetGame = () => {
    setGameResult(null);
    setRpsChoice(null);
    setCardGuess(null);
    setTriviaQ(null);
  };

  const playRuleta = async () => {
    setPlaying(true);
    resetGame();
    try {
      const res = await axios.post(`${API}/games/ruleta`, {
        user_id: user.id,
        bet_amount: betAmount
      });
      setGameResult(res.data);
      updateUser({ coins: res.data.new_balance });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
    setPlaying(false);
  };

  const playDados = async () => {
    setPlaying(true);
    resetGame();
    try {
      const res = await axios.post(`${API}/games/dados`, {
        user_id: user.id,
        bet_amount: betAmount
      });
      setGameResult(res.data);
      updateUser({ coins: res.data.new_balance });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
    setPlaying(false);
  };

  const playRPS = async (choice) => {
    setPlaying(true);
    setRpsChoice(choice);
    try {
      const res = await axios.post(`${API}/games/piedra-papel-tijera`, {
        user_id: user.id,
        bet_amount: betAmount,
        choice: choice
      });
      setGameResult(res.data);
      updateUser({ coins: res.data.new_balance });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
    setPlaying(false);
  };

  const loadTrivia = async () => {
    resetGame();
    try {
      const res = await axios.get(`${API}/games/trivia/question`);
      setTriviaQ(res.data);
    } catch (err) {
      alert('Error cargando pregunta');
    }
  };

  const answerTrivia = async (answerIndex) => {
    setPlaying(true);
    try {
      const res = await axios.post(`${API}/games/trivia`, {
        user_id: user.id,
        bet_amount: betAmount,
        answer_index: answerIndex
      });
      setGameResult(res.data);
      updateUser({ coins: res.data.new_balance });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
    setPlaying(false);
  };

  const playCarta = async (guess) => {
    setPlaying(true);
    setCardGuess(guess);
    try {
      const res = await axios.post(`${API}/games/carta-mayor`, {
        user_id: user.id,
        bet_amount: betAmount,
        guess: guess
      });
      setGameResult(res.data);
      updateUser({ coins: res.data.new_balance });
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
    setPlaying(false);
  };

  const renderGameContent = () => {
    switch (selectedGame) {
      case 'ruleta':
        return (
          <div className="text-center">
            <div className="text-8xl mb-6 animate-bounce">🎰</div>
            <button
              onClick={playRuleta}
              disabled={playing}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-yellow-600 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {playing ? 'Girando...' : '🎡 GIRAR RULETA'}
            </button>
          </div>
        );

      case 'dados':
        return (
          <div className="text-center">
            <div className="text-8xl mb-6">🎲</div>
            <p className="text-gray-300 mb-4">7+ para ganar. 10+ = x3</p>
            <button
              onClick={playDados}
              disabled={playing}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-red-600 hover:to-pink-700 transition-all disabled:opacity-50"
            >
              {playing ? 'Tirando...' : '🎲 TIRAR DADOS'}
            </button>
          </div>
        );

      case 'rps':
        return (
          <div className="text-center">
            <p className="text-gray-300 mb-6">Elige tu jugada:</p>
            <div className="flex justify-center gap-6 mb-6">
              {[
                { choice: 'piedra', icon: '🪨', label: 'Piedra' },
                { choice: 'papel', icon: '📄', label: 'Papel' },
                { choice: 'tijera', icon: '✂️', label: 'Tijera' }
              ].map(item => (
                <button
                  key={item.choice}
                  onClick={() => playRPS(item.choice)}
                  disabled={playing}
                  className={`flex flex-col items-center p-6 rounded-2xl border-4 transition-all hover:scale-110 disabled:opacity-50 ${
                    rpsChoice === item.choice
                      ? 'border-green-400 bg-green-500/20'
                      : 'border-purple-500/40 bg-purple-800/30 hover:border-pink-500'
                  }`}
                >
                  <div className="text-5xl mb-2">{item.icon}</div>
                  <span className="text-white font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 'trivia':
        return (
          <div className="text-center">
            {!triviaQ ? (
              <div>
                <div className="text-8xl mb-6">❓</div>
                <p className="text-gray-300 mb-4">Responde correctamente y gana x3</p>
                <button
                  onClick={loadTrivia}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-12 py-4 rounded-full text-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all"
                >
                  📝 OBTENER PREGUNTA
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl text-white font-bold mb-6">{triviaQ.question}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {triviaQ.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => answerTrivia(i)}
                      disabled={playing}
                      className="bg-purple-800/50 hover:bg-purple-700/60 border-2 border-purple-500/40 hover:border-pink-500 text-white py-4 px-6 rounded-xl font-medium transition-all disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'carta':
        return (
          <div className="text-center">
            <div className="text-8xl mb-6">🃏</div>
            <p className="text-gray-300 mb-6">¿La siguiente carta será mayor o menor?</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => playCarta('mayor')}
                disabled={playing}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                ⬆️ MAYOR
              </button>
              <button
                onClick={() => playCarta('menor')}
                disabled={playing}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-4 rounded-full text-xl font-bold hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50"
              >
                ⬇️ MENOR
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResult = () => {
    if (!gameResult) return null;

    const isWin = gameResult.net > 0;
    const isTie = gameResult.net === 0;

    return (
      <div className={`mt-6 p-6 rounded-2xl border-4 ${
        isWin ? 'bg-green-500/20 border-green-400' : isTie ? 'bg-yellow-500/20 border-yellow-400' : 'bg-red-500/20 border-red-400'
      }`}>
        <h4 className={`text-2xl font-bold mb-2 ${isWin ? 'text-green-400' : isTie ? 'text-yellow-400' : 'text-red-400'}`}>
          {gameResult.result}
        </h4>

        {gameResult.dice1 && (
          <p className="text-white text-4xl mb-2">🎲 {gameResult.dice1} + 🎲 {gameResult.dice2} = {gameResult.total}</p>
        )}

        {gameResult.computer_choice && (
          <p className="text-white text-lg mb-2">
            Tú: {gameResult.player_choice} vs Máquina: {gameResult.computer_choice}
          </p>
        )}

        {gameResult.correct_answer && (
          <p className="text-white text-lg mb-2">
            Respuesta correcta: {gameResult.correct_answer}
          </p>
        )}

        {gameResult.card1 && (
          <p className="text-white text-4xl mb-2">🃏 {gameResult.card1} → 🃏 {gameResult.card2}</p>
        )}

        <div className="mt-4 space-y-1">
          <p className="text-gray-300">Apuesta: 💰 {gameResult.bet?.toLocaleString()}</p>
          <p className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
            {isWin ? `+${gameResult.net?.toLocaleString()}` : gameResult.net?.toLocaleString()} monedas
          </p>
          <p className="text-yellow-400 font-medium">Balance: 💰 {gameResult.new_balance?.toLocaleString()}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={selectedGame ? () => { setSelectedGame(null); resetGame(); } : onBack}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors"
          >
            ← {selectedGame ? 'Juegos' : 'Volver'}
          </button>
          <div className="bg-yellow-600/30 border-2 border-yellow-500 rounded-full px-6 py-2">
            <span className="text-yellow-300 font-bold text-lg">💰 {user.coins?.toLocaleString()}</span>
          </div>
        </div>

        {!selectedGame ? (
          <div>
            <h2 className="text-3xl font-bold text-pink-400 text-center mb-8">🎮 Juegos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => { 
                    if (game.id === 'slots' && onNavigate) {
                      onNavigate('slots');
                    } else {
                      setSelectedGame(game.id); resetGame(); 
                    }
                  }}
                  className={`bg-gradient-to-r ${game.color} rounded-2xl p-6 text-left hover:scale-105 transition-all ${game.special ? 'col-span-1 md:col-span-2 border-2 border-yellow-400' : ''}`}
                >
                  <div className="text-5xl mb-3">{game.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-1">{game.name}</h3>
                  <p className="text-white/80 text-sm">{game.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold text-pink-400 text-center mb-4">
              {games.find(g => g.id === selectedGame)?.icon} {games.find(g => g.id === selectedGame)?.name}
            </h2>

            <div className="bg-purple-800/30 border-2 border-purple-500/30 rounded-2xl p-6 mb-6">
              <label className="text-gray-300 text-sm block mb-2">💰 Apuesta:</label>
              <div className="flex items-center gap-3">
                {[100, 500, 1000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setBetAmount(amount)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      betAmount === amount
                        ? 'bg-pink-500 text-white'
                        : 'bg-purple-700/40 text-gray-300 hover:bg-purple-600/50'
                    }`}
                  >
                    {amount >= 1000 ? `${amount / 1000}K` : amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-2 border-pink-500/30 rounded-3xl p-8">
              {renderGameContent()}
              {renderResult()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamesView;
