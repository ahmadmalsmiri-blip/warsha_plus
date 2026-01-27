
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/firebase';
import { User, ServiceRequest } from '../types';
import ChatInterface from '../components/ChatInterface';

interface ChatPageProps {
  user: User;
}

const ChatPage: React.FC<ChatPageProps> = ({ user }) => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      if (requestId) {
        const req = await db.requests.getById(requestId);
        if (req) {
          setRequest(req);
        } else {
          navigate('/');
        }
      }
    };
    fetchRequest();
  }, [requestId, navigate]);

  if (!request) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">جاري التحميل...</div>;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       <div className="mb-4 flex items-center justify-between">
         <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
           <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-lg px-2">
             ➜
           </button>
           محادثة الطلب: {request.category}
         </h1>
         <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{request.customerName}</span>
       </div>
       <div className="flex-1">
          <ChatInterface user={user} request={request} fullPage={true} />
       </div>
    </div>
  );
};

export default ChatPage;
