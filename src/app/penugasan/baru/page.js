'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah',
  'Dokumen Pelaksanaan Perubahan Anggaran Inspektorat Daerah Kabupaten Malang Tahun Anggaran 2026 Nomor: DPA/A.2/6.01.0.00.0.00.01.0000/001/2026 tanggal 9 Juni 2026'
];

export default function PenugasanBaruPage() {
  const router = useRouter();

  const [klasifikasi, setKlasifikasi] = useState('700.1.2');
  const [nomorUrut, setNomorUrut] = useState('');
  const kodeOPD = '35.07.200';
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggalSurat, setTanggalSurat] = useState(today);
  const [tanggalSPD, setTanggalSPD] = useState(today);
  const tahun = tanggalSurat ? new Date(tanggalSurat).getFullYear() : new Date().getFullYear();

  const nomorSuratLengkap = `${klasifikasi}/${nomorUrut || '...'}/${kodeOPD}/${tahun}`;
  const [maksudPenugasan, setMaksudPenugasan] = useState('');
  
  const [tempatBerangkat, setTempatBerangkat] = useState('Inspektorat Daerah Kabupaten Malang');
  const [tempatTujuan, setTempatTujuan] = useState('');
  const [tempatKembali, setTempatKembali] = useState('Inspektorat Daerah Kabupaten Malang');

  const [masterPegawai, setMasterPegawai] = useState([]);
  const [loadingPegawai, setLoadingPegawai] = useState(true);
  const [dasarList, setDasarList] = useState(DASAR_HUKUM_DEFAULT);

  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', id_supabase: '', nama: '', nip: '', pangkat_gol: '', jabatan: '', peran: 'Ketua Tim' }
  ]);

  const [tampilkanParaf, setTampilkanParaf] = useState(true);
  const [parafList, setParafList] = useState([
    { jabatan_paraf: 'Plt. Sekretaris' },
    { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
    { jabatan_paraf: 'Auditor Ahli Madya' }
  ]);

  const [saving, setSaving] = useState(false);

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

  const handleSubmitPenugasan = async (e) => {
    e.preventDefault();
    setSaving(true);

    const dasarFormatted = dasarList.map((item, idx) => {
      if (typeof item === 'object') {
        return { no: String(idx + 1), dasar_hukum: item.dasar_hukum || item.isi_dasar || '' };
      }
      return { no: String(idx + 1), dasar_hukum: String(item || '') };
    });

    const payload = {
      nomor_surat: nomorSuratLengkap,
      maksud_penugasan: maksudPenugasan,
      tempat_tujuan: tempatTujuan,
      tanggal_surat: tanggalSurat,
      tanggal_spd: tanggalSPD,
      dasar_hukum: dasarFormatted,
      personil: pegawaiList,
      tampilkan_paraf: tampilkanParaf,
      paraf_list: parafList,
      status: 'Surat Tugas'
    };

    const sendData = async (dataPayload) => {
      return await fetch(`${SUPABASE_URL}/rest/v1/penugasan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(dataPayload)
      });
    };

    try {
      let response = await sendData({
        ...payload,
        tempat_berangkat: tempatBerangkat,
        tempat_kembali: tempatKembali
      });

      if (!response.ok) {
        const errJson = await response.clone().json().catch(() => ({}));
        if (errJson.message && errJson.message.includes('tempat_berangkat')) {
          response = await sendData(payload);
        }
      }

      if (response.ok) {
        alert('Penugasan baru berhasil dibuat!');
        router.push('/dashboard');
      } else {
        const errData = await response.json();
        alert(`Gagal menyimpan: ${errData.message || errData.details || 'Terjadi kesalahan database.'}`);
      }
    } catch (err) {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-card {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .input-modern {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
          transition: all 0.2s;
          background-color: #ffffff;
        }
        .input-modern:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
      `}</style>

      <div style={{ maxWidth: '960px', margin: '0 auto' }} className="form-card">
        
        {/* HEADER NAVIGASI */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Link href="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              ← Kembali ke Dashboard
            </Link>
            <h1 style={{ margin: '8px 0 0 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
              Buat Penugasan Baru
            </h1>
          </div>
        </div>

        {/* FORMULIR UTAMA */}
        <form onSubmit={handleSubmitPenugasan} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 1: PENOMORAN & TANGGAL */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>01</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e1b4b' }}>Penomoran & Tanggal Naskah Dinas</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Kode Klasifikasi</label>
                <input 
                  list="klasifikasi-options" 
                  value={klasifikasi} 
                  onChange={(e) => setKlasifikasi(e.target.value)} 
                  placeholder="Ketik kode..."
                  required 
                  className="input-modern"
                />
                <datalist id="klasifikasi-options">
                  <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                  <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
                  <option value="800.1.1">800.1.1 (Kepegawaian)</option>
                  <option value="050.1.1">050.1.1 (Perencanaan)</option>
                </datalist>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Nomor Urut Surat</label>
                <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 3458" required className="input-modern" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Kode OPD</label>
                <input type="text" value={kodeOPD} disabled style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} className="input-modern" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tgl. Surat Tugas</label>
                <input type="date" value={tanggalSurat} onChange={(e) => setTanggalSurat(e.target.value)} required className="input-modern" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', display: 'block', marginBottom: '6px' }}>Tgl. Cetak SPD</label>
                <input type="date" value={tanggalSPD} onChange={(e) => setTanggalSPD(e.target.value)} required className="input-modern" style={{ borderColor: '#fca5a5' }} />
              </div>
            </div>

            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eef2ff', border: '1px dashed #6366f1', borderRadius: '10px', textAlign: 'center', fontSize: '13px' }}>
              Nomor Surat Lengkap: <strong style={{ color: '#4338ca', fontSize: '14px' }}>{nomorSuratLengkap}</strong>
            </div>
          </div>

          {/* SECTION 2: RINCIAN KEGIATAN */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '6px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>02</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e1b4b' }}>Maksud & Lokasi Penugasan</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Maksud Penugasan / Kegiatan Audit:</label>
              <textarea value={maksudPenugasan} onChange={(e) => setMaksudPenugasan(e.target.value)} placeholder="Contoh: Melakukan Klarifikasi Hasil Pemeriksaan Dengan Tujuan Tertentu (PDTT) Dugaan Pelaksanaan Pekerjaan..." rows="3" required className="input-modern" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tempat Berangkat (SPD):</label>
                <input type="text" value={tempatBerangkat} onChange={(e) => setTempatBerangkat(e.target.value)} required className="input-modern" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tempat Tujuan Perjalanan Dinas:</label>
                <input type="text" value={tempatTujuan} onChange={(e) => setTempatTujuan(e.target.value)} placeholder="Contoh: Kantor Kejaksaan Negeri Kab. Malang" required className="input-modern" />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>Tempat Kembali (SPD):</label>
                <input type="text" value={tempatKembali} onChange={(e) => setTempatKembali(e.target.value)} required className="input-modern" />
              </div>
            </div>
          </div>

          {/* SECTION 3: DASAR HUKUM */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ backgroundColor: '#d1fae5', color: '#047857', padding: '6px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>03</span>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e1b4b' }}>Dasar Hukum</h3>
              </div>
              <button type="button" onClick={resetDasarDefault} style={{ fontSize: '12px', color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
                🔄 Reset Default (Perbup No. 10/2026)
              </button>
            </div>

            {dasarList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <span style={{ padding: '10px 0', width: '20px', fontSize: '13px', fontWeight: 'bold', color: '#64748b' }}>{index + 1}.</span>
                <input value={typeof item === 'object' ? (item.dasar_hukum || item.isi_dasar || '') : item} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi peraturan dasar..." required className="input-modern" style={{ flex: 1 }} />
                {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px', fontWeight: '700' }}>Hapus</button>}
              </div>
            ))}
            <button type="button" onClick={tambahDasar} style={{ padding: '8px 14px', cursor: 'pointer', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '12px', color: '#334155', marginTop: '6px' }}>+ Tambah Dasar Hukum</button>
          </div>

          {/* SECTION 4: PERSONIL */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <span style={{ backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 10px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' }}>04</span>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e1b4b' }}>Personil Terkait</h3>
            </div>

            {pegawaiList.map((item, index) => (
              <div key={index} style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', color: '#334155' }}>
                  Personil Ke-{index + 1}
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>⚡ Pilih Pegawai Bezitting:</label>
                  <select
                    onChange={(e) => handleSelectPegawaiOtomatis(index, e.target.value)}
                    value={item.id_supabase || ""}
                    className="input-modern"
                  >
                    <option value="" disabled>
                      {loadingPegawai ? 'Memuat data pegawai...' : '-- Klik Pilih dari Master Bezitting --'}
                    </option>
                    {masterPegawai.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} - {p.jabatan}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap & Gelar" required className="input-modern" />
                  <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required className="input-modern" />
                  <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat/Gol (misal: III/b)" required className="input-modern" />
                  <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan Kedinasan" required className="input-modern" />
                </div>
                {pegawaiList.length > 1 && <button type="button" onClick={() => hapusPegawai(index)} style={{ color: '#ef4444', marginTop: '10px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '12px', fontWeight: '700' }}>Hapus Personil Ini</button>}
              </div>
            ))}

            <button type="button" onClick={tambahPegawai} style={{ padding: '8px 14px', cursor: 'pointer', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '700', fontSize: '12px', color: '#334155' }}>+ Tambah Personil</button>
          </div>

          {/* SIMPAN BUTTON */}
          <button
            type="submit"
            disabled={saving}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
              color: '#fff',
              padding: '16px',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '800',
              fontSize: '16px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 8px 20px -4px rgba(79, 70, 229, 0.35)',
              transition: 'transform 0.2s'
            }}
          >
            {saving ? 'Menyimpan Penugasan Baru...' : '💾 Simpan Penugasan & Terbitkan Naskah'}
          </button>

        </form>
      </div>

    </div>
  );
}
