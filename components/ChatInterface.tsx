
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, ServiceRequest, RequestStatus } from '../types';
import { db } from '../services/firebase';

interface ChatInterfaceProps {
  user: User;
  request: ServiceRequest;
  fullPage?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, request, fullPage = false }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const msgs = await db.messages.getByRequest(request.id);
      setMessages(msgs);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [request.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text?: string, type: ChatMessage['type'] = 'text', extra?: any) => {
    if ((!text?.trim() && type === 'text') || request.status === RequestStatus.COMPLETED) return;

    // Use spread to conditionally add properties and avoid 'undefined' values which Firebase rejects
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      requestId: request.id,
      senderId: user.id,
      senderName: user.name,
      type,
      createdAt: Date.now(),
      ...(type === 'text' && text ? { text } : {}),
      ...(type === 'image' && text ? { mediaUrl: text } : {}),
      ...(type === 'location' && extra ? { location: extra } : {})
    };

    await db.messages.send(newMessage);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    // Send notification to the other party
    const bid = request.acceptedBidId ? await db.bids.getById(request.acceptedBidId) : null;
    let targetUserId = '';
    
    if (user.id === request.customerId && bid) {
       targetUserId = bid.technicianId;
    } else if (bid && user.id === bid.technicianId) {
       targetUserId = request.customerId;
    }

    if (targetUserId) {
      await db.notifications.add({
        userId: targetUserId,
        title: `رسالة جديدة من ${user.name}`,
        message: type === 'text' ? (text || 'رسالة جديدة') : 'أرسل مرفقاً',
        type: 'status_update', // Reusing type for simplicity
        requestId: request.id
      });
    }
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      handleSendMessage(undefined, 'location', {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      });
    }, (err) => {
      alert('تعذر الحصول على الموقع');
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSendingMedia(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSendMessage(reader.result as string, 'image');
        setIsSendingMedia(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const isCompleted = request.status === RequestStatus.COMPLETED;

  return (
    <div className={`flex flex-col ${fullPage ? 'h-full' : 'h-[600px]'} bg-slate-50 dark:bg-slate-900 rounded-[32px] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm transition-colors`}>
      {/* Header */}
      <div className="bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="font-black text-blue-950 dark:text-white text-sm">المحادثة المباشرة</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">طلب #{request.id.split('-').pop()}</p>
          </div>
        </div>
        <div className="flex gap-1 items-center">
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}></span>
            <span className={`text-[10px] font-bold ${isCompleted ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isCompleted ? 'مكتمل' : 'نشط الآن'}
            </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat dark:bg-none dark:bg-slate-900">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-slate-400 text-sm font-bold bg-white dark:bg-slate-800 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700 shadow-sm">ابدأ المحادثة وشارك التفاصيل...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.senderId === 'system';
            
            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-full text-xs font-bold">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-md ${
                  isMe 
                    ? 'bg-emerald-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                }`}>
                  {!isMe && <p className="text-[10px] font-black opacity-50 mb-1">{msg.senderName}</p>}
                  
                  {msg.type === 'text' && <p className="text-sm font-medium leading-relaxed">{msg.text}</p>}
                  
                  {msg.type === 'image' && (
                    <div className="rounded-2xl overflow-hidden mt-1 max-w-[200px]">
                      <img src={msg.mediaUrl} alt="Sent" className="w-full object-cover" />
                    </div>
                  )}

                  {msg.type === 'location' && (
                    <div className="flex flex-col gap-2">
                       <p className="text-sm font-bold">📍 تم مشاركة الموقع</p>
                       <a 
                        href={`https://www.google.com/maps?q=${msg.location?.latitude},${msg.location?.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs underline font-black ${isMe ? 'text-emerald-100' : 'text-emerald-600 dark:text-emerald-400'}`}
                       >
                         فتح في خرائط جوجل
                       </a>
                    </div>
                  )}

                  <p className={`text-[9px] mt-2 font-bold text-right ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-800">
        {isCompleted ? (
           <div className="text-center text-slate-500 text-sm font-bold py-2">
             🚫 تم إغلاق المحادثة لأن الطلب مكتمل
           </div>
        ) : (
          <>
            <div className="flex gap-2 mb-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400 flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700"
                title="إرفاق صورة"
              >
                📷
              </button>
              <button 
                onClick={handleSendLocation}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-700 dark:hover:text-emerald-400 flex items-center justify-center transition-all border border-slate-100 dark:border-slate-700"
                title="مشاركة الموقع"
              >
                📍
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }} className="flex gap-3">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="اكتب رسالتك..."
                disabled={isSendingMedia}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all disabled:opacity-50 dark:text-white"
              />
              <button 
                type="submit"
                disabled={isSendingMedia || !inputText.trim()}
                className="bg-emerald-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 dark:shadow-none active:scale-90 disabled:opacity-50"
              >
                <svg className="w-6 h-6 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
