
import React, { useState, useEffect } from 'react';
import { User, UserRole, RequestStatus } from '../types';
import { db } from '../services/firebase';
import { CITIES } from '../constants';

interface ProfileProps {
  user: User;
  onUpdateUser: (u: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState({ ...user });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ completed: 0, spent: 0, joiningDate: '' });

  useEffect(() => {
    // Calculate Stats
    const fetchStats = async () => {
        // Use the counter from DB directly for efficiency
        const completedCount = user.completedRequests || 0;

        // Calculate money spent (only relevant for customer view)
        let totalSpent = 0;
        if (user.role === UserRole.CUSTOMER) {
           const allRequests = await db.requests.getAll();
           const allBids = await db.bids.getAll();
           
           const myCompletedReqs = allRequests.filter(r => 
             r.customerId === user.id && 
             r.status === RequestStatus.COMPLETED &&
             r.acceptedBidId
           );

           myCompletedReqs.forEach(r => {
             const bid = allBids.find(b => b.id === r.acceptedBidId);
             if (bid) totalSpent += bid.price;
           });
        }

        setStats({
          completed: completedCount,
          spent: totalSpent,
          joiningDate: new Date(parseInt(user.id.split('-')[1]) || Date.now()).toLocaleDateString('ar-JO', { year: 'numeric', month: 'long' })
        });
    };
    fetchStats();
  }, [user.id, user.completedRequests, user.role]);

  const handleSave = async () => {
    setLoading(true);
    await db.users.save(formData);
    onUpdateUser(formData);
    
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      alert('تم تحديث البيانات بنجاح!');
    }, 800);
  };

  const handleAddPortfolioImage = () => {
    // In a real app, this would be an file upload
    const url = prompt('أدخل رابط الصورة:');
    if (url) {
      const updatedPortfolio = [...(formData.portfolio || []), url];
      setFormData({ ...formData, portfolio: updatedPortfolio });
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    const updatedPortfolio = [...(formData.portfolio || [])];
    updatedPortfolio.splice(index, 1);
    setFormData({ ...formData, portfolio: updatedPortfolio });
  };

  // Determine Customer Level based on stats
  const getCustomerLevel = () => {
    if (stats.completed >= 20) return { name: 'عميل ذهبي 🥇', color: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900' };
    if (stats.completed >= 5) return { name: 'عميل فضي 🥈', color: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' };
    return { name: 'عميل برونزي 🥉', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900' };
  };

  const level = getCustomerLevel();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 dark:bg-slate-800 rounded-[40px] p-8 md:p-12 relative overflow-hidden text-white shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-700 text-slate-900 dark:text-white flex items-center justify-center text-5xl font-black border-4 border-emerald-500 shadow-xl">
             {user.name.charAt(0)}
          </div>
          <div className="text-center md:text-right flex-1">
             <div className="flex flex-col md:flex-row items-center gap-4 mb-2">
               <h1 className="text-3xl font-black">{user.name}</h1>
               {user.role === UserRole.CUSTOMER && (
                 <span className={`px-4 py-1.5 rounded-full text-xs font-black border ${level.color}`}>
                   {level.name}
                 </span>
               )}
               {user.role === UserRole.TECHNICIAN && user.approved && (
                 <span className="px-4 py-1.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                   ✅ فني معتمد
                 </span>
               )}
             </div>
             <p className="text-slate-300 mb-6 font-medium">{user.role === UserRole.CUSTOMER ? 'حساب زبون' : 'فني محترف'}</p>
             
             {/* Quick Stats */}
             <div className="flex flex-wrap justify-center md:justify-start gap-6">
               <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                 <p className="text-xs text-slate-400 mb-1 font-bold">تاريخ الانضمام</p>
                 <p className="font-bold">{stats.joiningDate}</p>
               </div>
               <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                 <p className="text-xs text-slate-400 mb-1 font-bold">{user.role === UserRole.TECHNICIAN ? 'المهام المنجزة' : 'الطلبات المكتملة'}</p>
                 <p className="font-bold text-emerald-400 text-xl">{stats.completed}</p>
               </div>
               {user.role === UserRole.TECHNICIAN && (
                 <div className="bg-white/10 px-6 py-3 rounded-2xl backdrop-blur-sm border border-white/5">
                   <p className="text-xs text-slate-400 mb-1 font-bold">التقييم العام</p>
                   <p className="font-bold text-yellow-400 text-xl">★ {user.rating?.toFixed(1) || '0.0'}</p>
                 </div>
               )}
             </div>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
          >
            {isEditing ? 'إلغاء التعديل' : 'تعديل الملف'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm h-fit transition-colors">
           <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">البيانات الشخصية</h2>
           <div className="space-y-5">
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الاسم الكامل</label>
               <input 
                 type="text" 
                 disabled={!isEditing}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">البريد الإلكتروني</label>
               <input 
                 type="email" 
                 disabled
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
                 value={formData.email}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">رقم الهاتف</label>
               <input 
                 type="tel" 
                 disabled={!isEditing}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                 value={formData.phone}
                 onChange={e => setFormData({...formData, phone: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">كلمة المرور</label>
               <input 
                 type="password" 
                 disabled={!isEditing}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                 value={formData.password || ''}
                 onChange={e => setFormData({...formData, password: e.target.value})}
                 placeholder={isEditing ? 'تغيير كلمة المرور' : '••••••'}
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المدينة</label>
               <select
                 disabled={!isEditing}
                 className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
                 value={formData.city || ''}
                 onChange={e => setFormData({...formData, city: e.target.value})}
               >
                 <option value="">اختر المدينة</option>
                 {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
             </div>
             
             {isEditing && (
               <button 
                 onClick={handleSave}
                 disabled={loading}
                 className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all mt-4"
               >
                 {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
               </button>
             )}
           </div>
        </div>

        {/* Right Column: Role Specific Content */}
        <div className="lg:col-span-2 space-y-8">
           
           {/* TECHNICIAN SECTION */}
           {user.role === UserRole.TECHNICIAN && (
             <>
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                 <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                    <span>📝</span> النبذة التعريفية (Bio)
                 </h2>
                 {isEditing ? (
                   <textarea 
                     rows={4}
                     className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                     value={formData.bio || ''}
                     onChange={e => setFormData({...formData, bio: e.target.value})}
                     placeholder="تحدث عن خبرتك ومهاراتك..."
                   ></textarea>
                 ) : (
                   <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                     {formData.bio || 'لم يتم إضافة نبذة تعريفية بعد.'}
                   </p>
                 )}
               </div>

               <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>📸</span> معرض الأعمال (Portfolio)
                   </h2>
                   {isEditing && (
                     <button 
                       onClick={handleAddPortfolioImage}
                       className="bg-slate-900 dark:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                     >
                       + إضافة صورة
                     </button>
                   )}
                 </div>
                 
                 {formData.portfolio && formData.portfolio.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {formData.portfolio.map((img, idx) => (
                       <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                         <img src={img} alt="Work" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                         {isEditing && (
                           <button 
                             onClick={() => handleRemovePortfolioImage(idx)}
                             className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold shadow-md"
                           >
                             ✕
                           </button>
                         )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                     <p className="text-slate-400 font-bold italic">لا توجد أعمال لعرضها</p>
                   </div>
                 )}
               </div>
             </>
           )}

           {/* CUSTOMER SECTION */}
           {user.role === UserRole.CUSTOMER && (
             <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-lg">
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
                      <p className="text-emerald-100 font-bold text-sm mb-1 uppercase tracking-widest">إجمالي المصروفات</p>
                      <h3 className="text-4xl font-black">{stats.spent} د.أ</h3>
                      <p className="text-xs text-emerald-100 mt-4 opacity-80">استثمارك في صيانة منزلك</p>
                   </div>
                   
                   <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center transition-colors">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-black text-slate-900 dark:text-white">حالة الولاء</h3>
                         <span className="text-2xl">{level.name.split(' ')[2]}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-2 overflow-hidden">
                         <div 
                           className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                           style={{ width: `${Math.min((stats.completed / 20) * 100, 100)}%` }}
                         ></div>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold text-left">
                        {stats.completed < 5 ? `باقي ${5 - stats.completed} طلبات للمستوى الفضي` : 
                         stats.completed < 20 ? `باقي ${20 - stats.completed} طلب للمستوى الذهبي` : 'أنت عميل مميز جداً!'}
                      </p>
                   </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-8 rounded-[32px] text-center">
                   <span className="text-4xl mb-4 block">🎁</span>
                   <h3 className="font-black text-blue-900 dark:text-blue-300 text-lg mb-2">هل تعلم؟</h3>
                   <p className="text-blue-800 dark:text-blue-200 font-medium">كلما زادت طلباتك المكتملة، زادت فرصتك في الحصول على خصومات حصرية من أفضل الفنيين في المنصة!</p>
                </div>
             </div>
           )}

        </div>
      </div>
    </div>
  );
};

export default Profile;
