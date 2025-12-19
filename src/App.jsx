import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Calculator, Smartphone, Car, MessageCircle, ShieldCheck, Info, User, Phone, AlertCircle } from 'lucide-react';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-feFghP9QK54WihVVFcX4rKoJUicJooU",
  authDomain: "smart-finance-be995.firebaseapp.com",
  projectId: "smart-finance-be995",
  storageBucket: "smart-finance-be995.firebasestorage.app",
  messagingSenderId: "217870762206",
  appId: "1:217870762206:web:037d8b132197a255f0424f",
  measurementId: "G-2EQDQZ2ZP7"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'smart-finance-be995';

const App = () => {
  const [activeTab, setActiveTab] = useState('mobil');
  const [loanAmount, setLoanAmount] = useState('');
  const [user, setUser] = useState(null);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadData, setLeadData] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth initialization
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const CONFIG = {
    mobil: {
      tenors: [12, 24, 36, 48],
      baseRate: 0.11,
      adminPct: 0.12,
      insurancePct: 0.05
    },
    motor: {
      tenors: [6, 12, 18, 24],
      baseRate: 0.22,
      adminPct: 0.28,
      insurancePct: 0.08
    }
  };

  const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const calculateInstallment = (amount, tenor, type) => {
    const conf = CONFIG[type];
    const years = tenor / 12;
    const totalInterest = amount * (conf.baseRate * years);
    const extraCosts = amount * (conf.adminPct + conf.insurancePct);
    return (amount + totalInterest + extraCosts) / tenor;
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!user || !leadData.name || !leadData.phone) return;

    setIsSubmitting(true);
    try {
      // Simpan data calon nasabah ke database
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leads'), {
        ...leadData,
        loanAmount: parseFloat(loanAmount),
        assetType: activeTab,
        timestamp: serverTimestamp(),
        userId: user.uid
      });

      // Redirect ke WhatsApp
      const msg = `Halo Smart Finance, saya ${leadData.name}. Saya ingin info simulasi BPKB ${activeTab.toUpperCase()} dengan pencairan ${formatIDR(loanAmount)}.`;
      window.open(`https://wa.me/6281315574375?text=${encodeURIComponent(msg)}`, '_blank');
      setShowLeadForm(false);
    } catch (error) {
      console.error("Error saving lead:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-6 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-green-900/10 overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-emerald-800 p-8 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">Smart Multi Finance</h1>
          <p className="text-emerald-100/70 text-sm mt-1">Solusi Pencairan Cepat & Aman</p>
        </div>

        <div className="p-6">
          {/* Asset Tabs */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => setActiveTab('mobil')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'mobil' ? 'bg-white shadow-md text-emerald-800' : 'text-slate-400'}`}
            >
              <Car size={18} /> BPKB MOBIL
            </button>
            <button 
              onClick={() => setActiveTab('motor')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'motor' ? 'bg-white shadow-md text-emerald-800' : 'text-slate-400'}`}
            >
              <Smartphone size={18} /> BPKB MOTOR
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-8">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">
              Nominal Pencairan
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-lg">Rp</div>
              <input 
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] focus:border-emerald-600 focus:bg-white outline-none transition-all font-bold text-2xl text-slate-800"
              />
            </div>
            {loanAmount && (
              <p className="text-sm text-emerald-600 font-semibold mt-3 px-1">
                {formatIDR(parseFloat(loanAmount))}
              </p>
            )}
          </div>

          {/* Results Grid */}
          <div className="space-y-3">
            {loanAmount > 0 ? (
              CONFIG[activeTab].tenors.map(t => (
                <div key={t} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tenor</span>
                    <span className="text-base font-bold text-slate-700">{t} Bulan</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Angsuran</span>
                    <span className="text-lg font-black text-emerald-800">
                      {formatIDR(calculateInstallment(parseFloat(loanAmount), t, activeTab))}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-300">
                <Calculator size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm italic">Masukkan jumlah pinjaman...</p>
              </div>
            )}
          </div>

          {/* Disclaimer Text */}
          <div className="mt-6 flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <AlertCircle size={20} className="text-amber-600 shrink-0" />
            <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
              Keterangan: Simulasi ini bersifat sementara. Hasil akhir dapat berubah sesuai dengan hasil survey data aset, kondisi kendaraan, serta kelengkapan dokumen pendukung lainnya.
            </p>
          </div>

          {/* Main Action */}
          <button 
            disabled={!loanAmount}
            onClick={() => setShowLeadForm(true)}
            className={`w-full mt-6 flex items-center justify-center gap-3 py-4.5 rounded-[1.25rem] font-bold text-lg shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] ${!loanAmount ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-800 text-white hover:bg-emerald-700 py-4'}`}
          >
            <MessageCircle size={22} />
            Hubungi Admin
          </button>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Aman • Resmi • Diawasi OJK</span>
          </div>
        </div>
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Satu Langkah Lagi</h2>
                <p className="text-sm text-slate-500">Lengkapi data untuk konsultasi</p>
              </div>
              <button onClick={() => setShowLeadForm(false)} className="text-slate-400 p-1 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nama Lengkap</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    required
                    type="text"
                    placeholder="Nama Anda"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
                    value={leadData.name}
                    onChange={e => setLeadData({...leadData, name: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Nomor WhatsApp</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    required
                    type="tel"
                    placeholder="0812xxxx"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
                    value={leadData.phone}
                    onChange={e => setLeadData({...leadData, phone: e.target.value})}
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-800 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Memproses...' : 'Dapatkan Pinjaman Sekarang'}
                {!isSubmitting && <MessageCircle size={18} />}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;