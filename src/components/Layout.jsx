import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Layout({ children }) {
  const { tableNumber, tableId, resetOrder } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');

  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'restaurant');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setRestaurantName(data.name || '');
          setRestaurantAddress(data.address || '');
        }
      } catch (err) {
        console.error('Error fetching restaurant settings:', err);
      }
    };
    fetchSettings();
  }, [location.pathname]);

  const handleMoveTable = async () => {
    if (tableId) {
      try {
        const tableRef = doc(db, 'tables', tableId);
        await updateDoc(tableRef, { status: 'available' });
      } catch (err) {
        console.error('Error freeing table:', err);
      }
    }
    resetOrder();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full">
        <div className="flex flex-col">
          <Link to="/" className="text-xl font-extrabold text-primary font-headline tracking-tight leading-tight">
            {restaurantName || 'Nama Restoran'}
          </Link>
          <span className="text-[10px] text-secondary font-medium leading-tight mt-0.5">
            {restaurantAddress || ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && tableNumber && (
            <div className="flex items-center gap-2">
              <button 
                onClick={handleMoveTable}
                className="text-[10px] font-bold text-primary uppercase tracking-widest px-3 py-1.5 rounded-full border border-primary/20 hover:bg-primary/5 transition-colors"
              >
                Pindah Meja
              </button>
              <div className="bg-surface-container-high px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">table_restaurant</span>
                <span className="text-xs font-bold text-on-surface">Meja {tableNumber}</span>
              </div>
            </div>
          )}
          {isAdmin && (
            <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">
              account_circle
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-6">
        {children}
      </main>

      {!isAdmin && location.pathname === '/' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-2 bg-surface/80 backdrop-blur-md rounded-t-3xl shadow-[0_-4px_24px_rgba(27,28,27,0.06)] transition-transform duration-500">
          <Link to="/" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">table_restaurant</span>
          </Link>
        </nav>
      )}

      {isAdmin && location.pathname !== '/admin/login' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-8 pb-8 pt-2 bg-surface/80 backdrop-blur-md rounded-t-3xl shadow-[0_-4px_24px_rgba(27,28,27,0.06)]">
          <Link to="/admin/orders" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/orders' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
          </Link>
          <Link to="/admin/tables" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/tables' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">grid_view</span>
          </Link>
          <Link to="/admin/reports" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/reports' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">bar_chart</span>
          </Link>
          <Link to="/admin/settings" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/settings' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
