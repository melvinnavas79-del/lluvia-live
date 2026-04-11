import React from 'react';
import { useUser } from '../contexts/UserContext';

const ProfileView = ({ onBack }) => {
  const { user, logout } = useUser();

  const getLevelInfo = (level) => {
    const levels = {
      1: { name: 'Bronce', emoji: '🥉' },
      2: { name: 'Plata', emoji: '👑👑' },
      3: { name: 'Oro', emoji: '👑👑👑' },
      4: { name: 'Diamante Azul', emoji: '💎' },
      5: { name: 'Esmeralda', emoji: '💎💎' },
      6: { name: 'Rubí', emoji: '💎💎💎' },
      7: { name: 'Zafiro', emoji: '👑💎' },
      8: { name: 'Arcoíris', emoji: '👑💎👑' },
      9: { name: 'SUPREMO', emoji: '👑💎👑💎' }
    };
    return levels[level] || levels[1];
  };

  const levelInfo = getLevelInfo(user.level);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Volver
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border-4 border-pink-500 rounded-3xl p-8 mb-6">
          <div className="flex justify-center mb-6">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-32 h-32 rounded-full border-4 border-pink-500"
            />
          </div>

          <h2 className="text-3xl font-bold text-white text-center mb-2">{user.username}</h2>
          <p className="text-yellow-400 text-center text-xl mb-6">{user.vip_status}</p>

          <div className="bg-black/30 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-400 text-sm mb-1">💰 Monedas</div>
                <div className="text-pink-400 text-2xl font-bold">{user.coins}</div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Nivel</div>
                <div className="text-pink-400 text-2xl font-bold">Nivel {user.level}</div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-2xl p-6 mb-6">
            <div className="text-center">
              <div className="text-5xl mb-2">{levelInfo.emoji}</div>
              <div className="text-white text-xl font-bold">{levelInfo.name}</div>
              <div className="text-gray-300 text-sm mt-2">Aristocracia: {user.aristocracy}</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-white font-bold mb-3">🎯 Badges:</h3>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((badge, i) => (
                <span
                  key={i}
                  className="bg-purple-600/50 px-3 py-1 rounded-full text-white text-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600/30 to-cyan-600/30 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-gray-300 text-sm">💎 Diamantes</div>
                <div className="text-cyan-400 text-2xl font-bold">{user.diamonds}</div>
              </div>
              <button className="bg-cyan-500 hover:bg-cyan-600 px-6 py-2 rounded-full text-white font-medium transition-colors">
                Recargar
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <button className="w-full bg-purple-800/40 hover:bg-purple-700/50 border-2 border-purple-500/30 text-white py-4 rounded-2xl font-medium transition-all flex items-center justify-between px-6">
            <span>👻 Modo Fantasma</span>
            <span className="text-gray-400">APAGADO</span>
          </button>

          <button className="w-full bg-purple-800/40 hover:bg-purple-700/50 border-2 border-purple-500/30 text-white py-4 rounded-2xl font-medium transition-all flex items-center justify-between px-6">
            <span>💰 Billetera</span>
            <span>→</span>
          </button>
        </div>

        <button
          onClick={() => {
            logout();
            onBack();
          }}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-4 rounded-2xl font-bold transition-all"
        >
          🚫 Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
