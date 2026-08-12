'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

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

  // Preview & Console SPD States
  const [activeSPDPreviewIndex, setActiveSPDPreviewIndex] = useState(0);
  const [spdPageType, setSpdPageType] = useState('depan');
  const [showSPDConsole, setShowSPDConsole] = useState(false);

  // Console State Khusus Isian SPD (Default: Inspektorat Daerah Kab. Malang)
  const [spdForm, setSpdForm] = useState({
    nomor_spd: '',
    pengguna_anggaran: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
    nip_pa: '198008012010011018',
    tempat_berangkat: 'Inspektorat Daerah Kab. Malang',
    tempat_tujuan: '',
    tempat_kembali: 'Inspektorat Daerah Kab. Malang',
    tgl_spd: '',
    tgl_berangkat: '',
    tgl_kembali: '',
    personil_spd: []
  });

  // Modal Edit General Penugasan
  const [isEditing, setIsEditing] = useState(false);
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
    
    // Normalisasi Personil
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

    const rawDasar = Array.isArray(item.dasar_hukum) ? item.dasar_hukum : [];
    const dasarFormatted = rawDasar.map(d => typeof d === 'object' ? (d?.dasar_hukum || d?.teks || JSON.stringify(d)) : String(d || ''));

    // Init Form Edit Utama
    setEditForm({
      nomor_surat: item.nomor_surat || '',
      maksud_penugasan: item.maksud_penugasan || '',
      tempat_tujuan: item.tempat_tujuan || '',
      tanggal_surat: item.tanggal_surat || '',
      tanggal_spd: item.tanggal_spd || item.tanggal_surat || '',
      dasar_hukum: dasarFormatted,
      personil: personilFormatted,
    });

    // Init Form Console SPD dengan Default "Inspektorat Daerah Kab. Malang"
    const personilSpdFormatted = personilFormatted.map((p) => ({
      ...p,
      no_spd_khusus: item.nomor_surat || '',
      tingkat_biaya: 'Tingkat C',
      alat_angkut: 'Kendaraan Dinas / Umum'
    }));

    setSpdForm({
      nomor_spd: item.nomor_surat || '',
      pengguna_anggaran: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: '198008012010011018',
      tempat_berangkat: item.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: item.tempat_tujuan || '',
      tempat_kembali: item.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      tgl_spd: item.tanggal_spd || item.tanggal_surat || '',
      tgl_berangkat: item.tanggal_surat || '',
      tgl_kembali: item.tanggal_surat || '',
      personil_spd: personilSpdFormatted
    });
  };

  // HANDLER SIMPAN CONSOLE SPD KHUSUS
  const handleSaveSPDConsole = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payloadToSave = {
        tanggal_spd: spdForm.tgl_spd,
        tempat_berangkat: spdForm.tempat_berangkat,
        tempat_kembali: spdForm.tempat_kembali,
        personil: spdForm.personil_spd
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
        const updated = await response.json();
        if (Array.isArray(updated) && updated.length > 0) {
          setDetail(updated[0]);
          setShowSPDConsole(false);
          alert('Konfigurasi Isian SPD Berhasil Diperbarui!');
        }
      } else {
        alert('Gagal menyimpan variabel SPD.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  // HANDLER DOWNLOAD SURAT TUGAS WORD
  const handleDownloadSuratTugas = async () => {
    if (!detail) return;

    const rawDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];
    const dasarListClean = rawDasar.map((d, idx) => ({
      no: idx + 1,
      dasar_hukum: typeof d === 'object' ? (d?.dasar_hukum || d?.teks || '-') : String(d || '-')
    }));

    const rawPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const pegawaiListClean = rawPersonil.map((p, idx) => {
      if (typeof p === 'object') {
        return {
          no: idx + 1,
          nama: p?.nama || '-',
          nip: p?.nip || '-',
          pangkat_gol: p?.pangkat_gol || '-',
          jabatan: p?.jabatan || '-'
        };
      }
      return { no: idx + 1, nama: String(p || '-'), nip: '-', pangkat_gol: '-', jabatan: '-' };
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
        alert('Gagal mengunduh Surat Tugas. Cek log server.');
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    }
  };

  // HANDLER DOWNLOAD SPD DEPAN SINGLE
  const handleDownloadSPDDepanSingle = async (personilObj) => {
    if (!detail) return;

    const payloadSPD = {
      nomor_spd: personilObj?.no_spd_khusus || spdForm.nomor_spd || detail.nomor_surat || '-',
      nama: personilObj?.nama || '-',
      nip: personilObj?.nip || '-',
      pangkat_gol: personilObj?.pangkat_gol || '-',
      jabatan: personilObj?.jabatan || '-',
      maksud_penugasan: detail.maksud_penugasan || '-',
      tempat_berangkat: spdForm.tempat_berangkat,
      tempat_tujuan: spdForm.tempat_tujuan || detail.tempat_tujuan || '-',
      tempat_kembali: spdForm.tempat_kembali,
      tgl_berangkat: formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat),
      tgl_kembali: formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat),
      tgl_spd: formatTanggalIndo(spdForm.tgl_spd || detail.tanggal_spd || detail.tanggal_surat),
      pengguna_anggaran: spdForm.pengguna_anggaran,
      nip_pa: spdForm.nip_pa
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
        a.download = `SPD_Depan_${(personilObj?.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
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
      nomor_spd: spdForm.nomor_spd || detail.nomor_surat || '-',
      maksud_penugasan: detail.maksud_penugasan || '-',
      tempat_berangkat: spdForm.tempat_berangkat,
      tempat_tujuan: spdForm.tempat_tujuan || detail.tempat_tujuan || '-',
      tempat_kembali: spdForm.tempat_kembali,
      tgl_berangkat: formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat),
      tgl_kembali: formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat),
      tgl_spd: formatTanggalIndo(spdForm.tgl_spd || detail.tanggal_spd || detail.tanggal_surat),
      pengguna_anggaran: spdForm.pengguna_anggaran,
      nip_pa: spdForm.nip_pa,
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif' }}>Memuat detail penugasan...</div>;
  if (!detail) return <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'sans-serif', color: '#e53e3e' }}>Data penugasan tidak ditemukan.</div>;

  const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
  const listDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];

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
            <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9 }}>
              Profil Penugasan Pengawasan
            </span>
            <h1 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 'bold' }}>
              {safeString(detail.maksud_penugasan)}
            </h1>
          </div>

          <button 
            onClick={() => setIsEditing(true)}
            style={{ backgroundColor: '#ed8936', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ✏️ Edit Surat Tugas Utama
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', width: '220px', fontWeight: 'bold', color: '#4a5568' }}>Nomor Surat Tugas</td>
                <td style={{ padding: '8px 0', width: '20px', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#2b6cb0' }}>{safeString(detail.nomor_surat)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Tempat Tujuan Pengawasan</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#1a202c' }}>{safeString(detail.tempat_tujuan)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Tanggal Surat / Pelaksanaan</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>{formatTanggalIndo(detail.tanggal_surat)}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #edf2f7' }}>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568' }}>Tanggal Penandatanganan SPD</td>
                <td style={{ padding: '8px 0', color: '#a0aec0' }}>:</td>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#38a169' }}>
                  {formatTanggalIndo(spdForm.tgl_spd || detail.tanggal_spd || detail.tanggal_surat)}
                </td>
              </tr>
              <tr>
                <td style={{ padding: '8px 0', fontWeight: 'bold', color: '#4a5568', verticalAlign: 'top' }}>Daftar Personil Penugasan</td>
                <td style={{ padding: '8px 0', color: '#a0aec0', verticalAlign: 'top' }}>:</td>
                <td style={{ padding: '8px 0', color: '#2d3748' }}>
                  <ol style={{ margin: 0, paddingLeft: '18px' }}>
                    {listPersonil.map((p, pIdx) => {
                      const pNama = typeof p === 'object' ? (p?.nama || '-') : String(p || '-');
                      const pJabatan = typeof p === 'object' ? (p?.jabatan || '') : '';
                      return (
                        <li key={pIdx} style={{ marginBottom: '4px' }}>
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
      </div>

      {/* TAHAP 1 */}
      {activeStep === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SURAT TUGAS PREVIEW */}
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
                          
                          return (
                            <div key={pIdx} style={{ marginBottom: '12px' }}>
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

          {/* DOKUMEN SPD & CONSOLE FITUR */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            
            {/* HEADER SPD WITH CONSOLE BUTTON */}
            <div style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#2b6cb0' }}>📑 Pratinjau & Pengaturan Lembar SPD</h3>
                <span style={{ fontSize: '12px', color: '#718096' }}>Ubah tanggal penandatanganan SPD, rute keberangkatan, dan detail khusus per pegawai</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setShowSPDConsole(true)}
                  style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  ⚙️ Console / Edit Variable SPD
                </button>

                <button onClick={handleDownloadSPDBelakang} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                  📥 Unduh Lembar Visum
                </button>
              </div>
            </div>

            {/* TAB KHUSUS PERSONIL SPD */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {listPersonil.map((p, idx) => {
                  const namaStr = typeof p === 'object' ? (p?.nama || `Pegawai ${idx+1}`) : String(p || '');
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveSPDPreviewIndex(idx)}
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

              <div style={{ display: 'flex', border: '1px solid #cbd5e0', borderRadius: '4px', overflow: 'hidden' }}>
                <button onClick={() => setSpdPageType('depan')} style={{ padding: '6px 12px', border: 'none', backgroundColor: spdPageType === 'depan' ? '#4a5568' : '#fff', color: spdPageType === 'depan' ? '#fff' : '#4a5568', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  📄 Halaman Depan
                </button>
                <button onClick={() => setSpdPageType('belakang')} style={{ padding: '6px 12px', border: 'none', backgroundColor: spdPageType === 'belakang' ? '#4a5568' : '#fff', color: spdPageType === 'belakang' ? '#fff' : '#4a5568', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                  📑 Halaman Belakang (Visum)
                </button>
              </div>
            </div>

            {/* PREVIEW KERTAS SPD SINKRON DENGAN CONSOLE */}
            {listPersonil[activeSPDPreviewIndex] && (
              <div style={{ backgroundColor: '#f7fafc', padding: '20px', borderRadius: '6px', border: '1px solid #cbd5e0' }}>
                {(() => {
                  const p = listPersonil[activeSPDPreviewIndex];
                  const pObj = typeof p === 'object' ? p : { nama: String(p || '-') };
                  const pNama = pObj?.nama || '-';
                  const pNip = pObj?.nip || '-';
                  const pGol = pObj?.pangkat_gol || '-';
                  const pJab = pObj?.jabatan || '-';

                  if (spdPageType === 'depan') {
                    return (
                      <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
                        <div style={{ textAlign: 'right', fontSize: '10px', marginBottom: '10px' }}>
                          Lembar ke : .........<br />Nomor : {spdForm.nomor_spd || detail.nomor_surat}
                        </div>

                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', textDecoration: 'underline', marginBottom: '16px' }}>
                          SURAT PERJALANAN DINAS (S.P.D)
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }} border="1" cellPadding="6">
                          <tbody>
                            <tr>
                              <td style={{ width: '30px', textAlign: 'center' }}>1.</td>
                              <td style={{ width: '220px' }}>Pengguna Anggaran</td>
                              <td>{spdForm.pengguna_anggaran}</td>
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
                              <td><strong>{spdForm.tempat_berangkat}</strong> / <strong>{spdForm.tempat_tujuan || detail.tempat_tujuan}</strong></td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: 'center' }}>6.</td>
                              <td>Tanggal Berangkat / Kembali</td>
                              <td>{formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)} s.d {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}</td>
                            </tr>
                            <tr>
                              <td style={{ textAlign: 'center' }}>7.</td>
                              <td>Tanggal Dikeluarkan SPD</td>
                              <td><strong>{formatTanggalIndo(spdForm.tgl_spd || detail.tanggal_spd || detail.tanggal_surat)}</strong></td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                          <button onClick={() => handleDownloadSPDDepanSingle(pObj)} style={{ backgroundColor: '#2b6cb0', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                            📥 Unduh File Word SPD Depan ({pNama})
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div style={{ width: '100%', maxWidth: '750px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', border: '1px solid #e2e8f0', fontFamily: 'Arial, sans-serif', fontSize: '11px' }}>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12px', marginBottom: '16px' }}>
                          LEMBAR VISUM / PEMERIKSAAN PERJALANAN DINAS
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }} border="1" cellPadding="8">
                          <tbody>
                            <tr>
                              <td style={{ width: '50%', verticalAlign: 'top' }}>
                                <strong>I. Berangkat dari</strong> : {spdForm.tempat_berangkat}<br />
                                <strong>Ke</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan}<br />
                                <strong>Pada Tanggal</strong> : {formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)}<br /><br />
                                Pengguna Anggaran,<br /><br /><br />
                                <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                                NIP. {spdForm.nip_pa}
                              </td>
                              <td style={{ width: '50%', verticalAlign: 'top' }}>
                                <strong>Tiba di</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan}<br />
                                <strong>Pada Tanggal</strong> : {formatTanggalIndo(spdForm.tgl_berangkat || detail.tanggal_surat)}<br /><br />
                                Kepala / Pejabat Setempat,<br /><br /><br />
                                ..................................................<br />
                                NIP.
                              </td>
                            </tr>
                            <tr>
                              <td style={{ verticalAlign: 'top' }}>
                                <strong>II. Berangkat dari</strong> : {spdForm.tempat_tujuan || detail.tempat_tujuan}<br />
                                <strong>Ke</strong> : {spdForm.tempat_kembali}<br />
                                <strong>Pada Tanggal</strong> : {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}<br /><br />
                                Kepala / Pejabat Setempat,<br /><br /><br />
                                ..................................................<br />
                                NIP.
                              </td>
                              <td style={{ verticalAlign: 'top' }}>
                                <strong>Tiba di</strong> : {spdForm.tempat_kembali}<br />
                                <strong>Pada Tanggal</strong> : {formatTanggalIndo(spdForm.tgl_kembali || detail.tanggal_surat)}<br /><br />
                                Pengguna Anggaran,<br /><br /><br />
                                <strong><u>{spdForm.pengguna_anggaran}</u></strong><br />
                                NIP. {spdForm.nip_pa}
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                          <button onClick={handleDownloadSPDBelakang} style={{ backgroundColor: '#4a5568', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                            📥 Unduh File Word Lembar Visum
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>

        </div>
      )}

      {/* CONSOLE EDIT VARIABLE SPD (MODAL) */}
      {showSPDConsole && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '700px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#2b6cb0' }}>
                ⚙️ Console & Tabel Isian Variabel SPD
              </h2>
              <button onClick={() => setShowSPDConsole(false)} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSPDConsole}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tanggal Dikeluarkan SPD:</label>
                  <input type="date" value={spdForm.tgl_spd} onChange={(e) => setSpdForm({ ...spdForm, tgl_spd: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nomor Dokumen SPD:</label>
                  <input type="text" value={spdForm.nomor_spd} onChange={(e) => setSpdForm({ ...spdForm, nomor_spd: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tempat Keberangkatan:</label>
                  <input type="text" value={spdForm.tempat_berangkat} onChange={(e) => setSpdForm({ ...spdForm, tempat_berangkat: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tempat Tujuan:</label>
                  <input type="text" value={spdForm.tempat_tujuan} onChange={(e) => setSpdForm({ ...spdForm, tempat_tujuan: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Tujuan Kembali (Pulang):</label>
                  <input type="text" value={spdForm.tempat_kembali} onChange={(e) => setSpdForm({ ...spdForm, tempat_kembali: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>Nama Pengguna Anggaran (PA):</label>
                  <input type="text" value={spdForm.pengguna_anggaran} onChange={(e) => setSpdForm({ ...spdForm, pengguna_anggaran: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>NIP Pengguna Anggaran:</label>
                  <input type="text" value={spdForm.nip_pa} onChange={(e) => setSpdForm({ ...spdForm, nip_pa: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e0', fontSize: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                <button type="button" onClick={() => setShowSPDConsole(false)} style={{ padding: '8px 16px', border: '1px solid #cbd5e0', borderRadius: '4px', background: '#fff', cursor: 'pointer', fontSize: '12px' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving} style={{ padding: '8px 16px', border: 'none', borderRadius: '4px', background: '#2b6cb0', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
                  {saving ? 'Memproses...' : 'Terapkan & Simpan Variabel SPD'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
