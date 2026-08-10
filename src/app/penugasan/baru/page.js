'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// KONFIGURASI SUPABASE
const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function PenugasanBaruPage() {
  const router = useRouter();

  // Form State Utama
  const [klasifikasi, setKlasifikasi] = useState('700.1.2');
  const [nomorUrut, setNomorUrut] = useState('');
  const kodeOPD = '35.07.200';
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggalSurat, setTanggalSurat] = useState(today);
  const [tanggalSPD, setTanggalSPD] = useState(today);
  const tahun = tanggalSurat ? new Date(tanggalSurat).getFullYear() : new Date().getFullYear();

  const nomorSuratLengkap = `${klasifikasi}/${nomorUrut || '...'}/${kodeOPD}/${tahun}`;
  const [maksudPenugasan, setMaksudPenugasan] = useState('');
  const [tempatTujuan, setTempatTujuan] = useState('');

  // Master Pegawai & Dynamic List
  const [masterPegawai, setMasterPegawai] = useState([]);
  const [loadingPegawai, setLoadingPegawai] = useState(true);
  const [dasarList, setDasarList] = useState([{ no: '1', isi_dasar: '' }]);
  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '' }
  ]);

  const [saving, setSaving] = useState(false);

  // Fetch Master Pegawai dari Supabase
  useEffect(() => {
    async function fetchPegawai() {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/pegawai?select=*&order=nama.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setMasterPegawai(data);
        }
      } catch (err) {
        console.error('Gagal mengambil data pegawai:', err);
      } finally {
        setLoadingPegawai(false);
      }
    }
    fetchPegawai();
  }, []);

  // Handlers Dynamic Lists
  const handleSelectPegawaiOtomatis = (index, selectedId) => {
    const p = masterPegawai.find((item) => String(item.id) === String(selectedId));
    if (p) {
      const updated = [...pegawaiList];
      updated[index] = {
        ...updated[index],
        id_supabase: p.id,
        nama: p.nama || '',
        nip: p.nip || '',
        pangkat_gol: p.pangkat_gol || '',
        jabatan: p.jabatan || ''
      };
      setPegawaiList(updated);
    }
  };

  const handleDasarChange = (index, value) => {
    const updated = [...dasarList];
    updated[index].isi_dasar = value;
    setDasarList(updated);
  };
  const tambahDasar = () => setDasarList([...dasarList, { no: String(dasarList.length + 1), isi_dasar: '' }]);
  const hapusDasar = (index) => {
    setDasarList(dasarList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => setPegawaiList([...pegawaiList, { no: String(pegawaiList.length + 1), id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '' }]);
  const hapusPegawai = (index) => {
    setPegawaiList(pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  // Simpan Penugasan Baru ke Supabase
  const handleSubmitPenugasan = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nomor_surat: nomorSuratLengkap,
      maksud_penugasan: maksudPenugasan,
      tempat_tujuan: tempatTujuan,
      tanggal_surat: tanggalSurat,
      tanggal_spd: tanggalSPD,
      dasar_hukum: dasarList,
      personil: pegawaiList,
      status: 'Surat Tugas' // Status awal saat penugasan dibuat
    };

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/penugasan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Penugasan baru berhasil dibuat!');
        router.push('/dashboard');
      } else {
        alert('Gagal menyimpan penugasan baru. Pastikan tabel penugasan sudah siap di Supabase.');
      }
    } catch (err) {
      console.error('Error simpan penugasan:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER NAVIGASI */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/dashboard" style={{ color: '#2b6cb0', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px' }}>
          ← Kembali ke Dashboard
        </Link>
        <h1 style={{ margin: '10px 0 0 0', fontSize: '24px', color: '#1a202c' }}>Buat Penugasan Baru</h1>
      </div>

      {/* FORMULIR INPUT */}
      <form onSubmit={handleSubmitPenugasan} style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Penomoran & Tanggal Surat */}
        <div style={{ border: '1px solid #b3d7ff', padding: '16px', borderRadius: '6px', backgroundColor: '#f0f7ff' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#004080' }}>Penomoran & Tanggal Penugasan:</label>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode Klasifikasi</label>
              <select value={klasifikasi} onChange={(e) => setKlasifikasi(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nomor Urut Surat</label>
              <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 015" required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode OPD</label>
              <input type="text" value={kodeOPD} disabled style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9ecef', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Tgl. Surat Tugas</label>
              <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#d9534f' }}>Tgl. Cetak SPD</label>
              <input type="date" value={tanggalSPD} onChange={(e) => setTanggalSPD(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #d9534f', boxSizing: 'border-box' }} />
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff', border: '1px dashed #0066cc', borderRadius: '4px', textAlign: 'center' }}>
            Preview Nomor Surat: <strong style={{ color: '#0066cc' }}>{nomorSuratLengkap}</strong>
          </div>
        </div>

        {/* Maksud Penugasan & Lokasi */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '14px' }}>Maksud Penugasan / Audit:</label>
            <textarea value={maksudPenugasan} onChange={(e) => setMaksudPenugasan(e.target.value)} placeholder="Contoh: Evaluasi SAKIP Tahun 2026..." rows="3" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px', fontSize: '14px' }}>Objek Pengawasan / Tempat Tujuan:</label>
            <textarea value={tempatTujuan} onChange={(e) => setTempatTujuan(e.target.value)} placeholder="Contoh: Kecamatan Pagak Kabupaten Malang..." rows="3" required style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Dasar Hukum */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px' }}>Dasar Hukum Penugasan:</label>
          {dasarList.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ padding: '8px 0' }}>{item.no}.</span>
              <input value={item.isi_dasar} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}>Hapus</button>}
            </div>
          ))}
          <button type="button" onClick={tambahDasar} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>+ Tambah Dasar Hukum</button>
        </div>

        {/* Personil Penugasan */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px' }}>Personil yang Ditugaskan:</label>
          
          {pegawaiList.map((item, index) => (
            <div key={index} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#2d3748' }}>
                Personil Ke-{item.no}
              </div>

              {/* Pilih Otomatis dari Supabase */}
              <div style={{ marginBottom: '10px', backgroundColor: '#f7fafc', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#4a5568' }}>
                  ⚡ Pilih Cepat dari Bezitting Pegawai:
                </label>
                <select
                  onChange={(e) => handleSelectPegawaiOtomatis(index, e.target.value)}
                  value={item.id_supabase || ""}
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="" disabled>
                    {loadingPegawai ? 'Memuat data pegawai...' : '-- Klik untuk Memilih Pegawai --'}
                  </option>
                  {masterPegawai.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nama} - {p.jabatan}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat/Gol" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              {pegawaiList.length > 1 && <button type="button" onClick={() => hapusPegawai(index)} style={{ color: 'red', marginTop: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px' }}>Hapus Personil Ini</button>}
            </div>
          ))}

          <button type="button" onClick={tambahPegawai} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>+ Tambah Personil</button>
        </div>

        {/* Tombol Simpan */}
        <button
          type="submit"
          disabled={saving}
          style={{ backgroundColor: '#2b6cb0', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Menyimpan Penugasan...' : '💾 Simpan Penugasan Baru'}
        </button>

      </form>
    </div>
  );
}
