import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminMenu() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', category: 'Makanan', description: '' });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

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
      const imageUrl = await handleUpload();
      await addDoc(collection(db, 'menu'), {
        ...formData,
        price: parseInt(formData.price),
        image: imageUrl || 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString()
      });
      setShowAddForm(false);
      setFormData({ name: '', price: '', category: 'Makanan', description: '' });
      setImageFile(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert('Gagal menambah menu.');
    } finally {
      setLoading(false);
    }
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
          onClick={() => setShowAddForm(true)}
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
            <button
              onClick={() => handleDelete(item.id)}
              className="w-10 h-10 text-error hover:bg-error-container rounded-full flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-xl">delete</span>
            </button>
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
              className="bg-surface w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-black font-headline mb-8">Tambah Menu Baru</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="aspect-video bg-on-surface/5 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 overflow-hidden relative">
                  {imageFile ? (
                    <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
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

                <div className="space-y-4">
                  <input
                    required
                    type="text"
                    placeholder="Nama Hidangan"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                  />
                  <input
                    required
                    type="number"
                    placeholder="Harga (Rp)"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary"
                  >
                    <option>Makanan</option>
                    <option>Minuman</option>
                    <option>Cemilan</option>
                  </select>
                  <textarea
                    placeholder="Deskripsi singkat..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary min-h-[100px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Hidangan'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
