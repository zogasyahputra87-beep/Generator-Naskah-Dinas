'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

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
        alert('Data penugasan berhasil dihapus!');
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

  // KETENTUAN STATISTIK RINGKASAN PENUGASAN
  const totalPenugasan = listPenugasan.length;
  const totalPerencanaan = listPenugasan.filter(i => !i.tahap || i.tahap === 1 || i.status === 'Surat Tugas').length;
  const totalPelaksanaan = listPenugasan.filter(i => i.tahap === 2 || i.status === 'Pelaksanaan').length;
  const totalPelaporan = listPenugasan.filter(i => i.tahap === 3 || i.status === 'Selesai' || i.status === 'Pelaporan').length;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER DASHBOARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a202c' }}>Dashboard Penugasan & SPD</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#718096' }}>Inspektorat Daerah Kabupaten Malang</p>
        </div>

        <Link href="/penugasan/baru" style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          + Buat Penugasan Baru
        </Link>
      </div>

      {/* RINGKASAN STATISTIK (FITUR DIPULIHKAN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderLeft: '5px solid #2b6cb0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Penugasan</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c', marginTop: '4px' }}>{totalPenugasan}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderLeft: '5px solid #3182ce', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>1. Perencanaan (ST/SPD)</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3182ce', marginTop: '4px' }}>{totalPerencanaan}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderLeft: '5px solid #dd6b20', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>2. Pelaksanaan Lapangan</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dd6b20', marginTop: '4px' }}>{totalPelaksanaan}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', borderLeft: '5px solid #38a169', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>3. Pelaporan & LHP</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38a169', marginTop: '4px' }}>{totalPelaporan}</div>
        </div>

      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text"
          placeholder="🔍 Cari nomor surat, maksud audit, atau tempat tujuan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      {/* TABEL DAFTAR PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>Memuat data penugasan...</div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>
            {searchQuery ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data penugasan.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f7fafc', borderBottom: '1px solid #e2e8f0', color: '#4a5568' }}>
                <th style={{ padding: '12px 16px', width: '50px' }}>No</th>
                <th style={{ padding: '12px 16px', width: '220px' }}>Nomor Surat (Klik Detail)</th>
                <th style={{ padding: '12px 16px' }}>Maksud Penugasan</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>Tempat Tujuan</th>
                <th style={{ padding: '12px 16px', width: '110px' }}>Tgl. Surat</th>
                <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                  
                  {/* KLIK NOMOR SURAT -> LANGSUNG KE HALAMAN DETAIL & TAHAPAN */}
                  <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                    <Link href={`/penugasan/${item.id}`} style={{ color: '#2b6cb0', textDecoration: 'underline' }}>
                      {item.nomor_surat || 'Buka Detail'}
                    </Link>
                  </td>

                  {/* KLIK MAKSUD PENUGASAN -> LANGSUNG KE HALAMAN DETAIL & TAHAPAN */}
                  <td style={{ padding: '12px 16px' }}>
                    <Link href={`/penugasan/${item.id}`} style={{ color: '#2d3748', textDecoration: 'none' }}>
                      {item.maksud_penugasan || '-'}
                    </Link>
                  </td>

                  <td style={{ padding: '12px 16px' }}>{item.tempat_tujuan || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.tanggal_surat || '-'}</td>
                  
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleHapusPenugasan(item.id, item.nomor_surat)}
                      style={{ backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
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

    </div>
  );
}
