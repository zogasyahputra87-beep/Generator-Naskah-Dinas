'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

function safeString(val, fallback = '-') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    return val.nama || val.label || val.teks || JSON.stringify(val);
  }
  return String(val);
}

function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1); // 1: Perencanaan, 2: Pelaksanaan, 3: Pelaporan

  // Preview States
  const [showSTPreview, setShowSTPreview] = useState(true);
  const [activeSPDPreviewIndex, setActiveSPDPreviewIndex] = useState(null);

  // Modal Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nomor_surat: '',
    maksud_penugasan: '',
    tempat_tujuan: '',
    irban_wilayah: '',
    pengendali_teknis: '',
    ketua_tim: '',
    tanggal_surat: '',
    tanggal_spd: '',
    dasar_hukum: [],
    personil: [],
  });

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
            const item = data[0];
            setDetail(item);
            initEditForm(item);
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

  const initEditForm = (item) => {
    const personilArr = Array.isArray(item.personil) ? JSON.parse(JSON.stringify(item.personil)) : [];
    let ketuaNama = safeString(item.ketua_tim, '');
    if (!ketuaNama && personilArr.length > 0) {
      ketuaNama = typeof personilArr[0] === 'object' ? (personilArr[0].nama || '') : String(personilArr[0]);
    }

    setEditForm({
      nomor_surat: item.nomor_surat || '',
      maksud_penugasan: item.maksud_penugasan || '',
      tempat_tujuan: item.tempat_tujuan || '',
      irban_wilayah: item.irban_wilayah || 'Inspektur Pembantu Wilayah I',
      pengendali_teknis: item.pengendali_teknis || 'Auditor Ahli Madya',
      ketua_tim: ketuaNama,
      tanggal_surat: item.tanggal_surat || '',
      tanggal_spd: item.tanggal_spd || '',
      dasar_hukum: Array.isArray(item.dasar_hukum) ? [...item.dasar_hukum] : [],
      personil: personilArr,
    });
  };

  // DOWNLOAD SURAT TUGAS WORD
  const handleDownloadSuratTugas = async () => {
    if (!detail) return;
    const payload = {
      nomor_surat: detail.nomor_surat,
      dasar_list: Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [],
      pegawai_list: Array.isArray(detail.personil) ? detail.personil : [],
      penugasan: detail.maksud_penugasan,
      tanggal: detail.tanggal_surat,
      tempat_tujuan: detail.tempat_tujuan
    };

    try {
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
        a.download = `Surat_Tugas_${safeString(detail.nomor_surat, 'ST').replace(/[\/\s]+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`Gagal mengunduh Surat Tugas: ${errJson.message || 'Error Server'}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server API Surat Tugas.');
    }
  };

  // DOWNLOAD SPD DEPAN SINGLE WORD
  const handleDownloadSPDDepanSingle = async (personil) => {
    if (!detail) return;
    const namaPersonil = typeof personil === 'object' ? (personil.nama || '') : safeString(personil, '');
    const payloadSPD = {
      nomor_spd: detail.nomor_surat,
      nama: namaPersonil,
      nip: typeof personil === 'object' ? (personil.nip || '-') : '-',
      pangkat_gol: typeof personil === 'object' ? (personil.pangkat_gol || '-') : '-',
      jabatan: typeof personil === 'object' ? (personil.jabatan || '-') : '-',
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tgl_berangkat: detail.tanggal_surat,
      tgl_kembali: detail.tanggal_surat,
      tgl_spd: detail.tanggal_spd,
    };

    try {
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
        a.download = `SPD_Depan_${(namaPersonil || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengunduh SPD.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat mengunduh SPD.');
    }
  };

  // SIMPAN EDIT PENUGASAN MENYELURUH
  const handleSaveEditPenugasan = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const updatedData = await response.json();
        if (updatedData && updatedData.length > 0) {
          setDetail(updatedData[0]);
          setIsEditing(false);
          alert('Data penugasan dan tim berhasil diperbarui!');
        }
      } else {
        alert('Gagal menyimpan perubahan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menyimpan.');
    }
  };

  // FORM EDIT DYNAMIC HANDLERS
  const handlePersonilChange = (index, field, value) => {
    const updated = [...editForm.personil];
    if (typeof updated[index] === 'string') {
      updated[index] = { nama: updated[index], nip: '', jabatan: '', pangkat_gol: '' };
    }
    updated[index][field] = value;
    setEditForm({ ...editForm, personil: updated });
  };

  const handleAddPersonil = () => {
    setEditForm({
      ...editForm,
      personil: [...editForm.personil, { nama: '', nip: '', jabatan: 'Anggota Tim', pangkat_gol: '' }]
    });
  };

  const handleRemovePersonil = (index) => {
    const updated = editForm.personil.filter((_, idx) => idx !== index);
    setEditForm({ ...editForm, personil: updated });
  };

  const handleDasarChange = (index, value) => {
    const updated = [...editForm.dasar_hukum];
    updated[index] = value;
    setEditForm({ ...editForm, dasar_hukum: updated });
  };

  const handleAddDasar = () => {
    setEditForm({ ...editForm, dasar_hukum: [...editForm.dasar_hukum, ''] });
  };

  const handleRemoveDasar = (index) => {
    const updated = editForm.dasar_hukum.filter((_, idx) => idx !== index);
    setEditForm({ ...editForm, dasar_hukum: updated });
  };

  // UPLOAD ST TTD
  const handleUploadSTSigned = async () => {
    const linkGDrive = prompt('Masukkan Link Google Drive Surat Tugas TTD:');
    if (!linkGDrive) return;

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
      alert('Gagal menyimpan tautan ST TTD.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const listDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];

  let ketuaTimNama = '-';
  if (detail.ketua_tim) {
    ketuaTimNama = safeString(detail.ketua_tim);
  } else if (listPersonil.length > 0) {
    const p1 = listPersonil[0];
    ketuaTimNama = typeof p1 === 'object' ? (p1.nama || '-') : String(p1);
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      
      {/* NAVIGASI */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PROFIL PENUGASAN TERSTRUKTUR DENGAN HIERARKI RAPI */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        
        {/* HEADER PROFIL */}
        <div style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              Naskah Dinas & Profil Penugasan Pengawasan
            </span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
              {safeString(detail.maksud_penugasan)}
            </h1>
          </div>

          <button 
            onClick={() => { initEditForm(detail); setIsEditing(true); }}
            style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
          >
            ✏️ Edit Penugasan Menyeluruh
          </button>
        </div>

        {/* STRUKTUR INFORMASI UTAMA & HIERARKI TIM */}
        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', width: '200px', fontWeight: 'bold', color: '#4a5568' }}>Nomor Penugasan / Surat</td>
                <td style={{ padding: '8px 0', width: '20px', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#2b6cb0' }}>{safeString(detail.nomor_surat)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Obyek Pengawasan (Tujuan)</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#1a202c' }}>{safeString(detail.tempat_tujuan)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Irban Wilayah Penanggungjawab</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>{safeString(detail.irban_wilayah, 'Inspektur Pembantu Wilayah I')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Pengendali Teknis (Daltek)</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>{safeString(detail.pengendali_teknis, 'Auditor Ahli Madya')}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Ketua Tim Penugasan</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#2d3748' }}>{ketuaTimNama}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Tanggal Pelaksanaan / Surat</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>{formatTanggalIndo(detail.tanggal_surat)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568', verticalAlign: 'top' }}>Anggota Tim ({listPersonil.length} Orang)</td>
                <td style={{ padding: '8px 0', color: '#a0aec0', verticalAlign: 'top' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>
                  <ol style={{ margin: 0, paddingLeft: '18px' }}>
                    {listPersonil.map((p, pIdx) => {
                      const pNama = typeof p === 'object' ? (p.nama || '-') : String(p);
                      const pJabatan = typeof p === 'object' ? (p.jabatan || '') : '';
                      return (
                        <li key={pIdx} style={{ marginBottom: '2px' }}>
                          <strong>{pNama}</strong> {pJabatan ? <span style={{ color: '#718096', fontSize: '12px' }}>({pJabatan})</span> : null}
                        </li>
                      );
                    })}
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TAB NAVIGASI TAHAPAN PENUGASAN */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveStep(1)}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderBottom: activeStep === 1 ? '3px solid #2b6cb0' : 'transparent',
            color: activeStep === 1 ? '#2b6cb0' : '#718096'
          }}
        >
          1. Perencanaan & Naskah Dinas (ST/SPD)
        </button>

        <button 
          onClick={() => setActiveStep(2)}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderBottom: activeStep === 2 ? '3px solid #dd6b20' : 'transparent',
            color: activeStep === 2 ? '#dd6b20' : '#718096'
          }}
        >
          2. Pelaksanaan Lapangan
        </button>

        <button 
          onClick={() => setActiveStep(3)}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            borderBottom: activeStep === 3 ? '3px solid #38a169' : 'transparent',
            color: activeStep === 3 ? '#38a169' : '#718096'
          }}
        >
          3. Pelaporan & TLHP
        </button>
      </div>

      {/* TAHAP 1: PERENCANAAN & NASKAH DINAS */}
      {activeStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AKSI DAN PRATINJAU LANGSUNG SURAT TUGAS */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📄 Pratinjau Naskah Surat Tugas</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Tampilan fisik naskah dinas Surat Tugas sebelum diunduh atau disahkan</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleDownloadSuratTugas}
                  style={{ backgroundColor: '#0066cc', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  📥 Unduh File Word (.docx)
                </button>

                {detail.link_st_ttd ? (
                  <a href={detail.link_st_ttd} target="_blank" rel="noreferrer" style={{ backgroundColor: '#38a169', color: '#fff', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                    🔗 Lihat ST TTD di GDrive
                  </a>
                ) : (
                  <button onClick={handleUploadSTSigned} style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    📤 Tambahkan ST TTD (GDrive)
                  </button>
                )}
              </div>
            </div>

            {/* KOMPONEN PRATINJAU KERTAS SURAT TUGAS */}
            <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
              <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#000', lineHeight: 1.5 }}>
                
                {/* KOP SURAT */}
                <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '8px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</div>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</div>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>
                    Jalan Raya Mondoroko 17B Singosari, Kabupaten Malang, Jawa Timur<br />
                    Telepon/Faksimile ( 0341 ) 451905 Laman: inspektorat.malangkab.go.id | Pos-el: inspektorat@malangkab.go.id Kode Pos: 65153
                  </div>
                </div>

                {/* JUDUL SURAT */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}>SURAT TUGAS</div>
                  <div style={{ fontSize: '12px' }}>NOMOR: {safeString(detail.nomor_surat)}</div>
                </div>

                {/* DASAR HUKUM */}
                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', fontWeight: 'bold', verticalAlign: 'top' }}>Dasar</td>
                      <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>
                        {listDasar.length > 0 ? (
                          <ol style={{ margin: 0, paddingLeft: '16px' }}>
                            {listDasar.map((d, dIdx) => (
                              <li key={dIdx} style={{ marginBottom: '4px' }}>{safeString(d)}</li>
                            ))}
                          </ol>
                        ) : (
                          'Peraturan Daerah Kabupaten Malang tentang Pokok-Pokok Pengelolaan Keuangan Daerah.'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '16px 0' }}>MEMERINTAHKAN:</div>

                {/* KEPADA / PEGAWAI */}
                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', fontWeight: 'bold', verticalAlign: 'top' }}>Kepada</td>
                      <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>
                        {listPersonil.map((p, pIdx) => {
                          const pNama = typeof p === 'object' ? (p.nama || '-') : String(p);
                          const pNip = typeof p === 'object' ? (p.nip || '-') : '-';
                          const pGol = typeof p === 'object' ? (p.pangkat_gol || '-') : '-';
                          const pJab = typeof p === 'object' ? (p.jabatan || '-') : '-';
                          return (
                            <div key={pIdx} style={{ marginBottom: '10px' }}>
                              <strong>{pIdx + 1}. Nama</strong> : {pNama}<br />
                              &nbsp;&nbsp;&nbsp;&nbsp;<strong>NIP</strong> : {pNip}<br />
                              &nbsp;&nbsp;&nbsp;&nbsp;<strong>Pangkat/Gol</strong> : {pGol}<br />
                              &nbsp;&nbsp;&nbsp;&nbsp;<strong>Jabatan</strong> : {pJab}
                            </div>
                          );
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* UNTUK */}
                <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', fontWeight: 'bold', verticalAlign: 'top' }}>Untuk</td>
                      <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>
                        {safeString(detail.maksud_penugasan)} di {safeString(detail.tempat_tujuan)}.
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* TANDA TANGAN */}
                <div style={{ float: 'right', width: '300px', textAlign: 'left', marginTop: '20px' }}>
                  Dikeluarkan di Singosari<br />
                  Pada tanggal {formatTanggalIndo(detail.tanggal_surat)}<br /><br />
                  <strong>INSPEKTUR DAERAH KABUPATEN MALANG</strong>
                  <br /><br /><br /><br />
                  <strong><u>ARRIE HENDRAWAN MAHADHIEKA, S.H.</u></strong><br />
                  Pembina Utama Muda<br />
                  NIP. 198008012010011018
                </div>
                <div style={{ clear: 'both' }}></div>

              </div>
            </div>
          </div>

          {/* PRATINJAU LANGSUNG SPD PERSONIL */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📑 Pratinjau Lembar SPD Personil</h3>
              <span style={{ fontSize: '12px', color: '#718096' }}>Klik nama personil di bawah untuk melihat wujud pratinjau lembar SPD fisik masing-masing</span>
            </div>

            {/* TAB LIST PERSONIL DENGAN PREVIEW */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {listPersonil.map((p, idx) => {
                const namaStr = typeof p === 'object' ? (p.nama || `Pegawai ${idx+1}`) : String(p);
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSPDPreviewIndex(activeSPDPreviewIndex === idx ? null : idx)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e0',
                      backgroundColor: activeSPDPreviewIndex === idx ? '#2b6cb0' : '#f7fafc',
                      color: activeSPDPreviewIndex === idx ? '#fff' : '#2d3748',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    👤 SPD {namaStr}
                  </button>
                );
              })}
            </div>

            {/* TAMPILAN PRATINJAU SPD AKTIF */}
            {activeSPDPreviewIndex !== null && listPersonil[activeSPDPreviewIndex] && (
              <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                {(() => {
                  const p = listPersonil[activeSPDPreviewIndex];
                  const pNama = typeof p === 'object' ? (p.nama || '-') : String(p);
                  const pNip = typeof p === 'object' ? (p.nip || '-') : '-';
                  const pGol = typeof p === 'object' ? (p.pangkat_gol || '-') : '-';
                  const pJab = typeof p === 'object' ? (p.jabatan || '-') : '-';

                  return (
                    <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                      <div style={{ textAlign: 'right', fontSize: '10px', marginBottom: '10px' }}>
                        Lembar ke : .........<br />Nomor : {safeString(detail.nomor_surat)}
                      </div>

                      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', textDecoration: 'underline', marginBottom: '16px' }}>
                        SURAT PERJALANAN DINAS (S.P.D)
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }} border="1" cellPadding="6">
                        <tbody>
                          <tr>
                            <td style={{ width: '30px', textAlign: 'center' }}>1.</td>
                            <td style={{ width: '220px' }}>Pengguna Anggaran</td>
                            <td>ARRIE HENDRAWAN MAHADHIEKA, S.H.</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center' }}>2.</td>
                            <td>Nama Pegawai yang diperintah</td>
                            <td><strong>{pNama}</strong></td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center' }}>3.</td>
                            <td>a. Pangkat dan Golongan<br />b. Jabatan</td>
                            <td>a. {pGol}<br />b. {pJab}</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center' }}>4.</td>
                            <td>Maksud Perjalanan Dinas</td>
                            <td>{safeString(detail.maksud_penugasan)}</td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center' }}>5.</td>
                            <td>Tempat Berangkat / Tujuan</td>
                            <td>Singosari, Kab. Malang / <strong>{safeString(detail.tempat_tujuan)}</strong></td>
                          </tr>
                          <tr>
                            <td style={{ textAlign: 'center' }}>6.</td>
                            <td>Tanggal Berangkat / Kembali</td>
                            <td>{formatTanggalIndo(detail.tanggal_surat)}</td>
                          </tr>
                        </tbody>
                      </table>

                      <div style={{ marginTop: '16px', textAlign: 'right' }}>
                        <button onClick={() => handleDownloadSPDDepanSingle(p)} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                          📥 Unduh File Word SPD ({pNama})
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAHAP 2: PELAKSANAAN */}
      {activeStep === 2 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#dd6b20' }}>Tahap 2: Pelaksanaan Pemeriksaan Lapangan</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>
            Dokumentasi Kertas Kerja Pemeriksaan (KKP), Berita Acara, dan bukti fisik pemeriksaan lapangan.
          </p>
          <div style={{ padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
            Modul pengunggahan Berita Acara & Dokumentasi Lapangan.
          </div>
        </div>
      )}

      {/* TAHAP 3: PELAPORAN & TLHP */}
      {activeStep === 3 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#38a169' }}>Tahap 3: Pelaporan (LHP) & Tindak Lanjut</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>
            Penyusunan Laporan Hasil Pemeriksaan (LHP) dan Pemantauan Tindak Lanjut Hasil Pemeriksaan (TLHP).
          </p>
          <div style={{ padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
            Modul LHP & Pemantauan Rekomendasi TLHP.
          </div>
        </div>
      )}

      {/* MODAL EDIT PENUGASAN MENYELURUH */}
      {isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', fontSize: '18px', color: '#1a202c' }}>
              ✏️ Edit Penugasan Menyeluruh
            </h2>

            <form onSubmit={handleSaveEditPenugasan}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor Surat Penugasan:</label>
                  <input type="text" value={editForm.nomor_surat} onChange={(e) => setEditForm({ ...editForm, nomor_surat: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Obyek Pengawasan / Tempat Tujuan:</label>
                  <input type="text" value={editForm.tempat_tujuan} onChange={(e) => setEditForm({ ...editForm, tempat_tujuan: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} required />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Maksud / Tujuan Penugasan:</label>
                <textarea value={editForm.maksud_penugasan} onChange={(e) => setEditForm({ ...editForm, maksud_penugasan: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', height: '60px', fontSize: '13px' }} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Surat Tugas:</label>
                  <input type="date" value={editForm.tanggal_surat} onChange={(e) => setEditForm({ ...editForm, tanggal_surat: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal SPD:</label>
                  <input type="date" value={editForm.tanggal_spd} onChange={(e) => setEditForm({ ...editForm, tanggal_spd: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
                </div>
              </div>

              {/* EDIT ANGGOTA TIM */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b6cb0' }}>👥 Anggota Tim Penugasan (Personil)</label>
                  <button type="button" onClick={handleAddPersonil} style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Tambah Personil
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editForm.personil.map((p, pIdx) => {
                    const pObj = typeof p === 'object' ? p : { nama: safeString(p), nip: '', jabatan: 'Anggota Tim' };
                    return (
                      <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 30px', gap: '8px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                        <input type="text" placeholder="Nama Pegawai" value={pObj.nama || ''} onChange={(e) => handlePersonilChange(pIdx, 'nama', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                        <input type="text" placeholder="NIP" value={pObj.nip || ''} onChange={(e) => handlePersonilChange(pIdx, 'nip', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                        <input type="text" placeholder="Jabatan Dalam Tim" value={pObj.jabatan || ''} onChange={(e) => handlePersonilChange(pIdx, 'jabatan', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                        <button type="button" onClick={() => handleRemovePersonil(pIdx)} style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* EDIT DASAR HUKUM */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b6cb0' }}>⚖️ Dasar Hukum Penugasan</label>
                  <button type="button" onClick={handleAddDasar} style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Tambah Dasar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {editForm.dasar_hukum.map((d, dIdx) => (
                    <div key={dIdx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="text" value={safeString(d, '')} onChange={(e) => handleDasarChange(dIdx, e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                      <button type="button" onClick={() => handleRemoveDasar(dIdx)} style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e0', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2b6cb0', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                  Simpan Perubahan Penugasan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
