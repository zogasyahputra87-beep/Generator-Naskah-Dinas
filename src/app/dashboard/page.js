'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppNavbar from '../../components/AppNavbar';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DashboardPage() {
  const [listPenugasan, setListPenugasan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPenugasan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?select=*&order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setListPenugasan(data);
      }
    } catch (err) {
      console.error('Gagal mengambil data penugasan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenugasan();
  }, []);

  const handleHapusPenugasan = async (id, nomorSurat) => {
    const konfirmasi = window.confirm(`Apakah Anda yakin ingin menghapus data penugasan nomor:\n"${nomorSurat || id}"?`);
    if (!konfirmasi) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (response.ok) {
        setListPenugasan(listPenugasan.filter(item => item.id !== id));
      } else {
        alert('Gagal menghapus data penugasan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menghapus.');
    }
  };

  const filteredData = listPenugasan.filter(item => {
    const query = searchQuery.toLowerCase();
    const nomor = String(item.nomor_surat || '').toLowerCase();
    const maksud = String(item.maksud_penugasan || '').toLowerCase();
    const tujuan = String(item.tempat_tujuan || '').toLowerCase();
    return nomor.includes(query) || maksud.includes(query) || tujuan.includes(query);
  });

  const totalPenugasan = listPenugasan.length;
  const totalPerencanaan = listPenugasan.filter(i => !i.tahap || i.tahap === 1 || i.status === 'Surat Tugas').length;
  const totalPelaksanaan = listPenugasan.filter(i => i.tahap === 2 || i.status === 'Pelaksanaan').length;
  const totalPelaporan = listPenugasan.filter(i => i.tahap === 3 || i.status === 'Selesai' || i.status === 'Pelaporan').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* NAVBAR & SIDEBAR HIDDEN TERPUSAT */}
      <AppNavbar title="Dashboard Utama" />

      {/* MAIN CONTENT */}
      <main style={{ padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* JUDUL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
              Dashboard Penugasan
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
              Inspektorat Daerah Kabupaten Malang
            </p>
          </div>

          <Link href="/penugasan/baru" style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff', padding: '10px 18px', borderRadius: '10px',
            textDecoration: 'none', fontWeight: '700', fontSize: '13.5px', display: 'inline-flex',
            alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
          }}>
            <span>+</span> Buat Penugasan Baru
          </Link>
        </div>

        {/* KARTU STATISTIK */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Total Penugasan</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{totalPenugasan}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', borderLeft: '4px solid #6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: '700', textTransform: 'uppercase' }}>1. Perencanaan</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#3730a3', marginTop: '4px' }}>{totalPerencanaan}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '700', textTransform: 'uppercase' }}>2. Pelaksanaan</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>{totalPelaksanaan}</div>
          </div>

          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', textTransform: 'uppercase' }}>3. Pelaporan</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: '#047857', marginTop: '4px' }}>{totalPelaporan}</div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div style={{ marginBottom: '16px' }}>
          <input 
            type="text"
            placeholder="🔍 Cari nomor surat, maksud kegiatan, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1',
              fontSize: '13.5px', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* TABEL DATA */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflowX: 'auto', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.04)' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data penugasan...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
              {searchQuery ? 'Tidak ada data yang sesuai pencarian.' : 'Belum ada data penugasan.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '650px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 16px', width: '40px' }}>No</th>
                  <th style={{ padding: '12px 16px', width: '200px' }}>Nomor Surat (Detail)</th>
                  <th style={{ padding: '12px 16px' }}>Maksud Penugasan</th>
                  <th style={{ padding: '12px 16px', width: '160px' }}>Tempat Tujuan</th>
                  <th style={{ padding: '12px 16px', width: '110px' }}>Tgl. Surat</th>
                  <th style={{ padding: '12px 16px', width: '70px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{index + 1}</td>
                    
                    <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                      <Link href={`/penugasan/${item.id}`} style={{ color: '#4f46e5', textDecoration: 'none' }}>
                        📄 {item.nomor_surat || 'Buka Detail'}
                      </Link>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#334155' }}>
                      <Link href={`/penugasan/${item.id}`} style={{ color: '#334155', textDecoration: 'none' }}>
                        {item.maksud_penugasan || '-'}
                      </Link>
                    </td>

                    <td style={{ padding: '12px 16px', color: '#475569' }}>{item.tempat_tujuan || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{item.tanggal_surat || '-'}</td>
                    
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleHapusPenugasan(item.id, item.nomor_surat)}
                        style={{
                          backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5',
                          padding: '6px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}
