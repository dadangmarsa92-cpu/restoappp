import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Menambahkan domain secara internal agar Firebase Auth tetap jalan
      const loginEmail = email.includes('@') ? email : `${email}@admin.com`;
      await signInWithEmailAndPassword(auth, loginEmail, password);
      navigate('/admin/orders');
    } catch (err) {
      setError('Username atau password salah. Coba lagi.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 pb-32">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8">
        <span className="material-symbols-outlined text-4xl text-primary font-bold">admin_panel_settings</span>
      </div>

      <div className="mb-10 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Login Admin</h2>
        <p className="text-secondary font-medium">Masuk untuk mengelola pesanan & menu restoran Anda.</p>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-6">
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Username Kasir</label>
          <input
            required
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin"
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Password</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all"
          />
        </div>
        {error && <p className="text-error text-xs font-bold text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
        >
          Masuk Sekarang
        </button>
      </form>
      
      <p className="mt-8 text-xs text-secondary font-medium tracking-tight">
        Lupa password? Hubungi administrator teknis.
      </p>
    </div>
  );
}
