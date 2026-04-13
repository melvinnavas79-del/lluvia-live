import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useUser } from '../contexts/UserContext';
import { EntryAnimation, ProfileFrame } from '../components/Animations';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RoomView = ({ roomId, onBack }) => {
  const { user } = useUser();
  const [room, setRoom] = useState(null);
  const [mySeat, setMySeat] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [audioStatus, setAudioStatus] = useState('off');
  const [entryAnim, setEntryAnim] = useState(null);

  const clientRef = useRef(null);
  const localTrackRef = useRef(null);
  const autoMuteTimer = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadRoom();
    loadChat();
    const r = setInterval(loadRoom, 3000);
    const c = setInterval(loadChat, 2000);
    return () => { clearInterval(r); clearInterval(c); leaveAgora(); };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadRoom = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}`);
      setRoom(res.data);
      const s = res.data.seats.findIndex(s => s && s.user_id === user.id);
      setMySeat(s >= 0 ? s : null);
    } catch (err) { console.error(err); }
  };

  const loadChat = async () => {
    try {
      const res = await axios.get(`${API}/rooms/${roomId}/chat?limit=30`);
      setChatMessages(res.data);
    } catch (err) { console.error(err); }
  };

  const joinAgora = async () => {
    try {
      setAudioStatus('connecting');
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

      await client.join(app_id, `room_${roomId}`, token, uid);

      const localTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localTrackRef.current = localTrack;
      await client.publish([localTrack]);

      setAudioStatus('on');
      setIsMuted(false);

      // Welcome + Entry animation
      await axios.post(`${API}/rooms/${roomId}/welcome?user_id=${user.id}`);
      loadChat();
      try {
        const animRes = await axios.get(`${API}/users/${user.id}/entry-animation`);
        if (animRes.data.special) setEntryAnim({ animation: animRes.data.animation, username: user.username });
      } catch (e) {}

      startAutoMuteTimer();
    } catch (err) {
      console.error('Agora error:', err);
      setAudioStatus('error');
    }
  };

  const leaveAgora = async () => {
    try {
      localTrackRef.current?.close();
      localTrackRef.current = null;
      await clientRef.current?.leave();
      clientRef.current = null;
      setAudioStatus('off');
      clearTimeout(autoMuteTimer.current);
    } catch (e) {}
  };

  const toggleMute = () => {
    if (localTrackRef.current) {
      const newMuted = !isMuted;
      localTrackRef.current.setEnabled(!newMuted);
      setIsMuted(newMuted);
      if (newMuted) startAutoMuteTimer();
      else clearTimeout(autoMuteTimer.current);
    }
  };

  const toggleDeafen = () => {
    const remoteUsers = clientRef.current?.remoteUsers || [];
    remoteUsers.forEach(u => {
      if (u.audioTrack) { isDeafened ? u.audioTrack.play() : u.audioTrack.stop(); }
    });
    setIsDeafened(!isDeafened);
  };

  const startAutoMuteTimer = () => {
    clearTimeout(autoMuteTimer.current);
    autoMuteTimer.current = setTimeout(() => { if (mySeat !== null) leaveSeat(); }, 5 * 60 * 1000);
  };

  const joinSeat = async (index) => {
    try {
      await axios.post(`${API}/rooms/${roomId}/join`, null, { params: { user_id: user.id, seat_index: index } });
      await joinAgora();
      loadRoom();
    } catch (err) { alert(err.response?.data?.detail || 'Error'); }
  };

  const leaveSeat = async () => {
    try {
      await axios.post(`${API}/rooms/${roomId}/leave`, null, { params: { user_id: user.id } });
      await leaveAgora();
      setMySeat(null);
      loadRoom();
    } catch (err) {}
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await axios.post(`${API}/rooms/${roomId}/chat`, { user_id: user.id, text: chatInput });
      setChatInput('');
      loadChat();
    } catch (err) {}
  };

  if (!room) return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 pb-28">
      {entryAnim && <EntryAnimation animation={entryAnim.animation} username={entryAnim.username} onComplete={() => setEntryAnim(null)} />}

      {/* Header */}
      <div className="p-3">
        <div className="flex items-center justify-between bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-3">
          <button data-testid="room-back-btn" onClick={() => { leaveAgora(); onBack(); }} className="bg-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold">← Volver</button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white">🎤 {room.name}</h2>
            <p className="text-white/50 text-xs">Lluvia Live</p>
          </div>
          <div className="text-xs text-right">
            <div className={audioStatus === 'on' ? 'text-green-400' : audioStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>
              {audioStatus === 'on' ? '🟢 Audio ON' : audioStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Audio OFF'}
            </div>
            <div className="text-white/50">{room.active_users} online</div>
          </div>
        </div>
      </div>

      {/* Seats */}
      <div className="px-3 mb-2">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-3">
          <div className="grid grid-cols-3 gap-2">
            {room.seats.map((seat, index) => (
              <div key={index} className="flex justify-center">
                <button
                  data-testid={`seat-btn-${index}`}
                  onClick={() => seat ? (seat.user_id === user.id ? leaveSeat() : null) : joinSeat(index)}
                  disabled={seat && seat.user_id !== user.id}
                  className={`relative w-full h-28 rounded-xl border-2 transition-all ${
                    seat
                      ? seat.user_id === user.id
                        ? 'bg-green-500/20 border-green-400'
                        : 'bg-pink-500/20 border-pink-400'
                      : 'bg-white/5 border-white/20 hover:border-pink-400'
                  }`}>
                  <div className="flex flex-col items-center justify-center h-full">
                    {seat ? (
                      <>
                        <ProfileFrame aristocracy={seat.aristocracy || 0}>
                          <img src={seat.avatar} alt="" className="w-11 h-11 rounded-full" />
                        </ProfileFrame>
                        <span className="text-white text-xs font-medium mt-1 truncate w-full text-center px-1">{seat.username}</span>
                        {seat.user_id === user.id && (
                          <div className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${isMuted ? 'bg-red-500' : 'bg-green-500'}`}>
                            {isMuted ? '🔇' : '🎤'}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-2xl">🪑</div>
                        <span className="text-white/30 text-xs">{index + 1}</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="px-3 pb-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-3">
          <h4 className="text-white/70 font-bold text-xs mb-2">💬 Chat</h4>
          <div className="h-36 overflow-y-auto mb-2 space-y-1">
            {chatMessages.map(msg => (
              <div key={msg.id} className={msg.type === 'welcome' ? 'text-center' : 'flex items-start gap-1'}>
                {msg.type === 'welcome' ? (
                  <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">{msg.text}</span>
                ) : msg.type === 'gift' ? (
                  <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-0.5 rounded-full">{msg.text}</span>
                ) : (
                  <>
                    <img src={msg.avatar} alt="" className="w-5 h-5 rounded-full mt-0.5" />
                    <div><span className="text-pink-400 text-xs font-bold">{msg.username}:</span> <span className="text-white/70 text-xs">{msg.text}</span></div>
                  </>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Mensaje..."
              data-testid="chat-input"
              className="flex-1 bg-white/10 text-white placeholder-white/30 border border-white/20 rounded-full px-3 py-2 text-xs outline-none" />
            <button data-testid="chat-send-btn" onClick={sendChat} className="bg-pink-500 text-white px-3 py-2 rounded-full text-xs font-bold">Enviar</button>
          </div>
        </div>
      </div>

      {/* AUDIO CONTROLS - FIXED AT BOTTOM */}
      {mySeat !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-3 pt-2" style={{background: 'linear-gradient(transparent, rgba(0,0,0,0.8) 30%)'}}>
          <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-3 flex items-center justify-center gap-4 border border-white/10 shadow-2xl">
            <button data-testid="toggle-mute-btn" onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform ${
                isMuted ? 'bg-red-500 shadow-red-500/40' : 'bg-green-500 shadow-green-500/40'
              }`}>
              {isMuted ? '🔇' : '🎤'}
            </button>
            <button data-testid="toggle-deafen-btn" onClick={toggleDeafen}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg active:scale-95 transition-transform ${
                isDeafened ? 'bg-orange-500 shadow-orange-500/40' : 'bg-blue-500 shadow-blue-500/40'
              }`}>
              {isDeafened ? '🔕' : '🔊'}
            </button>
            <button data-testid="leave-seat-btn" onClick={leaveSeat}
              className="w-14 h-14 rounded-full bg-red-600 shadow-lg shadow-red-600/40 flex items-center justify-center text-2xl active:scale-95 transition-transform">
              🚪
            </button>
            <div className="text-white/60 text-xs text-center ml-2">
              <div>{isMuted ? 'Mute' : 'Mic ON'}</div>
              <div>{isDeafened ? 'Sala mute' : 'Escuchando'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomView;
