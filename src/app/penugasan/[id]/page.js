'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

// DAFTAR DASAR HUKUM DEFAULT RESMI (4 PERATURAN)
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

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);

  // DUA OPSIONAL FITUR: SAKELAR PARAF HIERARKI & PREVIEW STATE
  const [showParafHierarki, setShowParafHierarki] = useState(true);
  const [activeSPDPreviewIndex, setActiveSPDPreviewIndex] = useState(0);
  const [spdPageType, setSpdPageType] = useState('depan');
  const [showSPDConsole, setShowSPDConsole] = useState(false);

  // Reference Konten Surat Tugas untuk Export
  const printAreaRef = useRef(null);

  // Form SPD State
  const [spdForm, setSpdForm] = useState({
    nomor_spd: '',
    pengguna_anggaran: 'Arrie Hendrawan Mahardhieka, S.H.',
    nip_pa: '198008012010011018',
    tempat_berangkat: 'Inspektorat Daerah Kab. Malang',
    tempat_tujuan: '',
    tempat_kembali: 'Inspektorat Daerah Kab. Malang',
    tgl_spd: '-',
    tgl_berangkat: '-',
    tgl_kembali: '-',
    personil_spd: []
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
            initForms(item);
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

  const initForms = (item) => {
    if (!item) return;

    const rawPersonil = Array.isArray(item.personil) ? JSON.parse(JSON.stringify(item.personil)) : [];
    const personilFormatted = rawPersonil.map((p, idx) => ({
      nama: p?.nama || (typeof p === 'string' ? p : ''),
      nip: p?.nip || '',
      pangkat_gol: p?.pangkat_gol || '',
      jabatan: p?.jabatan || '',
      peran: p?.peran || (idx === 0 ? 'Ketua Tim' : 'Anggota Tim')
    }));

    setSpdForm({
      nomor_spd: item.nomor_surat || '',
      pengguna_anggaran: 'Arrie Hendrawan Mahardhieka, S.H.',
      nip_pa: '198008012010011018',
      tempat_berangkat: item.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: item.tempat_tujuan || '',
      tempat_kembali: item.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      tgl_spd: item.tanggal_spd || item.tanggal_surat || '',
      tgl_berangkat: item.tanggal_surat || '',
      tgl_kembali: item.tanggal_surat || '',
      personil_spd: personilFormatted
    });
  };

  // OPSI 1: FITUR CETAK / SIMPAN PDF PRESISI (BROWSER PRINT ENGINE)
  const handlePrintPDF = () => {
    window.print();
  };

  // OPSI 2: FITUR EXPORT HTML LANGSUNG KE FILE DOCX (TANPA TEMPLATE WORD)
  const handleExportToDocx = () => {
    if (!printAreaRef.current) return;
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Surat Tugas</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.3; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
          .para-hierarki { border: 1px solid #000; padding: 4px; font-size: 9pt; width: 220px; }
        </style>
      </head>
      <body>
        ${printAreaRef.current.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
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
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      
      {/* CSS KHUSUS MEDIA PRINT (MENGHILANGKAN ELEMEN UI SAAT CETAK) */}
      <style jsx global>{`
        @media print {
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
            width: 100%;
            padding: 0;
            margin: 0;
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

      {/* TAB TAHAPAN */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }} className="no-print">
        <button 
          onClick={() => setActiveStep(1)}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 1 ? '3px solid #2b6cb0' : 'transparent',
            color: activeStep === 1 ? '#2b6cb0' : '#718096'
          }}
        >
          1. Naskah Dinas (Surat Tugas & SPD)
        </button>
      </div>

      {activeStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SURAT TUGAS CONTAINER */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* PANEL KONTROL DUA OPSI & SAKELAR PARAF */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }} className="no-print">
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📄 Naskah Surat Tugas Presisi</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Pilih metode ekspor atau cetak langsung</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                
                {/* SAKELAR HILANG/TAMPILKAN PARAF HIERARKI */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#edf2f7', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
                  <input 
                    type="checkbox" 
                    checked={showParafHierarki} 
                    onChange={(e) => setShowParafHierarki(e.target.checked)} 
                  />
                  <span>Tampilkan Paraf Hierarki</span>
                </label>

                {/* OPSI 1: CETAK / SIMPAN PDF */}
                <button 
                  onClick={handlePrintPDF}
                  style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  🖨️ Opsi 1: Cetak / Simpan PDF
                </button>

                {/* OPSI 2: EXPORT KE DOCX */}
                <button 
                  onClick={handleExportToDocx}
                  style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📥 Opsi 2: Export ke Word (.docx)
                </button>
              </div>
            </div>

            {/* AREA CETAK & PRATINJAU PRESISI */}
            <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
              <div 
                id="print-section"
                ref={printAreaRef}
                style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#000', lineHeight: 1.4 }}
              >
                
                {/* KOP SURAT */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px double #000', paddingBottom: '8px', marginBottom: '16px' }}>
                  <img src="/logo-kab-malang.png" alt="Logo" onError={(e) => { e.target.style.display = 'none'; }} style={{ width: '70px', height: 'auto', marginRight: '16px' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</div>
                    <div style={{ fontSize: '10px', marginTop: '2px' }}>
                      Jalan Raya Mondoroko 17B Singosari, Kabupaten Malang, Jawa Timur<br />
                      Telepon/Faksimile ( 0341 ) 451905 Laman: inspektorat.malangkab.go.id | Pos-el: inspektorat@malangkab.go.id Kode Pos: 65153
                    </div>
                  </div>
                </div>

                {/* JUDUL SURAT & NOMOR */}
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}>SURAT TUGAS</div>
                  <div style={{ fontSize: '12px' }}>NOMOR: {safeString(detail.nomor_surat)}</div>
                </div>

                {/* TABEL DASAR HUKUM */}
                <table style={{ width: '100%', marginBottom: '14px', borderCollapse: 'collapse' }}>
                  <tbody>
                    {listDasarWithDenganIni.map((dStr, dIdx) => (
                      <tr key={dIdx}>
                        {dIdx === 0 ? (
                          <>
                            <td style={{ width: '70px', fontWeight: 'bold', verticalAlign: 'top', paddingBottom: '4px' }}>Dasar</td>
                            <td style={{ width: '15px', verticalAlign: 'top', paddingBottom: '4px' }}>:</td>
                          </>
                        ) : (
                          <>
                            <td style={{ width: '70px' }}></td>
                            <td style={{ width: '15px' }}></td>
                          </>
                        )}
                        <td style={{ width: '25px', verticalAlign: 'top', paddingBottom: '4px' }}>{dIdx + 1}.</td>
                        <td style={{ verticalAlign: 'top', paddingBottom: '4px', textAlign: 'justify' }}>{dStr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* KATA MEMERINTAHKAN */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '16px 0' }}>MEMERINTAHKAN:</div>

                {/* TABEL KEPADA (PEGAWAI) */}
                <table style={{ width: '100%', marginBottom: '14px', borderCollapse: 'collapse' }}>
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
                              <td style={{ width: '70px', fontWeight: 'bold', verticalAlign: 'top', paddingBottom: '10px' }}>Kepada</td>
                              <td style={{ width: '15px', verticalAlign: 'top', paddingBottom: '10px' }}>:</td>
                            </>
                          ) : (
                            <>
                              <td style={{ width: '70px' }}></td>
                              <td style={{ width: '15px' }}></td>
                            </>
                          )}
                          <td style={{ width: '25px', verticalAlign: 'top', paddingBottom: '10px' }}>{pIdx + 1}.</td>
                          <td style={{ verticalAlign: 'top', paddingBottom: '10px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '90px' }}>Nama</td>
                                  <td style={{ width: '15px' }}>:</td>
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

                {/* TABEL UNTUK */}
                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '70px', fontWeight: 'bold', verticalAlign: 'top' }}>Untuk</td>
                      <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top', textAlign: 'justify', whiteSpace: 'pre-line' }}>
                        {safeString(detail.maksud_penugasan)}
                        {detail.tempat_tujuan ? `\nbertempat di ${detail.tempat_tujuan}.` : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* PARAGRAF PENUTUP & INTEGRITAS */}
                <div style={{ textAlign: 'justify', marginBottom: '8px', lineHeight: '1.5' }}>
                  Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
                </div>
                <div style={{ textAlign: 'justify', marginBottom: '8px', lineHeight: '1.5' }}>
                  Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan.
                </div>
                <div style={{ textAlign: 'justify', marginBottom: '24px', lineHeight: '1.5' }}>
                  Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
                </div>

                {/* PARAF HIERARKI & TTD INSPEKTUR */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
                  
                  {/* TABEL PARAF HIERARKI DENGAN SAKELAR ON/OFF */}
                  {showParafHierarki ? (
                    <div style={{ border: '1px solid #000', padding: '4px 6px', fontSize: '9pt', width: '230px' }} className="para-hierarki">
                      <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '3px', borderBottom: '1px solid #000', paddingBottom: '2px' }}>
                        PARAF HIERARKI
                      </div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '1px 0' }}>Sekretaris</td>
                            <td style={{ textAlign: 'right' }}>: ......</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 0' }}>Inspektur Pembantu Wilayah I</td>
                            <td style={{ textAlign: 'right' }}>: ......</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '1px 0' }}>Auditor Ahli Madya</td>
                            <td style={{ textAlign: 'right' }}>: ......</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ width: '230px' }}></div>
                  )}

                  {/* BLOK TANDA TANGAN */}
                  <div style={{ width: '260px', textAlign: 'left' }}>
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

        </div>
      )}

    </div>
  );
}
