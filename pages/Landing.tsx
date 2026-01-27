
import React from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../constants';
import { Logo } from '../components/Logo';

const Landing: React.FC = () => {
  return (
    <div className="min-h-full font-sans">
      {/* Hero Section */}
      <section className="pt-20 pb-24 px-4 overflow-hidden relative">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 font-bold text-xs mb-6 tracking-wide border border-emerald-200 dark:border-emerald-800">
             ✨ المنصة رقم #1 للصيانة في الأردن
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8 leading-tight tracking-tight">
            صيانة منزلك <br/> 
            <span className="relative inline-block">
              <span className="relative z-10 text-emerald-600 dark:text-emerald-400">أسهل وأسرع</span>
              <span className="absolute bottom-2 left-0 w-full h-3 bg-emerald-200/50 dark:bg-emerald-900/50 -z-0 rounded-full"></span>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            تواصل مع نخبة من الفنيين المحترفين في جميع المجالات.
            <br className="hidden md:block" />
            خدمة موثوقة، أسعار تنافسية، وضمان للجودة.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 dark:hover:bg-emerald-700 shadow-xl shadow-slate-900/20 dark:shadow-none transition-all w-full sm:w-auto"
            >
              أنا زبون (أبحث عن فني)
            </Link>
            <Link 
              to="/auth" 
              className="px-8 py-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-lg hover:border-slate-900 dark:hover:border-slate-500 transition-all w-full sm:w-auto"
            >
              أنا فني (أبحث عن عمل)
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm mb-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">خدماتنا</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">نغطي كافة احتياجات منزلك</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CATEGORIES.map((cat) => (
              <div 
                key={cat.id} 
                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white dark:hover:text-white transition-all group cursor-default text-center border border-slate-100 dark:border-slate-800"
              >
                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{cat.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-white">{cat.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-transparent border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="opacity-50 grayscale hover:grayscale-0 transition-all">
             <Logo className="w-8 h-8" textClassName="text-xl dark:text-white" />
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm font-bold">© 2024 WARSHA+</div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
