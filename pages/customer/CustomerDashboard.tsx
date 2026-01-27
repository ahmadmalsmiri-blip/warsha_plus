
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, ServiceRequest, Bid, RequestStatus } from '../../types';
import { db } from '../../services/firebase';
import TechnicianProfile from '../../components/TechnicianProfile';

const CustomerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [viewingTech, setViewingTech] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      const allReqs = await db.requests.getAll();
      const userReqs = allReqs.filter(r => r.customerId === user.id);
      setRequests(userReqs.sort((a, b) => b.createdAt - a.createdAt));
    };
    fetchRequests();
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  const handleSelectRequest = async (req: ServiceRequest) => {
    setSelectedRequest(req);
    const reqBids = await db.bids.getByRequest(req.id);
    setBids(reqBids);
  };

  const handleAcceptBid = async (bid: Bid) => {
    if (!selectedRequest) return;
    const updatedReq: ServiceRequest = { 
      ...selectedRequest, 
      status: RequestStatus.IN_PROGRESS,
      acceptedBidId: bid.id 
    };
    
    await db.requests.save(updatedReq);
    setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    setSelectedRequest(updatedReq);

    // Auto System Message
    await db.messages.send({
      id: `sys-${Date.now()}`,
      requestId: updatedReq.id,
      senderId: 'system',
      senderName: 'System',
      type: 'text',
      text: 'مرحباً، تم قبول العرض! سيقوم الفني بالتواصل معك قريباً لترتيب الموعد.',
      createdAt: Date.now()
    });

    // Notify Tech
    await db.notifications.add({
      userId: bid.technicianId,
      title: 'مبروك! تم قبول عرضك',
      message: `وافق ${user.name} على عرضك للطلب ${updatedReq.category}`,
      type: 'assignment',
      requestId: updatedReq.id
    });
  };

  const activeRequest = requests.find(r => 
    [RequestStatus.IN_PROGRESS, RequestStatus.EN_ROUTE, RequestStatus.STARTED].includes(r.status)
  );

  return (
    <div className="space-y-10">
      {viewingTech && <TechnicianProfile technician={viewingTech} onClose={() => setViewingTech(null)} />}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">مرحباً، {user.name} 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">تابع طلباتك الحالية أو ابدأ مشروعاً جديداً لصيانة منزلك.</p>
        </div>
        
        {/* Touch 1: Button Shape (rounded-xl) with Interaction */}
        <Link 
          to="/customer/new"
          className="bg-slate-900 dark:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-slate-900/10 hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
        >
          <span className="text-2xl bg-white/20 w-8 h-8 rounded-full flex items-center justify-center">+</span>
          <span>طلب خدمة جديد</span>
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active/Big Cards */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. Large Active Request Card - Touch 2: rounded-[24px] Card */}
          {activeRequest ? (
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-bold border border-emerald-100 dark:border-emerald-800 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    طلب نشط حالياً
                  </span>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white">{activeRequest.category}</h2>
                </div>
                <div className="text-left">
                  <p className="text-slate-400 font-bold text-sm">التاريخ</p>
                  <p className="font-bold text-slate-700 dark:text-slate-300">{new Date(activeRequest.createdAt).toLocaleDateString('ar-JO')}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-slate-800">
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{activeRequest.description}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                 <button 
                   onClick={() => navigate(`/chat/${activeRequest.id}`)}
                   className="flex-1 bg-slate-900 dark:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all shadow-lg shadow-slate-200 dark:shadow-none active:scale-95"
                 >
                   فتح المحادثة كاملة 💬
                 </button>
                 <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 font-bold text-slate-600 dark:text-slate-400 shadow-sm">
                    <span>الحالة:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {activeRequest.status === RequestStatus.EN_ROUTE ? 'الفني في الطريق 🚚' : 
                       activeRequest.status === RequestStatus.STARTED ? 'جاري العمل 🛠️' : 'قيد التنفيذ'}
                    </span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-[24px] p-10 text-white text-center relative overflow-hidden h-80 flex flex-col items-center justify-center shadow-2xl">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
               <div className="relative z-10 animate-enter">
                 <div className="text-6xl mb-6">✨</div>
                 <h2 className="text-2xl font-black mb-4">منزلك بحاجة لصيانة؟</h2>
                 <p className="text-slate-300 max-w-md mx-auto mb-8 font-medium">نحن هنا لمساعدتك. اطلب فني كهرباء، سباكة، أو ديكور بضغطة زر واحدة.</p>
                 <Link to="/customer/new" className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20 active:scale-95 inline-block">
                   اطلب خدمة الآن
                 </Link>
               </div>
            </div>
          )}

          {/* 2. Recent History (Large List) */}
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4 px-2">آخر الطلبات</h3>
            <div className="space-y-4">
              {requests.filter(r => r.id !== activeRequest?.id).length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[24px] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-medium">
                  لا يوجد أرشيف طلبات
                </div>
              ) : (
                requests.filter(r => r.id !== activeRequest?.id).slice(0, 3).map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => handleSelectRequest(req)} 
                    className="bg-white dark:bg-slate-900 p-6 rounded-[20px] border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all cursor-pointer flex justify-between items-center group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:scale-110 transition-all">
                         {req.category === 'كهرباء' ? '⚡' : req.category === 'سباكة' ? '🚰' : '🛠️'}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white text-lg">{req.category}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{req.description}</p>
                       </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      req.status === RequestStatus.COMPLETED ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details Panel */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 rounded-[24px] p-6 border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24 h-[calc(100vh-8rem)] flex flex-col animate-enter">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="font-black text-xl text-slate-900 dark:text-white">تفاصيل الطلب</h3>
                <button onClick={() => setSelectedRequest(null)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto pr-1">
                 {/* Status Badges */}
                 <div className="flex gap-2 mb-6">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold">{selectedRequest.category}</span>
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-lg text-xs font-bold">{selectedRequest.city}</span>
                 </div>

                 {/* Description */}
                 <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-6">
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">{selectedRequest.description}</p>
                 </div>

                 {/* Bids Section or Chat */}
                 {selectedRequest.status === RequestStatus.OPEN ? (
                   <div>
                     <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">💰</span>
                       العروض المقدمة ({bids.length})
                     </h4>
                     <div className="space-y-3">
                       {bids.map(bid => (
                         <div key={bid.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 hover:border-emerald-500 transition-all bg-white dark:bg-slate-800 hover:shadow-sm">
                            <div className="flex justify-between mb-2">
                              <span className="font-bold text-slate-900 dark:text-white">{bid.technicianName}</span>
                              <span className="font-black text-emerald-600 dark:text-emerald-400">{bid.price} د.أ</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{bid.message}</p>
                            <button 
                              onClick={() => handleAcceptBid(bid)}
                              className="w-full py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all"
                            >
                              قبول العرض
                            </button>
                         </div>
                       ))}
                       {bids.length === 0 && <p className="text-center text-slate-400 text-xs py-4 font-medium">لا توجد عروض حتى الآن، سننبهك فور وصولها!</p>}
                     </div>
                   </div>
                 ) : (
                   <div className="text-center py-8">
                     <p className="text-slate-400 mb-4 font-medium">المحادثة نشطة في صفحة مستقلة</p>
                      <button 
                        onClick={() => navigate(`/chat/${selectedRequest.id}`)}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none"
                      >
                        الذهاب للمحادثة 💬
                      </button>
                   </div>
                 )}
              </div>
            </div>
          ) : (
             <div className="h-full bg-slate-50/50 dark:bg-slate-900/50 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
               <span className="text-4xl mb-4 grayscale opacity-50">👈</span>
               <p className="font-bold">اختر طلباً من القائمة لعرض التفاصيل الكاملة والمحادثات</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
