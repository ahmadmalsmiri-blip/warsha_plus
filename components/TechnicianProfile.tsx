
import React, { useState } from 'react';
import { User } from '../types';

interface TechnicianProfileProps {
  technician: User;
  onClose: () => void;
}

const TechnicianProfile: React.FC<TechnicianProfileProps> = ({ technician, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-blue-900 p-10 text-white shrink-0 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-600/20 rounded-full blur-3xl"></div>
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all z-10"
          >
            ✕
          </button>
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-xl border-4 border-emerald-500">
              👷‍♂️
            </div>
            <div className="text-center md:text-right">
              <h2 className="text-3xl font-black mb-2">{technician.name}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <span className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-white/10">
                  ⭐ {technician.rating?.toFixed(1) || '0.0'} ({technician.reviewCount || 0} تقييم)
                </span>
                <span className="bg-white/10 px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 border border-white/10">
                  📍 {technician.city || 'الأردن'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <section>
            <h3 className="text-xl font-black text-blue-950 mb-4 border-r-4 border-emerald-500 pr-3">نبذة عن الفني</h3>
            <p className="text-slate-600 leading-relaxed font-medium">
              {technician.bio || 'لا يوجد وصف متاح حالياً لهذا الفني.'}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-black text-blue-950 mb-6 border-r-4 border-emerald-500 pr-3">معرض الأعمال (البروفايل)</h3>
            {technician.portfolio && technician.portfolio.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {technician.portfolio.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:scale-105 transition-transform">
                    <img src={img} alt="Portfolio item" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">لا توجد صور في معرض الأعمال بعد</p>
              </div>
            )}
          </section>

          <section className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
            <p className="text-blue-800 text-sm font-bold">
              🛡️ لحمايتك، يرجى إتمام كافة تفاصيل الاتفاق والدردشة داخل تطبيق ورشه+
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TechnicianProfile;
