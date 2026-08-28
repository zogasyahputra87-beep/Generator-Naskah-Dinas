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

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [showParafHierarki, setShowParafHierarki] = useState(true);

  const printAreaRef = useRef(null);

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

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportToDocx = () => {
    if (!printAreaRef.current) return;
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Surat Tugas</title>
        <style>
          @page { size: A4; margin: 2cm 2cm 2.5cm 3cm; }
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.15; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
          .para-hierarki { border: 0.5pt solid #000; font-size: 8pt; width: 6.86cm; }
          .para-header { background-color: #E9E9E9; font-weight: bold; text-align: center; padding: 3pt 0; }
          .indent-paraf { text-indent: 1.59cm; text-align: justify; margin-bottom: 6pt; line-height: 1.15; }
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
    a.download = `Surat_Tugas_${safeString(detail?.nomor_surat, 'ST').replace(/[\/\s]+/g, '_')}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '60px', textAlign: 'center', color: '#e53e3e' }}>Data tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const rawListDasar = Array.isArray(detail.dasar_hukum) && detail.dasar_hukum.length > 0 
    ? detail.dasar_hukum 
    : DASAR_HUKUM_DEFAULT;
  const listDasarWithDenganIni = appendDenganIni(rawListDasar);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif', paddingBottom: '60px' }}>
      
      {/* GLOBAL MEDIA PRINT CSS DENGAN MARGIN MARGIN 2cm 2.5cm 3cm 2cm */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin-top: 2cm;
            margin-bottom: 2.5cm;
            margin-left: 3cm;
            margin-right: 2cm;
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

      {/* NAVIGASI */}
      <div style={{ marginBottom: '16px' }} className="no-print">
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PANEL TOMBOL OPSI */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }} className="no-print">
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📄 Pratinjau Surat Tugas Presisi Perbup No. 2/2025</h3>
          <span style={{ fontSize: '12px', color: '#718096' }}>Margin: Top 2cm, Bottom 2.5cm, Left 3cm, Right 2cm</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#edf2f7', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
            <input type="checkbox" checked={showParafHierarki} onChange={(e) => setShowParafHierarki(e.target.checked)} />
            <span>Tampilkan Paraf Hierarki</span>
          </label>

          <button onClick={handlePrintPDF} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            🖨️ Opsi 1: Cetak / Simpan PDF
          </button>

          <button onClick={handleExportToDocx} style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            📥 Opsi 2: Export ke Word (.docx)
          </button>
        </div>
      </div>

      {/* AREA NASKAH PRESISI */}
      <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
        <div 
          id="print-section"
          ref={printAreaRef}
          style={{ 
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto', 
            backgroundColor: '#fff', 
            paddingTop: '20mm',
            paddingBottom: '25mm',
            paddingLeft: '30mm',
            paddingRight: '20mm',
            boxSizing: 'border-box',
            border: '1px solid #e2e8f0', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
            fontFamily: 'Arial, sans-serif', 
            fontSize: '12pt', 
            color: '#000', 
            lineHeight: 1.15 
          }}
        >
          {/* KOP SURAT DIKUNCI PRESISI */}
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
                Telepon/Faksimile ( 0341 ) 451905 Laman: inspektorat.malangkab.go.id | Pos-el: inspektorat@malangkab.go.id Kode Pos: 65153
              </div>
            </div>
          </div>

          {/* JUDUL SURAT (Arial 16pt Bold) & NOMOR (Arial 12pt Regular) */}
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '16pt', fontWeight: 'bold' }}>SURAT TUGAS</div>
            <div style={{ fontSize: '12pt', marginTop: '2px' }}>NOMOR: {safeString(detail.nomor_surat)}</div>
          </div>

          {/* TABEL DASAR HUKUM */}
          <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: 1.15 }}>
            <tbody>
              {listDasarWithDenganIni.map((dStr, dIdx) => (
                <tr key={dIdx}>
                  {dIdx === 0 ? (
                    <>
                      <td style={{ width: '2.25cm', fontWeight: 'normal', verticalAlign: 'top', paddingBottom: '4px' }}>Dasar</td>
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

          {/* MEMERINTAHKAN: (Arial 14pt Bold Centered) */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', margin: '14px 0' }}>
            MEMERINTAHKAN:
          </div>

          {/* TABEL KEPADA (PEGAWAI) */}
          <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', fontSize: '12pt', lineHeight: 1.15 }}>
            <tbody>
              {listPersonil.map((p, pIdx) => {
                const pNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                const pNip = typeof p === 'object' ? (p?.nip || '-') : '-';
                const pGol = typeof p === 'object' ? (p?.pangkat_gol || '-') : '-';
                const pJab = typeof p === 'object' ? (p?.jabatan || '-') : '-';

                return (
                  <tr key={pIdx}>
                    {pIdx === 0 ? (
                      <>
                        <td style={{ width: '2.25cm', fontWeight: 'normal', verticalAlign: 'top', paddingBottom: '8px' }}>Kepada</td>
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
                            <td><strong>{pNama}</strong></td>
                          </tr>
                          <tr>
                            <td>NIP.</td>
                            <td>:</td>
                            <td>{pNip}</td>
                          </tr>
                          <tr>
                            <td>Pangkat/Gol</td>
                            <td>:</td>
                            <td>{pGol}</td>
                          </tr>
                          <tr>
                            <td>Jabatan</td>
                            <td>:</td>
                            <td>{pJab}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TABEL UNTUK (12.77 cm Sel Isian) */}
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

          {/* PARAGRAF PENUTUP & KLAUSUL INTEGRITAS (First Line Indent: 1.59cm, Justified, Multiple 1.15 li) */}
          <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
            Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
          </div>
          <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
            Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas <strong>tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan</strong>.
          </div>
          <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '24px', lineHeight: 1.15 }}>
            Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
          </div>

          {/* PARAF HIERARKI (6.86cm, Shading #E9E9E9, Font 8pt) & BLOK TTD */}
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

            {/* BLOK TANDA TANGAN */}
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
      </div>

    </div>
  );
}
