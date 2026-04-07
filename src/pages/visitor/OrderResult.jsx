import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function OrderResult() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id));
        if (orderDoc.exists()) {
          setOrder(orderDoc.data());
        }
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center pb-32">
      <motion.div
        initial={{ scale: 0, rotate: -45 }}
        animate={{ scale: 1, rotate: 0 }}
        className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8"
      >
        <span className="material-symbols-outlined text-4xl text-primary font-bold">check_circle</span>
      </motion.div>

      <div className="w-full flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-lowest p-8 rounded-[3rem] shadow-2xl shadow-primary/20 mb-10 border border-outline-variant/10 relative overflow-hidden w-full max-w-sm mx-auto"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-primary-container" />
          <div className="flex justify-center mb-8">
            <QRCodeSVG 
              value={id} 
              size={200} 
              fgColor="#a83900" 
              level="H"
              marginSize={4}
            />
          </div>
          <div className="mt-8 pt-6 border-t border-dashed border-outline-variant/50">
            <p className="text-xs font-bold text-secondary uppercase tracking-[0.2em] mb-1">Kode Pesanan</p>
            <p className="text-xl font-black font-headline text-on-surface tracking-widest uppercase">{id}</p>
          </div>
        </motion.div>
      </div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto bg-surface-container-low rounded-[2rem] p-8 text-left border border-outline-variant/5 border-b-4 border-b-primary shadow-lg mb-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold font-headline">Rincian Pesanan</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">Meja {order.tableNumber}</span>
          </div>
          
          <div className="space-y-4 mb-8">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-start group">
                <div className="flex gap-3">
                  <span className="text-primary font-bold">{item.quantity}x</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface line-clamp-1">{item.name}</p>
                    <p className="text-[10px] text-secondary">{item.category}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-on-surface">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-outline-variant/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-secondary font-medium">Subtotal</span>
              <span className="text-sm font-bold">Rp {order.total ? (order.total / 1.15).toLocaleString('id-ID') : '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold font-headline">Total Bayar</span>
              <span className="text-xl font-black text-primary">Rp {order.total?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </motion.div>
      )}

      {!loading && !order && (
        <div className="p-10 text-secondary bg-surface-container-high rounded-3xl mb-10 w-full max-w-sm mx-auto">
          <span className="material-symbols-outlined text-4xl mb-2">error</span>
          <p className="font-bold">Detail pesanan tidak ditemukan.</p>
        </div>
      )}

      <div className="bg-surface-container-low rounded-3xl p-6 w-full max-w-sm mx-auto mb-12 flex items-start gap-4 text-left">
        <span className="material-symbols-outlined text-primary">info</span>
        <p className="text-sm font-medium text-secondary leading-relaxed">
          Pesanan Anda sedang disiapkan. Silakan menuju kasir untuk melakukan pembayaran dengan menunjukkan Kode QR di atas.
        </p>
      </div>

      <Link
        to="/"
        className="text-primary font-bold hover:underline flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">home</span>
        Kembali ke Halaman Utama
      </Link>
    </div>
  );
}
