import { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showExportMenu]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersList = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(order => order.status !== 'DELETED');
      setOrders(ordersList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch restaurant info for export headers
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'restaurant');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRestaurantName(docSnap.data().name || '');
          setRestaurantAddress(docSnap.data().address || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);

      if (filter === 'today') {
        return orderDate.toDateString() === now.toDateString();
      } else if (filter === 'month') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      } else if (filter === 'year') {
        return orderDate.getFullYear() === now.getFullYear();
      } else if (filter === 'range') {
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [orders, filter, startDate, endDate]);

  const stats = useMemo(() => {
    const revenue = filteredOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    const guests = filteredOrders.length;

    const menuStats = {};
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (!menuStats[item.name]) menuStats[item.name] = 0;
        menuStats[item.name] += item.quantity;
      });
    });

    const bestSellers = Object.entries(menuStats)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const maxQty = bestSellers.length > 0 ? bestSellers[0].qty : 1;

    return { revenue, guests, bestSellers, maxQty };
  }, [filteredOrders]);

  // Format date for display
  const formatDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // Build table data for export and display
  const buildTableData = () => {
    return filteredOrders.map(order => ({
      tanggal: formatDate(order.createdAt) + ' ' + formatTime(order.createdAt),
      nama: order.customerName || '-',
      telp: order.customerPhone || '-',
      pesanan: order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ') || '-',
      total: order.total || 0,
    }));
  };

  const getDateRangeLabel = () => {
    if (filter === 'today') return formatDate(new Date().toISOString());
    if (filter === 'month') {
      const now = new Date();
      return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
    if (filter === 'year') return new Date().getFullYear().toString();
    if (filter === 'range') return `${formatDate(startDate + 'T00:00:00')} - ${formatDate(endDate + 'T00:00:00')}`;
    return '';
  };

  // Export PDF
  const exportPDF = () => {
    try {
      const tData = buildTableData();
      const d = new jsPDF('l', 'mm', 'a4');

      // Header
      d.setFontSize(16);
      d.setFont(undefined, 'bold');
      d.text(restaurantName || 'Laporan Restoran', 14, 18);
      d.setFontSize(9);
      d.setFont(undefined, 'normal');
      if (restaurantAddress) d.text(restaurantAddress, 14, 24);
      
      d.setFontSize(11);
      d.setFont(undefined, 'bold');
      d.text('Laporan Penjualan', 14, 34);
      d.setFontSize(9);
      d.setFont(undefined, 'normal');
      d.text(`Periode: ${getDateRangeLabel()}`, 14, 40);

      // Table
      const rows = tData.map((row, idx) => [
        idx + 1,
        row.tanggal,
        row.nama,
        row.telp,
        row.pesanan,
        'Rp ' + row.total.toLocaleString('id-ID'),
      ]);

      autoTable(d, {
        startY: 46,
        head: [['No', 'Tanggal', 'Nama Tamu', 'No. Telp', 'Pesanan', 'Total']],
        body: rows,
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [139, 69, 19], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 248, 240] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 38 },
          3: { cellWidth: 32 },
          4: { cellWidth: 'auto' },
          5: { cellWidth: 35, halign: 'right' },
        },
      });

      // Grand Total
      const finalY = (d.previousAutoTable?.finalY || 60) + 8;
      d.setFontSize(11);
      d.setFont(undefined, 'bold');
      d.text(`Grand Total: Rp ${stats.revenue.toLocaleString('id-ID')}`, 14, finalY);
      d.text(`Jumlah Transaksi: ${stats.guests}`, 14, finalY + 7);

      d.save(`Laporan_${getDateRangeLabel().replace(/[\/\s]/g, '_')}.pdf`);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Gagal export PDF: ' + err.message);
    }
  };

  // Export Excel
  const exportExcel = () => {
    try {
      const tableData = buildTableData();

      const headerRows = [
        [restaurantName || 'Laporan Restoran'],
        [restaurantAddress || ''],
        [],
        [`Laporan Penjualan - Periode: ${getDateRangeLabel()}`],
        [],
        ['No', 'Tanggal', 'Nama Tamu', 'No. Telp', 'Pesanan', 'Total'],
      ];

      const dataRows = tableData.map((row, idx) => [
        idx + 1,
        row.tanggal,
        row.nama,
        row.telp,
        row.pesanan,
        row.total,
      ]);

      const footerRows = [
        [],
        ['', '', '', '', 'Grand Total', stats.revenue],
        ['', '', '', '', 'Jumlah Transaksi', stats.guests],
      ];

      const wsData = [...headerRows, ...dataRows, ...footerRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 22 },
        { wch: 18 },
        { wch: 45 },
        { wch: 18 },
      ];

      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Laporan_${getDateRangeLabel().replace(/[\/\s]/g, '_')}.xlsx`);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('Gagal export Excel: ' + err.message);
    }
  };

  const tableData = buildTableData();

  return (
    <div className="pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2 text-on-surface">Laporan Bisnis</h2>
        <p className="text-secondary text-sm font-medium">Analisis performa restoran Anda.</p>
      </div>

      {/* Filter Selector */}
      <div className="pb-4">
        <div className="grid grid-cols-4 gap-1 p-1 bg-surface-container-high rounded-2xl">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'year', label: 'Tahun Ini' },
            { id: 'range', label: 'Rentang' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all text-center ${filter === f.id ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-secondary opacity-60'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Picker */}
      <AnimatePresence mode="wait">
        {filter === 'range' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6"
          >
            <div className="bg-surface-container-lowest border border-outline-variant/10 p-4 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Dari Tanggal</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-surface-container-high border-none rounded-xl px-4 py-2 text-sm font-bold text-primary focus:ring-0"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Sampai Tanggal</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-surface-container-high border-none rounded-xl px-4 py-2 text-sm font-bold text-primary focus:ring-0"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-primary-container/20 border border-primary/10 rounded-[2.5rem] p-6">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 opacity-60">Total Pemasukan</p>
          <h3 className="text-2xl font-black text-primary">Rp {stats.revenue.toLocaleString('id-ID')}</h3>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-[2.5rem] p-6">
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 opacity-60">Jumlah Tamu</p>
          <h3 className="text-2xl font-black text-on-surface">{stats.guests} <span className="text-xs font-medium text-secondary">Tamu</span></h3>
        </div>
      </div>

      {/* Best Sellers */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 border border-outline-variant/10 mb-8">
        <div className="flex justify-between items-center mb-8">
          <h4 className="text-lg font-black text-on-surface">Menu Terlaris</h4>
          <span className="material-symbols-outlined text-primary">trending_up</span>
        </div>

        <div className="space-y-8">
          {stats.bestSellers.map((item, idx) => (
            <div key={idx} className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="font-bold text-on-surface">{item.name}</span>
                <span className="text-sm font-black text-primary">{item.qty}x</span>
              </div>
              <div className="h-2 w-full bg-on-surface/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.qty / stats.maxQty) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full"
                />
              </div>
            </div>
          ))}

          {stats.bestSellers.length === 0 && (
            <div className="py-10 text-center opacity-30">
              <p className="text-sm font-bold">Belum ada data penjualan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Order Table */}
      <div className="bg-surface-container-lowest rounded-[2.5rem] p-6 border border-outline-variant/10 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-black text-on-surface">Detail Pesanan</h4>
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Export
            </button>

            {/* Export Dropdown */}
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-2 z-[90] bg-surface rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden min-w-[160px]">
                <button
                  onClick={() => exportPDF()}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-container-high transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-red-500 text-xl">picture_as_pdf</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Export PDF</p>
                    <p className="text-[10px] text-secondary">Format dokumen</p>
                  </div>
                </button>
                <div className="h-px bg-outline-variant/10" />
                <button
                  onClick={() => exportExcel()}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-container-high transition-colors text-left"
                >
                  <span className="material-symbols-outlined text-green-600 text-xl">table_chart</span>
                  <div>
                    <p className="text-sm font-bold text-on-surface">Export Excel</p>
                    <p className="text-[10px] text-secondary">Format spreadsheet</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto -mx-2 px-2 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : tableData.length === 0 ? (
            <div className="py-12 text-center opacity-30">
              <span className="material-symbols-outlined text-4xl mb-3 block">receipt_long</span>
              <p className="text-sm font-bold">Belum ada pesanan di periode ini.</p>
            </div>
          ) : (
            <div className="min-w-[600px]">
              {/* Table Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_1fr_2fr_1fr] gap-2 px-3 py-3 bg-surface-container-high/50 rounded-2xl mb-2">
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">No</span>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Tanggal</span>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Nama</span>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Telp</span>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest">Pesanan</span>
                <span className="text-[9px] font-black text-secondary uppercase tracking-widest text-right">Total</span>
              </div>

              {/* Table Body */}
              <div className="space-y-1">
                {tableData.map((row, idx) => (
                  <div
                    key={idx}
                    className={`grid grid-cols-[40px_1fr_1fr_1fr_2fr_1fr] gap-2 px-3 py-3 rounded-xl transition-colors ${
                      idx % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-low/30'
                    }`}
                  >
                    <span className="text-xs font-bold text-secondary">{idx + 1}</span>
                    <span className="text-xs font-medium text-on-surface">{row.tanggal}</span>
                    <span className="text-xs font-bold text-on-surface truncate">{row.nama}</span>
                    <span className="text-xs font-medium text-secondary">{row.telp}</span>
                    <span className="text-xs font-medium text-on-surface-variant line-clamp-2">{row.pesanan}</span>
                    <span className="text-xs font-black text-primary text-right whitespace-nowrap">Rp {row.total.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              {/* Grand Total Footer */}
              <div className="mt-4 pt-4 border-t-2 border-dashed border-primary/20">
                <div className="flex justify-between items-center px-3 py-3 bg-primary-container/20 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Grand Total</p>
                    <p className="text-xs text-secondary font-medium">{stats.guests} transaksi</p>
                  </div>
                  <p className="text-2xl font-black text-primary">Rp {stats.revenue.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center px-8">
        <p className="text-[10px] font-bold text-secondary/40 uppercase tracking-[0.2em]">Generated via Restaurant Analytics</p>
      </div>
    </div>
  );
}
