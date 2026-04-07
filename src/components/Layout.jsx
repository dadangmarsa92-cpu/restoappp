import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Layout({ children }) {
  const { tableNumber } = useStore();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-background text-on-surface pb-32">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4 w-full border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">menu</button>
          <Link to="/" className="text-xl font-extrabold text-primary font-headline tracking-tight">Rasa Kurator</Link>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && tableNumber && (
            <div className="bg-surface-container-high px-4 py-1.5 rounded-full flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">table_restaurant</span>
              <span className="text-xs font-bold text-on-surface">Meja {tableNumber}</span>
            </div>
          )}
          <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-container-high transition-colors">
            {isAdmin ? 'account_circle' : 'search'}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-6">
        {children}
      </main>

      {!isAdmin && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-2 bg-surface/80 backdrop-blur-md rounded-t-3xl shadow-[0_-4px_24px_rgba(27,28,27,0.06)] transition-transform duration-500">
          {!tableNumber && (
            <Link to="/" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
              <span className="material-symbols-outlined">table_restaurant</span>
            </Link>
          )}
          <Link to="/menu" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/menu' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">restaurant_menu</span>
          </Link>
          <Link to="/checkout" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/checkout' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">shopping_cart</span>
          </Link>
        </nav>
      )}

      {isAdmin && location.pathname !== '/admin/login' && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-2 bg-surface/80 backdrop-blur-md rounded-t-3xl shadow-[0_-4px_24px_rgba(27,28,27,0.06)]">
          <Link to="/admin/scan" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/scan' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">qr_code_scanner</span>
          </Link>
          <Link to="/admin/menu" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/menu' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">inventory_2</span>
          </Link>
          <Link to="/admin/tables" className={`flex flex-col items-center justify-center p-3 transition-all ${location.pathname === '/admin/tables' ? 'bg-primary text-white rounded-full scale-110 shadow-lg' : 'text-secondary'}`}>
            <span className="material-symbols-outlined">grid_view</span>
          </Link>
        </nav>
      )}
    </div>
  );
}
