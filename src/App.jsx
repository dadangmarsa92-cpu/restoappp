import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TableSelection from './pages/visitor/TableSelection';
import Menu from './pages/visitor/Menu';
import Checkout from './pages/visitor/Checkout';
import OrderResult from './pages/visitor/OrderResult';

// Admin Pages
import AdminLogin from './pages/admin/Login';
import AdminScanner from './pages/admin/Scanner';
import AdminMenu from './pages/admin/Menu';
import AdminTables from './pages/admin/Tables';
import Setup from './pages/admin/Setup';
import { useStore } from './store/useStore';

function App() {
  const { tableNumber } = useStore();

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Visitor Routes */}
          <Route path="/" element={<TableSelection />} />
          <Route 
            path="/menu" 
            element={tableNumber ? <Menu /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/checkout" 
            element={tableNumber ? <Checkout /> : <Navigate to="/" replace />} 
          />
          <Route path="/order/:id" element={<OrderResult />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/scan" replace />} />
          <Route path="/admin/scan" element={<AdminScanner />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/tables" element={<AdminTables />} />
          <Route path="/admin/setup" element={<Setup />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
