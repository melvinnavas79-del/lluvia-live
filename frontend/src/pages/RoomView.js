import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoomView = ({ roomId, onBack }) => {
  const { user, updateUser } = useUser();
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    loadRoom();
    const interval = setInterval(loadRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    // Check for Bebé Robot prize
    if (user.coins >= 70000000) {
      const lastPrize = user.last_baby_robot_prize || 0;
      if (user.coins - lastPrize >= 70000000) {
        showBabyRobotPrize();
      }
    }
  }, [user.coins]);

  const showBabyRobotPrize = async () => {
    try {
      const res = await axios.put(`${API}/users/${user.id}`, {});
      if (res.data.baby_robot_awarded) {
        alert('🤖 ¡BEBÉ ROBOT! 🎉\n¡Has ganado 15,000,000 monedas!');
        updateUser(res.data);
        playSound('prize');
      }
    } catch (err) {
      console.error('Error checking prize:', err);
    }
  };

  const playSound = (type) => {
    try {
      const audio = new Audio();
      if (type === 'join') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAo=';
      } else if (type === 'leave') {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAo=';
      } else {
        audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjaP1fPFdigFJHfH8N2QQAo=';
      }
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  const loadRoom = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}`);
      setRoom(res.data);
      
      const seat = res.data.seats.findIndex(s => s && s.user_id === user.id);
      setMySeat(seat >= 0 ? seat : null);
      if (seat >= 0 && res.data.seats[seat]) {
        setIsMuted(res.data.seats[seat].is_muted || false);
      }
    } catch (err) {
      console.error('Error loading room:', err);
    }
  };

  const joinSeat = async (index) => {
    try {
      await axios.post(`${API}/rooms/${roomId}/join`, null, {
        params: { user_id: user.id, seat_index: index }
      });
      playSound('join');
      loadRoom();
      requestMicrophoneAccess();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al sentarse');
    }
  };

  const leaveSeat = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, null, {
        params: { user_id: user.id }
      });
      playSound('leave');
      setMySeat(null);
      setAudioEnabled(false);
      stopAudio();
      loadRoom();
    } catch (err) {
      alert('Error al levantarse');
    }
  };

  const toggleMute = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/toggle-mute`, null, {
        params: { user_id: user.id }
      });
      setIsMuted(!isMuted);
      playSound('click');
      loadRoom();
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current = stream;
      setAudioEnabled(true);
      playSound('join');
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('⚠️ Necesitamos acceso al micrófono para el audio en vivo');
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.getTracks().forEach(track => track.stop());
      audioRef.current = null;
    }
  };

  if (!room) {
    return (
      <div className=\"min-h-screen bg-gradient-to-b from-purple-900 to-blue-900 flex items-center justify-center\">
        <div className=\"text-white text-xl\">Cargando sala...</div>
      </div>
    );
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 p-4\">
      <div className=\"max-w-4xl mx-auto mb-6\">
        <div className=\"flex items-center justify-between bg-purple-800/30 border-2 border-pink-500/30 rounded-2xl p-4\">
          <button
            onClick={onBack}
            className=\"bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full font-medium transition-colors flex items-center gap-2\"
            data-testid=\"back-button\"
          >
            <span>←</span> Volver
          </button>
          <div className=\"text-center\">
            <h2 className=\"text-2xl font-bold text-pink-400 mb-1\">🎤 {room.name}</h2>
            <p className=\"text-gray-300\">Bienvenidos a Lluvia Live</p>
          </div>
          <div className=\"text-right\">
            <div className=\"text-pink-400 font-bold\">{room.active_users} en línea {audioEnabled && '🎤'}</div>
          </div>
        </div>
      </div>

      <div className=\"max-w-4xl mx-auto\">
        <div className=\"bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-2 border-pink-500/30 rounded-3xl p-8\">
          <h3 className=\"text-2xl font-bold text-pink-400 mb-6 text-center flex items-center justify-center gap-2\">
            <span>🪑</span> Asientos
          </h3>

          <div className=\"relative\">
            <div className=\"grid grid-cols-3 gap-6 mb-8\">
              {room.seats.map((seat, index) => (
                <div key={index} className=\"flex justify-center\">
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
                    data-testid={`seat-${index}`}
                  >
                    <div className=\"flex flex-col items-center justify-center h-full p-2\">
                      {seat ? (
                        <>
                          <img
                            src={seat.avatar}
                            alt={seat.username}
                            className=\"w-16 h-16 rounded-full mb-2 border-2 border-white/50\"
                          />
                          <span className=\"text-white font-medium text-sm text-center\">{seat.username}</span>
                          <span className=\"text-yellow-400 text-xs mt-1\">Nivel {seat.level}</span>
                          
                          {seat.user_id === user.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMute();
                              }}
                              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                              }`}
                              data-testid=\"mute-button\"
                            >
                              {isMuted ? '🔇' : '🎤'}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className=\"text-4xl mb-2\">🪑</div>
                          <span className=\"text-gray-400 text-xs\">Asiento {index + 1}</span>
                        </>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>

            <div className=\"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none\">
              <div className=\"w-32 h-32 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-pink-500/30 flex items-center justify-center\">
                <div className=\"text-center\">
                  <div className=\"text-4xl mb-2\">☔</div>
                  <div className=\"text-white text-xs font-bold\">Lluvia Live</div>
                </div>
              </div>
            </div>
          </div>

          {mySeat !== null && (
            <div className=\"mt-8 text-center space-y-3\">
              <div className=\"bg-black/30 rounded-2xl p-4\">
                <div className=\"text-white text-sm mb-2\">
                  {audioEnabled ? (
                    <>🎤 Micrófono {isMuted ? 'silenciado' : 'activo'}</>
                  ) : (
                    <>⚠️ Micrófono desactivado</>
                  )}
                </div>
              </div>
              <button
                onClick={leaveSeat}
                className=\"bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold transition-colors\"
                data-testid=\"leave-seat-button\"
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
