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
    <div className="flex flex-col items-center justify-center py-6 text-center pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-auto mb-4"
      >
        <div className="bg-primary/5 rounded-[2rem] p-4 border border-primary/10 relative overflow-hidden group">
          <div className="relative flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-none">
              <span className="material-symbols-outlined text-2xl text-primary font-bold">restaurant_menu</span>
            </div>
            <div>
              <h2 className="text-lg font-black font-headline text-on-surface leading-tight mb-1">Pesanan Anda Disiapkan!</h2>
              <p className="text-[11px] text-secondary font-medium leading-relaxed">
                Tunjukkan QR Code di bawah ini ke kasir untuk proses pembayaran.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-surface-container-lowest p-6 rounded-[2.5rem] shadow-xl border border-outline-variant/10 relative overflow-hidden w-full max-w-md mx-auto"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-outline-variant/5">
            <QRCodeSVG 
              value={id || "error"} 
              size={180} 
              fgColor="#a83900" 
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-2">Kode Verifikasi Kasir</p>
          <div className="bg-surface-container-high/30 p-3 rounded-2xl border border-outline-variant/10 inline-block px-6">
            <p className="text-lg font-black font-headline text-on-surface tracking-[0.1em] uppercase">{id}</p>
          </div>
        </div>

        {order && (
          <div className="text-left border-t border-dashed border-outline-variant/30 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold font-headline text-on-surface">Rincian Pesanan</h3>
              <span className="bg-primary/10 text-primary text-[10px] font-black uppercase px-3 py-1 rounded-full">Meja {order.tableNumber}</span>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar mb-4 pr-1">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-primary font-bold text-sm">{item.quantity}x</span>
                    <div>
                      <p className="text-sm font-bold text-on-surface line-clamp-1">{item.name}</p>
                      <p className="text-[10px] text-secondary">{item.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-on-surface">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center bg-surface-container-low/50 -mx-6 px-6 py-4 mt-2">
              <span className="font-bold text-on-surface uppercase text-[10px] tracking-widest opacity-60">Total Bayar</span>
              <span className="text-2xl font-black text-primary font-headline">Rp {order.total?.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}
      </motion.div>

      {!loading && !order && (
        <div className="p-8 text-secondary bg-surface-container-high rounded-3xl mb-6 w-full max-w-sm mx-auto">
          <span className="material-symbols-outlined text-4xl mb-2 text-error">error</span>
          <p className="font-bold">Pesanan tidak ditemukan.</p>
        </div>
      )}

      <div className="mt-8">
        <Link
          to="/menu"
          className="bg-surface-container-high text-on-surface px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-surface-container-highest transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">restaurant_menu</span>
          Kembali ke Menu
        </Link>
      </div>
    </div>
  );
}
