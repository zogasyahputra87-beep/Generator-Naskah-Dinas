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
  
  // Tab Naskah Active: 'st' | 'spd_depan' | 'spd_belakang'
  const [activeTabNaskah, setActiveTabNaskah] = useState('st');
  const [showParafHierarki, setShowParafHierarki] = useState(true);
  const [activeSPDIndex, setActiveSPDIndex] = useState(0);

  // Form Isian Variabel SPD
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail naskah dinas...</div>;
  if (!detail) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#e53e3e' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const rawListDasar = Array.isArray(detail.dasar_hukum) && detail.dasar_hukum.length > 0 
    ? detail.dasar_hukum 
    : DASAR_HUKUM_DEFAULT;
  const listDasarWithDenganIni = appendDenganIni(rawListDasar);

  // Personil Terpilih untuk SPD Depan
  const currentPersonilSPD = listPersonil[activeSPDIndex] || {};
  const pNama = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nama || '-') : String(currentPersonilSPD || '-');
  const pNip = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.nip || '-') : '-';
  const pGol = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.pangkat_gol || '-') : '-';
  const pJab = typeof currentPersonilSPD === 'object' ? (currentPersonilSPD?.jabatan || '-') : '-';

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'Arial, sans-serif', paddingBottom: '60px' }}>
      
      {/* CSS MEDIA PRINT PRESISI SESUAI PAGE SETUP */}
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

      {/* NAVIGASI & HEADER PANEL */}
      <div style={{ marginBottom: '16px' }} className="no-print">
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PANEL TOMBOL KONTROL & PILIHAN NASKAH */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} className="no-print">
        
        {/* NAVIGASI TAB DOKUMEN */}
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

        {/* AKSI CETAK / SAKELAR */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* SAKELAR HANYA TAMPIL DI TAB SURAT TUGAS */}
          {activeTabNaskah === 'st' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#edf2f7', padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e0' }}>
              <input type="checkbox" checked={showParafHierarki} onChange={(e) => setShowParafHierarki(e.target.checked)} />
              <span>Paraf Hierarki: {showParafHierarki ? 'ON' : 'OFF'}</span>
            </label>
          )}

          <button onClick={handlePrintPDF} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            🖨️ Cetak / Export PDF Siap Jadi
          </button>
        </div>
      </div>

      {/* SUB-BAR PERSONIL UNTUK SPD DEPAN */}
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

      {/* CONTAINER DOKUMEN UTAMA (A4 PRESISI) */}
      <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
        <div 
          id="print-section"
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

          {/* KOP SURAT DIKUNCI PRESISI PADA SEMUA NASKAH */}
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

          {/* ==================== 1. NASKAH SURAT TUGAS ==================== */}
          {activeTabNaskah === 'st' && (
            <div>
              {/* JUDUL SURAT & NOMOR */}
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

              {/* MEMERINTAHKAN: */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', margin: '14px 0' }}>
                MEMERINTAHKAN:
              </div>

              {/* TABEL KEPADA */}
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

              {/* TABEL UNTUK */}
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

              {/* PARAGRAF PENUTUP & INTEGRITAS */}
              <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
              </div>
              <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '8px', lineHeight: 1.15 }}>
                Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas <strong>tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan</strong>.
              </div>
              <div style={{ textIndent: '1.59cm', textAlign: 'justify', marginBottom: '24px', lineHeight: 1.15 }}>
                Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
              </div>

              {/* PARAF HIERARKI & BLOK TTD INSPEKTUR */}
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

          {/* ==================== 2. NASKAH SPD HALAMAN DEPAN ==================== */}
          {activeTabNaskah === 'spd_depan' && (
            <div>
              {/* ATAS SPD: LEMBAR KE & NOMOR */}
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

              {/* JUDUL SPD */}
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', margin: '12px 0 16px 0' }}>
                SURAT PERJALANAN DINAS (SPD)
              </div>

              {/* TABEL SPD 10 POIN (MURNI TANPA PARAF HIERARKI) */}
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

              {/* TTD PENGGUNA ANGGARAN SPD DEPAN (MURNI TANPA PARAF) */}
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

          {/* ==================== 3. NASKAH SPD HALAMAN BELAKANG (VISUM) ==================== */}
          {activeTabNaskah === 'spd_belakang' && (
            <div>
              {/* TABEL VISUM (POIN I s.d. V) */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontSize: '10pt', lineHeight: 1.25 }} border="1" cellPadding="6">
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

              {/* KLAUSUL PERIKSA & PERHATIAN */}
              <div style={{ fontSize: '9.5pt', margin: '12px 0', textAlign: 'justify', lineHeight: 1.25 }}>
                Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
              </div>

              <div style={{ fontSize: '9.5pt', marginBottom: '8px' }}>
                <strong>VI. Catatan lain-lain</strong>
              </div>

              <div style={{ fontSize: '9.5pt', marginBottom: '16px' }}>
                <strong>VII. PERHATIAN</strong><br />
                Pejabat yang berwenang menerbitkan SPPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan tanggal berangkat/tiba serta Bendaharawan bertanggung jawab berdasarkan peraturan-peraturan Keuangan Negara apabila Negara mendapat rugi akibat kesalahan, kealpaannya.
              </div>

              {/* TTD PENGGUNA ANGGARAN VISUM (MURNI TANPA PARAF) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <div style={{ width: '7.5cm', textAlign: 'left', fontSize: '10.5pt', lineHeight: 1.25 }}>
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
  );
}
