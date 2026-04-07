import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const CATEGORIES = ['Semua', 'Makanan', 'Minuman', 'Cemilan'];

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCartModal, setShowCartModal] = useState(false);
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart } = useStore();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menu'));
        const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMenuItems(items);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="pb-40">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight mb-6">Pilih menu <br/><span className="text-primary">favorit Anda</span></h2>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary transition-all"
            placeholder="Cari masakan, minuman..."
          />
        </div>
      </div>

      <section className="mb-12 no-scrollbar overflow-x-auto flex gap-4 pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-none px-8 py-3 rounded-full font-semibold transition-all ${
              activeCategory === cat 
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-4 md:gap-8">
          {filteredMenu.map((item) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group relative bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="aspect-square overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <div className="flex flex-col gap-1 mb-2">
                  <span className="w-fit bg-surface-container-high text-on-surface-variant text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">{item.category}</span>
                  <h3 className="text-sm font-bold text-on-surface line-clamp-1">{item.name}</h3>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-extrabold text-primary">Rp {item.price.toLocaleString('id-ID')}</span>
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center hover:scale-110 transition-transform active:scale-95 shadow-lg shadow-primary/30"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-40">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel rounded-3xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex items-center justify-between border border-white/20"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
                <span className="absolute -top-1 -right-1 bg-on-surface text-surface text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
              </div>
              <div>
                <p className="text-xs text-secondary font-medium tracking-tight">Total</p>
                <p className="text-lg font-extrabold text-on-surface">Rp {cartTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCartModal(true)}
              className="bg-primary text-on-primary px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
            >
              Pesan Sekarang
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {showCartModal && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="bg-surface w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl relative max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-extrabold font-headline mb-1">Keranjang Belanja</h3>
                  <p className="text-xs text-secondary font-medium uppercase tracking-widest">Kamu memesan {cartCount} item</p>
                </div>
                <button 
                  onClick={() => setShowCartModal(false)}
                  className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-secondary-variant"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pr-1 -mx-2 px-2">
                <div className="flex flex-col gap-6 mb-8">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 items-center group">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm flex-none">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate mb-1">{item.name}</h4>
                        <p className="text-xs font-extrabold text-primary">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-2xl">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-primary-variant hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="material-symbols-outlined text-outline-variant hover:text-error transition-colors p-1"
                      >
                        delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-secondary">Total Tagihan</span>
                  <span className="text-2xl font-black text-primary">Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="flex-1 py-4 px-6 rounded-2xl font-bold font-headline text-secondary bg-surface-container-highest hover:bg-surface-container-high transition-all"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={() => navigate('/checkout')}
                    className="flex-[2] bg-primary text-on-primary py-4 px-6 rounded-2xl font-bold font-headline shadow-lg shadow-primary/30 active:scale-95 transition-all"
                  >
                    Bayar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
