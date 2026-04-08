import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', category: '', description: '', addOnGroups: [] });
  const [imageFile, setImageFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const catDoc = await getDoc(doc(db, 'settings', 'categories'));
      if (catDoc.exists() && catDoc.data().list?.length > 0) {
        setCategories(catDoc.data().list);
        // Set default category if not set
        if (!formData.category) {
          setFormData(prev => ({ ...prev, category: catDoc.data().list[0] }));
        }
      } else {
        const defaults = ['Makanan', 'Minuman', 'Cemilan', 'Menu Spesial'];
        setCategories(defaults);
        if (!formData.category) {
          setFormData(prev => ({ ...prev, category: defaults[0] }));
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(['Makanan', 'Minuman', 'Cemilan']);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'menu'));
    setItems(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!imageFile) return null;
    const storageRef = ref(storage, `menu/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = formData.image;
      if (imageFile) {
        imageUrl = await handleUpload();
      }

      const itemData = {
        ...formData,
        price: parseInt(formData.price),
        image: imageUrl || 'https://via.placeholder.com/150',
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await updateDoc(doc(db, 'menu', editingId), itemData);
      } else {
        await addDoc(collection(db, 'menu'), {
          ...itemData,
          createdAt: new Date().toISOString()
        });
      }

      setShowAddForm(false);
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan menu.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: categories[0] || 'Makanan', description: '', addOnGroups: [] });
    setImageFile(null);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description || '',
      image: item.image,
      addOnGroups: item.addOnGroups || []
    });
    setEditingId(item.id);
    setShowAddForm(true);
  };

  const addAddOnGroup = () => {
    setFormData({
      ...formData,
      addOnGroups: [
        ...formData.addOnGroups,
        { id: Date.now().toString(), title: '', required: false, maxSelect: 1, options: [{ name: '', price: 0 }] }
      ]
    });
  };

  const removeAddOnGroup = (groupId) => {
    setFormData({
      ...formData,
      addOnGroups: formData.addOnGroups.filter(g => g.id !== groupId)
    });
  };

  const updateAddOnGroup = (groupId, updates) => {
    setFormData({
      ...formData,
      addOnGroups: formData.addOnGroups.map(g => g.id === groupId ? { ...g, ...updates } : g)
    });
  };

  const addOption = (groupId) => {
    setFormData({
      ...formData,
      addOnGroups: formData.addOnGroups.map(g => 
        g.id === groupId ? { ...g, options: [...g.options, { name: '', price: 0 }] } : g
      )
    });
  };

  const updateOption = (groupId, idx, updates) => {
    setFormData({
      ...formData,
      addOnGroups: formData.addOnGroups.map(g => {
        if (g.id === groupId) {
          const newOptions = [...g.options];
          newOptions[idx] = { ...newOptions[idx], ...updates };
          return { ...g, options: newOptions };
        }
        return g;
      })
    });
  };

  const removeOption = (groupId, idx) => {
    setFormData({
      ...formData,
      addOnGroups: formData.addOnGroups.map(g => {
        if (g.id === groupId) {
          return { ...g, options: g.options.filter((_, i) => i !== idx) };
        }
        return g;
      })
    });
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus menu ini?')) {
      await deleteDoc(doc(db, 'menu', id));
      fetchItems();
    }
  };

  return (
    <div className="pb-32">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight mb-2">Manajemen Menu</h2>
          <p className="text-secondary font-medium">Kelola hidangan dan minuman restoran Anda.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="bg-primary text-on-primary w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-surface-container-lowest p-4 rounded-3xl flex gap-4 items-center shadow-sm border border-outline-variant/10">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex-none">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-on-surface line-clamp-1">{item.name}</h4>
              <p className="text-xs text-secondary font-medium uppercase tracking-widest">{item.category}</p>
              <p className="text-sm font-extrabold text-primary">Rp {item.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="w-10 h-10 text-primary hover:bg-primary/10 rounded-full flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xl">edit</span>
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="w-10 h-10 text-error hover:bg-error-container rounded-full flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xl">delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-surface w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black font-headline">
                  {editingId ? 'Edit Menu' : 'Tambah Menu Baru'}
                </h3>
                <button onClick={() => setShowAddForm(false)} className="text-secondary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Photo Upload */}
                <div className="aspect-video bg-on-surface/5 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 overflow-hidden relative">
                  {imageFile || formData.image ? (
                    <img src={imageFile ? URL.createObjectURL(imageFile) : formData.image} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-secondary text-4xl mb-2">add_a_photo</span>
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Unggah Foto Menu</p>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-secondary ml-2">Informasi Dasar</h4>
                  <input
                    required
                    type="text"
                    placeholder="Nama Hidangan"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-4">
                    <input
                      required
                      type="number"
                      placeholder="Harga"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="flex-grow bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                    />
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-40 bg-surface-container-high border-none rounded-2xl py-4 px-4 focus:ring-2 focus:ring-primary font-bold text-sm"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    placeholder="Deskripsi hidangan..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </div>

                {/* Add-ons Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-secondary">Menu Tambahan (Option)</h4>
                    <button 
                      type="button"
                      onClick={addAddOnGroup}
                      className="text-primary text-xs font-bold flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Tambah Grup
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.addOnGroups.map((group) => (
                      <div key={group.id} className="bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/30 space-y-4">
                        <div className="flex gap-4">
                          <input
                            placeholder="Judul Grup (contoh: Extra Coffee)"
                            value={group.title}
                            onChange={(e) => updateAddOnGroup(group.id, { title: e.target.value })}
                            className="flex-grow bg-surface border-none rounded-xl py-2 px-4 focus:ring-1 focus:ring-primary text-sm font-bold"
                          />
                          <button type="button" onClick={() => removeAddOnGroup(group.id)} className="text-error">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-secondary-variant px-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => updateAddOnGroup(group.id, { required: e.target.checked })}
                              className="rounded border-outline-variant text-primary focus:ring-primary"
                            />
                            Wajib dipilih
                          </label>
                          <div className="flex items-center gap-2">
                            Maks. pilih:
                            <input
                              type="number"
                              min="1"
                              value={group.maxSelect}
                              onChange={(e) => updateAddOnGroup(group.id, { maxSelect: parseInt(e.target.value) })}
                              className="w-12 bg-surface border-none rounded-lg py-1 px-2 text-center focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3 pl-2">
                          {group.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-3">
                              <input
                                placeholder="Pilihan"
                                value={opt.name}
                                onChange={(e) => updateOption(group.id, idx, { name: e.target.value })}
                                className="flex-[3] bg-surface-container-high border-none rounded-xl py-2 px-4 text-xs"
                              />
                              <input
                                type="number"
                                placeholder="Harga (0 = Gratis)"
                                value={opt.price}
                                onChange={(e) => updateOption(group.id, idx, { price: parseInt(e.target.value) })}
                                className="flex-[2] bg-surface-container-high border-none rounded-xl py-2 px-4 text-xs"
                              />
                              <button type="button" onClick={() => removeOption(group.id, idx)} className="text-secondary/50">
                                <span className="material-symbols-outlined text-[18px]">close</span>
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => addOption(group.id)}
                            className="text-[10px] font-black uppercase text-secondary tracking-widest bg-white/50 w-full py-2 rounded-xl border border-dashed border-outline-variant/50"
                          >
                            + Tambah Pilihan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-5 rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-8"
                >
                  {loading ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Terbitkan Menu')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
