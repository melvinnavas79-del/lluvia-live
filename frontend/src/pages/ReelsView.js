import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReelsView = ({ onBack }) => {
  const { user } = useUser();
  const [reels, setReels] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadReels();
  }, []);

  const loadReels = async () => {
    try {
      const res = await axios.get(`${API}/reels`);
      setReels(res.data);
    } catch (err) {
      console.error('Error loading reels:', err);
    }
  };

  const createReel = async () => {
    if (!title.trim()) return alert('Escribe un título');
    try {
      await axios.post(`${API}/reels`, {
        user_id: user.id,
        title: title,
        description: description,
        video_url: ""
      });
      setTitle('');
      setDescription('');
      setShowCreate(false);
      loadReels();
    } catch (err) {
      alert('Error creando reel');
    }
  };

  const likeReel = async (reelId) => {
    try {
      await axios.post(`${API}/reels/${reelId}/like?user_id=${user.id}`);
      loadReels();
    } catch (err) {
      console.error('Error liking:', err);
    }
  };

  const colors = [
    'from-pink-500 to-rose-600',
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-yellow-500 to-orange-600',
    'from-red-500 to-pink-600',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full">
            ← Volver
          </button>
          <h2 className="text-2xl font-bold text-pink-400">🎬 Reels</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium"
          >
            + Crear
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-purple-800/30 border-2 border-pink-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4">🎬 Nuevo Reel</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del reel"
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-pink-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción..."
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-pink-500 h-24 resize-none"
            />
            <button
              onClick={createReel}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold"
            >
              🚀 Publicar Reel
            </button>
          </div>
        )}

        {/* Reels List */}
        <div className="space-y-4">
          {reels.map((reel, i) => (
            <div key={reel.id} className="bg-purple-800/20 border-2 border-purple-500/20 rounded-2xl overflow-hidden">
              {/* Video placeholder */}
              <div className={`bg-gradient-to-br ${colors[i % colors.length]} h-64 flex items-center justify-center relative`}>
                <div className="text-center">
                  <div className="text-7xl mb-3">🎬</div>
                  <div className="text-white text-xl font-bold">{reel.title}</div>
                </div>
                <div className="absolute bottom-3 right-3 flex gap-3">
                  <button
                    onClick={() => likeReel(reel.id)}
                    className="bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-1"
                  >
                    {reel.liked_by?.includes(user.id) ? '❤️' : '🤍'} {reel.likes || 0}
                  </button>
                  <div className="bg-black/40 text-white px-4 py-2 rounded-full">
                    💬 {reel.comments?.length || 0}
                  </div>
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <img src={reel.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <span className="text-white font-medium">{reel.username}</span>
                </div>
                {reel.description && (
                  <p className="text-gray-400 text-sm">{reel.description}</p>
                )}
              </div>
            </div>
          ))}

          {reels.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-6xl mb-4">🎬</div>
              <p>No hay reels todavía. ¡Crea el primero!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReelsView;
