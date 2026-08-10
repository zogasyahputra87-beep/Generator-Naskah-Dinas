'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DashboardPage() {
  const [penugasanList, setPenugasanList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Ringkasan Data Penugasan
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?select=*&order=created_at.desc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setPenugasanList(data);
        }
      } catch (err) {
        console.error('Gagal mengambil data penugasan:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Ringkasan Statistik Progres Penugasan
  const totalPenugasan = penugasanList.length;
  const dalamProses = penugasanList.filter(p => p.status === 'Surat Tugas' || p.status === 'Proses LHP').length;
  const selesai = penugasanList.filter(p => p.status === 'Selesai TLHP').length;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER DASHBOARD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a202c' }}>Dashboard Penugasan</h1>
          <p style={{ margin: '4px 0 0 0', color: '#718096' }}>Sistem Informasi Pengawasan & Naskah Dinas Inspektorat</p>
        </div>
        <Link href="/penugasan/baru" style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '10px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          + Buat Penugasan Baru
        </Link>
      </div>

      {/* KARTU RINGKASAN STATISTIK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '13px', color: '#718096', fontWeight: 'bold' }}>TOTAL PENUGASAN</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2d3748', marginTop: '8px' }}>{totalPenugasan}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #feebc8', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #dd6b20' }}>
          <span style={{ fontSize: '13px', color: '#dd6b20', fontWeight: 'bold' }}>SEDANG BERJALAN</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dd6b20', marginTop: '8px' }}>{dalamProses}</div>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #c6f6d5', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderLeft: '4px solid #38a169' }}>
          <span style={{ fontSize: '13px', color: '#38a169', fontWeight: 'bold' }}>SELESAI (TLHP)</span>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#38a169', marginTop: '8px' }}>{selesai}</div>
        </div>

      </div>

      {/* TABEL PROGRES PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f7fafc', fontWeight: 'bold', color: '#2d3748' }}>
          Daftar Progres Penugasan Aktif
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#edf2f7', color: '#4a5568' }}>
              <th style={{ padding: '12px 16px' }}>No. Surat / Penugasan</th>
              <th style={{ padding: '12px 16px' }}>Maksud Penugasan</th>
              <th style={{ padding: '12px 16px' }}>Objek / Obyek Pengawasan</th>
              <th style={{ padding: '12px 16px' }}>Tahapan Progres</th>
              <th style={{ padding: '12px 16px', textAlign: 'center' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>Memuat data penugasan...</td>
              </tr>
            ) : penugasanList.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>Belum ada penugasan terdaftar.</td>
              </tr>
            ) : (
              penugasanList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#2b6cb0' }}>{item.nomor_surat || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>{item.maksud_penugasan}</td>
                  <td style={{ padding: '12px 16px' }}>{item.tempat_tujuan}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      backgroundColor: item.status === 'Selesai TLHP' ? '#c6f6d5' : '#feebc8',
                      color: item.status === 'Selesai TLHP' ? '#22543d' : '#744210'
                    }}>
                      {item.status || 'Surat Tugas'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Link href={`/penugasan/${item.id}`} style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold' }}>
                      Detail & Progres →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
