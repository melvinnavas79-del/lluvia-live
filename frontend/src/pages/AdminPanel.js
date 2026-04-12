import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPanel = ({ onBack }) => {
  const { user, updateUser } = useUser();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [isAdmin, setIsAdmin] = useState(user?.is_admin || false);
  const [adminKey, setAdminKey] = useState('');
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [usersRes, roomsRes] = await Promise.all([
        axios.get(`${API}/admin/users?admin_id=${user.id}`),
        axios.get(`${API}/rooms`)
      ]);
      setUsers(usersRes.data);
      setRooms(roomsRes.data);
    } catch (err) {
      console.error('Error loading admin data:', err);
    }
  };

  const activateAdmin = async () => {
    try {
      const res = await axios.post(`${API}/admin/set-admin?user_id=${user.id}&admin_key=${adminKey}`);
      updateUser(res.data);
      setIsAdmin(true);
      setAdminKey('');
    } catch (err) {
      alert(err.response?.data?.detail || 'Clave inválida');
    }
  };

  const updateUserData = async (userId, updates) => {
    try {
      await axios.put(`${API}/admin/users/${userId}?admin_id=${user.id}`, updates);
      loadData();
    } catch (err) {
      alert('Error actualizando usuario');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}?admin_id=${user.id}`);
      loadData();
    } catch (err) {
      alert('Error eliminando usuario');
    }
  };

  const deleteRoom = async (roomId) => {
    if (!window.confirm('¿Eliminar esta sala?')) return;
    try {
      await axios.delete(`${API}/admin/rooms/${roomId}?admin_id=${user.id}`);
      loadData();
    } catch (err) {
      alert('Error eliminando sala');
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 p-4">
        <div className="max-w-md mx-auto">
          <button onClick={onBack} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full mb-6">
            ← Volver
          </button>
          <div className="bg-purple-800/30 border-2 border-pink-500/30 rounded-3xl p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-4">Panel de Admin</h2>
            <p className="text-gray-300 mb-6">Ingresa la clave de administrador:</p>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Clave de admin"
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-full px-6 py-3 mb-4 outline-none focus:border-pink-500"
            />
            <button
              onClick={activateAdmin}
              className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-full font-bold hover:from-pink-600 hover:to-pink-700 transition-all"
            >
              🔓 Activar Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full">
            ← Volver
          </button>
          <h1 className="text-2xl font-bold text-pink-400">👑 Panel Admin</h1>
          <div className="text-yellow-400 font-bold">Admin: {user.username}</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 border-2 border-pink-500/30 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{users.length}</div>
            <div className="text-gray-300">Usuarios</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30 border-2 border-blue-500/30 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{rooms.length}</div>
            <div className="text-gray-300">Salas</div>
          </div>
          <div className="bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-500/30 rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-white">{users.reduce((a, u) => a + (u.coins || 0), 0).toLocaleString()}</div>
            <div className="text-gray-300">Total Monedas</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['users', 'rooms'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-full font-medium transition-all ${
                activeTab === tab ? 'bg-pink-500 text-white' : 'bg-purple-800/30 text-gray-300 hover:bg-purple-700/40'
              }`}
            >
              {tab === 'users' ? '👥 Usuarios' : '🏠 Salas'}
            </button>
          ))}
        </div>

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
              <div key={u.id} className="bg-purple-800/30 border-2 border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={u.avatar} alt={u.username} className="w-12 h-12 rounded-full" />
                  <div>
                    <div className="text-white font-bold">{u.username} {u.is_admin && '👑'}</div>
                    <div className="text-gray-400 text-sm">Nivel {u.level} | 💰 {u.coins?.toLocaleString()} | {u.vip_status}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateUserData(u.id, { coins: (u.coins || 0) + 10000 })}
                    className="bg-green-500/30 hover:bg-green-500/50 text-green-400 px-3 py-1 rounded-full text-sm"
                  >
                    +10K 💰
                  </button>
                  <button
                    onClick={() => updateUserData(u.id, { level: Math.min((u.level || 1) + 1, 9) })}
                    className="bg-blue-500/30 hover:bg-blue-500/50 text-blue-400 px-3 py-1 rounded-full text-sm"
                  >
                    +Nivel
                  </button>
                  {!u.is_admin && (
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="bg-red-500/30 hover:bg-red-500/50 text-red-400 px-3 py-1 rounded-full text-sm"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rooms */}
        {activeTab === 'rooms' && (
          <div className="space-y-3">
            {rooms.length === 0 && (
              <div className="text-center py-12 text-gray-400">No hay salas activas</div>
            )}
            {rooms.map(r => (
              <div key={r.id} className="bg-purple-800/30 border-2 border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">{r.name}</div>
                  <div className="text-gray-400 text-sm">Dueño: {r.owner_name} | {r.active_users} usuarios</div>
                </div>
                <button
                  onClick={() => deleteRoom(r.id)}
                  className="bg-red-500/30 hover:bg-red-500/50 text-red-400 px-3 py-1 rounded-full text-sm"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
