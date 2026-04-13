import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useUser } from '../contexts/UserContext';
import { EntryAnimation, ProfileFrame, MicRing } from '../components/Animations';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoomView = ({ roomId, onBack }) => {
  const { user } = useUser();
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [agoraJoined, setAgoraJoined] = useState(false);
  const [entryAnim, setEntryAnim] = useState(null);

  const clientRef = useRef(null);
  const localTrackRef = useRef(null);
  const autoMuteTimer = useRef(null);

  useEffect(() => {
    loadRoom();
    loadChat();
    const roomInterval = setInterval(loadRoom, 3000);
    const chatInterval = setInterval(loadChat, 2000);
    return () => {
      clearInterval(roomInterval);
      clearInterval(chatInterval);
      leaveAgora();
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

  const loadChat = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}/chat?limit=30`);
      setChatMessages(res.data);
    } catch (err) { console.error(err); }
  };

  // ========== AGORA AUDIO ==========
  const joinAgora = async () => {
    try {
      const tokenRes = await axios.post(`${API}/agora/token?channel_name=room_${roomId}&user_id=${user.id}`);
      const { token, uid, app_id } = tokenRes.data;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published', async (remoteUser, mediaType) => {
        if (mediaType === 'audio') {
          await client.subscribe(remoteUser, 'audio');
          remoteUser.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (remoteUser, mediaType) => {
        if (mediaType === 'audio') remoteUser.audioTrack?.stop();
      });

      await client.join(app_id, `room_${roomId}`, token, uid);

      const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = localTrack;
      await client.publish([localTrack]);

      setAgoraJoined(true);
      startAutoMuteTimer();

      // Send welcome
      await axios.post(`${API}/rooms/${roomId}/welcome?user_id=${user.id}`);
      loadChat();
      
      // Show entry animation
      try {
        const animRes = await axios.get(`${API}/users/${user.id}/entry-animation`);
        if (animRes.data.special) {
          setEntryAnim({ animation: animRes.data.animation, username: user.username });
        }
      } catch (e) { console.log(e); }
    } catch (err) {
      console.error('Agora join error:', err);
      alert('Error conectando audio. Verifica permisos del micrófono.');
    }
  };

  const leaveAgora = async () => {
    try {
      if (localTrackRef.current) {
        localTrackRef.current.close();
        localTrackRef.current = null;
      }
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current = null;
      }
      setAgoraJoined(false);
      clearTimeout(autoMuteTimer.current);
    } catch (err) { console.error(err); }
  };

  const toggleMute = () => {
    if (localTrackRef.current) {
      localTrackRef.current.setEnabled(isMuted);
      setIsMuted(!isMuted);
      if (!isMuted) {
        // Started mute - start auto-kick timer (5 min)
        startAutoMuteTimer();
      } else {
        // Unmuted - reset timer
        clearTimeout(autoMuteTimer.current);
        startAutoMuteTimer();
      }
    }
  };

  const toggleDeafen = () => {
    if (clientRef.current) {
      const remoteUsers = clientRef.current.remoteUsers || [];
      remoteUsers.forEach(u => {
        if (u.audioTrack) {
          if (!isDeafened) u.audioTrack.stop();
          else u.audioTrack.play();
        }
      });
    }
    setIsDeafened(!isDeafened);
  };

  const startAutoMuteTimer = () => {
    clearTimeout(autoMuteTimer.current);
    autoMuteTimer.current = setTimeout(() => {
      // Auto-kick after 5 min mute
      if (isMuted && mySeat !== null) {
        leaveSeat();
      }
    }, 5 * 60 * 1000);
  };

  // ========== SEATS ==========
  const joinSeat = async (index) => {
    try {
      await axios.post(`${API}/rooms/${roomId}/join`, null, {
        params: { user_id: user.id, seat_index: index }
      });
      await joinAgora();
      loadRoom();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const leaveSeat = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, null, {
        params: { user_id: user.id }
      });
      await leaveAgora();
      setMySeat(null);
      loadRoom();
    } catch (err) { alert('Error'); }
  };

  // ========== CHAT ==========
  const sendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await axios.post(`${API}/rooms/${roomId}/chat`, {
        user_id: user.id, text: chatInput
      });
      setChatInput('');
      loadChat();
    } catch (err) { console.error(err); }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando sala...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 p-4 pb-24">
      {/* Entry Animation */}
      {entryAnim && (
        <EntryAnimation
          animation={entryAnim.animation}
          username={entryAnim.username}
          onComplete={() => setEntryAnim(null)}
        />
      )}
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3">
          <button onClick={() => { leaveAgora(); onBack(); }}
            className="bg-pink-500 text-white px-5 py-2 rounded-full text-sm font-bold">
            ← Volver
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">🎤 {room.name}</h2>
            <p className="text-white/60 text-xs">Lluvia Live</p>
          </div>
          <div className="text-sm">
            <span className={`${agoraJoined ? 'text-green-400' : 'text-red-400'}`}>
              {agoraJoined ? '🟢 Audio ON' : '🔴 Audio OFF'}
            </span>
            <div className="text-white/60 text-xs">{room.active_users} en línea</div>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="max-w-4xl mx-auto mb-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
          <div className="grid grid-cols-3 gap-3">
            {room.seats.map((seat, index) => (
              <div key={index} className="flex justify-center">
                <button
                  onClick={() => seat ? (seat.user_id === user.id ? leaveSeat() : null) : joinSeat(index)}
                  disabled={seat && seat.user_id !== user.id}
                  className={`relative w-24 h-32 rounded-xl border-2 transition-all ${
                    seat
                      ? seat.user_id === user.id
                        ? 'bg-green-500/20 border-green-400'
                        : 'bg-pink-500/20 border-pink-400'
                      : 'bg-white/5 border-white/20 hover:border-pink-400 cursor-pointer'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center h-full p-1">
                    {seat ? (
                      <>
                        <ProfileFrame aristocracy={seat.aristocracy || 0}>
                          <img src={seat.avatar} alt="" className="w-12 h-12 rounded-full" />
                        </ProfileFrame>
                        <span className="text-white font-medium text-xs truncate w-full text-center">{seat.username}</span>
                        <span className="text-yellow-400 text-xs">Lv.{seat.level}</span>
                        {seat.user_id === user.id && (
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isMuted ? 'bg-red-500' : 'bg-green-500'
                          }`}>
                            {isMuted ? '🔇' : '🎤'}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-2xl mb-1">🪑</div>
                        <span className="text-white/40 text-xs">{index + 1}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Audio Controls */}
          {mySeat !== null && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <button onClick={toggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  isMuted ? 'bg-red-500' : 'bg-green-500'
                }`}>
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button onClick={toggleDeafen}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  isDeafened ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                {isDeafened ? '🔕' : '🔊'}
              </button>
              <button onClick={leaveSeat}
                className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-lg">
                🚫
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
          <h4 className="text-white/80 font-bold text-sm mb-2">💬 Chat</h4>
          <div className="h-48 overflow-y-auto mb-3 space-y-2">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex items-start gap-2 ${msg.type === 'welcome' ? 'justify-center' : ''}`}>
                {msg.type === 'welcome' ? (
                  <div className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-1 rounded-full">
                    {msg.text}
                  </div>
                ) : (
                  <>
                    <img src={msg.avatar} alt="" className="w-6 h-6 rounded-full" />
                    <div>
                      <span className="text-pink-400 text-xs font-bold">{msg.username}:</span>
                      <span className="text-white/80 text-xs ml-1">{msg.text}</span>
                    </div>
                  </>
                )}
              </div>
            ))}
            {chatMessages.length === 0 && (
              <div className="text-white/30 text-center text-xs py-4">No hay mensajes</div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button onClick={sendChat}
              className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomView;
