'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DashboardPage() {
  const [listPenugasan, setListPenugasan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Daftar Penugasan dari Supabase
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

  // FITUR HAPUS PENUGASAN (TERMASUK PERCOBAAN/TESTING)
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
        // Refresh daftar penugasan setelah dihapus
        setListPenugasan(listPenugasan.filter(item => item.id !== id));
      } else {
        alert('Gagal menghapus data penugasan.');
      }
    } catch (err) {
      console.error('Error hapus:', err);
      alert('Terjadi kesalahan koneksi saat menghapus.');
    }
  };

  // Filter Pencarian
  const filteredData = listPenugasan.filter(item => {
    const query = searchQuery.toLowerCase();
    const nomor = String(item.nomor_surat || '').toLowerCase();
    const maksud = String(item.maksud_penugasan || '').toLowerCase();
    const tujuan = String(item.tempat_tujuan || '').toLowerCase();
    return nomor.includes(query) || maksud.includes(query) || tujuan.includes(query);
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER DASHBOARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a202c' }}>Dashboard Penugasan & SPD</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#718096' }}>Inspektorat Daerah Kabupaten Malang</p>
        </div>

        <Link href="/penugasan/baru" style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          + Buat Penugasan Baru
        </Link>
      </div>

      {/* BAR PENCARIAN */}
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
                <th style={{ padding: '12px 16px', width: '180px' }}>Nomor Surat</th>
                <th style={{ padding: '12px 16px' }}>Maksud Penugasan</th>
                <th style={{ padding: '12px 16px', width: '180px' }}>Tempat Tujuan</th>
                <th style={{ padding: '12px 16px', width: '120px' }}>Tgl. Surat</th>
                <th style={{ padding: '12px 16px', width: '160px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                  <td style={{ padding: '12px 16px' }}>{index + 1}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2b6cb0' }}>{item.nomor_surat || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.maksud_penugasan || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.tempat_tujuan || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.tanggal_surat || '-'}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      
                      {/* TOMBOL LIHAT NASKAH */}
                      <Link 
                        href={`/penugasan/${item.id}`} 
                        style={{ backgroundColor: '#edf2f7', color: '#2b6cb0', border: '1px solid #cbd5e0', padding: '6px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        📄 Buka
                      </Link>

                      {/* TOMBOL HAPUS DATA PERCOBAAN */}
                      <button
                        onClick={() => handleHapusPenugasan(item.id, item.nomor_surat)}
                        style={{ backgroundColor: '#fff5f5', color: '#e53e3e', border: '1px solid #feb2b2', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                      >
                        🗑️ Hapus
                      </button>

                    </div>
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
