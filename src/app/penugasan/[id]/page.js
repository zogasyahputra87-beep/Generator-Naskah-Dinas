'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

// KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function DetailPenugasanPage({ params }) {
  // Unwrap params di Next.js 15+ App Router
  const resolvedParams = use(params);
  const penugasanId = resolvedParams.id;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch Data Detail Penugasan berdasarkan ID
  useEffect(() => {
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
          if (data.length > 0) {
            setDetail(data[0]);
          }
        }
      } catch (err) {
        console.error('Gagal mengambil detail penugasan:', err);
      } finally {
        setLoading(false);
      }
    }

    if (penugasanId) {
      fetchDetailPenugasan();
    }
  }, [penugasanId]);

  // Handler Update Status Progres
  const handleUpdateStatus = async (statusBaru) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan?id=eq.${penugasanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: statusBaru })
      });

      if (response.ok) {
        setDetail(prev => ({ ...prev, status: statusBaru }));
        alert(`Status penugasan berhasil diperbarui menjadi: ${statusBaru}`);
      } else {
        alert('Gagal memperbarui status penugasan.');
      }
    } catch (err) {
      console.error('Error update status:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handler Unduh Word Surat Tugas
  const handleDownloadSuratTugas = async () => {
    if (!detail) return;
    const payload = {
      nomor_surat: detail.nomor_surat,
      dasar_list: detail.dasar_hukum || [],
      pegawai_list: detail.personil || [],
      penugasan: detail.maksud_penugasan,
      tanggal: detail.tanggal_surat,
      tampilkan_paraf: true,
      paraf_list: [
        { jabatan_paraf: 'Plt. Sekretaris' },
        { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
        { jabatan_paraf: 'Auditor Ahli Madya' }
      ]
    };

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
      a.download = `Surat_Tugas_${(detail.nomor_surat || 'ST').replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh Surat Tugas.');
    }
  };

  // Handler Unduh Word SPD
  const handleDownloadSPDWord = async (personil) => {
    if (!detail) return;
    const payloadSPD = {
      nomor_spd: detail.nomor_surat,
      nama: personil.nama,
      nip: personil.nip,
      pangkat_gol: personil.pangkat_gol,
      jabatan: personil.jabatan,
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tgl_berangkat: detail.tanggal_surat,
      tgl_kembali: detail.tanggal_surat,
      tgl_spd: detail.tanggal_spd,
    };

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
      a.download = `SPD_${(personil.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh SPD Word. Pastikan file template_spd.docx sudah ada.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif', color: '#718096' }}>
        Memuat detail penugasan...
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Data penugasan tidak ditemukan.</h2>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold' }}>
          ← Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  // Menentukan langkah mana yang sedang aktif
  const currentStatus = detail.status || 'Surat Tugas';
  const isLHPActive = currentStatus === 'Proses LHP' || currentStatus === 'Selesai TLHP';
  const isTLHPActive = currentStatus === 'Selesai TLHP';

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER & NAVIGASI */}
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          ← Kembali ke Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#1a202c' }}>
              Detail Penugasan: {detail.nomor_surat}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#718096' }}>{detail.maksud_penugasan}</p>
          </div>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '20px', 
            fontSize: '13px', 
            fontWeight: 'bold',
            backgroundColor: currentStatus === 'Selesai TLHP' ? '#c6f6d5' : '#feebc8',
            color: currentStatus === 'Selesai TLHP' ? '#22543d' : '#744210'
          }}>
            Status: {currentStatus}
          </span>
        </div>
      </div>

      {/* TIMELINE PROGRES PENUGASAN (5. PROGRES PENUGASAN) */}
      <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#2d3748' }}>Alur Progres Naskah Dinas</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', position: 'relative' }}>
          
          {/* Tahap 1: Surat Tugas */}
          <div style={{ padding: '16px', borderRadius: '6px', border: '2px solid #2b6cb0', backgroundColor: '#ebf8ff' }}>
            <div style={{ fontWeight: 'bold', color: '#2b6cb0', marginBottom: '4px', fontSize: '14px' }}>1. Surat Tugas & SPD</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#4a5568' }}>Penerbitan ST & Lembar SPD untuk personil.</p>
            <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0' }}>✓ Selesai / Aktif</span>
          </div>

          {/* Tahap 2: LHP */}
          <div style={{ padding: '16px', borderRadius: '6px', border: isLHPActive ? '2px solid #2b6cb0' : '1px solid #cbd5e0', backgroundColor: isLHPActive ? '#ebf8ff' : '#f7fafc' }}>
            <div style={{ fontWeight: 'bold', color: isLHPActive ? '#2b6cb0' : '#718096', marginBottom: '4px', fontSize: '14px' }}>2. Laporan Hasil Pemeriksaan (LHP)</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#4a5568' }}>Penyusunan dan pengesahan LHP dari hasil audit.</p>
            {isLHPActive ? (
              <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', fontWeight: 'bold', color: '#2b6cb0' }}>✓ Selesai / Aktif</span>
            ) : (
              <button 
                onClick={() => handleUpdateStatus('Proses LHP')} 
                disabled={updatingStatus}
                style={{ marginTop: '10px', padding: '4px 8px', fontSize: '11px', backgroundColor: '#dd6b20', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Lanjut ke LHP →
              </button>
            )}
          </div>

          {/* Tahap 3: TLHP */}
          <div style={{ padding: '16px', borderRadius: '6px', border: isTLHPActive ? '2px solid #38a169' : '1px solid #cbd5e0', backgroundColor: isTLHPActive ? '#f0fff4' : '#f7fafc' }}>
            <div style={{ fontWeight: 'bold', color: isTLHPActive ? '#38a169' : '#718096', marginBottom: '4px', fontSize: '14px' }}>3. Tindak Lanjut (TLHP)</div>
            <p style={{ margin: 0, fontSize: '12px', color: '#4a5568' }}>Pemantauan dan penyelesaian tindak lanjut.</p>
            {isTLHPActive ? (
              <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '11px', fontWeight: 'bold', color: '#38a169' }}>✓ Penugasan Selesai</span>
            ) : (
              <button 
                onClick={() => handleUpdateStatus('Selesai TLHP')} 
                disabled={!isLHPActive || updatingStatus}
                style={{ marginTop: '10px', padding: '4px 8px', fontSize: '11px', backgroundColor: isLHPActive ? '#38a169' : '#cbd5e0', color: '#fff', border: 'none', borderRadius: '4px', cursor: isLHPActive ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                Selesaikan (TLHP) ✓
              </button>
            )}
          </div>

        </div>
      </div>

      {/* INFORMASI KEGIATAN & UNDUH NASKAH DINAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Rincian Penugasan */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>Rincian Penugasan</h3>
          
          <table style={{ width: '100%', fontSize: '13px', lineHeight: '1.8' }}>
            <tbody>
              <tr>
                <td style={{ width: '130px', color: '#718096', fontWeight: 'bold' }}>Nomor Surat</td>
                <td>: {detail.nomor_surat}</td>
              </tr>
              <tr>
                <td style={{ color: '#718096', fontWeight: 'bold' }}>Tgl. Surat Tugas</td>
                <td>: {detail.tanggal_surat || '-'}</td>
              </tr>
              <tr>
                <td style={{ color: '#718096', fontWeight: 'bold' }}>Tgl. Cetak SPD</td>
                <td>: {detail.tanggal_spd || '-'}</td>
              </tr>
              <tr>
                <td style={{ color: '#718096', fontWeight: 'bold' }}>Objek Pengawasan</td>
                <td>: {detail.tempat_tujuan}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ marginTop: '16px' }}>
            <button 
              onClick={handleDownloadSuratTugas}
              style={{ width: '100%', backgroundColor: '#2b6cb0', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
            >
              📥 Unduh Word Surat Tugas (.docx)
            </button>
          </div>
        </div>

        {/* Daftar Personil & Unduh SPD */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '8px' }}>Personil & Unduh SPD</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(detail.personil || []).map((p, idx) => (
              <div key={idx} style={{ padding: '10px', backgroundColor: '#f7fafc', borderRadius: '6px', border: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#2d3748' }}>{p.nama}</div>
                  <div style={{ fontSize: '11px', color: '#718096' }}>NIP. {p.nip || '-'}</div>
                </div>
                <button
                  onClick={() => handleDownloadSPDWord(p)}
                  style={{ backgroundColor: '#4a5568', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                >
                  📄 SPD Word
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
