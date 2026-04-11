import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isRegister ? '/register' : '/login';
      const res = await axios.post(`${API}${endpoint}`, { username, password });
      
      if (res.data.success) {
        login(res.data.user);
        onLogin();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al conectar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-7xl">☂️</div>
            <div className="text-7xl">💧</div>
          </div>
          <h1 className="text-6xl font-bold text-pink-500 mb-3">Lluvia Live</h1>
          <p className="text-gray-300 text-xl">Conecta, Chatea, Vive</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-transparent border-4 border-pink-500 rounded-full px-6 py-4">
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-lg"
              required
            />
          </div>

          {isRegister && (
            <div className="bg-transparent border-4 border-pink-500 rounded-full px-6 py-4">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                required
              />
            </div>
          )}

          {!isRegister && (
            <div className="bg-transparent border-4 border-pink-500 rounded-full px-6 py-4">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-white placeholder-gray-400 outline-none text-lg"
                required
              />
            </div>
          )}

          {error && (
            <div className="text-red-400 text-center text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-4 rounded-full text-xl font-bold hover:from-pink-600 hover:to-pink-700 transition-all"
          >
            🚀 {isRegister ? 'Registrarse' : 'Ingresar'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              {isRegister ? '¿Ya tienes cuenta? Ingresa' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </form>

        <div className="text-center mt-8 text-gray-400">
          ✨ ¡Bienvenido a Lluvia Live! ✨
        </div>
      </div>
    </div>
  );
};

export default LoginPage;