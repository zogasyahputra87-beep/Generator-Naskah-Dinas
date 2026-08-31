'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import AppNavbar from '../../../components/AppNavbar';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DetailPenugasanPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // State Upload & Integrasi Google Drive
  const [uploading, setUploading] = useState(false);
  const [fileStTtd, setFileStTtd] = useState('');
  const [updatingTahap, setUpdatingTahap] = useState(false);

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${id}&select=*`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.length > 0) {
          setData(result[0]);
          setFileStTtd(result[0].file_st_ttd || '');
        }
      }
    } catch (err) {
      console.error('Gagal mengambil detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [id]);

  // UPLOAD FILE KE SUPABASE STORAGE
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `ST_TTD_${id}_${Date.now()}.${fileExt}`;
      const filePath = `berkas_st/${fileName}`;

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/penugasan_docs/${filePath}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': file.type
        },
        body: file
      });

      if (uploadRes.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/penugasan_docs/${filePath}`;
        
        await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({ file_st_ttd: publicUrl })
        });

        setFileStTtd(publicUrl);
        alert('Dokumen ST/SPD TTD Berhasil Diunggah!');
        fetchDetailData();
      } else {
        alert('Gagal mengunggah file. Pastikan bucket "penugasan_docs" di Supabase sudah dibuat Public.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat upload.');
    } finally {
      setUploading(false);
    }
  };

  // UPDATE LANJUT TAHAP PENGAWASAN (FLEKSIBEL TANPA MENGUNCI)
  const handleLanjutTahap = async (tahapBaru, namaTahap) => {
    let pesanKonfirmasi = `Apakah Anda yakin ingin memajukan penugasan ini ke Tahap "${namaTahap}"?`;
    
    // Peringatan jika dokumen belum diunggah
    if (!fileStTtd && tahapBaru > 1) {
      pesanKonfirmasi = `⚠️ PERINGATAN ADMINISTRASI:\nDokumen ST/SPD bertanda tangan belum diunggah.\n\nAnda tetap dapat melanjutkan ke Tahap "${namaTahap}", namun jangan lupa mengunggah dokumen fisik TTD di kemudian hari.\n\nLanjutkan tahap sekarang?`;
    }

    const konfirmasi = window.confirm(pesanKonfirmasi);
    if (!konfirmasi) return;

    try {
      setUpdatingTahap(true);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          tahap: tahapBaru,
          status: namaTahap
        })
      });

      if (res.ok) {
        alert(`Penugasan berhasil naik ke Tahap: ${namaTahap}.${!fileStTtd ? ' (Catatan: Harap lengkapi upload berkas ST/SPD TTD jika sudah terbit)' : ''}`);
        fetchDetailData();
      } else {
        alert('Gagal memperbarui tahap penugasan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setUpdatingTahap(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <AppNavbar title="Detail Penugasan" />
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>Memuat Detail Penugasan...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <AppNavbar title="Detail Penugasan" />
        <div style={{ padding: '60px', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>Data penugasan tidak ditemukan.</div>
      </div>
    );
  }

  const currentTahap = data.tahap || 1;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <AppNavbar title="Detail & Progres Penugasan" />

      <main style={{ padding: '28px 20px', maxWidth: '1100px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* NAVIGASI KEMBALI */}
        <div style={{ marginBottom: '16px' }}>
          <Link href="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>

        {/* HEADER KARTU INFORMASI UTAMA */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '16px', padding: '24px 28px', color: '#fff', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Nomor Surat Dinas
              </div>
              <h1 style={{ margin: '4px 0 10px 0', fontSize: '22px', fontWeight: '800' }}>
                {data.nomor_surat || '-'}
              </h1>
            </div>

            {/* BADGE STATUS DOKUMEN TTD */}
            <div>
              {fileStTtd ? (
                <span style={{ backgroundColor: '#10b981', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  ✅ Berkas ST TTD Lengkap
                </span>
              ) : (
                <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)' }}>
                  ⚠️ Pending Upload ST TTD
                </span>
              )}
            </div>
          </div>

          <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#e0e7ff', lineHeight: 1.5 }}>
            {data.maksud_penugasan}
          </p>
        </div>

        {/* INTEGRASI GOOGLE DRIVE & DOKUMEN KOLABORATIF */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                ☁️ Integrasi Google Drive & Dokumen Kolaboratif
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Buat dan sunting naskah ST, SPD, Berita Acara, serta Kertas Kerja Audit (KKA) langsung di Google Drive tim.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  window.open('https://docs.google.com/document/u/0/create', '_blank');
                }}
                style={{
                  backgroundColor: '#4285f4',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(66, 133, 244, 0.25)'
                }}
              >
                <span>📝</span> Buat Google Docs Baru (ST / SPD / BA)
              </button>

              <button
                onClick={() => {
                  window.open('https://docs.google.com/spreadsheets/u/0/create', '_blank');
                }}
                style={{
                  backgroundColor: '#0f9d58',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(15, 157, 88, 0.25)'
                }}
              >
                <span>📊</span> Buat Google Sheets Baru (KKA Audit)
              </button>
            </div>
          </div>
        </div>

        {/* STEPPER PROGRES TAHAPAN PENGAWASAN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '13px', fontWeight: '800', color: '#1e1b4b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Progres Tahapan Pengawasan
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            
            {/* TAHAP 1 */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: currentTahap >= 1 ? '#6366f1' : '#e2e8f0',
              backgroundColor: currentTahap >= 1 ? '#e0e7ff' : '#f8fafc',
              color: currentTahap >= 1 ? '#3730a3' : '#94a3b8'
            }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>1. Perencanaan</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Naskah Dinas ST & SPD</div>
            </div>

            {/* TAHAP 2 */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: currentTahap >= 2 ? '#f59e0b' : '#e2e8f0',
              backgroundColor: currentTahap >= 2 ? '#fef3c7' : '#f8fafc',
              color: currentTahap >= 2 ? '#b45309' : '#94a3b8'
            }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>2. Pelaksanaan Lapangan</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>KKP & Pengujian Audit</div>
            </div>

            {/* TAHAP 3 */}
            <div style={{
              padding: '16px',
              borderRadius: '12px',
              border: '2px solid',
              borderColor: currentTahap >= 3 ? '#10b981' : '#e2e8f0',
              backgroundColor: currentTahap >= 3 ? '#d1fae5' : '#f8fafc',
              color: currentTahap >= 3 ? '#047857' : '#94a3b8'
            }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>3. Pelaporan & LHP</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>LHP & Tindak Lanjut</div>
            </div>

          </div>
        </div>

        {/* FITUR UPLOAD DOKUMEN ST/SPD TTD & PEMAJUAN TAHAP */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            📁 Upload Berkas Bertanda Tangan & Verifikasi Tahap
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            
            {/* AREA UPLOAD FILE */}
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📑</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Upload ST / SPD Bertanda Tangan (PDF/Gambar)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                Bersifat wajib, namun dapat disusulkan setelah pengawasan lapangan selesai.
              </div>

              <input 
                type="file" 
                accept=".pdf,.png,.jpg,.jpeg" 
                onChange={handleFileUpload} 
                disabled={uploading}
                style={{ fontSize: '12px' }}
              />

              {uploading && <div style={{ fontSize: '12px', color: '#6366f1', marginTop: '8px', fontWeight: 'bold' }}>Mengunggah Berkas...</div>}

              {fileStTtd ? (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <a href={fileStTtd} target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12.5px', textDecoration: 'none' }}>
                    ✅ Lihat Dokumen ST Bertanda Tangan
                  </a>
                </div>
              ) : (
                <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#d97706', fontWeight: '600' }}>
                  ℹ️ Belum ada berkas terunggah (Dapat diisi belakangan)
                </div>
              )}
            </div>

            {/* ACTION TOMBOL LANJUT TAHAP (SELALU AKTIF DENGAN WARNING RAMAH) */}
            <div style={{ backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
                STATUS PENGAWASAN SAAT INI:
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e1b4b' }}>
                {currentTahap === 1 && 'Tahap 1: Perencanaan (Naskah Dinas)'}
                {currentTahap === 2 && 'Tahap 2: Pelaksanaan Lapangan (KKP)'}
                {currentTahap === 3 && 'Tahap 3: Pelaporan & LHP Selesai'}
              </div>

              {currentTahap === 1 && (
                <button
                  onClick={() => handleLanjutTahap(2, 'Pelaksanaan')}
                  disabled={updatingTahap}
                  style={{
                    backgroundColor: '#4f46e5',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  {updatingTahap ? 'Memproses...' : '🚀 Lanjut Ke Tahap 2: Pelaksanaan Lapangan →'}
                </button>
              )}

              {currentTahap === 2 && (
                <button
                  onClick={() => handleLanjutTahap(3, 'Pelaporan')}
                  disabled={updatingTahap}
                  style={{
                    backgroundColor: '#10b981',
                    color: '#fff',
                    border: 'none',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    fontWeight: '800',
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {updatingTahap ? 'Memproses...' : '✅ Selesaikan & Lanjut Ke Tahap 3: Pelaporan LHP →'}
                </button>
              )}

              {currentTahap === 3 && (
                <div style={{ color: '#047857', fontWeight: '800', fontSize: '13px' }}>
                  🎉 Seluruh Alur Pengawasan Penugasan Ini Telah Selesai!
                </div>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
