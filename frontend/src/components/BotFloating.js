import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BotFloating = ({ userId, userRole }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  // Only show for dueño
  if (userRole !== 'dueño') return null;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/bot/command`, { admin_id: userId, message: msg });
      const botReply = res.data.response || 'Sin respuesta';
      const action = res.data.action_result;
      setMessages(prev => [...prev, { role: 'bot', text: botReply, action }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error al conectar con el Bot' }]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button data-testid="bot-floating-btn" onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-xl shadow-purple-500/30 flex items-center justify-center text-2xl active:scale-90 transition-transform border-2 border-white/20">
          🤖
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-16 right-3 left-3 z-50 max-w-md ml-auto" style={{maxHeight: '70vh'}}>
          <div className="bg-gray-900 rounded-2xl border border-purple-500/30 shadow-2xl flex flex-col" style={{height: '400px'}}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <div className="text-white font-bold text-sm">Bot Lluvia Live</div>
                  <div className="text-green-400 text-[10px]">Privado - Solo tu</div>
                </div>
              </div>
              <button data-testid="bot-close-btn" onClick={() => setOpen(false)} className="text-white/50 hover:text-white text-lg">✕</button>
            </div>

            {/* Messages */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.length === 0 && (
                <div className="text-center text-white/30 py-8">
                  <div className="text-3xl mb-2">🤖</div>
                  <p className="text-xs">Preguntame lo que quieras</p>
                  <div className="flex flex-wrap gap-1 mt-3 justify-center">
                    {['¿Cuántos usuarios hay?', '¿Quién es el más rico?', 'Regala 1M a todos'].map(q => (
                      <button key={q} onClick={() => { setInput(q); }} className="bg-white/10 text-white/60 text-[10px] px-2 py-1 rounded-full hover:bg-white/20">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-white/90'
                  }`}>
                    {m.text}
                    {m.action && <div className="mt-1 bg-green-500/20 text-green-400 text-[10px] px-2 py-1 rounded-lg">✅ {m.action}</div>}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-2xl px-3 py-2 text-xs text-white/50">Pensando...</div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-700 flex-shrink-0">
              <div className="flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Habla con el Bot..."
                  data-testid="bot-input"
                  className="flex-1 bg-gray-800 text-white placeholder-white/30 border border-gray-700 rounded-full px-3 py-2 text-xs outline-none focus:border-purple-500" />
                <button data-testid="bot-send-btn" onClick={sendMessage} disabled={loading}
                  className="bg-purple-600 text-white px-3 py-2 rounded-full text-xs font-bold disabled:opacity-50">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BotFloating;
