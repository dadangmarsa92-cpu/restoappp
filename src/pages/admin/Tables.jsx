import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import AdminMenu from './Menu';

export default function AdminTables() {
  const [activeTab, setActiveTab] = useState('tables'); // 'tables' or 'menu'
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'tables'));
    const tableList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    tableList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    setTables(tableList);
    setLoading(false);
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'tables'), {
        name: newTableName,
        status: 'available',
        createdAt: new Date().toISOString()
      });
      setNewTableName('');
      setShowAdd(false);
      fetchTables();
    } catch (err) {
      alert('Gagal menambah meja.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'occupied' : 'available';
    await updateDoc(doc(db, 'tables', id), { status: newStatus });
    fetchTables();
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus meja ini?')) {
      await deleteDoc(doc(db, 'tables', id));
      fetchTables();
    }
  };

  return (
    <div className="pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight mb-6 text-on-surface">Manajemen Konten</h2>
        
        {/* Tabs */}
        <div className="flex p-1 bg-surface-container-high rounded-2xl mb-8">
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex-grow py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'tables' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            Daftar Meja
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-grow py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'menu' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
          >
            Daftar Menu
          </button>
        </div>
      </div>

      {activeTab === 'tables' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="font-bold text-lg text-on-surface">Data Meja ({tables.length})</h3>
            <button
              onClick={() => setShowAdd(true)}
              className="bg-primary text-on-primary px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Tambah
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tables.map((table) => (
              <div key={table.id} className="bg-surface-container-lowest p-5 rounded-3xl flex justify-between items-center shadow-sm border border-outline-variant/10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${table.status === 'available' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'}`}>
                    <span className="material-symbols-outlined text-3xl">table_restaurant</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-lg">Meja {table.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-full ${table.status === 'available' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-secondary'}`}>
                      {table.status === 'available' ? 'Tersedia' : 'Terisi'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleStatus(table.id, table.status)}
                    className="w-10 h-10 bg-surface-container-high hover:bg-surface-container-highest rounded-full flex items-center justify-center transition-colors text-primary"
                    title="Ganti Status"
                  >
                    <span className="material-symbols-outlined text-xl">sync_alt</span>
                  </button>
                  <button
                    onClick={() => handleDelete(table.id)}
                    className="w-10 h-10 text-error hover:bg-error-container rounded-full flex items-center justify-center transition-colors"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AdminMenu />
      )}

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative"
            >
              <h3 className="text-2xl font-black font-headline mb-6 text-on-surface">Tambah Meja</h3>
              <form onSubmit={handleAddTable} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Nama/Nomor Meja</label>
                  <input
                    required
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value)}
                    placeholder="Contoh: 01"
                    className="w-full bg-surface-container-high border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {loading ? 'Menambahkan...' : 'Simpan Meja'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
