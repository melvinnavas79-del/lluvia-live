import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = ({ onNavigate }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('salas');
  const [rooms, setRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const res = await axios.get(`${API}/rooms`);
      setRooms(res.data);
    } catch (err) {
      console.error('Error loading rooms:', err);
    }
  };

  const createRoom = async () => {
    const roomName = prompt('Nombre de la sala:');
    if (!roomName) return;

    try {
      await axios.post(`${API}/rooms?owner_id=${user.id}`, { name: roomName });
      loadRooms();
    } catch (err) {
      alert('Error al crear sala');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-b border-pink-500/30 p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="text-3xl">☂️💧</div>
            <div>
              <h1 className="text-2xl font-bold text-pink-400">Lluvia Live</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-yellow-600/30 border-2 border-yellow-500 rounded-full px-4 py-2">
              <span className="text-yellow-300 font-bold">💰 {user.coins}</span>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-full transition-colors"
            >
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="text-white font-medium">{user.username}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-pink-500/20">
        <div className="max-w-6xl mx-auto flex gap-2 p-2">
          {[
            { id: 'salas', label: '🏠 Salas', emoji: '🏠' },
            { id: 'juegos', label: '🎮 Juegos', emoji: '🎮' },
            { id: 'rankings', label: '🏆 Rankings', emoji: '🏆' },
            { id: 'clanes', label: '🏷️ Clanes', emoji: '🏷️' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'salas' && (
          <div>
            {/* Search Bar */}
            <div className="bg-purple-800/30 border-2 border-purple-500/30 rounded-full px-6 py-3 mb-6 flex items-center gap-3">
              <span className="text-2xl">🔍</span>
              <input
                type="text"
                placeholder="Buscar Personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
              />
              <button className="bg-yellow-500 w-10 h-10 rounded-full flex items-center justify-center text-xl">
                🏆
              </button>
              <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-pink-500" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { icon: '🏠', label: 'My Room', action: createRoom },
                { icon: '💬', label: 'Quick Join', action: () => {} },
                { icon: '🎬', label: 'Reels', action: () => {} },
                { icon: '📸', label: 'Galería', action: () => {} }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="bg-gradient-to-br from-purple-700/40 to-purple-900/40 border-2 border-purple-500/30 rounded-2xl p-6 hover:from-purple-600/50 hover:to-purple-800/50 transition-all"
                >
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <div className="text-white font-medium">{item.label}</div>
                </button>
              ))}
            </div>

            {/* Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl mb-2">🎉</div>
                  <h2 className="text-3xl font-bold text-white mb-2">Encuentra tu Vibra</h2>
                  <p className="text-white/80">Unete a salas de streaming en vivo</p>
                </div>
                <div className="w-32 h-32 bg-purple-500/30 rounded-3xl"></div>
              </div>
            </div>

            {/* Active Rooms */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>🔑</span> Salas Activas
              </h3>
              <div className="space-y-3">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => onNavigate('room', room.id)}
                    className="w-full bg-gradient-to-r from-purple-800/40 to-blue-800/40 border-2 border-purple-500/30 rounded-2xl p-6 hover:border-pink-500/50 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl"></div>
                        <div>
                          <h4 className="text-xl font-bold text-white mb-1">{room.name} ✨</h4>
                          <p className="text-gray-400">Bienvenidos a Lluvia Live</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-pink-400 font-bold">{room.active_users} 👥</div>
                        <div className="text-gray-400 text-sm">en línea</div>
                      </div>
                    </div>
                  </button>
                ))}

                {rooms.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-6xl mb-4">🪑</div>
                    <p>No hay salas activas. ¡Crea una!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🏆</div>
            <p>Rankings próximamente...</p>
          </div>
        )}

        {activeTab === 'clanes' && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🏷️</div>
            <p>Clanes próximamente...</p>
          </div>
        )}

        {activeTab === 'juegos' && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">🎮</div>
            <p>Juegos próximamente...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;