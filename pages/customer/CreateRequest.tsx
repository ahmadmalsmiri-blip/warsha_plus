
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, RequestStatus, ServiceRequest } from '../../types';
import { db } from '../../services/firebase';
import { CATEGORIES, CITIES } from '../../constants';

const CreateRequest: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: CATEGORIES[0].name,
    description: '',
    city: CITIES[0],
    preferredTime: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('يرجى كتابة وصف للمشكلة');
      return;
    }
    setLoading(true);

    const newReq: ServiceRequest = {
      id: `req-${Date.now()}`,
      customerId: user.id,
      customerName: user.name,
      category: formData.category,
      description: formData.description,
      city: formData.city,
      preferredTime: formData.preferredTime,
      status: RequestStatus.OPEN,
      createdAt: Date.now()
    };

    await db.requests.save(newReq);
    setTimeout(() => {
      navigate('/customer');
    }, 500);
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">طلب خدمة جديد</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">اختر نوع الخدمة وأخبرنا بالمشكلة لنرسل لك أفضل الفنيين.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Right Section: Selections */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* 1. Category Selection */}
            <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-sm">1</span>
                ما نوع الخدمة المطلوبة؟
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                    className={`relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 h-32 group ${
                      formData.category === cat.name
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className={`text-4xl transition-transform ${formData.category === cat.name ? 'scale-110' : 'group-hover:scale-110 grayscale'}`}>
                      {cat.icon}
                    </span>
                    <span className="font-bold text-sm">{cat.name}</span>
                    {formData.category === cat.name && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 rounded-full text-white flex items-center justify-center text-xs">✓</div>
                    )}
                  </button>
                ))}
              </div>
            </section>

            {/* 2. City Selection */}
            <section className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-sm">2</span>
                أين موقع العمل؟
              </h2>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => setFormData({ ...formData, city: city })}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                      formData.city === city
                        ? 'bg-slate-900 text-white shadow-lg dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Left Section: Details Form */}
          <div className="lg:col-span-5">
             <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-200 dark:border-slate-800 shadow-xl sticky top-24">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-sm">3</span>
                تفاصيل المشكلة
               </h2>

               <div className="space-y-5">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">وصف العطل / الخدمة</label>
                   <textarea 
                      required
                      rows={5}
                      placeholder="اشرح المشكلة بالتفصيل (مثال: لدي تسريب مياه تحت حوض المطبخ...)"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all resize-none"
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    ></textarea>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">الموعد المناسب للزيارة</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="مثال: غداً بعد العصر"
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 font-bold focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white transition-all pl-10"
                        value={formData.preferredTime}
                        onChange={e => setFormData({...formData, preferredTime: e.target.value})}
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">🕒</span>
                    </div>
                 </div>

                 <div>
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 mr-1">صورة للمشكلة (اختياري)</label>
                   <label className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors group">
                     <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                       <span className="text-2xl">📸</span>
                     </div>
                     <div>
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-300">أرفق صورة</p>
                       <p className="text-[10px] text-slate-400">تساعد الفني على فهم المشكلة</p>
                     </div>
                     <input type="file" className="hidden" accept="image/*" />
                   </label>
                 </div>

                 <div className="pt-4 flex gap-3">
                   <button 
                     type="button"
                     onClick={() => navigate('/customer')}
                     className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all dark:text-slate-400 dark:hover:bg-slate-800"
                   >
                     إلغاء
                   </button>
                   <button 
                     type="submit" 
                     disabled={loading}
                     className="flex-1 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                     {loading ? 'جاري النشر...' : 'نشر الطلب الآن'}
                     {!loading && <span className="text-xl">🚀</span>}
                   </button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
