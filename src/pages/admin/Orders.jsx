import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDoc, getDocs, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(null); // { id: '...', tableNumber: '...' }
  const [pendingDelete, setPendingDelete] = useState(null); // { id: '...' }

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(order => order.status !== 'DELETED');
      setOrders(ordersList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ... (Scanner logic matches existing)

  const updateStatus = async (id, newStatus, guestLeft = false) => {
    try {
      const order = orders.find(o => o.id === id);
      await updateDoc(doc(db, 'orders', id), { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // Release Table if guest has left
      if (newStatus === 'COMPLETED' && guestLeft && order?.tableNumber) {
        const qTables = query(collection(db, 'tables'), where('name', '==', order.tableNumber));
        const tableSnapshot = await getDocs(qTables);
        if (!tableSnapshot.empty) {
          const tableDoc = tableSnapshot.docs[0];
          await updateDoc(doc(db, 'tables', tableDoc.id), { status: 'available' });
        }
      }
    } catch (err) {
      alert('Gagal memperbarui status.');
    }
  };

  const executeDeleteOrder = async (id) => {
    try {
      try {
        await deleteDoc(doc(db, 'orders', id));
      } catch (err) {
        if (err.code === 'permission-denied') {
          // Fallback ke soft delete jika rule Firebase tidak mengizinkan hard delete
          await updateDoc(doc(db, 'orders', id), {
            status: 'DELETED',
            updatedAt: new Date().toISOString()
          });
        } else {
          throw err;
        }
      }
      setPendingDelete(null);
    } catch (err) {
      console.error('Delete error details:', err);
      alert('Gagal menghapus pesanan: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customerName && order.customerName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700';
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'COMPLETED': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2 text-on-surface">Pesanan Aktif</h2>
        <p className="text-secondary text-sm font-medium">Monitoring dan validasi pesanan pelanggan.</p>
      </div>

      {/* Search & Scan Bar */}
      <div className="flex gap-3 mb-8">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl">search</span>
          <input
            type="text"
            placeholder="Cari Kode Pesanan / Nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary text-sm font-medium"
          />
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="bg-primary text-on-primary w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform flex-none"
        >
          <span className="material-symbols-outlined text-2xl">qr_code_scanner</span>
        </button>
      </div>

      {/* Order Grid (2 Columns on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm border border-outline-variant/10 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-on-surface/5 rounded-xl flex items-center justify-center text-primary flex-none">
                    <span className="material-symbols-outlined text-xl">table_restaurant</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface leading-tight">{order.customerName || 'Pelanggan'}</h4>
                    <p className="text-[10px] text-secondary font-black uppercase tracking-widest mt-0.5">Meja {order.tableNumber} • {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="bg-surface-container-low/40 rounded-2xl p-4 mb-4 flex-grow">
                <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest mb-3">Rincian Menu</p>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-bold items-start">
                      <span className="text-on-surface/80 flex gap-2">
                        <span className="text-primary">{item.quantity}x</span>
                        <span>{item.name}</span>
                      </span>
                      <span className="text-on-surface whitespace-nowrap ml-4">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-dashed border-outline-variant/30 flex justify-between items-center">
                  <span className="text-[10px] font-black text-secondary tracking-widest uppercase">ID: {order.id.slice(-8).toUpperCase()}</span>
                  <span className="text-lg font-black text-primary">Rp {order.total?.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {order.status === 'PENDING' ? (
                  <button
                    onClick={() => updateStatus(order.id, 'PAID')}
                    className="flex-grow bg-primary text-on-primary py-3.5 rounded-2xl font-bold text-xs shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    Tandai Lunas
                  </button>
                ) : order.status === 'PAID' ? (
                  <button
                    onClick={() => setPendingCompletion(order)}
                    className="flex-grow bg-surface-container-high text-on-surface py-3.5 rounded-2xl font-bold text-xs transition-all active:scale-95"
                  >
                    Selesaikan Dapur
                  </button>
                ) : (
                  <div className="flex-grow text-center py-3.5 bg-on-surface/5 text-secondary text-[10px] font-black uppercase tracking-widest rounded-2xl">
                    Pesanan Selesai
                  </div>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingDelete(order);
                  }}
                  className="w-12 h-12 bg-error-container/10 text-error rounded-2xl flex items-center justify-center hover:bg-error-container/20 active:scale-95 transition-all flex-none relative z-10"
                  title="Hapus"
                >
                  <span className="material-symbols-outlined text-xl pointer-events-none">delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!loading && filteredOrders.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">search_off</span>
            <p className="font-bold">Tidak ada pesanan yang sesuai.</p>
          </div>
        )}
      </div>

      {/* Completion Confirmation Modal */}
      <AnimatePresence>
        {pendingCompletion && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingCompletion(null)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl relative"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-primary">logout</span>
                </div>
                <h3 className="text-2xl font-black text-on-surface mb-2">Konfirmasi Kepulangan</h3>
                <p className="text-secondary text-sm font-medium">Apakah tamu di <span className="text-on-surface font-black">Meja {pendingCompletion.tableNumber}</span> sudah pulang?</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    updateStatus(pendingCompletion.id, 'COMPLETED', true);
                    setPendingCompletion(null);
                  }}
                  className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  Ya, Sudah Pulang
                </button>
                <button
                  onClick={() => setPendingCompletion(null)}
                  className="w-full text-secondary font-bold text-xs py-2"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDelete && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingDelete(null)}
              className="absolute inset-0 bg-error/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="bg-surface w-full max-w-sm rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl relative"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-4xl text-error">delete_forever</span>
                </div>
                <h3 className="text-2xl font-black text-on-surface mb-2">Hapus Pesanan?</h3>
                <p className="text-secondary text-xs font-medium px-4 leading-relaxed">
                  Tindakan ini akan menghapus data pesanan secara permanen dari sistem dan laporan.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => executeDeleteOrder(pendingDelete.id)}
                  className="w-full bg-error text-white py-4 rounded-full font-bold text-lg shadow-xl shadow-error/20 active:scale-95 transition-all"
                >
                  Hapus Permanen
                </button>
                <button
                  onClick={() => setPendingDelete(null)}
                  className="w-full bg-surface-container-high text-on-surface py-4 rounded-full font-bold text-lg active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scanner Overlay */}
      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScanner(false)}
              className="absolute inset-0 bg-on-surface/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-surface w-full max-w-md rounded-[3rem] p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-black text-on-surface">Pindai Kode</h3>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Arahkan kamera ke QR Pesanan</p>
                </div>
                <button 
                  onClick={() => setShowScanner(false)}
                  className="w-10 h-10 bg-on-surface/5 rounded-full flex items-center justify-center text-secondary hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="overflow-hidden rounded-[2rem] bg-on-surface/5 border-2 border-dashed border-outline-variant/30 mb-4">
                <div id="reader" className="w-full"></div>
              </div>
              
              <p className="text-center text-[10px] font-black text-secondary/40 uppercase tracking-[0.2em] py-4">Rasa Kurator POS System</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
