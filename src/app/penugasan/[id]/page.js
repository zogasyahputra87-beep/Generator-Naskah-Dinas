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

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1); // 1: Perencanaan, 2: Pelaksanaan, 3: Pelaporan

  // Preview States
  const [stBlobUrl, setStBlobUrl] = useState(null);
  const [spdPreviewUrls, setSpdPreviewUrls] = useState({});
  const [generatingST, setGeneratingST] = useState(false);
  const [generatingSPD, setGeneratingSPD] = useState({});

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
    setEditForm({
      nomor_surat: item.nomor_surat || '',
      maksud_penugasan: item.maksud_penugasan || '',
      tempat_tujuan: item.tempat_tujuan || '',
      irban_wilayah: item.irban_wilayah || 'Inspektur Pembantu Wilayah I',
      pengendali_teknis: item.pengendali_teknis || 'Auditor Ahli Madya',
      ketua_tim: safeString(item.ketua_tim, ''),
      tanggal_surat: item.tanggal_surat || '',
      tanggal_spd: item.tanggal_spd || '',
      dasar_hukum: Array.isArray(item.dasar_hukum) ? [...item.dasar_hukum] : [],
      personil: Array.isArray(item.personil) ? JSON.parse(JSON.stringify(item.personil)) : [],
    });
  };

  // HANDLER PREVIEW SURAT TUGAS
  const handleGenerateSTPreview = async () => {
    if (!detail) return;
    setGeneratingST(true);
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
        setStBlobUrl(url);
      } else {
        alert('Gagal menghasilkan preview Surat Tugas.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setGeneratingST(false);
    }
  };

  // HANDLER PREVIEW SPD PERSONIL
  const handleGenerateSPDPreview = async (index, personil) => {
    if (!detail) return;
    setGeneratingSPD(prev => ({ ...prev, [index]: true }));

    const namaPersonil = typeof personil === 'object' ? (personil.nama || '') : safeString(personil, '');
    const payloadSPD = {
      nomor_spd: detail.nomor_surat,
      nama: namaPersonil,
      nip: typeof personil === 'object' ? (personil.nip || '') : '',
      pangkat_gol: typeof personil === 'object' ? (personil.pangkat_gol || '') : '',
      jabatan: typeof personil === 'object' ? (personil.jabatan || '') : '',
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
        setSpdPreviewUrls(prev => ({ ...prev, [index]: url }));
      } else {
        alert('Gagal menghasilkan preview SPD.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setGeneratingSPD(prev => ({ ...prev, [index]: false }));
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
          setStBlobUrl(null); // Reset preview agar diperbarui
          setSpdPreviewUrls({});
          alert('Data penugasan dan tim berhasil diperbarui!');
        }
      } else {
        alert('Gagal menyimpan perubahan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menyimpan.');
    }
  };

  // HANDLER DYNAMIC FORM EDIT PERSONIL
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

  // HANDLER DYNAMIC FORM EDIT DASAR HUKUM
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
    const linkGDrive = prompt('Masukkan Link Google Drive / Docs Surat Tugas TTD:');
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
        alert('Tautan Google Drive Surat Tugas TTD berhasil disimpan!');
        window.location.reload();
      }
    } catch (err) {
      alert('Gagal menyimpan tautan ST TTD.');
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      
      {/* NAVIGASI */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* HEADER PROFIL PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0', textTransform: 'uppercase' }}>
              Profil Penugasan Pengawasan
            </span>
            <h1 style={{ margin: '4px 0 6px 0', fontSize: '20px', color: '#1a202c' }}>
              {safeString(detail.maksud_penugasan)}
            </h1>
            <div style={{ fontSize: '13px', color: '#4a5568' }}>
              Nomor: <strong>{safeString(detail.nomor_surat)}</strong> | Obyek: <strong>{safeString(detail.tempat_tujuan)}</strong>
            </div>
          </div>

          <button 
            onClick={() => { initEditForm(detail); setIsEditing(true); }}
            style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✏️ Edit Penugasan Lengkap
          </button>
        </div>
      </div>

      {/* TAB NAVIGASI TAHAPAN */}
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
          1. Perencanaan & Persiapan
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

      {/* ISIAN TAHAP 1: PERENCANAAN & PERSIAPAN */}
      {activeStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION SURAT TUGAS */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📄 Dokumen Surat Tugas</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Generate Word, Pratinjau Dokumen, dan Tautkan File TTD</span>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', backgroundColor: detail.status_st === 'Disahkan (Sudah TTD)' ? '#c6f6d5' : '#feebc8', color: detail.status_st === 'Disahkan (Sudah TTD)' ? '#22543d' : '#744210' }}>
                {safeString(detail.status_st, 'Hasil Generate')}
              </span>
            </div>

            {/* ACTION BUTTONS ST */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleGenerateSTPreview} 
                disabled={generatingST}
                style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {generatingST ? 'Memproses...' : '👁️ Pratinjau Dokumen Surat Tugas'}
              </button>

              {detail.link_st_ttd ? (
                <a href={detail.link_st_ttd} target="_blank" rel="noreferrer" style={{ backgroundColor: '#38a169', color: '#fff', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none' }}>
                  🔗 Buka ST TTD di Google Drive / Docs
                </a>
              ) : (
                <button onClick={handleUploadSTSigned} style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  📤 Tambahkan / Tautkan ST TTD (GDrive)
                </button>
              )}
            </div>

            {/* PREVIEW CONTAINER ST */}
            {stBlobUrl && (
              <div style={{ border: '1px solid #cbd5e0', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f7fafc', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>Pratinjau Hasil Generate Surat Tugas (.docx)</span>
                  <a href={stBlobUrl} download={`Surat_Tugas_${safeString(detail.nomor_surat, 'ST').replace(/[\/\s]+/g, '_')}.docx`} style={{ backgroundColor: '#4a5568', color: '#fff', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
                    📥 Unduh File Word (.docx)
                  </a>
                </div>
                
                {/* Visual Placeholder Pratinjau */}
                <div style={{ border: '1px dashed #cbd5e0', padding: '30px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#2d3748', fontWeight: 'bold' }}>
                    Surat Tugas Nomor: {safeString(detail.nomor_surat)} Siap Diunduh!
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#718096' }}>
                    File Word (.docx) dapat langsung dibuka di Microsoft Word atau diunggah ke Google Docs untuk dibagikan.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION SPD PERSONIL */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📑 Dokumen Surat Perjalanan Dinas (SPD) Personil</h3>
              <span style={{ fontSize: '12px', color: '#718096' }}>Daftar personil penugasan dan pratinjau lembar SPD masing-masing</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {listPersonil.map((p, idx) => {
                const namaStr = safeString(p);
                const nipStr = typeof p === 'object' ? (p.nip || '-') : '-';
                const jabatanStr = typeof p === 'object' ? (p.jabatan || 'Anggota Tim') : 'Anggota Tim';

                return (
                  <div key={idx} style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: '#2d3748', display: 'block' }}>{idx + 1}. {namaStr}</strong>
                        <span style={{ fontSize: '12px', color: '#718096' }}>NIP: {nipStr} | Jabatan: {jabatanStr}</span>
                      </div>

                      <button 
                        onClick={() => handleGenerateSPDPreview(idx, p)}
                        disabled={generatingSPD[idx]}
                        style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {generatingSPD[idx] ? 'Memproses...' : '📄 Pratinjau SPD Depan'}
                      </button>
                    </div>

                    {/* PREVIEW CONTAINER SPD INDIVIDUAL */}
                    {spdPreviewUrls[idx] && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #cbd5e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#38a169', fontWeight: 'bold' }}>✓ Dokumen SPD Depan Siap</span>
                          <a href={spdPreviewUrls[idx]} download={`SPD_Depan_${namaStr.replace(/[\/\s]+/g, '_')}.docx`} style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', textDecoration: 'none', fontWeight: 'bold' }}>
                            📥 Unduh SPD Word (.docx)
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ISIAN TAHAP 2: PELAKSANAAN */}
      {activeStep === 2 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#dd6b20' }}>Tahap 2: Pelaksanaan Pemeriksaan Lapangan</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>
            Unggah Berita Acara, Kertas Kerja Pemeriksaan (KKP), dan dokumentasi pemeriksaan lapangan.
          </p>
          <div style={{ padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
            Fitur unggah berkas KKP & Berita Acara Lapangan.
          </div>
        </div>
      )}

      {/* ISIAN TAHAP 3: PELAPORAN & TLHP */}
      {activeStep === 3 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#38a169' }}>Tahap 3: Pelaporan (LHP) & Tindak Lanjut</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>
            Manajemen Dokumen Laporan Hasil Pemeriksaan (LHP) dan pemantauan tindak lanjut rekomendasi.
          </p>
          <div style={{ padding: '40px', border: '2px dashed #cbd5e0', borderRadius: '6px', textAlign: 'center', color: '#a0aec0', fontSize: '13px' }}>
            Fitur unggah LHP & pemantauan status TLHP.
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
              
              {/* FORM INFORMASI UTAMA */}
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

              {/* EDIT ANGGOTA TIM (PERSONIL) */}
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

              {/* TOMBOL AKSI MODAL */}
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
