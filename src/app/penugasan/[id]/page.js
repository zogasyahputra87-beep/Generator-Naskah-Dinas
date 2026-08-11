'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

// Helper konversi aman ke String agar React tidak crash (#130)
function safeString(val, fallback = '-') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    return val.nama || val.label || val.teks || JSON.stringify(val);
  }
  return String(val);
}

// Helper jeda waktu antar pengunduhan otomatis
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPersonil, setSelectedPersonil] = useState([]);

  // State Modal Edit Penugasan
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nomor_surat: '',
    maksud_penugasan: '',
    tempat_tujuan: '',
    tanggal_surat: '',
    tanggal_spd: '',
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
            const personil = Array.isArray(item.personil) ? item.personil : [];
            setSelectedPersonil(personil.map((_, idx) => idx));

            // Isi nilai awal form edit
            setEditForm({
              nomor_surat: item.nomor_surat || '',
              maksud_penugasan: item.maksud_penugasan || '',
              tempat_tujuan: item.tempat_tujuan || '',
              tanggal_surat: item.tanggal_surat || '',
              tanggal_spd: item.tanggal_spd || '',
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

  // Handler Simpan Perubahan Edit Penugasan
  const handleSaveEdit = async (e) => {
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
          alert('Data penugasan berhasil diperbarui! Surat Tugas & SPD otomatis menggunakan data baru.');
        }
      } else {
        alert('Gagal memperbarui data penugasan.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan saat menyimpan perubahan.');
    }
  };

  const handleTogglePersonil = (index) => {
    if (selectedPersonil.includes(index)) {
      setSelectedPersonil(selectedPersonil.filter(i => i !== index));
    } else {
      setSelectedPersonil([...selectedPersonil, index]);
    }
  };

  const handleSelectAllPersonil = () => {
    const listPersonil = Array.isArray(detail?.personil) ? detail.personil : [];
    if (selectedPersonil.length === listPersonil.length) {
      setSelectedPersonil([]);
    } else {
      setSelectedPersonil(listPersonil.map((_, idx) => idx));
    }
  };

  // Handler Download Surat Tugas Word
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
        alert(`Gagal mengunduh Surat Tugas: ${errJson.message || 'Error pada server backend (500)'}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat mengunduh Surat Tugas.');
    }
  };

  // Helper API SPD
  const fetchSPDFile = async (payload, defaultFilename) => {
    try {
      const response = await fetch('/api/generate-spd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return true;
      } else {
        const errJson = await response.json().catch(() => ({}));
        alert(`Gagal membuat dokumen SPD: ${errJson.message || 'Error pada server backend (500)'}`);
        return false;
      }
    } catch (err) {
      alert('Gagal menghubungi server API SPD.');
      return false;
    }
  };

  // Unduh 1 Personil SPD
  const handleDownloadSPDDepanSingle = async (personil) => {
    if (!detail) return;
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

    await fetchSPDFile(payloadSPD, `SPD_Depan_${(namaPersonil || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`);
  };

  // Unduh SPD Depan untuk seluruh personil terpilih secara otomatis
  const handleDownloadSPDDepanMassal = async () => {
    if (!detail) return;
    const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const targetPersonil = listPersonil.filter((_, idx) => selectedPersonil.includes(idx));

    if (targetPersonil.length === 0) {
      alert('Pilih minimal satu personil.');
      return;
    }

    for (let i = 0; i < targetPersonil.length; i++) {
      const p = targetPersonil[i];
      await handleDownloadSPDDepanSingle(p);
      if (i < targetPersonil.length - 1) {
        await delay(500);
      }
    }
  };

  // Unduh Lembar Visum (Halaman Belakang)
  const handleDownloadSPDBelakang = async () => {
    if (!detail) return;
    const payloadVisum = {
      nomor_spd: detail.nomor_surat,
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tgl_berangkat: detail.tanggal_surat,
      tgl_kembali: detail.tanggal_surat,
      tgl_spd: detail.tanggal_spd,
      halaman_belakang_only: true
    };

    await fetchSPDFile(payloadVisum, `SPD_Halaman_Belakang_Visum.docx`);
  };

  // Link GDrive Handler
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  
  let ketuaTimNama = '-';
  if (detail.ketua_tim) {
    ketuaTimNama = safeString(detail.ketua_tim);
  } else if (listPersonil.length > 0) {
    ketuaTimNama = safeString(listPersonil[0]);
  }

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
              {safeString(detail.maksud_penugasan)}
            </h1>
            <div style={{ fontSize: '13px', color: '#718096', marginTop: '4px' }}>
              Nomor Penugasan: <strong>{safeString(detail.nomor_surat)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => setIsEditing(true)} 
              style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✏️ Edit Penugasan
            </button>

            <span style={{ 
              padding: '6px 14px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: 'bold',
              backgroundColor: detail.status === 'Selesai TLHP' ? '#c6f6d5' : '#feebc8',
              color: detail.status === 'Selesai TLHP' ? '#22543d' : '#744210'
            }}>
              Status: {safeString(detail.status, 'Surat Tugas')}
            </span>
          </div>
        </div>

        {/* HIRARKI TIM */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #edf2f7' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Obyek Pengawasan</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{safeString(detail.tempat_tujuan)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Irban Wilayah</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{safeString(detail.irban_wilayah, 'Inspektur Pembantu Wilayah I')}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Pengendali Teknis</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{safeString(detail.pengendali_teknis, 'Auditor Ahli Madya')}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: 'bold', textTransform: 'uppercase' }}>Ketua Tim</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2d3748', marginTop: '2px' }}>{ketuaTimNama}</div>
          </div>
        </div>
      </div>

      {/* MODAL POPUP EDIT PENUGASAN */}
      {isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', fontSize: '16px' }}>✏️ Edit Penugasan</h3>
            <form onSubmit={handleSaveEdit}>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor Surat Penugasan:</label>
                <input 
                  type="text" 
                  value={editForm.nomor_surat} 
                  onChange={(e) => setEditForm({ ...editForm, nomor_surat: e.target.value })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} 
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Maksud / Tujuan Penugasan:</label>
                <textarea 
                  value={editForm.maksud_penugasan} 
                  onChange={(e) => setEditForm({ ...editForm, maksud_penugasan: e.target.value })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', height: '80px', fontSize: '13px' }} 
                  required
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Obyek Pengawasan / Tempat Tujuan:</label>
                <input 
                  type="text" 
                  value={editForm.tempat_tujuan} 
                  onChange={(e) => setEditForm({ ...editForm, tempat_tujuan: e.target.value })} 
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} 
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Surat Tugas:</label>
                  <input 
                    type="date" 
                    value={editForm.tanggal_surat} 
                    onChange={(e) => setEditForm({ ...editForm, tanggal_surat: e.target.value })} 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal SPD:</label>
                  <input 
                    type="date" 
                    value={editForm.tanggal_spd} 
                    onChange={(e) => setEditForm({ ...editForm, tanggal_spd: e.target.value })} 
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  style={{ padding: '8px 16px', border: '1px solid #cbd5e0', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '12px' }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2b6cb0', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* TAHAPAN PENUGASAN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        
        {/* PERENCANAAN */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ borderBottom: '2px solid #2b6cb0', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ backgroundColor: '#2b6cb0', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>1</span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1a202c' }}>Perencanaan & Persiapan</h3>
          </div>

          {/* SURAT TUGAS */}
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
                {safeString(detail.status_st, 'Hasil Generate')}
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

          {/* SPD */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '12px', backgroundColor: '#fdfdfd' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '13px' }}>📑 SPD / SPPD Personil</span>
              <button 
                onClick={handleSelectAllPersonil}
                style={{ fontSize: '10px', color: '#2b6cb0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {selectedPersonil.length === listPersonil.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
              </button>
            </div>

            {/* LIST PERSONIL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              {listPersonil.map((p, idx) => {
                const namaStr = safeString(p);
                const jabatanStr = typeof p === 'object' ? safeString(p.jabatan, '') : '';
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#f7fafc', borderRadius: '4px', fontSize: '12px', border: '1px solid #edf2f7' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1 }}>
                      <input 
                        type="checkbox" 
                        checked={selectedPersonil.includes(idx)} 
                        onChange={() => handleTogglePersonil(idx)} 
                      />
                      <div>
                        <strong style={{ display: 'block', fontSize: '12px' }}>{namaStr}</strong>
                        {jabatanStr ? <span style={{ color: '#718096', fontSize: '10px' }}>{jabatanStr}</span> : null}
                      </div>
                    </label>
                    <button onClick={() => handleDownloadSPDDepanSingle(p)} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '3px 8px', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>
                      Depan
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={handleDownloadSPDDepanMassal}
                style={{ width: '100%', backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📄 Unduh Halaman Depan Terpilih ({selectedPersonil.length})
              </button>

              <button 
                onClick={handleDownloadSPDBelakang}
                style={{ width: '100%', backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📑 Unduh Halaman Belakang (Visum)
              </button>
            </div>

          </div>
        </div>

        {/* PELAKSANAAN */}
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

        {/* PELAPORAN */}
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
