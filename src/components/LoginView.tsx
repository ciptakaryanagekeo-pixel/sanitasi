import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Droplets,
  ShieldCheck,
  AlertCircle,
  Building2,
  KeyRound,
  ArrowRight,
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Valid credentials requested by user: user: sanitasi, pass: sanitasi@2026
      if (username.trim() === 'sanitasi' && password === 'sanitasi@2026') {
        onLoginSuccess();
      } else {
        setErrorMessage('Username atau password salah! Silakan periksa kembali akun Anda.');
      }
    }, 400);
  };

  const handleQuickFill = () => {
    setUsername('sanitasi');
    setPassword('sanitasi@2026');
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Top Emblem & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-4 border border-blue-400/30">
            <Droplets className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" /> Bidang Cipta Karya • Dinas PUPR
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SIM-SANITASI CK
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
            Sistem Informasi Manajemen Sanitasi & Kelayakan Infrastruktur
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              Autentikasi Petugas
            </h2>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
              v2.0 Clean
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username / Akun Petugas
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition transform active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memverifikasi Akun...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard Sanitasi</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Hint / Helper Card */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-400 block">Akun Akses Terdaftar:</span>
                <div className="font-mono text-[11px] text-blue-300">
                  user: <span className="font-bold text-white">sanitasi</span> | pass: <span className="font-bold text-white">sanitasi@2026</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFill}
                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-[10px] font-semibold transition"
              >
                Isi Cepat
              </button>
            </div>
          </div>
        </div>

        {/* Security & Ownership Footer */}
        <div className="text-center mt-6 text-slate-500 text-[11px] space-y-1">
          <p className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Sistem Keamanan Terintegrasi Dinas PUPR
          </p>
          <p>© 2026 Bidang Cipta Karya • Server Backend Google Worksheet</p>
        </div>
      </div>
    </div>
  );
}
