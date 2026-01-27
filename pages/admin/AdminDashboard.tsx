
import React, { useState, useEffect } from 'react';
import { User, UserRole, ServiceRequest, RequestStatus } from '../../types';
import { db } from '../../services/firebase';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'techs' | 'requests'>('techs');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const allUsers = await db.users.getAll();
    setTechnicians(allUsers.filter(u => u.role === UserRole.TECHNICIAN));
    const allRequests = await db.requests.getAll();
    setRequests(allRequests.sort((a, b) => b.createdAt - a.createdAt));
  };

  const handleApprove = async (techId: string) => {
    const tech = await db.users.getById(techId);
    if (tech) {
      tech.approved = true;
      await db.users.save(tech);
      await refreshData();
      alert('تم اعتماد الفني بنجاح!');
    }
  };

  const pendingTechs = technicians.filter(t => !t.approved).length;
  const activeRequestsCount = requests.filter(r => r.status === RequestStatus.OPEN).length;

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Right Sidebar (Control Panel) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Admin Profile Card */}
          <div className="bg-slate-900 text-white rounded-[32px] p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mt-10"></div>
             <div className="relative z-10 text-center">
               <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl border border-white/20">
                 🛡️
               </div>
               <h2 className="text-xl font-bold">{user.name}</h2>
               <p className="text-slate-400 text-xs mt-1 font-medium">مدير النظام</p>
             </div>
          </div>

          {/* Navigation Menu */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-4">
             <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-4 mt-2">القائمة</h3>
             <button 
               onClick={() => setActiveTab('techs')}
               className={`w-full flex items-center justify-between p-4 rounded-xl mb-2 transition-all font-bold ${activeTab === 'techs' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
             >
               <div className="flex items-center gap-3">
                 <span>👷‍♂️</span>
                 <span>إدارة الفنيين</span>
               </div>
               {pendingTechs > 0 && <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendingTechs}</span>}
             </button>

             <button 
               onClick={() => setActiveTab('requests')}
               className={`w-full flex items-center justify-between p-4 rounded-xl transition-all font-bold ${activeTab === 'requests' ? 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
             >
               <div className="flex items-center gap-3">
                 <span>📋</span>
                 <span>جميع الطلبات</span>
               </div>
               <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>
             </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl block mb-1">👥</span>
              <p className="text-[10px] text-slate-400 font-bold">المستخدمين</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{technicians.length}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 text-center">
              <span className="text-2xl block mb-1">📢</span>
              <p className="text-[10px] text-slate-400 font-bold">نشط الآن</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{activeRequestsCount}</p>
            </div>
          </div>
        </div>

        {/* Left Content Area (Main Table) */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[500px]">
            {/* Table Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <h2 className="text-xl font-black text-slate-900 dark:text-white">
                 {activeTab === 'techs' ? 'سجل الفنيين والموافقات' : 'سجل الطلبات الشامل'}
               </h2>
               <button onClick={refreshData} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">تحديث ↻</button>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {activeTab === 'techs' ? (
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الفني</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">معلومات الاتصال</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">التقييم</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الحالة</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {technicians.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">لا يوجد فنيون مسجلون</td></tr>
                    ) : (
                      technicians.map(tech => (
                        <tr key={tech.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">👷‍♂️</div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">{tech.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{tech.city || 'غير محدد'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{tech.phone}</div>
                             <div className="text-xs text-slate-400">{tech.email}</div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                               <span className="text-yellow-400">★</span> {tech.rating?.toFixed(1) || '0.0'}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${tech.approved ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                              {tech.approved ? 'معتمد ✅' : 'قيد المراجعة ⏳'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {!tech.approved && (
                              <button 
                                onClick={() => handleApprove(tech.id)}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all"
                              >
                                اعتماد الفني
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-right">
                  <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">نوع الخدمة</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الزبون</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">الحالة</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {requests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-white">{req.category}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">{req.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-600 dark:text-slate-300">{req.customerName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                            req.status === RequestStatus.OPEN ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            req.status === RequestStatus.COMPLETED ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                          {new Date(req.createdAt).toLocaleDateString('ar-JO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
