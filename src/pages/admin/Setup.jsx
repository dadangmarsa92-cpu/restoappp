import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';

const INITIAL_MENU = [
  { name: 'Nasi Goreng Kurator', price: 55000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1512058560366-c988648bb13e?auto=format&fit=crop&w=800&q=80', description: 'Nasi goreng rempah khas dengan topping telur mata sapi, ayam suwir, dan kerupuk udang.' },
  { name: 'Sate Ayam Madura', price: 42000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1529692236671-f1f6e946a89c?auto=format&fit=crop&w=800&q=80', description: '10 tusuk sate ayam empuk dengan bumbu kacang kental dan irisan bawang merah.' },
  { name: 'Beef Rendang Plate', price: 78000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1596797038530-2c39da95d003?auto=format&fit=crop&w=800&q=80', description: 'Daging sapi pilihan yang dimasak perlahan dengan santan dan 16 rempah rahasia.' },
  { name: 'Gado-Gado Premium', price: 38000, category: 'Makanan', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', description: 'Sayuran segar kukus dengan bumbu kacang artisan, tahu tempe, dan telur rebus.' },
  { name: 'Es Teh Manis Selasih', price: 15000, category: 'Minuman', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80', description: 'Teh melati pilihan dengan gula batu dan taburan selasih yang menyegarkan.' },
  { name: 'Es Jeruk Murni', price: 22000, category: 'Minuman', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80', description: 'Perasan jeruk peras asli tanpa tambahan pemanis buatan.' },
  { name: 'Soda Gembira', price: 28000, category: 'Minuman', image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', description: 'Campuran soda, sirup coco pandan, dan susu kental manis yang legendaris.' },
  { name: 'Pisang Goreng Keju', price: 25000, category: 'Cemilan', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=800&q=80', description: 'Pisang raja goreng tepung renyah dengan parutan keju cheddar melimpah.' },
];

const INITIAL_TABLES = Array.from({ length: 15 }, (_, i) => ({
  name: String(i + 1).padStart(2, '0'),
  status: Math.random() > 0.3 ? 'available' : 'occupied'
}));

export default function Setup() {
  const [status, setStatus] = useState('Idle');
  const [loading, setLoading] = useState(false);

  const runSetup = async () => {
    setLoading(true);
    setStatus('Memulai Setup...');

    try {
      // 0. Create Admin User
      setStatus('Mencoba Membuat Akun Admin...');
      try {
        // Menggunakan admin@admin.com sebagai email "username admin"
        await createUserWithEmailAndPassword(auth, 'admin@admin.com', 'admin123');
        setStatus('Akun Admin Berhasil Dibuat!');
      } catch (authErr) {
        if (authErr.code === 'auth/email-already-in-use') {
          setStatus('Akun Admin Sudah Ada.');
        } else {
          throw authErr;
        }
      }

      // 1. Seed Menu
      const menuSnap = await getDocs(collection(db, 'menu'));
      if (menuSnap.empty) {
        setStatus('Mengisi Data Menu...');
        for (const item of INITIAL_MENU) {
          await addDoc(collection(db, 'menu'), { ...item, createdAt: new Date().toISOString() });
        }
      }

      // 2. Seed Tables
      const tableSnap = await getDocs(collection(db, 'tables'));
      if (tableSnap.empty) {
        setStatus('Mengisi Data Meja...');
        for (const table of INITIAL_TABLES) {
          await addDoc(collection(db, 'tables'), { ...table, createdAt: new Date().toISOString() });
        }
      }

      setStatus('Setup Selesai! Anda bisa kembali ke halaman utama.');
    } catch (err) {
      console.error(err);
      setStatus('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold mb-6">Database Setup</h2>
      <p className="text-secondary mb-8">Klik tombol di bawah untuk mengisi database awal (Menu & Meja).</p>
      <div className="bg-surface-container-high p-6 rounded-3xl mb-8">
        <p className="font-mono text-sm">{status}</p>
      </div>
      <button
        disabled={loading}
        onClick={runSetup}
        className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Jalankan Setup Database'}
      </button>
    </div>
  );
}
