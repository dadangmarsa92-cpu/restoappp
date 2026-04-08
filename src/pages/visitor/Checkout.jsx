import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, updateQuantity, tableNumber, userInfo, clearCart } = useStore();

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = total * 0.1;
  const service = total * 0.05;
  const grandTotal = total + tax + service;

  const handlePlaceOrder = async () => {
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        customerName: userInfo.name,
        customerPhone: userInfo.phone,
        tableNumber: tableNumber,
        items: cart,
        total: grandTotal,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
      clearCart();
      navigate(`/order/${orderRef.id}`);
    } catch (err) {
      alert('Gagal mengirim pesanan. Periksa koneksi Anda.');
    }
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="material-symbols-outlined text-6xl text-surface-container-high mb-4">shopping_basket</span>
        <h3 className="text-xl font-bold font-headline mb-2">Keranjang Kosong</h3>
        <p className="text-secondary mb-8">Pilih menu lezat kami untuk memulai pesanan.</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-primary text-on-primary px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Lihat Menu
        </button>
      </div>
    );
  }

  return (
    <div className="pb-44">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold tracking-tight mb-2">Ringkasan</h2>
        <p className="text-secondary font-medium">Pastikan pesanan Anda sudah sesuai.</p>
      </div>

      <div className="space-y-6 mb-12">
        {cart.map((item) => (
          <div key={item.cartId} className="flex gap-4 items-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm flex-none">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-grow">
              <h4 className="font-bold text-on-surface line-clamp-1">{item.name}</h4>
              {item.selectedAddOns?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1 mb-1">
                  {item.selectedAddOns.map((s, idx) => (
                    <span key={idx} className="text-[10px] bg-secondary/10 text-secondary-variant px-1.5 py-0.5 rounded font-medium">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm font-extrabold text-primary">Rp {item.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-high rounded-full px-2 py-1">
              <button
                onClick={() => updateQuantity(item.cartId, -1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-sm">remove</span>
              </button>
              <span className="font-bold min-w-[1rem] text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.cartId, 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-low rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center text-sm font-medium text-secondary">
          <span>Subtotal</span>
          <span className="text-on-surface">Rp {total.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-medium text-secondary">
          <span>Pajak (10%)</span>
          <span className="text-on-surface">Rp {tax.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-medium text-secondary">
          <span>Layanan (5%)</span>
          <span className="text-on-surface">Rp {service.toLocaleString('id-ID')}</span>
        </div>
        <div className="pt-4 border-t border-outline-variant/30 flex justify-between items-center">
          <span className="font-bold font-headline text-lg">Total Bayar</span>
          <span className="font-extrabold font-headline text-2xl text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="mt-8 bg-surface-container-lowest rounded-3xl p-6 flex items-center gap-4 border border-outline-variant/10">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-primary">person_pin_circle</span>
        </div>
        <div>
          <p className="text-xs font-bold text-secondary uppercase tracking-widest">Detail Pelanggan</p>
          <p className="font-extrabold text-on-surface">{userInfo.name} • Meja {tableNumber}</p>
          <p className="text-xs text-secondary font-medium tracking-tight">{userInfo.phone}</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full p-6 pb-12 z-40 bg-gradient-to-t from-background to-transparent flex flex-col gap-3">
        <button
          onClick={() => navigate('/menu')}
          className="w-full bg-surface-container-highest text-on-surface py-4 rounded-full font-headline font-bold text-lg border border-outline-variant/30 hover:bg-surface-container-highest shadow-sm active:scale-95 transition-all"
        >
          + Tambah Menu
        </button>
        <button
          onClick={handlePlaceOrder}
          className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
        >
          Konfirmasi Pesanan
        </button>
      </div>
    </div>
  );
}
