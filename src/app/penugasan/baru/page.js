'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

// DASAR HUKUM DEFAULT RESMI PERBUP NO. 2/2025 (4 PERATURAN)
const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah',
  'Dokumen Pelaksanaan Perubahan Anggaran Inspektorat Daerah Kabupaten Malang Tahun Anggaran 2026 Nomor: DPA/A.2/6.01.0.00.0.00.01.0000/001/2026 tanggal 9 Juni 2026'
];

export default function PenugasanBaruPage() {
  const router = useRouter();

  // Kode Klasifikasi & Penomoran
  const [klasifikasi, setKlasifikasi] = useState('700.1.2');
  const [nomorUrut, setNomorUrut] = useState('');
  const kodeOPD = '35.07.200';
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggalSurat, setTanggalSurat] = useState(today);
  const [tanggalSPD, setTanggalSPD] = useState(today);
  const tahun = tanggalSurat ? new Date(tanggalSurat).getFullYear() : new Date().getFullYear();

  const nomorSuratLengkap = `${klasifikasi}/${nomorUrut || '...'}/${kodeOPD}/${tahun}`;
  const [maksudPenugasan, setMaksudPenugasan] = useState('');
  
  // Variabel Tempat SPD
  const [tempatBerangkat, setTempatBerangkat] = useState('Inspektorat Daerah Kabupaten Malang');
  const [tempatTujuan, setTempatTujuan] = useState('');
  const [tempatKembali, setTempatKembali] = useState('Inspektorat Daerah Kabupaten Malang');

  // Master Pegawai & Dynamic List
  const [masterPegawai, setMasterPegawai] = useState([]);
  const [loadingPegawai, setLoadingPegawai] = useState(true);
  
  // State Dasar Hukum
  const [dasarList, setDasarList] = useState(DASAR_HUKUM_DEFAULT);

  // State Personil
  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '', peran: 'Ketua Tim' }
  ]);

  // State Paraf Hierarki
  const [tampilkanParaf, setTampilkanParaf] = useState(true);
  const [parafList, setParafList] = useState([
    { jabatan_paraf: 'Plt. Sekretaris' },
    { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
    { jabatan_paraf: 'Auditor Ahli Madya' }
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
    updated[index] = value;
    setDasarList(updated);
  };
  const tambahDasar = () => setDasarList([...dasarList, '']);
  const hapusDasar = (index) => setDasarList(dasarList.filter((_, i) => i !== index));
  const resetDasarDefault = () => setDasarList(DASAR_HUKUM_DEFAULT);

  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => setPegawaiList([...pegawaiList, { no: String(pegawaiList.length + 1), id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '', peran: 'Anggota Tim' }]);
  const hapusPegawai = (index) => {
    setPegawaiList(pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handleParafChange = (index, value) => {
    const updated = [...parafList];
    updated[index].jabatan_paraf = value;
    setParafList(updated);
  };
  const tambahParaf = () => setParafList([...parafList, { jabatan_paraf: '' }]);
  const hapusParaf = (index) => setParafList(parafList.filter((_, i) => i !== index));

  // Simpan Penugasan Baru ke Supabase
  const handleSubmitPenugasan = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nomor_surat: nomorSuratLengkap,
      maksud_penugasan: maksudPenugasan,
      tempat_berangkat: tempatBerangkat,
      tempat_tujuan: tempatTujuan,
      tempat_kembali: tempatKembali,
      tanggal_surat: tanggalSurat,
      tanggal_spd: tanggalSPD,
      dasar_hukum: dasarList,
      personil: pegawaiList,
      tampilkan_paraf: tampilkanParaf,
      paraf_list: parafList,
      status: 'Surat Tugas'
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
        alert('Gagal menyimpan penugasan baru.');
      }
    } catch (err) {
      console.error('Error simpan penugasan:', err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '10px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
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
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode Klasifikasi (Ketik / Pilih)</label>
              <input 
                list="klasifikasi-options" 
                value={klasifikasi} 
                onChange={(e) => setKlasifikasi(e.target.value)} 
                placeholder="Pilih atau ketik kode..."
                required 
                style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              />
              <datalist id="klasifikasi-options">
                <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
                <option value="800.1.1">800.1.1 (Kepegawaian)</option>
                <option value="050.1.1">050.1.1 (Perencanaan)</option>
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nomor Urut Surat</label>
              <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 3458" required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
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

        {/* Maksud Penugasan & Lokasi Perjalanan Dinas */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px' }}>Rincian Maksud & Lokasi Penugasan:</label>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Maksud Penugasan / Kegiatan Audit:</label>
            <textarea value={maksudPenugasan} onChange={(e) => setMaksudPenugasan(e.target.value)} placeholder="Contoh: Melakukan Klarifikasi Hasil Pemeriksaan Dengan Tujuan Tertentu (PDTT) Dugaan Pelaksanaan Pekerjaan Konstruksi..." rows="3" required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tempat Berangkat (SPD):</label>
              <input type="text" value={tempatBerangkat} onChange={(e) => setTempatBerangkat(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tempat Tujuan Perjalanan Dinas:</label>
              <input type="text" value={tempatTujuan} onChange={(e) => setTempatTujuan(e.target.value)} placeholder="Contoh: Kantor Kejaksaan Negeri Kabupaten Malang" required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Tempat Kembali (SPD):</label>
              <input type="text" value={tempatKembali} onChange={(e) => setTempatKembali(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Dasar Hukum Otomatis (Default + Custom) */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Dasar Hukum Penugasan:</label>
            <button type="button" onClick={resetDasarDefault} style={{ fontSize: '11px', color: '#2b6cb0', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              🔄 Reset ke Dasar Hukum Default (4 Peraturan Resmi)
            </button>
          </div>

          {dasarList.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ padding: '8px 0', width: '20px', fontSize: '13px', fontWeight: 'bold' }}>{index + 1}.</span>
              <input value={item} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px' }}>Hapus</button>}
            </div>
          ))}
          <button type="button" onClick={tambahDasar} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>+ Tambah Baris Dasar Hukum</button>
        </div>

        {/* Personil Penugasan */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', fontSize: '14px' }}>Personil yang Ditugaskan:</label>
          
          {pegawaiList.map((item, index) => (
            <div key={index} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: '#2d3748' }}>
                Personil Ke-{index + 1}
              </div>

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
                <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap & Gelar" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat/Gol (misal: Penata Muda Tk. I (III/b))" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan (misal: Auditor Ahli Pertama)" required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
              </div>
              {pegawaiList.length > 1 && <button type="button" onClick={() => hapusPegawai(index)} style={{ color: 'red', marginTop: '8px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px' }}>Hapus Personil Ini</button>}
            </div>
          ))}

          <button type="button" onClick={tambahPegawai} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#edf2f7', border: '1px solid #cbd5e0', borderRadius: '4px', fontWeight: 'bold', fontSize: '12px' }}>+ Tambah Personil</button>
        </div>

        {/* PARAF HIERARKI */}
        <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" checked={tampilkanParaf} onChange={(e) => setTampilkanParaf(e.target.checked)} />
            Cetak Tabel Paraf Hierarki pada Surat Tugas
          </label>
          {tampilkanParaf && (
            <div style={{ marginTop: '10px', paddingLeft: '10px' }}>
              {parafList.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input value={item.jabatan_paraf} onChange={(e) => handleParafChange(index, e.target.value)} style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }} />
                  <button type="button" onClick={() => hapusParaf(index)} style={{ color: 'red', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px' }}>Hapus</button>
                </div>
              ))}
              <button type="button" onClick={tambahParaf} style={{ marginTop: '6px', fontSize: '12px', cursor: 'pointer', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', padding: '4px 8px' }}>+ Tambah Baris Paraf</button>
            </div>
          )}
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
