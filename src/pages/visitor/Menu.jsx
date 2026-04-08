import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Menu() {
  const [categories, setCategories] = useState(['Semua']);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCartModal, setShowCartModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState({}); // { groupId: [optionIndex] }
  const [detailQuantity, setDetailQuantity] = useState(1);
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, removeFromCart, userInfo } = useStore();

  // Swipe handling
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleSwipe = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      const currentIdx = categories.indexOf(activeCategory);
      if (diff > 0 && currentIdx < categories.length - 1) {
        setActiveCategory(categories[currentIdx + 1]);
      } else if (diff < 0 && currentIdx > 0) {
        setActiveCategory(categories[currentIdx - 1]);
      }
    }
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menu'));
        const items = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMenuItems(items);
      } catch (err) {
        console.error('Error fetching menu:', err);
      } finally {
        setLoading(false);
      }
    };
    const fetchCategories = async () => {
      try {
        const catDoc = await getDoc(doc(db, 'settings', 'categories'));
        if (catDoc.exists() && catDoc.data().list?.length > 0) {
          setCategories(['Semua', ...catDoc.data().list]);
        } else {
          setCategories(['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Menu Spesial']);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchMenu();
    fetchCategories();
  }, []);

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setDetailQuantity(1);
    // Initialize required add-ons with empty arrays or first option if mandatory and single select?
    // Let's just keep it empty and validate on submit.
    setSelectedAddOns({});
    setShowDetailModal(true);
  };

  const handleToggleAddOn = (groupId, optIdx, isSingle) => {
    const current = selectedAddOns[groupId] || [];
    if (isSingle) {
      setSelectedAddOns({ ...selectedAddOns, [groupId]: [optIdx] });
    } else {
      const maxSelect = selectedItem.addOnGroups.find(g => g.id === groupId).maxSelect || 1;
      if (current.includes(optIdx)) {
        setSelectedAddOns({ ...selectedAddOns, [groupId]: current.filter(i => i !== optIdx) });
      } else if (current.length < maxSelect) {
        setSelectedAddOns({ ...selectedAddOns, [groupId]: [...current, optIdx] });
      }
    }
  };

  const calculateItemTotal = (item, selections) => {
    let total = item.price;
    if (item.addOnGroups) {
      item.addOnGroups.forEach(group => {
        const selectedIndices = selections[group.id] || [];
        selectedIndices.forEach(idx => {
          total += group.options[idx].price || 0;
        });
      });
    }
    return total;
  };

  const handleAddToCart = () => {
    // Validation
    if (selectedItem.addOnGroups) {
      for (const group of selectedItem.addOnGroups) {
        if (group.required && (!selectedAddOns[group.id] || selectedAddOns[group.id].length === 0)) {
          alert(`Silakan pilih ${group.title} terlebih dahulu.`);
          return;
        }
      }
    }

    const selections = [];
    if (selectedItem.addOnGroups) {
      selectedItem.addOnGroups.forEach(group => {
        const indices = selectedAddOns[group.id] || [];
        indices.forEach(idx => {
          selections.push({
            groupTitle: group.title,
            name: group.options[idx].name,
            price: group.options[idx].price
          });
        });
      });
    }

    const itemPrice = calculateItemTotal(selectedItem, selectedAddOns);
    
    addToCart({
      ...selectedItem,
      price: itemPrice,
      quantity: detailQuantity
    }, selections);

    setShowDetailModal(false);
  };

  const filteredMenu = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <div className="pb-40">
      <div className="px-6 pt-6 mb-8">
        <p className="text-sm font-semibold text-secondary mb-1">Selamat Datang,</p>
        <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-on-surface">
          {userInfo?.name || 'Tamu'}
          <span className="text-primary">.</span>
        </h2>
        <p className="text-sm text-secondary font-medium mt-1">Silakan Pilih Menu</p>
        <div className="relative mt-5">
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

      <section className="mb-12 no-scrollbar overflow-x-auto flex gap-4 pb-2 px-6">
        {categories.map(cat => (
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

      <div
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
        onTouchEnd={handleSwipe}
      >
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.section
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-4 md:gap-8 px-6"
            >
              {filteredMenu.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleOpenDetail(item)}
                  className="group relative bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
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
                      <div className="w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                        <span className="material-symbols-outlined text-sm">add</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredMenu.length === 0 && (
                <div className="col-span-2 text-center py-16">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-3 block">search_off</span>
                  <p className="text-secondary font-medium">Tidak ada menu ditemukan</p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-40">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-panel-heavy p-2 pr-2 pl-6 rounded-full flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">shopping_cart</span>
                </div>
                <span className="absolute -top-1 -right-1 bg-on-surface text-surface text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">{cartCount}</span>
              </div>
              <div>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-60 leading-none">Total</p>
                <p className="text-lg font-black text-on-surface">Rp {cartTotal.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCartModal(true)}
              className="bg-primary text-on-primary px-6 py-3.5 rounded-full font-black text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Pesan
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {/* Product Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-surface w-full max-w-md rounded-t-[3rem] shadow-2xl relative max-h-[92vh] overflow-hidden flex flex-col"
            >
               {/* Close Button Header */}
               <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="w-10 h-10 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center border border-white/30"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="overflow-y-auto no-scrollbar pb-32">
                <div className="h-72 w-full relative">
                  <img src={selectedItem.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-60" />
                </div>
                
                <div className="px-8 -mt-10 relative z-10">
                  <div className="bg-surface rounded-t-[3rem] pt-8 pb-4">
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">{selectedItem.category}</span>
                    <h3 className="text-3xl font-black text-on-surface leading-tight mb-2 tracking-tight">{selectedItem.name}</h3>
                    <p className="text-2xl font-black text-primary mb-6 tracking-tight">Rp {selectedItem.price.toLocaleString('id-ID')}</p>
                    
                    {selectedItem.description && (
                      <p className="text-sm text-secondary font-medium leading-relaxed mb-8">{selectedItem.description}</p>
                    )}

                    {/* Add-ons Rendering */}
                    {selectedItem.addOnGroups && selectedItem.addOnGroups.map((group) => (
                      <div key={group.id} className="mb-8 last:mb-0">
                        <div className="flex justify-between items-baseline mb-4">
                          <h4 className="text-sm font-black uppercase tracking-widest text-on-surface">{group.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${group.required ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                            {group.required ? 'Wajib - pilih 1' : `Opsional - pilih maks. ${group.maxSelect}`}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {group.options.map((opt, idx) => {
                            const isSelected = (selectedAddOns[group.id] || []).includes(idx);
                            const isSingle = group.required || group.maxSelect === 1;
                            
                            return (
                              <button
                                key={idx}
                                onClick={() => handleToggleAddOn(group.id, idx, isSingle)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                  isSelected 
                                    ? 'bg-primary/5 border-primary shadow-sm' 
                                    : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container-high'
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-primary border-primary' : 'border-outline-variant'
                                  }`}>
                                    {isSelected && <span className="material-symbols-outlined text-white text-[14px]">done</span>}
                                  </div>
                                  <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{opt.name}</span>
                                </div>
                                <span className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                                  {opt.price > 0 ? `+ Rp ${opt.price.toLocaleString('id-ID')}` : 'Gratis'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className="absolute bottom-0 left-0 right-0 p-8 glass-panel border-t border-outline-variant/10 flex items-center gap-6">
                <div className="flex items-center gap-4 bg-surface-container-high px-4 py-2 rounded-2xl shrink-0">
                  <button onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))} className="text-primary hover:scale-110 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">remove_circle</span>
                  </button>
                  <span className="text-lg font-black w-6 text-center">{detailQuantity}</span>
                  <button onClick={() => setDetailQuantity(detailQuantity + 1)} className="text-primary hover:scale-110 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">add_circle</span>
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  className="flex-grow bg-primary text-on-primary py-4 rounded-2xl font-headline font-black text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_basket</span>
                  Tambah ke Keranjang
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Cart Modal */}
        {showCartModal && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-6">
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
                    <div key={item.cartId} className="flex gap-4 items-center group">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm flex-none">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-on-surface truncate mb-0.5">{item.name}</h4>
                        {item.selectedAddOns?.length > 0 && (
                          <p className="text-[10px] text-secondary-variant italic mb-1 line-clamp-1">
                            {item.selectedAddOns.map(s => s.name).join(', ')}
                          </p>
                        )}
                        <p className="text-xs font-extrabold text-primary">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-surface-container-low px-3 py-1.5 rounded-2xl">
                        <button 
                          onClick={() => updateQuantity(item.cartId, -1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-primary-variant hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartId, 1)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.cartId)}
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
                    className="flex-[2] bg-primary text-on-primary py-4 px-6 rounded-2xl font-bold font-headline shadow-lg shadow-primary/30 active:scale-95 transition-all text-center"
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
