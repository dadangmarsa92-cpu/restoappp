import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, scanned, paid

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanFailure);

    function onScanSuccess(decodedText) {
      scanner.clear();
      handleFetchOrder(decodedText);
    }

    function onScanFailure(error) {
      // ignore
    }

    return () => {
      scanner.clear();
    };
  }, []);

  const handleFetchOrder = async (orderId) => {
    setLoading(true);
    setScanResult(orderId);
    try {
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        setOrderData(orderDoc.data());
        setStatus('scanned');
      } else {
        alert('Order tidak ditemukan!');
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePayment = async () => {
    if (!scanResult) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'orders', scanResult), {
        status: 'PAID',
        paidAt: new Date().toISOString()
      });
      setStatus('paid');
    } catch (err) {
      alert('Gagal memproses pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-32">
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight mb-2">Kasir Scanner</h2>
        <p className="text-secondary font-medium">Scan QR Code pengunjung untuk memproses pembayaran.</p>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-[2.5rem] bg-on-surface/5 border-4 border-dashed border-outline-variant/30 relative"
          >
            <div id="reader" className="w-full"></div>
            <div className="p-8 text-center bg-surface/80 backdrop-blur-md absolute bottom-0 w-full">
              <p className="text-xs font-bold text-secondary uppercase tracking-widest mb-1">Status Scanner</p>
              <p className="text-sm font-bold text-primary flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Siap Memindai
              </p>
            </div>
          </motion.div>
        )}

        {status === 'scanned' && orderData && (
          <motion.div
            key="order-detail"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-surface-container-high p-6 rounded-3xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-secondary uppercase tracking-widest">Pemesanan</p>
                  <h3 className="text-2xl font-black font-headline text-on-surface uppercase">{scanResult}</h3>
                </div>
                <div className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Pending
                </div>
              </div>

              <div className="space-y-4 border-t border-outline-variant/30 pt-6">
                {orderData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm font-medium">
                    <span className="text-secondary">{item.quantity}x {item.name}</span>
                    <span className="text-on-surface">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-outline-variant/50 mt-6 pt-6 flex justify-between items-center">
                <span className="font-bold text-on-surface">Total Harga</span>
                <span className="text-xl font-black text-primary">Rp {orderData.total.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-3xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary">table_restaurant</span>
              </div>
              <div>
                <p className="text-xs font-bold text-secondary uppercase tracking-widest">Detail Pelanggan</p>
                <p className="font-extrabold text-on-surface">{orderData.customerName} • Meja {orderData.tableNumber}</p>
              </div>
            </div>

            <button
              disabled={loading}
              onClick={handleCompletePayment}
              className="w-full bg-primary text-on-primary py-4 rounded-full font-headline font-bold text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              {loading ? 'Memproses...' : 'Selesaikan Pembayaran'}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full text-secondary font-bold text-sm py-2"
            >
              Batalkan / Scan Ulang
            </button>
          </motion.div>
        )}

        {status === 'paid' && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-12 text-center"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <span className="material-symbols-outlined text-5xl text-green-600 font-bold">verified</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Pembayaran Lunas</h2>
            <p className="text-secondary font-medium mb-10">Pesanan telah divalidasi dan dicatat sebagai lunas.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold shadow-lg"
            >
              Scan Pesanan Lain
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
