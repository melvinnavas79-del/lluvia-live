import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/lluvia1/400/400',
  'https://picsum.photos/seed/lluvia2/400/400',
  'https://picsum.photos/seed/lluvia3/400/400',
  'https://picsum.photos/seed/lluvia4/400/400',
  'https://picsum.photos/seed/lluvia5/400/400',
  'https://picsum.photos/seed/lluvia6/400/400',
];

const PhotosView = ({ onBack }) => {
  const { user } = useUser();
  const [photos, setPhotos] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const res = await axios.get(`${API}/photos`);
      setPhotos(res.data);
    } catch (err) {
      console.error('Error loading photos:', err);
    }
  };

  const createPhoto = async () => {
    if (!title.trim()) return alert('Escribe un título');
    const url = imageUrl.trim() || SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
    try {
      await axios.post(`${API}/photos`, {
        user_id: user.id,
        title: title,
        image_url: url,
        description: description
      });
      setTitle('');
      setDescription('');
      setImageUrl('');
      setShowCreate(false);
      loadPhotos();
    } catch (err) {
      alert('Error subiendo foto');
    }
  };

  const likePhoto = async (photoId) => {
    try {
      await axios.post(`${API}/photos/${photoId}/like?user_id=${user.id}`);
      loadPhotos();
    } catch (err) {
      console.error('Error liking:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full">
            ← Volver
          </button>
          <h2 className="text-2xl font-bold text-pink-400">📸 Galería</h2>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-medium"
          >
            + Subir
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-purple-800/30 border-2 border-pink-500/30 rounded-2xl p-6 mb-6">
            <h3 className="text-white font-bold mb-4">📸 Nueva Foto</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la foto"
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-pink-500"
            />
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de la imagen (opcional)"
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-pink-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción..."
              className="w-full bg-purple-900/50 border-2 border-purple-500/40 text-white rounded-xl px-4 py-3 mb-3 outline-none focus:border-pink-500 h-20 resize-none"
            />
            <button
              onClick={createPhoto}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-xl font-bold"
            >
              📸 Publicar Foto
            </button>
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map(photo => (
            <div
              key={photo.id}
              className="bg-purple-800/20 border-2 border-purple-500/20 rounded-xl overflow-hidden cursor-pointer hover:border-pink-500/50 transition-all"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img
                src={photo.image_url}
                alt={photo.title}
                className="w-full h-48 object-cover"
                onError={(e) => { e.target.src = SAMPLE_IMAGES[0]; }}
              />
              <div className="p-3">
                <p className="text-white font-medium text-sm truncate">{photo.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <img src={photo.avatar} alt="" className="w-5 h-5 rounded-full" />
                    <span className="text-gray-400 text-xs">{photo.username}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); likePhoto(photo.id); }}
                    className="text-sm"
                  >
                    {photo.liked_by?.includes(user.id) ? '❤️' : '🤍'} {photo.likes || 0}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">📸</div>
            <p>No hay fotos todavía. ¡Sube la primera!</p>
          </div>
        )}

        {/* Photo Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-purple-900 border-2 border-pink-500 rounded-2xl max-w-lg w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.title}
                className="w-full h-80 object-cover"
                onError={(e) => { e.target.src = SAMPLE_IMAGES[0]; }}
              />
              <div className="p-6">
                <h3 className="text-white text-xl font-bold mb-2">{selectedPhoto.title}</h3>
                {selectedPhoto.description && (
                  <p className="text-gray-400 mb-4">{selectedPhoto.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={selectedPhoto.avatar} alt="" className="w-8 h-8 rounded-full" />
                    <span className="text-white">{selectedPhoto.username}</span>
                  </div>
                  <button
                    onClick={() => likePhoto(selectedPhoto.id)}
                    className="bg-pink-500/30 hover:bg-pink-500/50 text-white px-4 py-2 rounded-full"
                  >
                    {selectedPhoto.liked_by?.includes(user.id) ? '❤️' : '🤍'} {selectedPhoto.likes || 0}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotosView;
