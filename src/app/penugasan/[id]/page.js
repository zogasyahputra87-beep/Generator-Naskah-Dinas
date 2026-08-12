'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

const OPSI_PERAN = [
  'Penanggung Jawab',
  'Wakil Penanggung Jawab',
  'Pengendali Teknis',
  'Ketua Tim',
  'Anggota Tim',
  'Pegawai'
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

export default function DetailProgresPenugasanPage() {
  const params = useParams();
  const penugasanId = params?.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  // Preview States
  const [activeSPDPreviewIndex, setActiveSPDPreviewIndex] = useState(null);
  const [spdPageType, setSpdPageType] = useState('depan');

  // Modal Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [jenisTimMode, setJenisTimMode] = useState('pengawasan');
  const [editForm, setEditForm] = useState({
    nomor_surat: '',
    maksud_penugasan: '',
    tempat_tujuan: '',
    tanggal_surat: '',
    tanggal_spd: '',
    dasar_hukum: [],
    personil: [],
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
            initEditForm(item);
          } else {
            setDetail(null);
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
    if (!item) return;
    const rawPersonil = Array.isArray(item.personil) ? JSON.parse(JSON.stringify(item.personil)) : [];
    
    const personilFormatted = rawPersonil.map((p, idx) => {
      if (typeof p === 'string') {
        return { nama: p, nip: '', pangkat_gol: '', jabatan: '', peran: idx === 0 ? 'Ketua Tim' : 'Anggota Tim' };
      }
      return {
        nama: p?.nama || '',
        nip: p?.nip || '',
        pangkat_gol: p?.pangkat_gol || '',
        jabatan: p?.jabatan || '',
        peran: p?.peran || (idx === 0 ? 'Ketua Tim' : 'Anggota Tim')
      };
    });

    const isPerjadin = item.jenis_penugasan === 'perjadin';
    setJenisTimMode(isPerjadin ? 'perjadin' : 'pengawasan');

    const rawDasar = Array.isArray(item.dasar_hukum) ? item.dasar_hukum : [];
    const dasarFormatted = rawDasar.map(d => typeof d === 'object' ? (d?.dasar_hukum || d?.teks || JSON.stringify(d)) : String(d || ''));

    setEditForm({
      nomor_surat: item.nomor_surat || '',
      maksud_penugasan: item.maksud_penugasan || '',
      tempat_tujuan: item.tempat_tujuan || '',
      tanggal_surat: item.tanggal_surat || '',
      tanggal_spd: item.tanggal_spd || '',
      dasar_hukum: dasarFormatted,
      personil: personilFormatted,
    });
  };

  const handleSwitchMode = (mode) => {
    setJenisTimMode(mode);
    if (mode === 'pengawasan' && editForm.personil.length === 0) {
      setEditForm(prev => ({
        ...prev,
        personil: [
          { nama: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.', nip: '198008012010011018', pangkat_gol: 'Pembina Utama Muda', jabatan: 'Inspektur Daerah', peran: 'Penanggung Jawab' },
          { nama: '', nip: '', pangkat_gol: '', jabatan: 'Irban Wilayah I', peran: 'Wakil Penanggung Jawab' },
          { nama: '', nip: '', pangkat_gol: '', jabatan: 'Auditor Ahli Madya', peran: 'Pengendali Teknis' },
          { nama: '', nip: '', pangkat_gol: '', jabatan: 'Auditor Ahli Muda', peran: 'Ketua Tim' },
          { nama: '', nip: '', pangkat_gol: '', jabatan: 'Auditor Ahli Pertama', peran: 'Anggota Tim' }
        ]
      }));
    }
  };

  // HANDLER DOWNLOAD SURAT TUGAS WORD
  const handleDownloadSuratTugas = async () => {
    if (!detail) return;

    const rawDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];
    const dasarListClean = rawDasar.map(d => typeof d === 'object' ? (d?.dasar_hukum || d?.teks || '-') : String(d || '-'));

    const rawPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const pegawaiListClean = rawPersonil.map(p => {
      if (typeof p === 'object') {
        return {
          nama: p?.nama || '-',
          nip: p?.nip || '-',
          pangkat_gol: p?.pangkat_gol || '-',
          jabatan: p?.jabatan || '-'
        };
      }
      return { nama: String(p || '-'), nip: '-', pangkat_gol: '-', jabatan: '-' };
    });

    const payload = {
      nomor_surat: detail.nomor_surat || '-',
      dasar_list: dasarListClean,
      pegawai_list: pegawaiListClean,
      penugasan: detail.maksud_penugasan || '-',
      tanggal: formatTanggalIndo(detail.tanggal_surat),
      tempat_tujuan: detail.tempat_tujuan || '-'
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

  // HANDLER DOWNLOAD SPD DEPAN SINGLE
  const handleDownloadSPDDepanSingle = async (personil) => {
    if (!detail) return;
    const pObj = typeof personil === 'object' ? personil : { nama: String(personil || '') };

    const payloadSPD = {
      nomor_spd: detail.nomor_surat || '-',
      nama: pObj?.nama || '-',
      nip: pObj?.nip || '-',
      pangkat_gol: pObj?.pangkat_gol || '-',
      jabatan: pObj?.jabatan || '-',
      maksud_penugasan: detail.maksud_penugasan || '-',
      tempat_tujuan: detail.tempat_tujuan || '-',
      tgl_berangkat: formatTanggalIndo(detail.tanggal_surat),
      tgl_kembali: formatTanggalIndo(detail.tanggal_surat),
      tgl_spd: formatTanggalIndo(detail.tanggal_spd || detail.tanggal_surat),
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
        a.download = `SPD_Depan_${(pObj?.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengunduh SPD Depan.');
      }
    } catch (err) {
      alert('Gagal menghubungi server API SPD.');
    }
  };

  // HANDLER DOWNLOAD VISUM
  const handleDownloadSPDBelakang = async () => {
    if (!detail) return;
    const payloadVisum = {
      nomor_spd: detail.nomor_surat || '-',
      maksud_penugasan: detail.maksud_penugasan || '-',
      tempat_tujuan: detail.tempat_tujuan || '-',
      tgl_berangkat: formatTanggalIndo(detail.tanggal_surat),
      tgl_kembali: formatTanggalIndo(detail.tanggal_surat),
      tgl_spd: formatTanggalIndo(detail.tanggal_spd || detail.tanggal_surat),
      halaman_belakang_only: true
    };

    try {
      const response = await fetch('/api/generate-spd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadVisum),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SPD_Halaman_Belakang_Visum.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Gagal mengunduh Lembar Visum.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  // SIMPAN EDIT PENUGASAN
  const handleSaveEditPenugasan = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payloadToSave = {
        nomor_surat: editForm.nomor_surat,
        maksud_penugasan: editForm.maksud_penugasan,
        tempat_tujuan: editForm.tempat_tujuan,
        tanggal_surat: editForm.tanggal_surat,
        tanggal_spd: editForm.tanggal_spd,
        dasar_hukum: editForm.dasar_hukum,
        personil: editForm.personil,
      };

      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payloadToSave)
      });

      if (response.ok) {
        const updatedData = await response.json();
        if (Array.isArray(updatedData) && updatedData.length > 0) {
          setDetail({
            ...updatedData[0],
            jenis_penugasan: jenisTimMode
          });
          setIsEditing(false);
          alert('Data penugasan berhasil diperbarui!');
        }
      } else {
        const errorText = await response.text();
        alert(`Gagal menyimpan perubahan: ${errorText}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi saat menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const handlePersonilChange = (index, field, value) => {
    const updated = [...editForm.personil];
    if (updated[index]) {
      updated[index][field] = value;
      setEditForm({ ...editForm, personil: updated });
    }
  };

  const handleAddPersonil = (peranDefault = 'Anggota Tim') => {
    setEditForm({
      ...editForm,
      personil: [...editForm.personil, { nama: '', nip: '', pangkat_gol: '', jabatan: '', peran: peranDefault }]
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#4a5568' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#e53e3e' }}>Data penugasan tidak ditemukan atau ID tidak valid.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const listDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];
  const isPengawasanMode = jenisTimMode !== 'perjadin';

  const pjObj = listPersonil.find(p => typeof p === 'object' && p?.peran === 'Penanggung Jawab');
  const wpjObj = listPersonil.find(p => typeof p === 'object' && p?.peran === 'Wakil Penanggung Jawab');
  const daltekObj = listPersonil.find(p => typeof p === 'object' && p?.peran === 'Pengendali Teknis');
  const ketuaObj = listPersonil.find(p => typeof p === 'object' && p?.peran === 'Ketua Tim');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif', paddingBottom: '60px' }}>
      
      {/* NAVIGASI */}
      <div style={{ marginBottom: '16px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' }}>
          ← Kembali ke Dashboard Penugasan
        </Link>
      </div>

      {/* PROFIL PENUGASAN */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e0', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
                Profil Penugasan Pengawasan
              </span>
              <span style={{ fontSize: '10px', backgroundColor: isPengawasanMode ? '#ed8936' : '#38a169', color: '#fff', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                {isPengawasanMode ? 'Mode Tim Pengawasan' : 'Mode Perjadin Biasa'}
              </span>
            </div>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
              {safeString(detail.maksud_penugasan)}
            </h1>
          </div>

          <button 
            onClick={() => { initEditForm(detail); setIsEditing(true); }}
            style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✏️ Edit Penugasan
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', width: '220px', fontWeight: 'bold', color: '#4a5568' }}>Nomor Penugasan / Surat</td>
                <td style={{ padding: '8px 0', width: '20px', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#2b6cb0' }}>{safeString(detail.nomor_surat)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Obyek / Tempat Tujuan</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#1a202c' }}>{safeString(detail.tempat_tujuan)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Tanggal Pelaksanaan / Surat</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>{formatTanggalIndo(detail.tanggal_surat)}</td>
              </tr>

              {isPengawasanMode ? (
                <>
                  <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>1. Penanggung Jawab</td>
                    <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                    <td style={{ padding: '8px 0', color: '#2d3748' }}>{pjObj ? pjObj.nama : 'Inspektur Daerah Kabupaten Malang'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>2. Wakil Penanggung Jawab</td>
                    <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                    <td style={{ padding: '8px 0', color: '#2d3748' }}>{wpjObj ? wpjObj.nama : 'Irban Wilayah'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>3. Pengendali Teknis (Daltek)</td>
                    <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                    <td style={{ padding: '8px 0', color: '#2d3748' }}>{daltekObj ? daltekObj.nama : 'Auditor Ahli Madya'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>4. Ketua Tim</td>
                    <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                    <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#2d3748' }}>{ketuaObj ? ketuaObj.nama : '-'}</td>
                  </tr>
                </>
              ) : null}

              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568', verticalAlign: 'top' }}>
                  {isPengawasanMode ? '5. Anggota Tim' : 'Daftar Pegawai Ditugaskan'} ({listPersonil.length} Orang)
                </td>
                <td style={{ padding: '8px 0', color: '#a0aec0', verticalAlign: 'top' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>
                  <ol style={{ margin: 0, paddingLeft: '18px' }}>
                    {listPersonil.map((p, pIdx) => {
                      const pNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                      const pJabatan = typeof p === 'object' ? (p?.jabatan || '') : '';
                      const pPeran = typeof p === 'object' ? (p?.peran || '') : '';
                      return (
                        <li key={pIdx} style={{ marginBottom: '4px' }}>
                          <strong>{pNama}</strong> {pPeran ? <span style={{ color: '#2b6cb0', fontSize: '11px', fontWeight: 'bold' }}>[{pPeran}]</span> : null} {pJabatan ? <span style={{ color: '#718096', fontSize: '12px' }}>- {pJabatan}</span> : null}
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

      {/* TAB TAHAPAN */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveStep(1)}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 1 ? '3px solid #2b6cb0' : 'transparent',
            color: activeStep === 1 ? '#2b6cb0' : '#718096'
          }}
        >
          1. Perencanaan & Naskah Dinas (ST/SPD)
        </button>
        <button 
          onClick={() => setActiveStep(2)}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 2 ? '3px solid #dd6b20' : 'transparent',
            color: activeStep === 2 ? '#dd6b20' : '#718096'
          }}
        >
          2. Pelaksanaan Lapangan
        </button>
        <button 
          onClick={() => setActiveStep(3)}
          style={{
            padding: '12px 24px', border: 'none', background: 'none', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
            borderBottom: activeStep === 3 ? '3px solid #38a169' : 'transparent',
            color: activeStep === 3 ? '#38a169' : '#718096'
          }}
        >
          3. Pelaporan & TLHP
        </button>
      </div>

      {/* TAHAP 1 */}
      {activeStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SURAT TUGAS */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📄 Pratinjau Naskah Surat Tugas</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Tampilan fisik naskah dinas Surat Tugas</span>
              </div>

              <button 
                onClick={handleDownloadSuratTugas}
                style={{ backgroundColor: '#0066cc', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                📥 Unduh File Word (.docx)
              </button>
            </div>

            <div style={{ backgroundColor: '#f7fafc', padding: '24px', borderRadius: '6px', border: '1px solid #cbd5e0', overflowX: 'auto' }}>
              <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#000', lineHeight: 1.5 }}>
                
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

                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}>SURAT TUGAS</div>
                  <div style={{ fontSize: '12px' }}>NOMOR: {safeString(detail.nomor_surat)}</div>
                </div>

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

                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '80px', fontWeight: 'bold', verticalAlign: 'top' }}>Kepada</td>
                      <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                      <td style={{ verticalAlign: 'top' }}>
                        {listPersonil.map((p, pIdx) => {
                          const pNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                          const pNip = typeof p === 'object' ? (p?.nip || '-') : '-';
                          const pGol = typeof p === 'object' ? (p?.pangkat_gol || '-') : '-';
                          const pJab = typeof p === 'object' ? (p?.jabatan || '-') : '-';
                          const pPeran = typeof p === 'object' ? (p?.peran || 'Pegawai') : 'Pegawai';
                          
                          return (
                            <div key={pIdx} style={{ marginBottom: '12px' }}>
                              <strong>{pIdx + 1}. Nama</strong> : {pNama} {isPengawasanMode ? <strong>({pPeran})</strong> : null}<br />
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

          {/* SPD */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📑 Pratinjau Dokumen SPD</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Pilih personil untuk pratinjau lembar SPD fisik</span>
              </div>

              <button onClick={handleDownloadSPDBelakang} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                📥 Unduh Word Lembar Visum (Belakang)
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {listPersonil.map((p, idx) => {
                  const namaStr = typeof p === 'object' ? (p?.nama || `Pegawai ${idx+1}`) : String(p || '');
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveSPDPreviewIndex(activeSPDPreviewIndex === idx ? null : idx)}
                      style={{
                        padding: '8px 14px', borderRadius: '4px', border: '1px solid #cbd5e0',
                        backgroundColor: activeSPDPreviewIndex === idx ? '#2b6cb0' : '#f7fafc',
                        color: activeSPDPreviewIndex === idx ? '#fff' : '#2d3748',
                        fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'
                      }}
                    >
                      👤 SPD {namaStr}
                    </button>
                  );
                })}
              </div>

              {activeSPDPreviewIndex !== null && (
                <div style={{ display: 'flex', border: '1px solid #cbd5e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <button onClick={() => setSpdPageType('depan')} style={{ padding: '6px 12px', border: 'none', backgroundColor: spdPageType === 'depan' ? '#4a5568' : '#fff', color: spdPageType === 'depan' ? '#fff' : '#4a5568', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    📄 Halaman Depan
                  </button>
                  <button onClick={() => setSpdPageType('belakang')} style={{ padding: '6px 12px', border: 'none', backgroundColor: spdPageType === 'belakang' ? '#4a5568' : '#fff', color: spdPageType === 'belakang' ? '#fff' : '#4a5568', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                    📑 Halaman Belakang (Visum)
                  </button>
                </div>
              )}
            </div>

            {activeSPDPreviewIndex !== null && listPersonil[activeSPDPreviewIndex] && (
              <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                {(() => {
                  const p = listPersonil[activeSPDPreviewIndex];
                  const pNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                  const pNip = typeof p === 'object' ? (p?.nip || '-') : '-';
                  const pGol = typeof p === 'object' ? (p?.pangkat_gol || '-') : '-';
                  const pJab = typeof p === 'object' ? (p?.jabatan || '-') : '-';

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
                          📥 Unduh File Word SPD Depan ({pNama})
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

      {/* TAHAP 2 */}
      {activeStep === 2 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ marginTop: 0, color: '#dd6b20' }}>Tahap 2: Pelaksanaan Lapangan</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>Dokumentasi KKP dan Berita Acara Lapangan.</p>
        </div>
      )}

      {/* TAHAP 3 */}
      {activeStep === 3 && (
        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ marginTop: 0, color: '#38a169' }}>Tahap 3: Pelaporan (LHP) & TLHP</h3>
          <p style={{ fontSize: '13px', color: '#4a5568' }}>Penyusunan LHP & Pemantauan TLHP.</p>
        </div>
      )}

      {/* MODAL EDIT PENUGASAN HYBRID */}
      {isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '750px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1a202c' }}>
                ✏️ Edit Penugasan
              </h2>

              <div style={{ display: 'flex', backgroundColor: '#edf2f7', padding: '2px', borderRadius: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('pengawasan')}
                  style={{
                    padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                    backgroundColor: jenisTimMode === 'pengawasan' ? '#2b6cb0' : 'transparent',
                    color: jenisTimMode === 'pengawasan' ? '#fff' : '#4a5568'
                  }}
                >
                  🔍 Mode Tim Pengawasan
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('perjadin')}
                  style={{
                    padding: '6px 12px', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                    backgroundColor: jenisTimMode === 'perjadin' ? '#38a169' : 'transparent',
                    color: jenisTimMode === 'perjadin' ? '#fff' : '#4a5568'
                  }}
                >
                  🚗 Mode Perjadin Biasa
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditPenugasan}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor Surat Penugasan:</label>
                  <input type="text" value={editForm.nomor_surat} onChange={(e) => setEditForm({ ...editForm, nomor_surat: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Obyek / Tempat Tujuan:</label>
                  <input type="text" value={editForm.tempat_tujuan} onChange={(e) => setEditForm({ ...editForm, tempat_tujuan: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} required />
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Maksud Penugasan:</label>
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

              {/* INPUT PEGAWAI */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#2b6cb0' }}>
                    👥 Daftar Pegawai & Peran Dalam Tim ({jenisTimMode === 'pengawasan' ? 'Hirarkis Pengawasan' : 'Perjadin Biasa'})
                  </label>
                  <button type="button" onClick={() => handleAddPersonil(jenisTimMode === 'pengawasan' ? 'Anggota Tim' : 'Pegawai')} style={{ backgroundColor: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
                    + Tambah Pegawai
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {editForm.personil.map((p, pIdx) => (
                    <div key={pIdx} style={{ display: 'grid', gridTemplateColumns: jenisTimMode === 'pengawasan' ? '1.5fr 1.8fr 1.2fr 1.2fr 30px' : '2fr 1.5fr 1.5fr 30px', gap: '6px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #edf2f7' }}>
                      
                      {jenisTimMode === 'pengawasan' && (
                        <select 
                          value={p?.peran || 'Anggota Tim'} 
                          onChange={(e) => handlePersonilChange(pIdx, 'peran', e.target.value)}
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0' }}
                        >
                          {OPSI_PERAN.map((role, rIdx) => (
                            <option key={rIdx} value={role}>{role}</option>
                          ))}
                        </select>
                      )}

                      <input type="text" placeholder="Nama Pegawai" value={p?.nama || ''} onChange={(e) => handlePersonilChange(pIdx, 'nama', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                      <input type="text" placeholder="NIP" value={p?.nip || ''} onChange={(e) => handlePersonilChange(pIdx, 'nip', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                      <input type="text" placeholder="Jabatan" value={p?.jabatan || ''} onChange={(e) => handlePersonilChange(pIdx, 'jabatan', e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                      <button type="button" onClick={() => handleRemovePersonil(pIdx)} style={{ backgroundColor: '#e53e3e', color: '#fff', border: 'none', borderRadius: '4px', height: '28px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                  ))}
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
                <button type="submit" disabled={saving} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2b6cb0', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan Penugasan'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
