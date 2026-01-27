
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, UserRole, AppNotification } from '../types';
import { db } from '../services/firebase';
import AiAssistant from './AiAssistant';
import { Logo } from './Logo';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for Mobile Drawer
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const ntf = await db.notifications.getByUser(user.id);
      setNotifications(ntf);
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    await db.notifications.markAllRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (n: AppNotification) => {
    await db.notifications.markAsRead(n.id);
    setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    setShowNotifications(false);
  };

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false);
    onLogout();
  }

  // --- REUSABLE SIDEBAR CONTENT ---
  const SidebarContent = () => (
    <>
      <div className="h-24 flex items-center px-8 border-b border-slate-800/50">
         <div className="text-white"><Logo className="w-8 h-8" textClassName="text-2xl text-white" /></div>
      </div>
      <div className="flex-1 overflow-y-auto py-8 px-4">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">القائمة الرئيسية</p>
        <SidebarItem to="/" icon="🏠" label="الرئيسية" />
        {!user ? (
          <SidebarItem to="/auth" icon="🔐" label="تسجيل الدخول" />
        ) : (
          <>
            {user.role === UserRole.CUSTOMER && (
              <>
                <SidebarItem to="/customer" icon="📊" label="لوحة التحكم" />
                <SidebarItem to="/customer/new" icon="➕" label="طلب جديد" />
              </>
            )}
            {user.role === UserRole.TECHNICIAN && <SidebarItem to="/technician" icon="🔨" label="لوحة الفني" />}
            {user.role === UserRole.ADMIN && <SidebarItem to="/admin" icon="🛡️" label="الإدارة" />}
          </>
        )}
        <div className="mt-8">
          <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">الإعدادات</p>
          {user && <SidebarItem to="/profile" icon="⚙️" label="الملف الشخصي" />}
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all font-bold text-sm hover:translate-x-1 dark:hover:bg-slate-800">
            <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
            <span>{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
          </button>
        </div>
      </div>
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50 dark:bg-slate-950/50">
        {user && (
          <button onClick={handleLogoutClick} className="w-full bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold border border-slate-700 hover:border-red-900/50 hover:text-red-400 transition-colors flex items-center justify-center gap-2">
            <span>🚪</span> تسجيل الخروج
          </button>
        )}
      </div>
    </>
  );

  // --- DESKTOP SIDEBAR ITEM ---
  const SidebarItem = ({ to, icon, label }: { to: string; icon: string; label: string }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));
    return (
      <Link
        to={to}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm mb-1 ${
          isActive
            ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/20 translate-x-1 dark:bg-emerald-600 dark:shadow-emerald-900/20'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:translate-x-1 dark:text-slate-400 dark:hover:bg-slate-800'
        }`}
      >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
      </Link>
    );
  };

  // --- MOBILE BOTTOM NAV ITEM ---
  const BottomNavItem = ({ to, icon, label, isSpecial = false }: { to: string; icon: any; label: string; isSpecial?: boolean }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));
    
    if (isSpecial) {
      return (
        <Link to={to} className="relative -top-6">
          <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/40 border-4 border-slate-50 dark:border-slate-950">
            {icon}
          </div>
        </Link>
      );
    }

    return (
      <Link to={to} className={`flex flex-col items-center justify-center gap-1 w-full h-full ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
        <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>{icon}</span>
        <span className="text-[10px] font-bold">{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR (Visible only on LG screens) --- */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-950 dark:bg-slate-900 text-white border-l border-slate-800 h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* --- MOBILE SIDEBAR DRAWER (Visible on Mobile when toggled) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden font-sans">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-enter"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Drawer Content */}
          <aside className="absolute top-0 right-0 bottom-0 w-3/4 max-w-sm bg-slate-950 text-white shadow-2xl flex flex-col animate-enter border-l border-slate-800">
             <button 
               onClick={() => setIsMobileMenuOpen(false)}
               className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white"
             >
               ✕
             </button>
             <SidebarContent />
          </aside>
        </div>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Header */}
        <header className="h-16 lg:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <div className="lg:hidden text-slate-900 dark:text-white">
              <Logo className="w-6 h-6" showText={false} />
            </div>
            <h2 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white hidden sm:block">
              {location.pathname === '/' ? 'ورشه+' : 
               location.pathname.startsWith('/chat') ? 'المحادثة' : 
               (user?.role === UserRole.CUSTOMER ? 'الرئيسية' : user?.role === UserRole.TECHNICIAN ? 'المهام' : user?.role === UserRole.ADMIN ? 'لوحة الإدارة' : '')}
            </h2>
          </div>

          <div className="flex items-center gap-3">
             {/* Mobile Dark Mode Toggle */}
             <button onClick={() => setIsDarkMode(!isDarkMode)} className="lg:hidden p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {isDarkMode ? '☀️' : '🌙'}
             </button>

             {user ? (
               <div className="relative" ref={notificationRef}>
                 <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 relative">
                   <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                   {unreadCount > 0 && <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900"></span>}
                 </button>
                 {showNotifications && (
                   <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-enter z-50">
                     <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                       <h3 className="font-bold text-slate-900 dark:text-white text-xs">التنبيهات</h3>
                       <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-emerald-600">تحديد الكل</button>
                     </div>
                     <div className="max-h-60 overflow-y-auto">
                       {notifications.length === 0 ? <div className="p-4 text-center text-xs text-slate-400">لا توجد تنبيهات</div> : 
                         notifications.map(n => (
                           <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-3 border-b border-slate-50 dark:border-slate-800 cursor-pointer ${!n.read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                             <p className="text-xs font-bold text-slate-900 dark:text-white">{n.title}</p>
                             <p className="text-[10px] text-slate-500 dark:text-slate-400">{n.message}</p>
                           </div>
                         ))
                       }
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <Link to="/auth" className="text-xs font-bold bg-slate-900 text-white px-3 py-1.5 rounded-lg">دخول</Link>
             )}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-24 lg:pb-8 p-4 sm:p-8 scroll-smooth no-scrollbar">
          <div className="max-w-6xl mx-auto animate-enter">
             {children || <Outlet />}
          </div>
        </main>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 h-16 pb-safe z-40 flex justify-around items-center px-2">
           <BottomNavItem to="/" icon="🏠" label="الرئيسية" />
           
           {!user ? (
             <BottomNavItem to="/auth" icon="🔐" label="دخول" />
           ) : (
             <>
               {user.role === UserRole.CUSTOMER && (
                 <>
                   <BottomNavItem to="/customer" icon="📊" label="طلباتي" />
                   <BottomNavItem to="/customer/new" icon="➕" label="" isSpecial={true} />
                 </>
               )}
               {user.role === UserRole.TECHNICIAN && (
                  <BottomNavItem to="/technician" icon="🔨" label="المهام" />
               )}
               {user.role === UserRole.ADMIN && (
                  <BottomNavItem to="/admin" icon="🛡️" label="الإدارة" />
               )}
               <BottomNavItem to="/profile" icon="👤" label="حسابي" />
             </>
           )}
        </div>
      </div>

      {user && <AiAssistant user={user} />}
    </div>
  );
};

export default Layout;
