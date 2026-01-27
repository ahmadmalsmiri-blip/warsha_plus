
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ServiceRequest, Bid, RequestStatus } from '../../types';
import { db } from '../../services/firebase';

const TechnicianDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [openRequests, setOpenRequests] = useState<ServiceRequest[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [bidPrice, setBidPrice] = useState<string>('');
  const [bidMessage, setBidMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const refreshData = async () => {
    const all = await db.requests.getAll();
    setOpenRequests(all.filter(r => r.status === RequestStatus.OPEN).sort((a, b) => b.createdAt - a.createdAt));
    
    const allBids = await db.bids.getAll();
    const myBids = allBids.filter(b => b.technicianId === user.id);
    setMyBids(myBids);

    const activeStatuses = [RequestStatus.IN_PROGRESS, RequestStatus.EN_ROUTE, RequestStatus.STARTED];
    const myAccepted = all.filter(r => activeStatuses.includes(r.status) && myBids.some(b => b.id === r.acceptedBidId));
    setAcceptedRequests(myAccepted);

    if (selectedRequest) {
      const updated = all.find(r => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setLoading(true);
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      requestId: selectedRequest.id,
      technicianId: user.id,
      technicianName: user.name,
      technicianRating: user.rating || 0,
      price: parseFloat(bidPrice),
      message: bidMessage,
      createdAt: Date.now()
    };

    await db.bids.save(newBid);
    
    await db.notifications.add({
      userId: selectedRequest.customerId,
      title: 'عرض سعر جديد!',
      message: `قدم الفني ${user.name} عرض سعر بقيمة ${bidPrice} د.أ`,
      type: 'bid',
      requestId: selectedRequest.id
    });

    setBidPrice('');
    setBidMessage('');
    setSelectedRequest(null);
    await refreshData();
    setLoading(false);
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    const req = await db.requests.getById(requestId);
    if (!req) return;
    
    const updated: ServiceRequest = { ...req, status: newStatus };
    await db.requests.save(updated);

    // If status is COMPLETED, increment counter for both customer and technician
    if (newStatus === RequestStatus.COMPLETED) {
      try {
        // 1. Update Customer
        const customer = await db.users.getById(req.customerId);
        if (customer) {
          await db.users.save({
            ...customer,
            completedRequests: (customer.completedRequests || 0) + 1
          });
        }

        // 2. Update Technician (Current User)
        const updatedTech = {
          ...user,
          completedRequests: (user.completedRequests || 0) + 1
        };
        await db.users.save(updatedTech);
        // We don't need to update local user state here immediately as Layout/App handles re-fetch on reload, 
        // but for better UX we could. For now, database update is critical.
      } catch (error) {
        console.error("Error updating completed counts:", error);
      }
    }

    await refreshData();
  };

  if (!user.approved) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-12 text-center max-w-xl shadow-xl border border-yellow-100 dark:border-yellow-900/30">
          <span className="text-6xl block mb-6">⏳</span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">الحساب قيد المراجعة</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">شكراً لتسجيلك. سيقوم فريق الإدارة بمراجعة بياناتك وتفعيل حسابك قريباً.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white">مساحة العمل</h1>

      {/* Top Metrics Cards - LARGE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 dark:bg-slate-800 text-white p-8 rounded-[32px] relative overflow-hidden shadow-xl">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">تقييم الأداء</p>
           <div className="flex items-end gap-2">
             <span className="text-5xl font-black text-white">{user.rating?.toFixed(1) || '0.0'}</span>
             <span className="text-emerald-400 text-2xl mb-1">★</span>
           </div>
           <p className="text-xs text-slate-400 mt-4 font-bold">{user.reviewCount || 0} عملية تقييم</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">المهام النشطة</p>
               <span className="text-5xl font-black text-slate-900 dark:text-white">{acceptedRequests.length}</span>
             </div>
             <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-2xl">🛠️</div>
           </div>
           <p className="text-xs text-slate-400 mt-4 font-bold">مهام قيد التنفيذ حالياً</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500 transition-all">
           <div className="flex justify-between items-start">
             <div>
               <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-wider mb-2">فرص متاحة</p>
               <span className="text-5xl font-black text-slate-900 dark:text-white">{openRequests.length}</span>
             </div>
             <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-2xl">📢</div>
           </div>
           <p className="text-xs text-slate-400 mt-4 font-bold">طلبات تنتظر عروض أسعار</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
             <h2 className="text-xl font-black text-slate-900 dark:text-white">سوق الطلبات</h2>
             <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300">{openRequests.length} طلب جديد</span>
          </div>

          <div className="grid gap-6">
            {openRequests.map(req => {
               const alreadyBidded = myBids.some(b => b.requestId === req.id);
               return (
                 <div 
                   key={req.id}
                   onClick={() => !alreadyBidded && setSelectedRequest(req)}
                   className={`bg-white dark:bg-slate-900 rounded-[24px] p-6 border transition-all cursor-pointer group ${alreadyBidded ? 'opacity-60 grayscale border-slate-100 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-400 hover:shadow-lg'}`}
                 >
                   <div className="flex justify-between items-start mb-4">
                     <span className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-1 rounded-lg text-xs font-black">{req.category}</span>
                     <span className="text-xs text-slate-400 font-bold">{new Date(req.createdAt).toLocaleDateString('ar-JO')}</span>
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{req.description}</h3>
                   <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
                     <span>📍 {req.city}</span>
                     <span>👤 {req.customerName}</span>
                   </div>
                   {alreadyBidded && <div className="mt-4 text-emerald-600 dark:text-emerald-400 text-xs font-bold">✅ تم تقديم عرض</div>}
                 </div>
               );
            })}
          </div>
        </div>

        {/* Sidebar / Action Panel */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-lg text-slate-900 dark:text-white">إجراءات الطلب</h3>
                <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">✕</button>
              </div>

              {selectedRequest.status === RequestStatus.OPEN ? (
                <form onSubmit={handlePlaceBid} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl mb-4 text-sm text-slate-600 dark:text-slate-300">
                    {selectedRequest.description}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">السعر (د.أ)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none dark:text-white"
                      value={bidPrice}
                      onChange={e => setBidPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">ملاحظات</label>
                    <textarea 
                      required
                      rows={3}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none dark:text-white"
                      value={bidMessage}
                      onChange={e => setBidMessage(e.target.value)}
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                  >
                    إرسال العرض
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <button onClick={() => updateRequestStatus(selectedRequest.id, RequestStatus.EN_ROUTE)} className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 py-3 rounded-xl font-bold hover:bg-blue-100">في الطريق 🚚</button>
                    <button onClick={() => updateRequestStatus(selectedRequest.id, RequestStatus.STARTED)} className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 py-3 rounded-xl font-bold hover:bg-yellow-100">بدء العمل 🛠️</button>
                    <button onClick={() => updateRequestStatus(selectedRequest.id, RequestStatus.COMPLETED)} className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 py-3 rounded-xl font-bold hover:bg-green-100">إتمام المهمة ✅</button>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button 
                        onClick={() => navigate(`/chat/${selectedRequest.id}`)}
                        className="w-full bg-slate-900 dark:bg-slate-700 text-white py-3 rounded-xl font-bold hover:bg-slate-800"
                      >
                        فتح المحادثة 💬
                      </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
             // List of Active Jobs in the sidebar if no selection
             <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-[32px] p-6 shadow-xl">
               <h3 className="font-bold text-lg mb-4">مهامي النشطة</h3>
               <div className="space-y-3">
                 {acceptedRequests.length === 0 ? (
                   <p className="text-slate-500 text-sm">لا توجد مهام نشطة</p>
                 ) : (
                   acceptedRequests.map(req => (
                     <div key={req.id} onClick={() => setSelectedRequest(req)} className="bg-white/10 p-4 rounded-xl cursor-pointer hover:bg-white/20 transition-colors">
                       <p className="font-bold text-sm">{req.category}</p>
                       <p className="text-xs text-slate-400 mt-1">{req.city}</p>
                       <span className="inline-block mt-2 text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-md">{req.status}</span>
                     </div>
                   ))
                 )}
               </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
