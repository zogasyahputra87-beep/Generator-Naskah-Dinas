'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DetailProgresPenugasanPage({ params }) {
  const [penugasanId, setPenugasanId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Unwrap params secara aman untuk Next.js 15
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved && resolved.id) {
        setPenugasanId(resolved.id);
      }
    });
  }, [params]);

  // Fetch data dari Supabase setelah ID didapatkan
  useEffect(() => {
    if (!penugasanId) return;

    async function fetchDetailPenugasan() {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}&select=*`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setDetail(data[0]);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil detail:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchDetailPenugasan();
  }, [penugasanId]);

  // Handler Upload / Link ST TTD GDrive
  const handleUploadSTSigned = async () => {
    const linkGDrive = prompt('Masukkan Link Google Drive Surat Tugas TTD:');
    if (!linkGDrive) return;

    setUploading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          link_st_ttd: linkGDrive,
          status_st: 'Disahkan (Sudah TTD)'
        })
      });

      if (response.ok) {
        alert('Tautan Google Drive berhasil disimpan!');
        window.location.reload();
      }
    } catch (err) {
      alert('Gagal memperbarui status ST.');
    } finally {
      setUploading(false);
    }
  };

  // Handler Unduh Word Surat Tugas
  const handleDownloadSuratTugas = async () => {
    if (!detail) return;
    const payload = {
      nomor_surat: detail.nomor_surat,
      dasar_list: Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [],
      pegawai_list: Array.isArray(detail.personil) ? detail.personil : [],
      penugasan: detail.maksud_penugasan,
      tanggal: detail.tanggal_surat,
      tampilkan_paraf: true,
      paraf_list: Array.isArray(detail.paraf_list) ? detail.paraf_list : []
    };

    const response = await fetch('/api/generate-surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Tugas_${(detail.nomor_surat || 'ST').replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // Handler Unduh Word SPD
  const handleDownloadSPDWord = async (personil) => {
    if (!detail) return;
    const payloadSPD = {
      nomor_spd: detail.nomor_surat,
      nama: personil.nama,
      nip: personil.nip,
      pangkat_gol: personil.pangkat_gol,
      jabatan: personil.jabatan,
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tgl_berangkat: detail.tanggal_surat,
      tgl_kembali: detail.tanggal_surat,
      tgl_spd: detail.tanggal_spd,
    };

    const response = await fetch('/api/generate-spd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSPD),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPD_${(personil.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const ketuaTim = detail.ketua_tim || (listPersonil.length > 0 ? listPersonil[0].nama : '-');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '40px' }}>
      
      {/* NAVIGASI */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PROFIL PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #edf2f7', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2b6cb0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Profil Penugasan Pengawasan
            </span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '20px', color: '#1a202c' }}>
              {detail.maksud_penugasan}
            </h1>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
              Nomor Penugasan: <strong>{detail.nomor_surat}</strong>
            </div>
          </div>

          <span style={{ 
            padding: '6px 14px', 
            borderRadius: '20px', 
            fontSize: '12px', 
            fontWeight: 'bold',
            backgroundColor: detail.status === 'Selesai TLHP' ? '#c6f6d5' : '#feebc8',
            color: detail.status === 'Selesai TLHP' ? '#22543d' : '#744210'
          }}>
            Status: {detail.status || 'Surat Tugas'}
          </span>
        </div>

        {/* HIRARKI TIM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #edf2f7' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Obyek Pengawasan</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{detail.tempat_tujuan || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Irban Wilayah</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{detail.irban_wilayah || 'Inspektur Pembantu Wilayah I'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Pengendali Teknis</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{detail.pengendali_teknis || 'Auditor Ahli Madya'}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Ketua Tim</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{ketuaTim}</div>
          </div>
        </div>
      </div>

      {/* 3 KOLOM TAHAPAN PENUGASAN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* KOLOM 1: PERENCANAAN DAN PERSIAPAN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #2b6cb0', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#2b6cb0', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a202c' }}>Perencanaan & Persiapan</h3>
          </div>

          {/* ITEM SURAT TUGAS */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '12px', backgroundColor: '#fdfdfd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>📄 Surat Tugas</span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'bold', 
                padding: '2px 6px', 
                borderRadius: '4px',
                backgroundColor: detail.status_st === 'Disahkan (Sudah TTD)' ? '#c6f6d5' : '#e2e8f0',
                color: detail.status_st === 'Disahkan (Sudah TTD)' ? '#22543d' : '#4a5568'
              }}>
                {detail.status_st || 'Hasil Generate'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button onClick={handleDownloadSuratTugas} style={{ backgroundColor: '#0066cc', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                📥 Unduh Word Surat Tugas
              </button>

              {detail.link_st_ttd ? (
                <a href={detail.link_st_ttd} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', backgroundColor: '#38a169', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                  🔗 Lihat ST TTD (GDrive)
                </a>
              ) : (
                <button onClick={handleUploadSTSigned} disabled={uploading} style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📤 Link Google Drive ST TTD
                </button>
              )}
            </div>
          </div>

          {/* ITEM SPD */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#fdfdfd' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>📑 SPD / SPPD Personil</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {listPersonil.map((p, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', backgroundColor: '#f7fafc', borderRadius: '4px', fontSize: '12px' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{p.nama}</strong>
                    <span style={{ color: '#718096', fontSize: '10px' }}>{p.jabatan}</span>
                  </div>
                  <button onClick={() => handleDownloadSPDWord(p)} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer' }}>
                    Word
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM 2: PELAKSANAAN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #dd6b20', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#dd6b20', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>2</span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a202c' }}>Pelaksanaan</h3>
          </div>

          <div style={{ padding: '20px 10px', textAlign: 'center', border: '1px dashed #cbd5e0', borderRadius: '6px', backgroundColor: '#f7fafc' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '4px' }}>Tahap Pelaksanaan Pemeriksaan</div>
            <p style={{ fontSize: '11px', color: '#a0aec0', margin: 0 }}>
              Kertas Kerja Pemeriksaan (KKP), Berita Acara, & Dokumen Lapangan.
            </p>
          </div>
        </div>

        {/* KOLOM 3: PELAPORAN & TLHP */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #38a169', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#38a169', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>3</span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a202c' }}>Pelaporan & TLHP</h3>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', marginBottom: '12px', backgroundColor: '#fdfdfd' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>📋 Laporan Hasil Pemeriksaan (LHP)</div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#edf2f7', padding: '3px 8px', borderRadius: '4px', color: '#4a5568' }}>
              Belum Diunggah
            </span>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#fdfdfd' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>✅ Tindak Lanjut (TLHP)</div>
            <span style={{ fontSize: '10px', fontWeight: 'bold', backgroundColor: '#edf2f7', padding: '3px 8px', borderRadius: '4px', color: '#4a5568' }}>
              Menunggu LHP
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
