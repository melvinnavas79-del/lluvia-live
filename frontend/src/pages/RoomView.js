import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoomView = ({ roomId, onBack }) => {
  const { user } = useUser();
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    loadRoom();
    const interval = setInterval(loadRoom, 3000);
    return () => {
      clearInterval(interval);
      stopMic();
    };
  }, [roomId]);

  const loadRoom = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}`);
      setRoom(res.data);
      const seat = res.data.seats.findIndex(s => s && s.user_id === user.id);
      setMySeat(seat >= 0 ? seat : null);
    } catch (err) { console.error(err); }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicActive(true);
      setIsMuted(false);
    } catch (err) {
      alert('Necesitamos acceso al micrófono');
    }
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setMicActive(false);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted; });
    }
    setIsMuted(!isMuted);
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  const joinSeat = async (index) => {
    try {
      await axios.post(`${API}/rooms/${roomId}/join`, null, {
        params: { user_id: user.id, seat_index: index }
      });
      await startMic();
      loadRoom();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const leaveSeat = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, null, {
        params: { user_id: user.id }
      });
      stopMic();
      setMySeat(null);
      loadRoom();
    } catch (err) { alert('Error'); }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-xl">Cargando sala...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4">
          <button onClick={() => { stopMic(); onBack(); }}
            className="bg-pink-500 text-white px-5 py-2 rounded-full text-sm font-bold">
            ← Volver
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">🎤 {room.name}</h2>
            <p className="text-white/60 text-sm">Lluvia Live</p>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-sm">
              {micActive ? '🟢' : '🔴'} {room.active_users} en línea
            </div>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {room.seats.map((seat, index) => (
              <div key={index} className="flex justify-center">
                <button
                  onClick={() => seat ? (seat.user_id === user.id ? leaveSeat() : null) : joinSeat(index)}
                  disabled={seat && seat.user_id !== user.id}
                  className={`relative w-28 h-36 rounded-2xl border-3 transition-all ${
                    seat
                      ? seat.user_id === user.id
                        ? 'bg-green-500/20 border-green-400'
                        : 'bg-pink-500/20 border-pink-400'
                      : 'bg-white/5 border-white/20 hover:border-pink-400 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full p-2">
                    {seat ? (
                      <>
                        <img src={seat.avatar} alt="" className="w-14 h-14 rounded-full mb-1 border-2 border-white/50" />
                        <span className="text-white font-medium text-xs">{seat.username}</span>
                        <span className="text-yellow-400 text-xs">Lv.{seat.level}</span>
                        {seat.user_id === user.id && (
                          <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                            isMuted ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {isMuted ? '🔇' : '🎤'}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-3xl mb-1">🪑</div>
                        <span className="text-white/40 text-xs">Asiento {index + 1}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Center Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600/30 to-pink-600/30 border-2 border-pink-500/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl">☔</div>
                <div className="text-white text-xs font-bold">Lluvia</div>
              </div>
            </div>
          </div>

          {/* Audio Controls */}
          {mySeat !== null && (
            <div className="bg-black/30 rounded-2xl p-4">
              <div className="flex items-center justify-center gap-4">
                {/* Mic Toggle */}
                <button onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
                    isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}>
                  {isMuted ? '🔇' : '🎤'}
                </button>

                {/* Deafen (mute room) */}
                <button onClick={toggleDeafen}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition-all ${
                    isDeafened ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                  {isDeafened ? '🔕' : '🔊'}
                </button>

                {/* Leave */}
                <button onClick={leaveSeat}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-xl">
                  🚫
                </button>
              </div>

              <div className="text-center mt-3 text-white/60 text-sm">
                {isMuted ? '🔇 Micrófono silenciado' : '🎤 Micrófono activo'}
                {isDeafened && ' | 🔕 Sala silenciada'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomView;
