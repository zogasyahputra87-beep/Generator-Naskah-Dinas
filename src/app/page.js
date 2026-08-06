'use client';
import { useState } from 'react';

export default function HomePage() {
  const [nomorSurat, setNomorSurat] = useState('');
  const [penugasan, setPenugasan] = useState('');
  const [tanggal, setTanggal] = useState('');

  // Dynamic Array: Dasar Hukum
  const [dasarList, setDasarList] = useState([
    { no: '1', isi_dasar: '' }
  ]);

  // Dynamic Array: Pegawai
  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', nama: '', nip: '', pangkat_gol: '', jabatan: '' }
  ]);

  // Option & Dynamic Array: Paraf Hierarki
  const [tampilkanParaf, setTampilkanParaf] = useState(true);
  const [parafList, setParafList] = useState([
    { jabatan_paraf: 'Plt. Sekretaris' },
    { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
    { jabatan_paraf: 'Auditor Ahli Madya' }
  ]);

  // Handlers untuk Dasar Hukum
  const handleDasarChange = (index, value) => {
    const updated = [...dasarList];
    updated[index].isi_dasar = value;
    setDasarList(updated);
  };
  const tambahDasar = () => {
    setDasarList([...dasarList, { no: String(dasarList.length + 1), isi_dasar: '' }]);
  };
  const hapusDasar = (index) => {
    const filtered = dasarList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) }));
    setDasarList(filtered);
  };

  // Handlers untuk Pegawai
  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => {
    setPegawaiList([
      ...pegawaiList,
      { no: String(pegawaiList.length + 1), nama: '', nip: '', pangkat_gol: '', jabatan: '' }
    ]);
  };
  const hapusPegawai = (index) => {
    const filtered = pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) }));
    setPegawaiList(filtered);
  };

  // Handlers untuk Paraf Hierarki
  const handleParafChange = (index, value) => {
    const updated = [...parafList];
    updated[index].jabatan_paraf = value;
    setParafList(updated);
  };
  const tambahParaf = () => setParafList([...parafList, { jabatan_paraf: '' }]);
  const hapusParaf = (index) => setParafList(parafList.filter((_, i) => i !== index));

  // Handle Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nomor_surat: nomorSurat,
      dasar_list: dasarList,
      pegawai_list: pegawaiList,
      penugasan: penugasan,
      tanggal: tanggal,
      tampilkan_paraf: tampilkanParaf,
      paraf_list: parafList
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
      a.download = `Surat_Tugas_${nomorSurat.replace(/[\/\s]+/g, '_') || 'Baru'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh surat. Pastikan template Word sudah ada di public/templates/.');
    }
  };

  return (
    <main style={{ maxWidth: '700px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Pembuat Surat Tugas Otomatis</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Nomor & Tanggal Surat */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Nomor Surat</label>
            <input value={nomorSurat} onChange={(e) => setNomorSurat(e.target.value)} placeholder="090/ST/.../2026" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Tanggal Surat</label>
            <input value={tanggal} onChange={(e) => setTanggal(e.target.value)} placeholder="Contoh: 10 Agustus 2026" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Section Dasar Hukum */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Dasar Hukum:</label>
          {dasarList.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ padding: '8px 0' }}>{item.no}.</span>
              <input value={item.isi_dasar} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px' }} />
              {dasarList.length > 1 && (
                <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>
              )}
            </div>
          ))}
          <button type="button" onClick={tambahDasar} style={{ marginTop: '5px', padding: '6px 12px', cursor: 'pointer' }}>+ Tambah Dasar Hukum</button>
        </div>

        {/* Section Pegawai */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Daftar Personil Yang Ditugaskan:</label>
          {pegawaiList.map((item, index) => (
            <div key={index} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Pegawai Ke-{item.no}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap & Gelar" required style={{ padding: '8px' }} />
                <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required style={{ padding: '8px' }} />
                <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat / Golongan" required style={{ padding: '8px' }} />
                <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan" required style={{ padding: '8px' }} />
              </div>
              {pegawaiList.length > 1 && (
                <button type="button" onClick={() => hapusPegawai(index)} style={{ color: 'red', marginTop: '8px', cursor: 'pointer' }}>Hapus Pegawai Ini</button>
              )}
            </div>
          ))}
          <button type="button" onClick={tambahPegawai} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#eef', border: '1px solid #99c' }}>+ Tambah Personil Pegawai</button>
        </div>

        {/* Maksud Penugasan */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Untuk (Maksud Penugasan):</label>
          <textarea value={penugasan} onChange={(e) => setPenugasan(e.target.value)} rows="3" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>

        {/* Opsi Paraf Hierarki */}
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <input type="checkbox" checked={tampilkanParaf} onChange={(e) => setTampilkanParaf(e.target.checked)} />
            Cetak Tabel Paraf Hierarki
          </label>

          {tampilkanParaf && (
            <div style={{ marginTop: '12px', paddingLeft: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Daftar Jabatan Paraf:</label>
              {parafList.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                  <input value={item.jabatan_paraf} onChange={(e) => handleParafChange(index, e.target.value)} style={{ flex: 1, padding: '6px' }} />
                  <button type="button" onClick={() => hapusParaf(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>
                </div>
              ))}
              <button type="button" onClick={tambahParaf} style={{ marginTop: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Tambah Baris Paraf</button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" style={{ backgroundColor: '#0066cc', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
          Generate Surat Tugas (.docx)
        </button>
      </form>
    </main>
  );
}
