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
  const [filterJenis, setFilterJenis] = useState('ALL'); // STATE BARU UNTUK FILTER JENIS

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

  // LOGIKA FILTER GANDA (KATA KUNCI + JENIS PENUGASAN)
  const filteredData = listPenugasan.filter(item => {
    const query = searchQuery.toLowerCase();
    const nomor = String(item.nomor_surat || '').toLowerCase();
    const maksud = String(item.maksud_penugasan || '').toLowerCase();
    const tujuan = String(item.tempat_tujuan || '').toLowerCase();
    const jenis = String(item.jenis_penugasan || 'Pemeriksaan / Audit Regular');

    const matchSearch = nomor.includes(query) || maksud.includes(query) || tujuan.includes(query);
    const matchJenis = filterJenis === 'ALL' || jenis === filterJenis;

    return matchSearch && matchJenis;
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
        
        {/* BANNER HEADER */}
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
              Pantau seluruh progres naskah dinas, audit, KKP, hingga rekapitulasi penugasan tahunan.
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

        {/* KARTU STATISTIK */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase' }}>Total Penugasan</span>
              <span style={{ fontSize: '20px' }}>📋</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>{totalPenugasan}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>Naskah dinas terdaftar</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#c7d2fe', fontWeight: '800', textTransform: 'uppercase' }}>1. Perencanaan</span>
              <span style={{ fontSize: '20px' }}>📝</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>{totalPerencanaan}</div>
            <div style={{ fontSize: '11px', color: '#e0e7ff', marginTop: '4px' }}>Surat Tugas & Preparation</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#fef3c7', fontWeight: '800', textTransform: 'uppercase' }}>2. Pelaksanaan</span>
              <span style={{ fontSize: '20px' }}>⚡</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>{totalPelaksanaan}</div>
            <div style={{ fontSize: '11px', color: '#fef3c7', marginTop: '4px' }}>Audit Lapangan & KKP</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #047857 0%, #10b981 100%)', borderRadius: '16px', padding: '22px', color: '#fff', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', color: '#d1fae5', fontWeight: '800', textTransform: 'uppercase' }}>3. Pelaporan</span>
              <span style={{ fontSize: '20px' }}>✅</span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '8px' }}>{totalPelaporan}</div>
            <div style={{ fontSize: '11px', color: '#ecfdf5', marginTop: '4px' }}>LHP Selesai & Tindak Lanjut</div>
          </div>
        </div>

        {/* FITUR PENCARIAN & FILTER JENIS PENUGASAN (DIPISAHKAN DENGAN DROPDOWN) */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          
          {/* SEARCH BAR KATA KUNCI */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input 
              type="text"
              placeholder="🔍 Cari nomor surat, maksud kegiatan, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', 
                padding: '12px 16px', 
                borderRadius: '12px', 
                border: '2px solid #e2e8f0',
                fontSize: '13.5px', 
                outline: 'none', 
                backgroundColor: '#fff', 
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* DROPDOWN FILTER JENIS PENUGASAN */}
          <div style={{ width: '280px' }}>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '13.5px',
                backgroundColor: '#fff',
                fontWeight: '700',
                color: '#1e1b4b',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="ALL">📌 Semua Jenis Penugasan</option>
              <option value="Pemeriksaan / Audit Regular">Pemeriksaan / Audit Regular</option>
              <option value="Pemeriksaan APBDes">Pemeriksaan APBDes / Desa</option>
              <option value="Pemeriksaan Dengan Tujuan Tertentu (PDTT)">PDTT</option>
              <option value="Reviu (RKA / LKPJ / LPPD / LKPD)">Reviu</option>
              <option value="Evaluasi / Monitoring">Evaluasi / Monitoring</option>
              <option value="Pendampingan / Asistensi / E-Consulting">Pendampingan / Asistensi</option>
              <option value="Pemeriksaan Khusus / Pengaduan (BAK)">Pemeriksaan Khusus / Pengaduan</option>
              <option value="Perjalanan Dinas / Rapat Koordinasi">Perjalanan Dinas / Rapat</option>
            </select>
          </div>

        </div>

        {/* TABEL DATA */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Memuat data penugasan...</div>
          ) : filteredData.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>
              {searchQuery || filterJenis !== 'ALL' ? 'Tidak ada penugasan yang cocok dengan filter / pencarian.' : 'Belum ada data penugasan.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px', minWidth: '900px' }}>
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
                  {filteredData.map((item, index) => {
                    const jenisText = item.jenis_penugasan || 'Pemeriksaan / Audit Regular';
                    return (
                      <tr 
                        key={item.id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
                        }}
                      >
                        <td style={{ padding: '16px', color: '#64748b', fontWeight: '600' }}>{index + 1}</td>
                        
                        <td style={{ padding: '16px', fontWeight: '700' }}>
                          <Link href={`/penugasan/${item.id}`} style={{ color: '#4f46e5', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span>📄</span> {item.nomor_surat || 'Buka Detail'}
                          </Link>
                        </td>

                        {/* BADGE VISUAL JENIS PENUGASAN */}
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
                            📌 {jenisText}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
