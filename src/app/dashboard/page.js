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
    const jenis = String(item.jenis_penugasan || '').toLowerCase();
    return nomor.includes(query) || maksud.includes(query) || tujuan.includes(query) || jenis.includes(query);
  });

  const totalPenugasan = listPenugasan.length;
  const totalPerencanaan = listPenugasan.filter(i => !i.tahap || i.tahap === 1 || i.status === 'Surat Tugas').length;
  const totalPelaksanaan = listPenugasan.filter(i => i.tahap === 2 || i.status === 'Pelaksanaan').length;
  const totalPelaporan = listPenugasan.filter(i => i.tahap === 3 || i.status === 'Selesai' || i.status === 'Pelaporan').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* NAVBAR */}
      <AppNavbar title="Dashboard Utama" />

      {/* ISI KONTEN */}
      <main style={{ padding: '28px 20px', maxWidth: '1240px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* BANNER HEADER HALAMAN */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4338ca 100%)', 
          borderRadius: '20px', 
          padding: '28px 32px', 
          marginBottom: '28px', 
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              Sistem Informasi Manajemen Penugasan
            </div>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Inspektorat Daerah Kabupaten Malang
            </h1>
            <p style={{ margin: '6px 0 0 0', fontSize: '13.5px', color: '#e0e7ff' }}>
              Pantau seluruh progres naskah dinas, audit, KKP, hingga tindak lanjut dalam satu portal terpadu.
            </p>
          </div>

          <Link href="/penugasan/buat" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
            color: '#fff', 
            padding: '12px 22px', 
            borderRadius: '12px',
            textDecoration: 'none', 
            fontWeight: '800', 
            fontSize: '14px', 
            display: 'inline-flex',
            alignItems: 'center', 
            gap: '8px', 
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
          }}>
            <span>➕</span> Buat Penugasan Baru
          </Link>
        </div>

        {/* KARTU STATISTIK FULL GRADIENT BERWARNA */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          
          {/* CARD TOTAL */}
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Penugasan</span>
              <span style={{ fontSize: '20px' }}>📋</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#f8fafc' }}>{totalPenugasan}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>Naskah dinas terdaftar</div>
          </div>

          {/* CARD PERENCANAAN */}
          <div style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#c7d2fe', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Perencanaan</span>
              <span style={{ fontSize: '20px' }}>📝</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#fff' }}>{totalPerencanaan}</div>
            <div style={{ fontSize: '11px', color: '#e0e7ff', marginTop: '4px' }}>Surat Tugas & Preparation</div>
          </div>

          {/* CARD PELAKSANAAN */}
          <div style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#fef3c7', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Pelaksanaan</span>
              <span style={{ fontSize: '20px' }}>⚡</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#fff' }}>{totalPelaksanaan}</div>
            <div style={{ fontSize: '11px', color: '#fef3c7', marginTop: '4px' }}>Audit Lapangan & KKP</div>
          </div>

          {/* CARD PELAPORAN */}
          <div style={{ background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#d1fae5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Pelaporan</span>
              <span style={{ fontSize: '20px' }}>✅</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px', color: '#fff' }}>{totalPelaporan}</div>
            <div style={{ fontSize: '11px', color: '#ecfdf5', marginTop: '4px' }}>LHP Selesai & Tindak Lanjut</div>
          </div>

        </div>

        {/* BAR PENCARIAN */}
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text"
            placeholder="🔍 Cari nomor surat, jenis penugasan, maksud kegiatan, atau lokasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', 
              padding: '14px 18px', 
              borderRadius: '12px', 
              border: '2px solid #e2e8f0',
              fontSize: '14px', 
              outline: 'none', 
              backgroundColor: '#fff', 
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
          />
        </div>

        {/* TABEL DATA DENGAN HEADER BERWARNA INDIGO */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Memuat data penugasan...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
              {searchQuery ? 'Tidak ada data penugasan yang sesuai pencarian.' : 'Belum ada data penugasan.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px', minWidth: '850px' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', color: '#fff' }}>
                    <th style={{ padding: '16px', width: '40px' }}>No</th>
                    <th style={{ padding: '16px', width: '200px' }}>Nomor Surat</th>
                    <th style={{ padding: '16px', width: '180px' }}>Jenis Penugasan</th>
                    <th style={{ padding: '16px' }}>Maksud Penugasan</th>
                    <th style={{ padding: '16px', width: '150px' }}>Tempat Tujuan</th>
                    <th style={{ padding: '16px', width: '110px' }}>Tgl. Surat</th>
                    <th style={{ padding: '16px', width: '70px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr 
                      key={item.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '16px', color: '#64748b', fontWeight: '600' }}>{index + 1}</td>
                      
                      <td style={{ padding: '16px', fontWeight: '700' }}>
                        <Link href={`/penugasan/${item.id}`} style={{ color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>📄</span> {item.nomor_surat || 'Buka Detail'}
                        </Link>
                      </td>

                      {/* BADGE JENIS PENUGASAN */}
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          backgroundColor: '#e0e7ff', 
                          color: '#3730a3', 
                          padding: '4px 10px', 
                          borderRadius: '8px', 
                          fontSize: '11.5px', 
                          fontWeight: '700',
                          display: 'inline-block'
                        }}>
                          📌 {item.jenis_penugasan || 'Pemeriksaan / Audit Regular'}
                        </span>
                      </td>

                      <td style={{ padding: '16px', color: '#334155', lineHeight: 1.5 }}>
                        <Link href={`/penugasan/${item.id}`} style={{ color: '#334155', textDecoration: 'none' }}>
                          {item.maksud_penugasan || '-'}
                        </Link>
                      </td>

                      <td style={{ padding: '16px', color: '#475569', fontWeight: '500' }}>{item.tempat_tujuan || '-'}</td>
                      <td style={{ padding: '16px', color: '#64748b' }}>{item.tanggal_surat || '-'}</td>
                      
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleHapusPenugasan(item.id, item.nomor_surat)}
                          style={{
                            backgroundColor: '#fef2f2', 
                            color: '#ef4444', 
                            border: '1px solid #fca5a5',
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            fontWeight: 'bold', 
                            fontSize: '12px',
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
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
