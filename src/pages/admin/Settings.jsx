import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_CATEGORIES = ['Makanan', 'Minuman', 'Cemilan', 'Menu Spesial'];

export default function Settings() {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const restDoc = await getDoc(doc(db, 'settings', 'restaurant'));
        if (restDoc.exists()) {
          const data = restDoc.data();
          setRestaurantName(data.name || '');
          setRestaurantAddress(data.address || '');
        }
        const catDoc = await getDoc(doc(db, 'settings', 'categories'));
        if (catDoc.exists() && catDoc.data().list?.length > 0) {
          setCategories(catDoc.data().list);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, 'settings', 'restaurant'), {
        name: restaurantName, address: restaurantAddress,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await setDoc(doc(db, 'settings', 'categories'), {
        list: categories, updatedAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('Kategori sudah ada!');
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory('');
  };

  const removeCategory = (idx) => {
    if (categories.length <= 1) { alert('Minimal 1 kategori.'); return; }
    setCategories(categories.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Pengaturan</h2>
        <p className="text-secondary font-medium text-sm">Kelola informasi restoran Anda</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Restaurant Info */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">store</span>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Informasi Restoran</h3>
          </div>
          <input
            type="text"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="Nama Restoran"
            className="w-full bg-surface-container-highest border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium text-sm"
            required
          />
          <input
            type="text"
            value={restaurantAddress}
            onChange={(e) => setRestaurantAddress(e.target.value)}
            placeholder="Alamat Restoran"
            className="w-full bg-surface-container-highest border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium text-sm"
            required
          />
        </div>

        {/* Category Management - Compact */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-primary text-xl">category</span>
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">Kategori Menu</h3>
          </div>

          {/* Category chips - inline wrapped */}
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {categories.map((cat, idx) => (
                <motion.div
                  key={cat}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 bg-surface-container-high rounded-full pl-4 pr-1.5 py-1.5"
                >
                  <span className="text-sm font-bold text-on-surface">{cat}</span>
                  <button
                    type="button"
                    onClick={() => removeCategory(idx)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-secondary/50 hover:text-error hover:bg-error-container/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Add new category inline */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
              placeholder="Tambah kategori..."
              className="flex-grow bg-surface-container-highest border-none rounded-full py-2.5 px-4 focus:ring-2 focus:ring-primary text-on-surface font-medium text-sm"
            />
            <button
              type="button"
              onClick={addCategory}
              className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-transform flex-none"
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <motion.button
          type="submit"
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          className={`w-full py-4 rounded-full font-headline font-bold text-lg shadow-lg transition-all ${
            saved
              ? 'bg-green-600 text-white'
              : 'bg-gradient-to-r from-primary to-primary-container text-on-primary'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Menyimpan...
            </span>
          ) : saved ? (
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              Tersimpan!
            </span>
          ) : (
            'Simpan Pengaturan'
          )}
        </motion.button>
      </form>
    </div>
  );
}
