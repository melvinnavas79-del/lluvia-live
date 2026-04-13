import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = ({ onNavigate }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('popular');
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [subTab, setSubTab] = useState('popular');
  const [unreadCount, setUnreadCount] = useState(0);
  const [flashFame, setFlashFame] = useState({});

  useEffect(() => {
    loadRooms();
    loadUsers();
    loadUnreadCount();
    loadFlashFame();
    const n = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(n);
  }, []);

  const loadRooms = async () => {
    try {
      const res = await axios.get(`${API}/rooms`);
      setRooms(res.data);
    } catch (err) { console.error(err); }
  };

  const loadUsers = async () => {
    try {
      const res = await axios.get(`${API}/rankings/coins`);
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await axios.get(`${API}/notifications/${user.id}/unread-count`);
      setUnreadCount(res.data.count || 0);
    } catch (err) { console.error(err); }
  };

  const loadFlashFame = async () => {
    try {
      const res = await axios.get(`${API}/flash-fame/all`);
      setFlashFame(res.data);
    } catch (err) { console.error(err); }
  };

  const createRoom = async () => {
    const roomName = prompt('Nombre de la sala:');
    if (!roomName) return;
    try {
      await axios.post(`${API}/rooms?owner_id=${user.id}`, { name: roomName });
      loadRooms();
    } catch (err) { alert('Error al crear sala'); }
  };

  const renderMio = () => (
    <div className="p-4">
      {/* Abrir Sala Button - PROMINENT */}
      <button
        data-testid="abrir-sala-btn"
        onClick={createRoom}
        className="w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white py-4 rounded-2xl font-bold text-lg mb-5 shadow-lg shadow-blue-500/30 active:scale-[0.98] transition-transform"
      >
        + Abrir Sala
      </button>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: '💬', label: 'Quick Join', action: () => { if (rooms.length > 0) onNavigate('room', rooms[0].id); } },
          { icon: '🎬', label: 'Reels', action: () => onNavigate('reels') },
          { icon: '💰', label: 'Tienda', action: () => onNavigate('store') }
        ].map((item, i) => (
          <button key={i} onClick={item.action}
            className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all flex flex-col items-center">
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-white text-xs font-medium">{item.label}</div>
          </button>
        ))}
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-3">Salas Activas</h3>
      <div className="space-y-3">
        {rooms.map(room => (
          <button key={room.id} onClick={() => onNavigate('room', room.id)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all text-left border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center text-white text-xl">☔</div>
                <div>
                  <h4 className="font-bold text-gray-800">{room.name}</h4>
                  <p className="text-gray-500 text-sm">Lluvia Live</p>
                </div>
              </div>
              <div className="text-blue-500 font-bold">{room.active_users} 👥</div>
            </div>
          </button>
        ))}
        {rooms.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-5xl mb-3">🪑</div>
            <p>No hay salas. Abre una!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPopular = () => (
    <div className="p-4">
      {/* FLASH FAME BANNER - Top 1 Individual */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-6 mb-5 overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{background: 'radial-gradient(circle at 50% 0%, #fbbf24 0%, transparent 60%)'}} />
        <div className="relative text-center">
          <div className="text-4xl mb-2" style={{animation: 'pulse 2s infinite'}}>👑</div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-1" style={{textShadow: '0 0 20px rgba(234,179,8,0.5)'}}>
            Flash Fame
          </h2>
          {flashFame.individual ? (
            <div className="mt-2">
              <div className="inline-block bg-yellow-500/20 border border-yellow-500/40 rounded-full px-4 py-1">
                <span className="text-yellow-300 font-bold text-sm">🏆 {flashFame.individual.username} - {(flashFame.individual.coins || 0).toLocaleString()} coins</span>
              </div>
            </div>
          ) : (
            <p className="text-white/50 text-sm">Campeon semanal</p>
          )}
        </div>
      </div>

      {/* FLASH FAME CARDS - Clan Semanal, Clan Mensual, Pareja */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {/* Clan Semanal */}
        <button data-testid="nav-clanes-btn" onClick={() => onNavigate('clanes')}
          className="relative bg-gradient-to-b from-blue-600/90 to-blue-800/90 rounded-2xl p-3 text-center overflow-hidden hover:scale-105 transition-transform">
          <div className="absolute inset-0 opacity-30" style={{background: 'radial-gradient(circle at 50% 100%, #3b82f6 0%, transparent 60%)'}} />
          <div className="relative">
            <div className="text-2xl mb-1">⚔️</div>
            <h4 className="font-bold text-white text-xs mb-1">Clan Semanal</h4>
            {flashFame.clan_semanal ? (
              <div className="bg-white/10 rounded-lg px-2 py-1">
                <span className="text-cyan-300 font-bold text-[10px]">{flashFame.clan_semanal.name}</span>
              </div>
            ) : (
              <span className="text-white/40 text-[10px]">Sin datos</span>
            )}
          </div>
        </button>

        {/* Pareja CP */}
        <button data-testid="nav-parejas-btn" onClick={() => onNavigate('parejas')}
          className="relative bg-gradient-to-b from-pink-600/90 to-rose-800/90 rounded-2xl p-3 text-center overflow-hidden hover:scale-105 transition-transform">
          <div className="absolute inset-0 opacity-30" style={{background: 'radial-gradient(circle at 50% 100%, #ec4899 0%, transparent 60%)'}} />
          <div className="relative">
            <div className="text-2xl mb-1">💖</div>
            <h4 className="font-bold text-white text-xs mb-1">Pareja #1</h4>
            {flashFame.pareja ? (
              <div className="bg-white/10 rounded-lg px-2 py-1">
                <span className="text-pink-300 font-bold text-[10px]">{flashFame.pareja.user1_name} & {flashFame.pareja.user2_name}</span>
              </div>
            ) : (
              <span className="text-white/40 text-[10px]">Sin datos</span>
            )}
          </div>
        </button>

        {/* Clan Mensual */}
        <button onClick={() => onNavigate('clanes')}
          className="relative bg-gradient-to-b from-yellow-600/90 to-amber-800/90 rounded-2xl p-3 text-center overflow-hidden hover:scale-105 transition-transform">
          <div className="absolute inset-0 opacity-30" style={{background: 'radial-gradient(circle at 50% 100%, #f59e0b 0%, transparent 60%)'}} />
          <div className="relative">
            <div className="text-2xl mb-1">🏰</div>
            <h4 className="font-bold text-white text-xs mb-1">Clan Mensual</h4>
            {flashFame.clan_mensual ? (
              <div className="bg-white/10 rounded-lg px-2 py-1">
                <span className="text-yellow-300 font-bold text-[10px]">{flashFame.clan_mensual.name}</span>
              </div>
            ) : (
              <span className="text-white/40 text-[10px]">Sin datos</span>
            )}
          </div>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-6 mb-4 border-b border-gray-200">
        <button onClick={() => setSubTab('popular')}
          className={`pb-2 font-bold transition-all ${subTab === 'popular' ? 'text-gray-800 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
          Popular
        </button>
        <button onClick={() => setSubTab('nuevo')}
          className={`pb-2 font-bold transition-all ${subTab === 'nuevo' ? 'text-gray-800 border-b-2 border-cyan-400' : 'text-gray-400'}`}>
          Nuevo
        </button>
      </div>

      {/* User Feed */}
      <div className="space-y-3">
        {users.map((u, i) => (
          <div key={u.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <img src={u.avatar} alt={u.username} className="w-14 h-14 rounded-full border-2 border-blue-200 object-cover" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800">{u.username}</span>
                  {i === 0 && <span className="bg-yellow-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">👑 TOP 1</span>}
                  {i === 1 && <span className="bg-gray-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🥈 TOP 2</span>}
                  {i === 2 && <span className="bg-orange-400 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">🥉 TOP 3</span>}
                </div>
                <div className="flex gap-1 text-xs">
                  <span>Lv.{u.level || 1}</span>
                  {u.clan_name && <span className="text-blue-500">| {u.clan_name}</span>}
                  {u.cp_partner && <span className="text-pink-500">| 💖 {u.cp_partner}</span>}
                </div>
              </div>
              <div className="text-blue-500 font-bold text-sm">{(u.coins || 0).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <div className="text-5xl mb-3">👥</div>
            <p>No hay usuarios todavia</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDescubrir = () => (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => onNavigate('reels')}
          className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-6 text-center hover:scale-105 transition-all">
          <div className="text-5xl mb-2">🎬</div>
          <h3 className="text-white font-bold text-lg">Reels</h3>
          <p className="text-white/80 text-sm">Videos cortos</p>
        </button>
        <button onClick={() => onNavigate('photos')}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-center hover:scale-105 transition-all">
          <div className="text-5xl mb-2">📸</div>
          <h3 className="text-white font-bold text-lg">Fotos</h3>
          <p className="text-white/80 text-sm">Galeria</p>
        </button>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-3">Tendencias</h3>
      <div className="text-center py-8 text-gray-400">
        <div className="text-5xl mb-3">🔍</div>
        <p>Descubre contenido nuevo</p>
      </div>
    </div>
  );

  const renderEvent = () => (
    <div className="p-4 text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">Eventos</h3>
      <p className="text-gray-500">Proximamente eventos especiales</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Status Bar */}
      <div className="bg-blue-50 px-4 py-2 flex items-center justify-between">
        <span className="text-gray-600 text-sm font-medium">☔ Lluvia Live</span>
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 font-bold text-xs">💰 {(user.coins || 0).toLocaleString()}</span>
          <span className="text-cyan-500 font-bold text-xs">💎 {(user.diamonds || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Top Tabs */}
      <div className="bg-white/80 backdrop-blur px-4 pt-2">
        <div className="flex items-center gap-1">
          {[
            { id: 'mio', label: 'Mio' },
            { id: 'popular', label: 'Popular' },
            { id: 'descubrir', label: 'Descubrir' },
            { id: 'event', label: 'Event' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-center font-medium transition-all relative ${activeTab === tab.id ? 'text-gray-800' : 'text-gray-400'}`}>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-cyan-400 rounded-full" />}
            </button>
          ))}
          <button data-testid="nav-notifications-btn" onClick={() => onNavigate('notifications')} className="p-2 text-gray-500 text-xl relative">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{unreadCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24">
        {activeTab === 'mio' && renderMio()}
        {activeTab === 'popular' && renderPopular()}
        {activeTab === 'descubrir' && renderDescubrir()}
        {activeTab === 'event' && renderEvent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          <button data-testid="nav-abrir-sala-bottom" onClick={createRoom} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white text-lg font-bold">+</span>
            </div>
            <span className="text-xs text-cyan-500 font-bold">Abrir Sala</span>
          </button>

          <button onClick={() => onNavigate('games')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <span className="text-xs text-gray-500">Juegos</span>
          </button>

          <button onClick={() => onNavigate('reels')} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎬</span>
            </div>
            <span className="text-xs text-gray-500">Momento</span>
          </button>

          <button onClick={() => onNavigate('photos')} className="flex flex-col items-center gap-1 relative">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📸</span>
            </div>
            <span className="text-xs text-gray-500">Fotos</span>
          </button>

          <button onClick={() => onNavigate('profile')} className="flex flex-col items-center gap-1">
            <img src={user.avatar} alt="yo" className="w-12 h-12 rounded-full border-2 border-gray-200 object-cover" />
            <span className="text-xs text-gray-500">yo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
