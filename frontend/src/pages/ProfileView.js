import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ProfileView = ({ onBack, onNavigate }) => {
  const { user, logout, updateUser } = useUser();
  const [ghostMode, setGhostMode] = useState(user?.ghost_mode || false);

  const toggleGhostMode = async () => {
    try {
      const res = await axios.post(`${API}/users/${user.id}/ghost-mode`);
      if (res.data.success) {
        setGhostMode(res.data.ghost_mode);
        updateUser({ ghost_mode: res.data.ghost_mode });
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Solo el admin puede usar Modo Fantasma');
    }
  };

  const memberDate = user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : '11/4/2026';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 pt-8 pb-16 px-4 relative">
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          ← Volver
        </button>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-28 h-28 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Username */}
        <h2 className="text-3xl font-bold text-white text-center mb-3">{user.username}</h2>

        {/* Badges Row */}
        <div className="flex flex-wrap justify-center gap-2 mb-3">
          <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-bold">
            ARISTOCRAT {user.aristocracy || 9}
          </span>
          <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            👑👑👑 Aristocrat IX
          </span>
          <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            Verificado
          </span>
          <span className="bg-yellow-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            👑 Fundador
          </span>
          {user.is_admin && (
            <span className="bg-yellow-600 text-white text-xs px-3 py-1 rounded-full font-bold">
              ⭐ Admin
            </span>
          )}
          <span className="bg-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            👑 VIP
          </span>
          <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
            💎 Aristocrat IX
          </span>
        </div>

        {/* Member Since */}
        <p className="text-white/80 text-center text-sm">Miembro desde {memberDate}</p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 -mt-8">
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Nivel */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-1">⭐</div>
            <div className="text-gray-500 text-sm">Nivel</div>
            <div className="text-2xl font-bold text-gray-800">{user.level || 99}</div>
          </div>

          {/* Monedas */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-1">💰</div>
            <div className="text-gray-500 text-sm">Monedas</div>
            <div className="text-2xl font-bold text-gray-800">{(user.coins || 0).toLocaleString()}</div>
          </div>

          {/* Diamantes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-1">💎</div>
            <div className="text-gray-500 text-sm">Diamantes</div>
            <div className="text-2xl font-bold text-gray-800">{(user.diamonds || 0).toLocaleString()}</div>
          </div>

          {/* Total Gastado */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-1">💸</div>
            <div className="text-gray-500 text-sm">Total Gastado</div>
            <div className="text-2xl font-bold text-gray-800">{(user.total_spent || 0).toLocaleString()}</div>
          </div>

          {/* Total Recibido */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-1">🎁</div>
            <div className="text-gray-500 text-sm">Total Recibido</div>
            <div className="text-2xl font-bold text-gray-800">{(user.total_received || 0).toLocaleString()}</div>
          </div>
        </div>

        {/* Configuracion */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Configuracion</h3>
          
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-700 font-medium">Modo Fantasma</span>
            <button
              onClick={toggleGhostMode}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold ${
                ghostMode
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {ghostMode ? 'Activado' : 'Desactivado'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-700 font-medium">Rol Especial</span>
            <span className="bg-pink-100 text-pink-600 px-4 py-1.5 rounded-lg text-sm font-bold">
              👑 {user.role === 'dueño' ? 'Dueño' : user.role === 'admin' ? 'Admin' : user.role === 'moderador' ? 'Moderador' : user.role === 'supervisor' ? 'Supervisor' : 'Usuario'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
        {(user.is_admin || user.role === 'dueño' || user.role === 'admin' || user.role === 'moderador' || user.role === 'supervisor') && (
            <button
              onClick={() => onNavigate('admin')}
              className="col-span-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white py-3 rounded-2xl font-bold text-center"
            >
              👑 Panel de Administración
            </button>
          )}

          <button className="bg-white border-2 border-cyan-400 text-cyan-500 py-3 rounded-2xl font-bold">
            Editar Perfil
          </button>

          <button
            onClick={() => {
              logout();
              onBack();
            }}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 rounded-2xl font-bold"
          >
            Cerrar Sesion
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
