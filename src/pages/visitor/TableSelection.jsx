import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function TableSelection() {
  const navigate = useNavigate();
  const { setTableNumber, setTableId, setUserInfo } = useStore();
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tables'));
        const tableList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tableList.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        setTables(tableList);
      } catch (err) {
        console.error('Error fetching tables:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleTableClick = (table) => {
    if (table.status === 'available') {
      setSelectedTable(table.name);
      setSelectedTableId(table.id);
    }
  };

  const handleContinue = () => {
    if (selectedTable) {
      setShowModal(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name && formData.phone && selectedTableId) {
      try {
        // Update status meja di Firestore
        const tableRef = doc(db, 'tables', selectedTableId);
        await updateDoc(tableRef, { status: 'occupied' });

        setTableNumber(selectedTable);
        setTableId(selectedTableId);
        setUserInfo(formData);
        setShowModal(false);
        navigate('/menu');
      } catch (err) {
        console.error('Error updating table status:', err);
        alert('Gagal memilih meja. Silakan coba lagi.');
      }
    }
  };

  return (
    <div className="pb-24">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Pilih Meja Anda</h2>
        <p className="text-secondary font-medium">Silakan pilih meja yang tersedia untuk memulai pengalaman kuliner Anda.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Terisi</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {tables.map((table) => (
            <button
              key={table.id}
              disabled={table.status === 'occupied'}
              onClick={() => handleTableClick(table)}
              className={`relative aspect-square rounded-xl p-2 flex flex-col justify-between items-center text-center transition-all active:scale-95 group ${
                table.status === 'occupied' 
                   ? 'bg-surface-container-high opacity-60 cursor-not-allowed' 
                   : selectedTable === table.name 
                     ? 'bg-surface-container-lowest shadow-sm border-2 border-primary' 
                     : 'bg-surface-container-lowest shadow-sm hover:bg-surface-container-low'
               }`}
             >
               <div className="flex flex-col items-center gap-1">
                 <span className={`text-lg font-bold font-headline ${selectedTable === table.name ? 'text-primary' : 'text-on-surface'}`}>{table.name}</span>
                 <span className={`material-symbols-outlined text-sm ${selectedTable === table.name ? 'text-primary' : 'text-outline-variant'}`}>
                   {table.status === 'occupied' ? 'person' : selectedTable === table.name ? 'check_circle' : 'table_restaurant'}
                 </span>
               </div>
               <div className="mt-auto">
                 <span className={`text-[8px] font-bold uppercase tracking-tighter ${table.status === 'occupied' ? 'text-secondary' : 'text-primary'}`}>
                   {table.status === 'occupied' ? 'Terisi' : 'Tersedia'}
                 </span>
               </div>
             </button>
           ))}
         </div>
      )}

      <div className="fixed bottom-0 left-0 w-full p-6 pb-24 z-40 bg-gradient-to-t from-background to-transparent">
        <button
          onClick={handleContinue}
          disabled={!selectedTable}
          className={`w-full py-4 rounded-full font-headline font-bold text-lg shadow-lg active:scale-[0.98] transition-all ${
            selectedTable 
              ? 'bg-gradient-to-r from-primary to-primary-container text-on-primary' 
              : 'bg-surface-container-highest text-secondary opacity-50 cursor-not-allowed'
          }`}
        >
          Lanjutkan
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface w-full max-w-sm rounded-3xl p-8 shadow-2xl relative"
            >
              <h3 className="text-2xl font-bold font-headline mb-6">Identitas Pengunjung</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Nama Lengkap</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-secondary uppercase tracking-widest mb-2">Nomor Telepon</label>
                  <input
                    required
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="0812xxxx"
                    className="w-full bg-surface-container-highest border-none rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold font-headline shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Mulai Pesan
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
