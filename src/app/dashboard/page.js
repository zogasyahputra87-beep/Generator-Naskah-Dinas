'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DashboardPage() {
  const [listPenugasan, setListPenugasan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State Responsif Sidebar (Sembunyi/Tampil)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* STYLE ANIMASI GLOBAL */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .card-hover {
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.08);
        }
      `}</style>

      {/* OVERLAY UNTUK HP SAAT SIDEBAR BUKA */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)', zIndex: 40, transition: 'all 0.3s'
          }}
        />
      )}

      {/* SIDEBAR NAVIGATION (LAPTOP: PERMANEN / HP: SLIDE-IN) */}
      <aside style={{
        position: 'fixed', top: 0, bottom: 0, left: 0, width: '260px',
        backgroundColor: '#0f172a', color: '#f8fafc', zIndex: 50,
        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column', padding: '24px 16px'
      }}>
        {/* LOGO & BRAND */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#3b82f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
            I
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>INSPEKTORAT</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>KABUPATEN MALANG</div>
          </div>
        </div>

        {/* MENU UTAMA */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px', backgroundColor: '#1e293b', color: '#38bdf8', fontWeight: 'bold', textDecoration: 'none', fontSize: '14px' }}>
            <span>📊</span> Dashboard Utama
          </Link>
          <Link href="/penugasan/baru" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '8px', color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', transition: 'background 0.2s' }}>
            <span>📝</span> Penugasan Baru
          </Link>
        </nav>

        {/* FOOTER SIDEBAR */}
        <div style={{ borderTop: '1px solid #334155', paddingTop: '16px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
          SIM-PENUGASAN v2.0
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* TOP BAR / HEADER */}
        <header style={{ height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', padding: '8px', borderRadius: '6px', backgroundColor: '#f1f5f9' }}
          >
            ☰
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Selamat Datang, Tim Audit</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#334155', fontSize: '13px' }}>
              TA
            </div>
          </div>
        </header>

        {/* AREA ISI HALAMAN */}
        <main style={{ padding: '24px', flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }} className="animate-fade-in">
          
          {/* JUDUL & AKSEN TOMBOL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>
                Dashboard Penugasan
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
                Kelola dan pantau seluruh naskah dinas serta tahapan pengawasan daerah.
              </p>
            </div>

            <Link href="/penugasan/baru" style={{
              backgroundColor: '#2563eb', color: '#fff', padding: '10px 20px', borderRadius: '10px',
              textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', display: 'inline-flex',
              alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
              transition: 'transform 0.2s'
            }}>
              <span>+</span> Buat Penugasan Baru
            </Link>
          </div>

          {/* KARTU STATISTIK EKSEKUTIF WITH HOVER ANIMATION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            
            <div className="card-hover" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Penugasan</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>{totalPenugasan}</div>
            </div>

            <div className="card-hover" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>1. Perencanaan</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#1d4ed8', marginTop: '6px' }}>{totalPerencanaan}</div>
            </div>

            <div className="card-hover" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #f59e0b', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#d97706', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>2. Pelaksanaan Lapangan</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#b45309', marginTop: '6px' }}>{totalPelaksanaan}</div>
            </div>

            <div className="card-hover" style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', borderLeft: '4px solid #10b981', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>3. Pelaporan & LHP</div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: '#047857', marginTop: '6px' }}>{totalPelaporan}</div>
            </div>

          </div>

          {/* BAR PENCARIAN */}
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="text"
              placeholder="🔍 Cari berdasarkan nomor surat, maksud kegiatan, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '14px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                fontSize: '14px', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
              }}
            />
          </div>

          {/* TABEL MODERN RESPONSIVE */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.03)' }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Memuat data penugasan...</div>
            ) : filteredData.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                {searchQuery ? 'Tidak ada data penugasan yang sesuai.' : 'Belum ada data penugasan.'}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                    <th style={{ padding: '14px 18px', width: '50px' }}>No</th>
                    <th style={{ padding: '14px 18px', width: '220px' }}>Nomor Surat (Detail & Tahapan)</th>
                    <th style={{ padding: '14px 18px' }}>Maksud Penugasan</th>
                    <th style={{ padding: '14px 18px', width: '180px' }}>Tempat Tujuan</th>
                    <th style={{ padding: '14px 18px', width: '110px' }}>Tgl. Surat</th>
                    <th style={{ padding: '14px 18px', width: '80px', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '14px 18px', color: '#64748b' }}>{index + 1}</td>
                      
                      {/* LINK BUKA DETAIL PENUGASAN */}
                      <td style={{ padding: '14px 18px', fontWeight: '700' }}>
                        <Link href={`/penugasan/${item.id}`} style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>📄</span> {item.nomor_surat || 'Lihat Detail'}
                        </Link>
                      </td>

                      {/* MAKSUD PENUGASAN */}
                      <td style={{ padding: '14px 18px', color: '#334155', lineHeight: 1.5 }}>
                        <Link href={`/penugasan/${item.id}`} style={{ color: '#334155', textDecoration: 'none' }}>
                          {item.maksud_penugasan || '-'}
                        </Link>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#475569' }}>{item.tempat_tujuan || '-'}</td>
                      <td style={{ padding: '14px 18px', color: '#64748b' }}>{item.tanggal_surat || '-'}</td>
                      
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleHapusPenugasan(item.id, item.nomor_surat)}
                          style={{
                            backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5',
                            padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          🗑️ Hapus
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

    </div>
  );
}
