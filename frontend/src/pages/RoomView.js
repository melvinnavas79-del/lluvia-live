import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoomView = ({ roomId, onBack }) => {
  const { user } = useUser();
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(null);

  useEffect(() => {
    loadRoom();
    const interval = setInterval(loadRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}`);
      setRoom(res.data);
      
      const seat = res.data.seats.findIndex(s => s && s.user_id === user.id);
      setMySeat(seat >= 0 ? seat : null);
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  const joinSeat = async (index) => {
    try {
      await axios.post(`${API}/rooms/${roomId}/join`, null, {
        params: { user_id: user.id, seat_index: index }
      });
      loadRoom();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al sentarse');
    }
  };

  const leaveSeat = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, null, {
        params: { user_id: user.id }
      });
      setMySeat(null);
      loadRoom();
    } catch (err) {
      alert('Error al levantarse');
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando sala...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-purple-800/30 border-2 border-pink-500/30 rounded-2xl p-4">
          <button
            onClick={onBack}
            className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2"
          >
            <span>←</span> Volver
          </button>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-pink-400 mb-1">🎤 {room.name}</h2>
            <p className="text-gray-300">Bienvenidos a Lluvia Live</p>
          </div>
          <div className="text-right">
            <div className="text-pink-400 font-bold">{room.active_users} en línea</div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-pink-500/30 rounded-3xl p-8">
          <h3 className="text-2xl font-bold text-pink-400 mb-6 text-center flex items-center justify-center gap-2">
            <span>🪑</span> Asientos
          </h3>

          <div className="relative">
            <div className="grid grid-cols-3 gap-6 mb-8">
              {room.seats.map((seat, index) => (
                <div key={index} className="flex justify-center">
                  <button
                    onClick={() => seat ? (seat.user_id === user.id ? leaveSeat() : null) : joinSeat(index)}
                    disabled={seat && seat.user_id !== user.id}
                    className={`relative w-32 h-40 rounded-2xl border-4 transition-all ${
                      seat
                        ? seat.user_id === user.id
                          ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400 hover:border-green-300'
                          : 'bg-gradient-to-br from-pink-500/30 to-purple-500/30 border-pink-400'
                        : 'bg-gradient-to-br from-purple-700/20 to-blue-700/20 border-purple-500/40 hover:border-pink-500/60 cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center h-full p-2">
                      {seat ? (
                        <>
                          <img
                            src={seat.avatar}
                            alt={seat.username}
                            className="w-16 h-16 rounded-full mb-2 border-2 border-white/50"
                          />
                          <span className="text-white font-medium text-sm text-center">{seat.username}</span>
                          <span className="text-yellow-400 text-xs mt-1">Nivel {seat.level}</span>
                          
                          {seat.user_id === user.id && (
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              🎤
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-4xl mb-2">🪑</div>
                          <span className="text-gray-400 text-xs">Asiento {index + 1}</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-pink-500/30 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">☔</div>
                  <div className="text-white text-xs font-bold">Lluvia Live</div>
                </div>
              </div>
            </div>
          </div>

          {mySeat !== null && (
            <div className="mt-8 text-center">
              <button
                onClick={leaveSeat}
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-colors"
              >
                🚫 Levantarse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomView;
