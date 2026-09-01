'use client';
import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import AppNavbar from '../../../components/AppNavbar';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah;',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah;',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah;',
  'Dokumen Pelaksanaan Perubahan Anggaran Inspektorat Daerah Kabupaten Malang Tahun Anggaran 2026 Nomor: DPA/A.2/6.01.0.00.0.00.01.0000/001/2026 tanggal 9 Juni 2026, dengan ini:'
];

function safeString(val, fallback = '-') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    return val.nama || val.label || val.teks || val.dasar_hukum || JSON.stringify(val);
  }
  return String(val);
}

function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  try {
    const date = new Date(tanggalStr);
    if (isNaN(date.getTime())) return String(tanggalStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return String(tanggalStr);
  }
}

function appendDenganIni(listText) {
  if (!Array.isArray(listText) || listText.length === 0) return [];
  return listText.map((item, idx) => {
    let textStr = typeof item === 'object' ? (item?.dasar_hukum || item?.teks || '') : String(item || '');
    textStr = textStr.trim().replace(/[.;,]+$/, '');
    if (idx === listText.length - 1) {
      return `${textStr}, dengan ini:`;
    }
    return `${textStr};`;
  });
}

export default function DetailPenugasanPage({ params }) {
  const { id } = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Tab Naskah & Paraf
  const [activeTabNaskah, setActiveTabNaskah] = useState('st'); // 'st' | 'spd_depan' | 'spd_belakang'
  const [showParafHierarki, setShowParafHierarki] = useState(true);
  const [activeSPDIndex, setActiveSPDIndex] = useState(0);

  // State Upload & Progres
  const [uploading, setUploading] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [fileStTtd, setFileStTtd] = useState('');
  const [updatingTahap, setUpdatingTahap] = useState(false);

  const printAreaRef = useRef(null);

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

  // HANDLE DOWNLOAD DOKUMEN WORD (.DOCX)
  const handleExportToDocx = async () => {
    if (!data) return;
    try {
      setDownloadingDoc(true);
      let endpoint = '/api/generate-spd';
      let payload = {};

      const currentPersonil = (Array.isArray(data.personil) ? data.personil : [])[activeSPDIndex] || {};
      const pNama = typeof currentPersonil === 'object' ? (currentPersonil?.nama || '-') : String(currentPersonil || '-');
      const pNip = typeof currentPersonil === 'object' ? (currentPersonil?.nip || '-') : '-';
      const pGol = typeof currentPersonil === 'object' ? (currentPersonil?.pangkat_gol || '-') : '-';
      const pJab = typeof currentPersonil === 'object' ? (currentPersonil?.jabatan || '-') : '-';

      if (activeTabNaskah === 'st') {
        endpoint = '/api/generate-surat';
        payload = {
          nomor_surat: data.nomor_surat,
          maksud_penugasan: data.maksud_penugasan,
          tempat_tujuan: data.tempat_tujuan,
          tanggal_surat: formatTanggalIndo(data.tanggal_surat),
          personil: data.personil,
          dasar_hukum: data.dasar_hukum
        };
      } else {
        payload = {
          halaman_belakang_only: activeTabNaskah === 'spd_belakang',
          nomor_spd: data.nomor_surat,
          nama: pNama,
          nip: pNip,
          pangkat_gol: pGol,
          jabatan: pJab,
          maksud_penugasan: data.maksud_penugasan,
          tempat_berangkat: data.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
          tempat_tujuan: data.tempat_tujuan,
          tgl_berangkat: formatTanggalIndo(data.tanggal_surat),
          tgl_spd: formatTanggalIndo(data.tanggal_spd || data.tanggal_surat)
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Gagal me-render dokumen dari API');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const tabLabel = activeTabNaskah === 'st' ? 'ST' : activeTabNaskah === 'spd_depan' ? `SPD_Depan_${pNama.replace(/\s+/g, '_')}` : `SPD_Belakang_${pNama.replace(/\s+/g, '_')}`;
      a.download = `${tabLabel}_${safeString(data?.nomor_surat, 'Naskah').replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download Error:', err);
      alert('Gagal mendownload dokumen Word.');
    } finally {
      setDownloadingDoc(false);
    }
  };

  // UPLOAD FILE TTD KE SUPABASE
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
        alert('Gagal mengunggah file.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat upload.');
    } finally {
      setUploading(false);
    }
  };

  // LANJUT TAHAP
  const handleLanjutTahap = async (tahapBaru, namaTahap) => {
    let pesanKonfirmasi = `Apakah Anda yakin ingin memajukan penugasan ini ke Tahap "${namaTahap}"?`;
    if (!fileStTtd && tahapBaru > 1) {
      pesanKonfirmasi = `⚠️ PERINGATAN ADMINISTRASI:\nDokumen ST/SPD bertanda tangan belum diunggah.\n\nAnda tetap dapat melanjutkan ke Tahap "${namaTahap}", namun jangan lupa mengunggah berkas TTD di kemudian hari.\n\nLanjutkan tahap sekarang?`;
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
        alert(`Penugasan berhasil naik ke Tahap: ${namaTahap}.`);
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
  const listPersonil = Array.isArray(data.personil) ? data.personil : [];
  const rawListDasar = Array.isArray(data.dasar_hukum) && data.dasar_hukum.length > 0 
    ? data.dasar_hukum 
    : DASAR_HUKUM_DEFAULT;
  const listDasarWithDenganIni = appendDenganIni(rawListDasar);

  const currentPersonilSPD = listPersonil[activeSPDIndex] || {};
  const pNama = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nama || '-') : String(currentPersonilSPD || '-');
  const pNip = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nip || '-') : '-';
  const pGol = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.pangkat_gol || '-') : '-';
  const pJab = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.jabatan || '-') : '-';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* CSS CETAK / PRINT A4 PRESISI */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${activeTabNaskah === 'spd_belakang' ? '12mm 15mm 12mm 15mm' : '15mm 20mm 20mm 25mm'};
          }
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section {
            position: absolute; left: 0; top: 0; width: 100% !important;
            padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <AppNavbar title="Detail & Generator Penugasan" />

      <main style={{ padding: '28px 20px', maxWidth: '1100px', margin: '0 auto', boxSizing: 'border-box' }}>
        
        {/* NAVIGASI KEMBALI */}
        <div style={{ marginBottom: '16px' }} className="no-print">
          <Link href="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>

        {/* HEADER KARTU INFORMASI UTAMA */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '16px', padding: '24px 28px', color: '#fff', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(30, 27, 75, 0.2)' }} className="no-print">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Nomor Surat Dinas
              </div>
              <h1 style={{ margin: '4px 0 10px 0', fontSize: '22px', fontWeight: '800' }}>
                {data.nomor_surat || '-'}
              </h1>
            </div>

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

        {/* PROGRES TAHAPAN PENGAWASAN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }} className="no-print">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', border: '2px solid', borderColor: currentTahap >= 1 ? '#6366f1' : '#e2e8f0', backgroundColor: currentTahap >= 1 ? '#e0e7ff' : '#f8fafc', color: currentTahap >= 1 ? '#3730a3' : '#94a3b8' }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>1. Perencanaan (ST/SPD)</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', border: '2px solid', borderColor: currentTahap >= 2 ? '#f59e0b' : '#e2e8f0', backgroundColor: currentTahap >= 2 ? '#fef3c7' : '#f8fafc', color: currentTahap >= 2 ? '#b45309' : '#94a3b8' }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>2. Pelaksanaan Lapangan</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', border: '2px solid', borderColor: currentTahap >= 3 ? '#10b981' : '#e2e8f0', backgroundColor: currentTahap >= 3 ? '#d1fae5' : '#f8fafc', color: currentTahap >= 3 ? '#047857' : '#94a3b8' }}>
              <div style={{ fontWeight: '800', fontSize: '13px' }}>3. Pelaporan & LHP</div>
            </div>
          </div>
        </div>

        {/* BAR KONTROL GENERATOR DOKUMEN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px 24px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} className="no-print">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTabNaskah('st')}
              style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e0',
                backgroundColor: activeTabNaskah === 'st' ? '#4f46e5' : '#f8fafc',
                color: activeTabNaskah === 'st' ? '#fff' : '#334155',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer'
              }}
            >
              📄 Surat Tugas (ST)
            </button>
            <button
              onClick={() => setActiveTabNaskah('spd_depan')}
              style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e0',
                backgroundColor: activeTabNaskah === 'spd_depan' ? '#4f46e5' : '#f8fafc',
                color: activeTabNaskah === 'spd_depan' ? '#fff' : '#334155',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer'
              }}
            >
              📑 SPD (Halaman Depan)
            </button>
            <button
              onClick={() => setActiveTabNaskah('spd_belakang')}
              style={{
                padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e0',
                backgroundColor: activeTabNaskah === 'spd_belakang' ? '#4f46e5' : '#f8fafc',
                color: activeTabNaskah === 'spd_belakang' ? '#fff' : '#334155',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer'
              }}
            >
              📋 SPD (Visum / Belakang)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeTabNaskah === 'st' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#f1f5f9', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <input type="checkbox" checked={showParafHierarki} onChange={(e) => setShowParafHierarki(e.target.checked)} />
                <span>Paraf Hierarki: {showParafHierarki ? 'ON' : 'OFF'}</span>
              </label>
            )}

            <button onClick={() => window.print()} style={{ backgroundColor: '#312e81', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer' }}>
              🖨️ Cetak / PDF
            </button>

            <button onClick={handleExportToDocx} disabled={downloadingDoc} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}>
              {downloadingDoc ? '⏳ Generating Word...' : '📥 Download File Word (.docx)'}
            </button>
          </div>
        </div>

        {/* PILIH PEGAWAI SPD */}
        {activeTabNaskah !== 'st' && (
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="no-print">
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>Pilih Pegawai Cetak SPD:</span>
            {listPersonil.map((p, idx) => {
              const nameStr = typeof p === 'object' ? (p?.nama || `Pegawai ${idx+1}`) : String(p || '');
              return (
                <button
                  key={idx}
                  onClick={() => setActiveSPDIndex(idx)}
                  style={{
                    padding: '6px 14px', borderRadius: '6px', border: '1px solid #cbd5e1',
                    backgroundColor: activeSPDIndex === idx ? '#4f46e5' : '#f8fafc',
                    color: activeSPDIndex === idx ? '#fff' : '#334155',
                    fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  👤 {nameStr}
                </button>
              );
            })}
          </div>
        )}

        {/* ARENA RENDER KERTAS NASKAH DINAS A4 */}
        <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', overflowX: 'auto', marginBottom: '28px' }}>
          <div 
            id="print-section"
            ref={printAreaRef}
            style={{ 
              width: '210mm',
              minHeight: '297mm',
              margin: '0 auto', 
              backgroundColor: '#fff', 
              paddingTop: activeTabNaskah === 'spd_belakang' ? '12mm' : '15mm',
              paddingBottom: activeTabNaskah === 'spd_belakang' ? '12mm' : '20mm',
              paddingLeft: activeTabNaskah === 'spd_belakang' ? '15mm' : '20mm',
              paddingRight: activeTabNaskah === 'spd_belakang' ? '15mm' : '20mm',
              boxSizing: 'border-box',
              border: '1px solid #e2e8f0', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
              fontFamily: 'Arial, sans-serif', 
              fontSize: activeTabNaskah === 'spd_belakang' ? '9.5pt' : '11pt', 
              color: '#000', 
              lineHeight: 1.15 
            }}
          >

            {/* KOP SURAT */}
            {activeTabNaskah !== 'spd_belakang' && (
              <div style={{ borderBottom: '3px double #000', paddingBottom: '4px', marginBottom: '14px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <img src="/logo-kab-malang.png" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '68px', height: 'auto' }} />
                      </td>
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px' }}>PEMERINTAH KABUPATEN MALANG</div>
                        <div style={{ fontSize: '15pt', fontWeight: 'bold', marginTop: '1px' }}>INSPEKTORAT DAERAH</div>
                        <div style={{ fontSize: '9pt', fontWeight: 'normal', marginTop: '2px' }}>
                          Jalan Raya Mondoroko 17B Singosari, Jawa Timur<br />
                          Telepon. (0341) 451905 Laman: http://inspektorat.malangkab.go.id<br />
                          Pos-el: inspektorat.malangkab@gmail.com, Kode Pos 65153
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* NASKAH SURAT TUGAS */}
            {activeTabNaskah === 'st' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '15pt', fontWeight: 'bold' }}>SURAT TUGAS</div>
                  <div style={{ fontSize: '11pt', marginTop: '2px' }}>NOMOR: {safeString(data.nomor_surat)}</div>
                </div>

                <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '11pt', lineHeight: 1.15 }}>
                  <tbody>
                    {listDasarWithDenganIni.map((dStr, dIdx) => (
                      <tr key={dIdx}>
                        {dIdx === 0 ? (
                          <>
                            <td style={{ width: '2.25cm', verticalAlign: 'top', paddingBottom: '4px' }}>Dasar</td>
                            <td style={{ width: '0.4cm', verticalAlign: 'top', paddingBottom: '4px' }}>:</td>
                          </>
                        ) : (
                          <>
                            <td style={{ width: '2.25cm' }}></td>
                            <td style={{ width: '0.4cm' }}></td>
                          </>
                        )}
                        <td style={{ width: '0.6cm', verticalAlign: 'top', paddingBottom: '4px' }}>{dIdx + 1}.</td>
                        <td style={{ verticalAlign: 'top', paddingBottom: '4px', textAlign: 'justify' }}>{dStr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13pt', margin: '14px 0' }}>
                  MEMERINTAHKAN:
                </div>

                <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '11pt', lineHeight: 1.15 }}>
                  <tbody>
                    {listPersonil.map((p, pIdx) => {
                      const itemNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                      const itemNip = typeof p === 'object' ? (p?.nip || '-') : '-';
                      const itemGol = typeof p === 'object' ? (p?.pangkat_gol || '-') : '-';
                      const itemJab = typeof p === 'object' ? (p?.jabatan || '-') : '-';

                      return (
                        <tr key={pIdx}>
                          {pIdx === 0 ? (
                            <>
                              <td style={{ width: '2.25cm', verticalAlign: 'top', paddingBottom: '8px' }}>Kepada</td>
                              <td style={{ width: '0.4cm', verticalAlign: 'top', paddingBottom: '8px' }}>:</td>
                            </>
                          ) : (
                            <>
                              <td style={{ width: '2.25cm' }}></td>
                              <td style={{ width: '0.4cm' }}></td>
                            </>
                          )}
                          <td style={{ width: '0.6cm', verticalAlign: 'top', paddingBottom: '8px' }}>{pIdx + 1}.</td>
                          <td style={{ verticalAlign: 'top', paddingBottom: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '2.8cm' }}>Nama</td>
                                  <td style={{ width: '0.4cm' }}>:</td>
                                  <td><strong>{itemNama}</strong></td>
                                </tr>
                                <tr>
                                  <td>NIP.</td>
                                  <td>:</td>
                                  <td>{itemNip}</td>
                                </tr>
                                <tr>
                                  <td>Pangkat/Gol</td>
                                  <td>:</td>
                                  <td>{itemGol}</td>
                                </tr>
                                <tr>
                                  <td>Jabatan</td>
                                  <td>:</td>
                                  <td>{itemJab}</td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse', fontSize: '11pt', lineHeight: 1.15 }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '2.25cm', verticalAlign: 'top' }}>Untuk</td>
                      <td style={{ width: '0.4cm', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                        {safeString(data.maksud_penugasan)}
                        {data.tempat_tujuan ? ` bertempat di ${data.tempat_tujuan}.` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textIndent: '1.5cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                  Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
                </div>
                <div style={{ textIndent: '1.5cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                  Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas <strong>tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan</strong>.
                </div>
                <div style={{ textIndent: '1.5cm', textAlign: 'justify', marginBottom: '24px', lineHeight: 1.15 }}>
                  Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
                  {showParafHierarki ? (
                    <div style={{ border: '0.5pt solid #000', width: '6.8cm', fontSize: '8pt' }}>
                      <div style={{ backgroundColor: '#E9E9E9', fontWeight: 'bold', textAlign: 'center', padding: '3pt 0', borderBottom: '0.5pt solid #000' }}>
                        PARAF HIERARKI
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                        <tbody>
                          <tr style={{ borderBottom: '0.5pt solid #000' }}>
                            <td style={{ padding: '3px 6px', width: '70%' }}>Plt. Sekretaris</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right' }}>: ......</td>
                          </tr>
                          <tr style={{ borderBottom: '0.5pt solid #000' }}>
                            <td style={{ padding: '3px 6px' }}>Inspektur Pembantu Wilayah I</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right' }}>: ......</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '3px 6px' }}>Auditor Ahli Madya</td>
                            <td style={{ padding: '3px 6px', textAlign: 'right' }}>: ......</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ width: '6.8cm' }}></div>
                  )}

                  <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '11pt', lineHeight: 1.25 }}>
                    Malang, {formatTanggalIndo(data.tanggal_surat)}<br />
                    <strong>Plt. Inspektur Kabupaten Malang</strong>
                    <br /><br /><br /><br />
                    <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                    Penata Tingkat I<br />
                    NIP. 198008012010011018
                  </div>
                </div>
              </div>
            )}

            {/* NASKAH SPD HALAMAN DEPAN */}
            {activeTabNaskah === 'spd_depan' && (
              <div>
                <table style={{ width: '100%', marginBottom: '10px' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '60%' }}></td>
                      <td style={{ width: '40%', fontSize: '9.5pt' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '90px' }}>Lembar ke</td>
                              <td>: </td>
                            </tr>
                            <tr>
                              <td>Kode No</td>
                              <td>: </td>
                            </tr>
                            <tr>
                              <td>Nomor</td>
                              <td>: {data.nomor_surat}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', margin: '10px 0 14px 0', textDecoration: 'underline' }}>
                  SURAT PERJALANAN DINAS (SPD)
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9.5pt', lineHeight: 1.25 }} border="1" cellPadding="4">
                  <tbody>
                    <tr>
                      <td style={{ width: '25px', textAlign: 'center', verticalAlign: 'top' }}>1.</td>
                      <td style={{ width: '200px', verticalAlign: 'top' }}>Pengguna Anggaran</td>
                      <td style={{ verticalAlign: 'top' }}>ARRIE HENDRAWAN MAHADHIEKA, S.H.</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>2.</td>
                      <td style={{ verticalAlign: 'top' }}>Nama Pegawai yang diperintah</td>
                      <td style={{ verticalAlign: 'top' }}><strong>{pNama}</strong><br />NIP. {pNip}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>3.</td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. Pangkat dan Golongan<br />
                        b. Jabatan<br />
                        c. Tingkat Biaya Perjalanan Dinas
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. {pGol}<br />
                        b. {pJab}<br />
                        c. 
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>4.</td>
                      <td style={{ verticalAlign: 'top' }}>Maksud Perjalanan Dinas</td>
                      <td style={{ verticalAlign: 'top', textAlign: 'justify' }}>{safeString(data.maksud_penugasan)}</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>5.</td>
                      <td style={{ verticalAlign: 'top' }}>Alat angkutan yang dipergunakan</td>
                      <td style={{ verticalAlign: 'top' }}>Angkutan Darat</td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>6.</td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. Tempat berangkat<br />
                        b. Tempat tujuan
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. {data.tempat_berangkat || 'Inspektorat Daerah Kabupaten Malang'}<br />
                        b. {data.tempat_tujuan || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>7.</td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. Lamanya Perjalanan Dinas<br />
                        b. Tanggal berangkat<br />
                        c. Tanggal harus kembali
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        a. 1 (satu) hari<br />
                        b. {formatTanggalIndo(data.tanggal_surat)}<br />
                        c. {formatTanggalIndo(data.tanggal_surat)}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>8.</td>
                      <td colSpan="2" style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }} border="1" cellPadding="3">
                          <tbody>
                            <tr>
                              <td style={{ borderBottom: 'none', borderLeft: 'none', borderTop: 'none' }} width="35%">Pengikut</td>
                              <td style={{ borderBottom: 'none', borderTop: 'none' }} width="25%">Nama</td>
                              <td style={{ borderBottom: 'none', borderTop: 'none' }} width="20%">Tanggal Lahir</td>
                              <td style={{ borderBottom: 'none', borderRight: 'none', borderTop: 'none' }} width="20%">Keterangan</td>
                            </tr>
                            <tr>
                              <td style={{ borderLeft: 'none' }}>1.</td>
                              <td></td>
                              <td></td>
                              <td style={{ borderRight: 'none' }}></td>
                            </tr>
                            <tr>
                              <td style={{ borderLeft: 'none' }}>2.</td>
                              <td></td>
                              <td></td>
                              <td style={{ borderRight: 'none' }}></td>
                            </tr>
                            <tr>
                              <td style={{ borderLeft: 'none', borderBottom: 'none' }}>3.</td>
                              <td style={{ borderBottom: 'none' }}></td>
                              <td style={{ borderBottom: 'none' }}></td>
                              <td style={{ borderRight: 'none', borderBottom: 'none' }}></td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>9.</td>
                      <td style={{ verticalAlign: 'top' }}>Pembebanan Anggaran<br />a. SKPD<br />b. Akun</td>
                      <td style={{ verticalAlign: 'top' }}><br />a. Inspektorat Daerah Kabupaten Malang<br />b. </td>
                    </tr>
                    <tr>
                      <td style={{ textAlign: 'center', verticalAlign: 'top' }}>10.</td>
                      <td style={{ verticalAlign: 'top' }}>Keterangan lain-lain</td>
                      <td style={{ verticalAlign: 'top' }}></td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                  <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '9.5pt', lineHeight: 1.2 }}>
                    <table style={{ width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '90px' }}>Dikeluarkan di</td>
                          <td>: Singosari</td>
                        </tr>
                        <tr>
                          <td>Tanggal</td>
                          <td>: {formatTanggalIndo(data.tanggal_spd || data.tanggal_surat)}</td>
                        </tr>
                      </tbody>
                    </table>
                    <br />
                    <strong>Pengguna Anggaran</strong>
                    <br /><br /><br /><br />
                    <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                    NIP. 198008012010011018
                  </div>
                </div>
              </div>
            )}

            {/* NASKAH SPD VISUM BELAKANG (PERSIS PDF ACUAN) */}
            {activeTabNaskah === 'spd_belakang' && (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '8.5pt', lineHeight: 1.15 }} border="1" cellPadding="3">
                  <tbody>
                    {/* I */}
                    <tr>
                      <td style={{ width: '50%', verticalAlign: 'top' }}></td>
                      <td style={{ width: '50%', verticalAlign: 'top' }}>
                        I. Berangkat dari : Inspektorat Daerah Kab. Malang<br />
                        &nbsp;&nbsp;&nbsp;(Tempat Kedudukan)<br />
                        &nbsp;&nbsp;&nbsp;Ke : {data.tempat_tujuan || 'Kantor Kejaksaan Negeri Kabupaten Malang'}<br />
                        &nbsp;&nbsp;&nbsp;Tanggal : {formatTanggalIndo(data.tanggal_surat)}<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          <strong>Plt. Inspektur Kabupaten Malang</strong>
                          <div style={{ height: '35px' }}></div>
                          <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                          NIP. 198008012010011018
                        </div>
                      </td>
                    </tr>

                    {/* II */}
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>
                        II. Tiba di : {data.tempat_tujuan || 'Kantor Kejaksaan Negeri Kabupaten Malang'}<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal : {formatTanggalIndo(data.tanggal_surat)}<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '35px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        Berangkat dari : {data.tempat_tujuan || 'Kantor Kejaksaan Negeri Kabupaten Malang'}<br />
                        Ke : Inspektorat Daerah Kab. Malang<br />
                        Pada tanggal : {formatTanggalIndo(data.tanggal_surat)}<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '35px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                    </tr>

                    {/* III */}
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>
                        III. Tiba di :<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '30px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        Berangkat dari :<br />
                        Ke :<br />
                        Pada tanggal :<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '30px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                    </tr>

                    {/* IV */}
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>
                        IV. Tiba di :<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '30px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        Berangkat dari :<br />
                        Ke :<br />
                        Pada tanggal :<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          Kepala .......................................................
                          <div style={{ height: '30px' }}></div>
                          (............................................................)<br />
                          NIP.
                        </div>
                      </td>
                    </tr>

                    {/* V */}
                    <tr>
                      <td style={{ verticalAlign: 'top' }}>
                        V. Tiba di : Inspektorat Daerah Kab. Malang<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : {formatTanggalIndo(data.tanggal_surat)}<br />
                        <div style={{ textAlign: 'center', marginTop: '4px' }}>
                          <strong>Plt. Inspektur Kabupaten Malang</strong>
                          <div style={{ height: '35px' }}></div>
                          <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                          NIP. 198008012010011018
                        </div>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <div style={{ fontSize: '7.5pt', lineHeight: 1.1, textAlign: 'justify' }}>
                          Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                        </div>
                      </td>
                    </tr>

                    {/* VI */}
                    <tr>
                      <td colSpan="2">
                        <strong>VI. Catatan lain-lain</strong>
                      </td>
                    </tr>

                    {/* VII */}
                    <tr>
                      <td colSpan="2">
                        <strong>VII. PERHATIAN</strong><br />
                        <span style={{ fontSize: '7.5pt', lineHeight: 1.1 }}>
                          Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta Bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan, kealpaannya.
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* TTD PENGGUNA ANGGARAN POSISI PERSIS DI BAWAH TABEL */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '8.5pt', lineHeight: 1.2 }}>
                    <strong>Pengguna Anggaran</strong>
                    <div style={{ height: '40px' }}></div>
                    <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                    NIP. 198008012010011018
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* UPLOAD BERKAS TTD & VERIFIKASI TAHAP */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }} className="no-print">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            📁 Upload Berkas Bertanda Tangan & Verifikasi Tahap
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            
            <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '20px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📑</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                Upload ST / SPD Bertanda Tangan (PDF/Gambar)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>
                Dapat diunggah kemudian hari jika dokumen TTD fisik sudah terbit.
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
                  ℹ️ Belum ada berkas terunggah (Dapat disusulkan)
                </div>
              )}
            </div>

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
                    backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px 18px',
                    borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer',
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
                    backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '12px 18px',
                    borderRadius: '10px', fontWeight: '800', fontSize: '13.5px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  {updatingTahap ? 'Memproses...' : '✅ Selesaikan & Lanjut Ke Tahap 3: Pelaporan LHP →'}
                </button>
              )}
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
