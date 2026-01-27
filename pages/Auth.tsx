
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { db } from '../services/firebase';
import { JORDAN_PHONE_REGEX } from '../constants';
import { Logo } from '../components/Logo';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.CUSTOMER
  });

  // OTP State
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpNotification, setOtpNotification] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- ONE CLICK LOGIN LOGIC ---
  const handleQuickLogin = async (role: UserRole) => {
    setLoading(true);
    setError('');
    
    let testUser: User;
    
    // Define test users data
    if (role === UserRole.ADMIN) {
      testUser = {
        id: 'test-admin',
        name: 'المدير العام',
        email: 'admin@test.com',
        phone: '0790000000',
        password: '123',
        role: UserRole.ADMIN,
        approved: true
      };
    } else if (role === UserRole.TECHNICIAN) {
      testUser = {
        id: 'test-tech',
        name: 'خالد (فني تجريبي)',
        email: 'tech@test.com',
        phone: '0790000002',
        password: '123',
        role: UserRole.TECHNICIAN,
        approved: true,
        city: 'الزرقاء',
        rating: 4.8,
        reviewCount: 15,
        completedRequests: 12,
        bio: 'فني كهرباء خبرة 10 سنوات',
        portfolio: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500']
      };
    } else {
      testUser = {
        id: 'test-customer',
        name: 'أحمد (زبون تجريبي)',
        email: 'customer@test.com',
        phone: '0790000001',
        password: '123',
        role: UserRole.CUSTOMER,
        approved: true,
        city: 'عمان',
        completedRequests: 5
      };
    }

    try {
      // Check if user exists, if not create/update it
      await db.users.save(testUser);
      localStorage.setItem('logged_in_user_id', testUser.id);
      onLogin(testUser);
    } catch (err) {
      console.error(err);
      setError('فشل الدخول السريع. تأكد من إعدادات قاعدة البيانات.');
      setLoading(false);
    }
  };

  // Handle Initial Form Submit (Login or Start Registration)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        const user = await db.users.getByEmail(formData.email);
        
        if (user) {
          // Check Password (simple string check for this mock auth)
          if (user.password === formData.password) {
            localStorage.setItem('logged_in_user_id', user.id);
            onLogin(user);
          } else {
            setError('كلمة المرور غير صحيحة');
          }
        } else {
          setError('البريد الإلكتروني غير مسجل');
        }
        setLoading(false);
      } else {
        // --- REGISTRATION VALIDATION ---
        if (!JORDAN_PHONE_REGEX.test(formData.phone)) {
          setError('رقم الهاتف الأردني غير صحيح (يجب أن يبدأ بـ 07 ويتكون من 10 أرقام)');
          setLoading(false);
          return;
        }

        const existingUser = await db.users.getByEmail(formData.email);
        if (existingUser) {
          setError('هذا البريد الإلكتروني مسجل مسبقاً');
          setLoading(false);
          return;
        }

        // --- START WHATSAPP OTP FLOW ---
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        
        setTimeout(() => {
          setOtpNotification(`💬 رسالة واتساب: رمز التحقق الخاص بك هو ${code}`);
          setShowOtpStep(true);
          setLoading(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً');
      setLoading(false);
    }
  };

  // Handle OTP Verification and Final Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (otpInput !== generatedOtp) {
      setError('رمز التحقق غير صحيح، حاول مرة أخرى');
      setLoading(false);
      return;
    }

    try {
      const newUser: User = {
        id: `u-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password, // Saving password
        role: formData.role,
        approved: formData.role === UserRole.CUSTOMER,
        completedRequests: 0
      };

      await db.users.save(newUser);
      localStorage.setItem('logged_in_user_id', newUser.id);
      onLogin(newUser);
    } catch (err) {
      console.error(err);
      setError('فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpNotification(`💬 إعادة إرسال: رمز التحقق الجديد هو ${code}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      
      {/* OTP Notification Banner (Simulation) */}
      {otpNotification && (
        <div className="absolute top-0 left-0 right-0 bg-[#25D366] text-white p-4 text-center shadow-lg animate-enter z-50 flex items-center justify-center gap-2 cursor-pointer" onClick={() => { setOtpInput(generatedOtp); setOtpNotification(null); }}>
          <span className="text-2xl">📱</span>
          <div className="font-bold">
            {otpNotification}
            <span className="block text-xs opacity-90 mt-1">(اضغط هنا لنسخ الرمز تلقائياً)</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-xl w-full max-w-md p-8 border border-slate-100 relative z-10">
        <div className="flex justify-center mb-8">
          <Logo className="w-16 h-16" textClassName="text-4xl" />
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {showOtpStep ? 'تأكيد رقم الهاتف' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {showOtpStep 
              ? `تم إرسال رمز التحقق عبر واتساب إلى ${formData.phone}` 
              : 'أهلاً بك في منصة ورشه+ لخدمات الصيانة'
            }
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm mb-8 flex items-center gap-3 border border-red-200 font-bold animate-pulse">
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        {/* --- OTP FORM --- */}
        {showOtpStep ? (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 animate-bounce">
                📱
              </div>
              <label className="block text-sm font-bold text-slate-900 mb-4">أدخل رمز التحقق (6 أرقام)</label>
              <input 
                type="text" 
                maxLength={6}
                required 
                autoFocus
                placeholder="- - - - - -"
                className="w-full px-5 py-4 rounded-2xl border-2 border-emerald-500/30 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all text-slate-900 font-black text-2xl text-center tracking-[0.5em] bg-emerald-50/30"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otpInput.length !== 6}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
            </button>

            <div className="flex justify-between items-center text-sm font-bold pt-4">
              <button type="button" onClick={() => setShowOtpStep(false)} className="text-slate-400 hover:text-slate-600">
                تغيير الرقم
              </button>
              <button type="button" onClick={handleResendOtp} className="text-emerald-600 hover:text-emerald-700">
                إعادة إرسال الرمز؟
              </button>
            </div>
          </form>
        ) : (
          /* --- LOGIN / REGISTER FORM --- */
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 mr-1">الاسم الكامل</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-bold text-sm bg-slate-50 focus:bg-white"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 mr-1">نوع الحساب</label>
                  <select 
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-bold text-sm bg-slate-50 focus:bg-white"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.CUSTOMER}>زبون (أرغب بطلب خدمة)</option>
                    <option value={UserRole.TECHNICIAN}>فني (أرغب بتقديم خدماتي)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 mr-1">رقم الهاتف (واتساب)</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      required 
                      placeholder="07XXXXXXXX"
                      className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 font-bold text-sm bg-slate-50 focus:bg-white pl-12"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg grayscale opacity-70">📱</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 mt-1 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    سيتم إرسال رمز التحقق عبر واتساب
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 mr-1">البريد الإلكتروني</label>
              <input 
                type="email" 
                required 
                placeholder="example@mail.com"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-bold text-sm bg-slate-50 focus:bg-white"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5 mr-1">كلمة المرور</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none transition-all text-slate-900 font-bold text-sm bg-slate-50 focus:bg-white"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full text-white py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 mt-4 flex items-center justify-center gap-2 ${
                !isLogin 
                  ? 'bg-[#25D366] hover:bg-[#128C7E] shadow-emerald-900/10' // WhatsApp Brand Colors
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
              }`}
            >
              {loading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : (
                <>
                  <span>إرسال الرمز عبر واتساب</span>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                </>
              ))}
            </button>
          </form>
        )}

        {/* --- QUICK LOGIN BUTTONS --- */}
        {!showOtpStep && (
          <div className="mt-8 pt-6 border-t border-slate-100">
             <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">دخول سريع (للتجربة والاختبار)</p>
             <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => handleQuickLogin(UserRole.CUSTOMER)}
                  disabled={loading}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-3 rounded-xl text-xs font-bold transition-colors border border-emerald-100 flex flex-col items-center gap-1"
                >
                  <span>👤</span>
                  زبون
                </button>
                <button 
                  onClick={() => handleQuickLogin(UserRole.TECHNICIAN)}
                  disabled={loading}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 rounded-xl text-xs font-bold transition-colors border border-blue-100 flex flex-col items-center gap-1"
                >
                  <span>👷‍♂️</span>
                  فني
                </button>
                <button 
                  onClick={() => handleQuickLogin(UserRole.ADMIN)}
                  disabled={loading}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors border border-slate-200 flex flex-col items-center gap-1"
                >
                  <span>🛡️</span>
                  مدير
                </button>
             </div>
          </div>
        )}

        {/* --- TOGGLE LOGIN/REGISTER --- */}
        {!showOtpStep && (
          <div className="mt-6 text-center text-sm">
            <button 
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setFormData({ ...formData, name: '', email: '', phone: '', password: '' });
              }}
              className="text-slate-500 hover:text-slate-900 transition-colors font-bold"
            >
              {isLogin ? (
                <>ليس لديك حساب؟ <span className="text-emerald-600 underline decoration-2 decoration-emerald-200 underline-offset-4">سجل الآن</span></>
              ) : (
                <>لديك حساب بالفعل؟ <span className="text-emerald-600 underline decoration-2 decoration-emerald-200 underline-offset-4">سجل دخولك</span></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
