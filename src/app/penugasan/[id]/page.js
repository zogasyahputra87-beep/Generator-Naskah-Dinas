'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah;',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah;',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah;',
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

export default function DetailPenugasanDanTahapanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // TAHAPAN PROGRES PENUGASAN (1: Perencanaan, 2: Pelaksanaan, 3: Pelaporan)
  const [activeStep, setActiveStep] = useState(1);

  // TAB NASKAH DINAS: 'st' | 'spd_depan' | 'spd_belakang'
  const [activeTabNaskah, setActiveTabNaskah] = useState('st');
  const [showParafHierarki, setShowParafHierarki] = useState(true);
  const [activeSPDIndex, setActiveSPDIndex] = useState(0);

  const printAreaRef = useRef(null);

  const [spdForm, setSpdForm] = useState({
    nomor_spd: '',
    pengguna_anggaran: 'Arrie Hendrawan Mahardhieka, S.H.',
    nip_pa: '198008012010011018',
    tempat_berangkat: 'Inspektorat Daerah Kab. Malang',
    tempat_tujuan: '',
    tempat_kembali: 'Inspektorat Daerah Kab. Malang',
    tgl_spd: '',
    tgl_berangkat: '',
    tgl_kembali: ''
  });

  useEffect(() => {
    if (!penugasanId) return;

    async function fetchDetailPenugasan() {
      try {
        setLoading(true);
        const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}&select=*`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            setDetail(item);
            setSpdForm({
              nomor_spd: item.nomor_surat || '',
              pengguna_anggaran: 'Arrie Hendrawan Mahardhieka, S.H.',
              nip_pa: '198008012010011018',
              tempat_berangkat: item.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
              tempat_tujuan: item.tempat_tujuan || '',
              tempat_kembali: item.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
              tgl_spd: item.tanggal_spd || item.tanggal_surat || '',
              tgl_berangkat: item.tanggal_surat || '',
              tgl_kembali: item.tanggal_surat || ''
            });
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

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportToDocx = () => {
    if (!printAreaRef.current) return;
    
    const judulDoc = activeTabNaskah === 'st' ? 'Surat_Tugas' : activeTabNaskah === 'spd_depan' ? 'SPD_Depan' : 'SPD_Visum';
    const marginStyles = activeTabNaskah === 'spd_belakang' 
      ? '@page { size: A4; margin: 1.5cm 1.5cm 1.5cm 2cm; }' 
      : '@page { size: A4; margin: 2cm 2cm 2.5cm 3cm; }';

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${judulDoc}</title>
        <style>
          ${marginStyles}
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.15; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
        </style>
      </head>
      <body>
        ${printAreaRef.current.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${judulDoc}_${safeString(detail?.nomor_surat, 'Naskah').replace(/[\/\s]+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#e53e3e' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const rawListDasar = Array.isArray(detail.dasar_hukum) && detail.dasar_hukum.length > 0 
    ? detail.dasar_hukum 
    : DASAR_HUKUM_DEFAULT;
  const listDasarWithDenganIni = appendDenganIni(rawListDasar);

  const currentPersonilSPD = listPersonil[activeSPDIndex] || {};
  const pNama = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nama || '-') : String(currentPersonilSPD || '-');
  const pNip = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nip || '-') : '-';
  const pGol = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.pangkat_gol || '-') : '-';
  const pJab = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.jabatan || '-') : '-';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif', paddingBottom: '60px' }}>
      
      {/* CSS MEDIA PRINT PRESISI */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin-top: ${activeTabNaskah === 'spd_belakang' ? '1.5cm' : '2cm'};
            margin-bottom: ${activeTabNaskah === 'spd_belakang' ? '1.5cm' : '2.5cm'};
            margin-left: ${activeTabNaskah === 'spd_belakang' ? '2cm' : '3cm'};
            margin-right: ${activeTabNaskah === 'spd_belakang' ? '1.5cm' : '2cm'};
          }
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* HEADER NAVIGASI */}
      <div style={{ marginBottom: '16px' }} className="no-print">
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PROFIL RINGKAS DETAIL PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }} className="no-print">
        <div style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              Informasi Detail Penugasan
            </span>
            <h1 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
              {safeString(detail.maksud_penugasan)}
            </h1>
          </div>
        </div>

        <div style={{ padding: '16px 20px', fontSize: '13px', color: '#2d3748' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><strong>Nomor Surat Tugas:</strong> <span style={{ color: '#2b6cb0', fontWeight: 'bold' }}>{safeString(detail.nomor_surat)}</span></div>
            <div><strong>Lokasi Perjalanan Dinas:</strong> {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}</div>
            <div><strong>Tanggal Penugasan:</strong> {formatTanggalIndo(detail.tanggal_surat)}</div>
            <div><strong>Jumlah Personil:</strong> {listPersonil.length} Orang</div>
          </div>
        </div>
      </div>

      {/* TAHAPAN PROGRES PENUGASAN (DI BAGIAN BAWAH INFORMASI DETAIL) */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '20px' }} className="no-print">
        <button 
          onClick={() => setActiveStep(1)}
          style={{
            padding: '12px 20px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 1 ? '3px solid #2b6cb0' : 'transparent',
            color: activeStep === 1 ? '#2b6cb0' : '#718096'
          }}
        >
          1. Perencanaan & Naskah Dinas (ST/SPD)
        </button>
        <button 
          onClick={() => setActiveStep(2)}
          style={{
            padding: '12px 20px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 2 ? '3px solid #dd6b20' : 'transparent',
            color: activeStep === 2 ? '#dd6b20' : '#718096'
          }}
        >
          2. Pelaksanaan Lapangan
        </button>
        <button 
          onClick={() => setActiveStep(3)}
          style={{
            padding: '12px 20px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 3 ? '3px solid #38a169' : 'transparent',
            color: activeStep === 3 ? '#38a169' : '#718096'
          }}
        >
          3. Pelaporan & LHP
        </button>
      </div>

      {/* TAHAP 1: PERENCANAAN & NASKAH DINAS */}
      {activeStep === 1 && (
        <div>
          {/* BAR NAVIGASI NASKAH DINAS */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} className="no-print">
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActiveTabNaskah('st')}
                style={{
                  padding: '8px 14px', borderRadius: '4px', border: '1px solid #cbd5e0',
                  backgroundColor: activeTabNaskah === 'st' ? '#2b6cb0' : '#f7fafc',
                  color: activeTabNaskah === 'st' ? '#fff' : '#2d3748',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                📄 Surat Tugas
              </button>
              <button
                onClick={() => setActiveTabNaskah('spd_depan')}
                style={{
                  padding: '8px 14px', borderRadius: '4px', border: '1px solid #cbd5e0',
                  backgroundColor: activeTabNaskah === 'spd_depan' ? '#2b6cb0' : '#f7fafc',
                  color: activeTabNaskah === 'spd_depan' ? '#fff' : '#2d3748',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                📑 SPD (Halaman Depan)
              </button>
              <button
                onClick={() => setActiveTabNaskah('spd_belakang')}
                style={{
                  padding: '8px 14px', borderRadius: '4px', border: '1px solid #cbd5e0',
                  backgroundColor: activeTabNaskah === 'spd_belakang' ? '#2b6cb0' : '#f7fafc',
                  color: activeTabNaskah === 'spd_belakang' ? '#fff' : '#2d3748',
                  fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
                }}
              >
                📋 SPD (Visum / Belakang)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {activeTabNaskah === 'st' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#edf2f7', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
                  <input type="checkbox" checked={showParafHierarki} onChange={(e) => setShowParafHierarki(e.target.checked)} />
                  <span>Paraf Hierarki: {showParafHierarki ? 'ON' : 'OFF'}</span>
                </label>
              )}

              <button onClick={handlePrintPDF} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                🖨️ Cetak / PDF
              </button>

              <button onClick={handleExportToDocx} style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                📥 Export Word (.docx)
              </button>
            </div>
          </div>

          {activeTabNaskah === 'spd_depan' && (
            <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }} className="no-print">
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Pilih Pegawai SPD:</span>
              {listPersonil.map((p, idx) => {
                const nameStr = typeof p === 'object' ? (p?.nama || `Pegawai ${idx+1}`) : String(p || '');
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSPDIndex(idx)}
                    style={{
                      padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0',
                      backgroundColor: activeSPDIndex === idx ? '#4a5568' : '#fff',
                      color: activeSPDIndex === idx ? '#fff' : '#2d3748',
                      fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    👤 {nameStr}
                  </button>
                );
              })}
            </div>
          )}

          {/* PRATINJAU DOKUMEN NASKAH */}
          <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
            <div 
              id="print-section"
              ref={printAreaRef}
              style={{ 
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto', 
                backgroundColor: '#fff', 
                paddingTop: activeTabNaskah === 'spd_belakang' ? '15mm' : '20mm',
                paddingBottom: activeTabNaskah === 'spd_belakang' ? '15mm' : '25mm',
                paddingLeft: activeTabNaskah === 'spd_belakang' ? '20mm' : '30mm',
                paddingRight: activeTabNaskah === 'spd_belakang' ? '15mm' : '20mm',
                boxSizing: 'border-box',
                border: '1px solid #e2e8f0', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                fontFamily: 'Arial, sans-serif', 
                fontSize: activeTabNaskah === 'spd_belakang' ? '10pt' : '12pt', 
                color: '#000', 
                lineHeight: 1.15 
              }}
            >

              {/* KOP SURAT */}
              {activeTabNaskah !== 'spd_belakang' && (
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '6px', marginBottom: '16px' }}>
                  <div style={{ width: '2.99cm', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <img src="/logo-kab-malang.png" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '70px', height: 'auto' }} />
                  </div>
                  <div style={{ width: '12.99cm', textAlign: 'center', lineHeight: 1.25 }}>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '12pt', fontWeight: 'normal' }}>
                      PEMERINTAH KABUPATEN MALANG
                    </div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16pt', fontWeight: 'bold', marginTop: '2px' }}>
                      INSPEKTORAT DAERAH
                    </div>
                    <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', fontWeight: 'normal', marginTop: '3px' }}>
                      Jalan Raya Mondoroko 17B Singosari, Kabupaten Malang, Jawa Timur<br />
                      Telepon/Faksimile ( 0341 ) 451905 Laman: http://inspektorat.malangkab.go.id<br />
                      Pos-el: inspektorat.malangkab@gmail.com, Kode Pos 65153
                    </div>
                  </div>
                </div>
              )}

              {/* SURAT TUGAS */}
              {activeTabNaskah === 'st' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>SURAT TUGAS</div>
                    <div style={{ fontSize: '12pt', marginTop: '2px' }}>NOMOR: {safeString(detail.nomor_surat)}</div>
                  </div>

                  <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: 1.15 }}>
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

                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', margin: '14px 0' }}>
                    MEMERINTAHKAN:
                  </div>

                  <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: 1.15 }}>
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
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12pt' }}>
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

                  <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: 1.15 }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '2.25cm', verticalAlign: 'top' }}>Untuk</td>
                        <td style={{ width: '0.4cm', verticalAlign: 'top' }}>:</td>
                        <td style={{ width: '12.77cm', verticalAlign: 'top', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                          {safeString(detail.maksud_penugasan)}
                          {detail.tempat_tujuan ? ` bertempat di ${detail.tempat_tujuan}.` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                    Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
                  </div>
                  <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                    Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas <strong>tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan</strong>.
                  </div>
                  <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '24px', lineHeight: 1.15 }}>
                    Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
                    {showParafHierarki ? (
                      <div style={{ border: '0.5pt solid #000', width: '6.86cm', fontSize: '8pt', fontFamily: 'Arial, sans-serif' }}>
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
                      <div style={{ width: '6.86cm' }}></div>
                    )}

                    <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '12pt', lineHeight: 1.25 }}>
                      Malang, {formatTanggalIndo(detail.tanggal_surat)}<br />
                      <strong>Plt. Inspektur Kabupaten Malang</strong>
                      <br /><br /><br /><br />
                      <strong><u>Arrie Hendrawan Mahardhieka, S.H.</u></strong><br />
                      Penata Tingkat I<br />
                      NIP 198008012010011018
                    </div>
                  </div>
                </div>
              )}

              {/* SPD HALAMAN DEPAN */}
              {activeTabNaskah === 'spd_depan' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11pt', marginBottom: '8px' }}>
                    <div style={{ width: '260px' }}>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: '90px' }}>Lembar ke</span>
                        <span>: ..........</span>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: '90px' }}>Kode No</span>
                        <span>: ..........</span>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <span style={{ width: '90px' }}>Nomor</span>
                        <span>: {spdForm.nomor_spd || detail.nomor_surat}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', margin: '12px 0 16px 0' }}>
                    SURAT PERJALANAN DINAS (SPD)
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10.5pt', lineHeight: 1.2 }} border="1" cellPadding="6">
                    <tbody>
                      <tr>
                        <td style={{ width: '30px', textAlign: 'center', verticalAlign: 'top' }}>1.</td>
                        <td style={{ width: '230px', verticalAlign: 'top' }}>Pengguna Anggaran</td>
                        <td style={{ verticalAlign: 'top' }}>{spdForm.pengguna_anggaran}</td>
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
                          c. Tingkat C
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>4.</td>
                        <td style={{ verticalAlign: 'top' }}>Maksud Perjalanan Dinas</td>
                        <td style={{ verticalAlign: 'top', textAlign: 'justify' }}>{safeString(detail.maksud_penugasan)}</td>
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
                          a. {spdForm.tempat_berangkat}<br />
                          b. {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}
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
                          b. {formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)}<br />
                          c. {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>8.</td>
                        <td style={{ verticalAlign: 'top' }}>
                          Pengikut<br />
                          1.<br />2.<br />3.
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid #000' }}>
                                <td style={{ fontWeight: 'bold' }}>Nama</td>
                                <td style={{ fontWeight: 'bold' }}>Tanggal Lahir</td>
                                <td style={{ fontWeight: 'bold' }}>Keterangan</td>
                              </tr>
                            </thead>
                            <tbody>
                              <tr><td>-</td><td>-</td><td>-</td></tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>9.</td>
                        <td style={{ verticalAlign: 'top' }}>
                          Pembebanan Anggaran<br />
                          a. SKPD<br />
                          b. Akun
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <br />
                          a. Inspektorat Daerah Kabupaten Malang<br />
                          b. -
                        </td>
                      </tr>
                      <tr>
                        <td style={{ textAlign: 'center', verticalAlign: 'top' }}>10.</td>
                        <td style={{ verticalAlign: 'top' }}>Keterangan lain-lain</td>
                        <td style={{ verticalAlign: 'top' }}>-</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '11pt', lineHeight: 1.25 }}>
                      Dikeluarkan di : Singosari<br />
                      Tanggal : {formatTanggalIndo(spdForm.tgl_spd || detail.tanggal_spd || detail.tanggal_surat)}
                      <br /><br />
                      <strong>Pengguna Anggaran</strong>
                      <br /><br /><br /><br />
                      <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                      NIP. {spdForm.nip_pa}
                    </div>
                  </div>
                </div>
              )}

              {/* SPD VISUM (TANPA KOP SURAT) */}
              {activeTabNaskah === 'spd_belakang' && (
                <div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '9.5pt', lineHeight: 1.2 }} border="1" cellPadding="5">
                    <tbody>
                      <tr>
                        <td style={{ width: '50%', verticalAlign: 'top' }}>
                          <strong>I. Berangkat dari</strong> : {spdForm.tempat_berangkat}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;(Tempat Kedudukan)<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Ke : {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Tanggal : {formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)}<br /><br />
                          <strong>Plt. Inspektur Kabupaten Malang</strong><br /><br /><br /><br />
                          <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                          NIP. {spdForm.nip_pa}
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top' }}>
                          <strong>II. Tiba di</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal : {formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)}<br /><br />
                          <strong>Kepala</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top' }}>
                          &nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari : {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Ke : {spdForm.tempat_kembali}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal : {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}<br /><br />
                          <strong>Kepala</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan || '-'}<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <strong>III. Tiba di</strong> :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br /><br />
                          <strong>Kepala</strong> :<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top' }}>
                          &nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Ke :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br /><br />
                          <strong>Kepala</strong> :<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <strong>IV. Tiba di</strong> :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br /><br />
                          <strong>Kepala</strong> :<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                      </tr>
                      <tr>
                        <td style={{ verticalAlign: 'top' }}>
                          &nbsp;&nbsp;&nbsp;&nbsp;Berangkat dari :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Ke :<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;Pada tanggal :<br /><br />
                          <strong>Kepala</strong> :<br /><br /><br /><br />
                          (.........................................................)<br />
                          NIP.
                        </td>
                        <td style={{ verticalAlign: 'top' }}>
                          <strong>V. Tiba di</strong> : {spdForm.tempat_kembali}<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Pada Tanggal : {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}<br /><br />
                          <strong>Plt. Inspektur Kabupaten Malang</strong><br /><br /><br /><br />
                          <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                          NIP. {spdForm.nip_pa}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ fontSize: '9pt', margin: '10px 0', textAlign: 'justify', lineHeight: 1.2 }}>
                    Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                  </div>

                  <div style={{ fontSize: '9pt', marginBottom: '6px' }}>
                    <strong>VI. Catatan lain-lain</strong>
                  </div>

                  <div style={{ fontSize: '9pt', marginBottom: '14px' }}>
                    <strong>VII. PERHATIAN</strong><br />
                    Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta Bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan, kealpaannya.
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '10pt', lineHeight: 1.2 }}>
                      <strong>Pengguna Anggaran</strong>
                      <br /><br /><br /><br />
                      <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                      NIP. {spdForm.nip_pa}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* TAHAP 2: PELAKSANAAN LAPANGAN */}
      {activeStep === 2 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#dd6b20' }}>🚧 Tahap 2: Pelaksanaan Lapangan & Kertas Kerja</h3>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.6 }}>
            Halaman ini digunakan tim untuk mengunggah atau mendokumentasikan Kertas Kerja Pemeriksaan (KKP), bukti transaksi, serta temuan awal saat verifikasi fisik di lapangan.
          </p>
          <div style={{ marginTop: '16px', padding: '16px', border: '1px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', backgroundColor: '#fffaf0' }}>
            📁 Modul Pelaksanaan Lapangan Siap Dihubungkan dengan File Storage / Catatan Tim.
          </div>
        </div>
      )}

      {/* TAHAP 3: PELAPORAN & TINDAK LANJUT */}
      {activeStep === 3 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#38a169' }}>📋 Tahap 3: Pelaporan & LHP (Tindak Lanjut)</h3>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.6 }}>
            Tahap penyusunan Laporan Hasil Pemeriksaan (LHP) / Reviu dan status rekomendasi tindak lanjut bagi Objek Pengawasan.
          </p>
          <div style={{ marginTop: '16px', padding: '16px', border: '1px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', backgroundColor: '#f0fff4' }}>
            📝 Modul Penyusunan LHP & Matriks Tindak Lanjut Siap Digunakan.
          </div>
        </div>
      )}

    </div>
  );
}
