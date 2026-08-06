'use client';
import { useState } from 'react';

export default function HomePage() {
  const [formData, setFormData] = useState({
    nomor_surat: '',
    nama: '',
    nip: '',
    jabatan: '',
    kegiatan: '',
    tanggal: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/generate-surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Tugas_${formData.nama || 'Baru'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh surat. Pastikan file template Word sudah diunggah.');
    }
  };

  return (
    <main style={{ maxWidth: '600px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Pembuat Surat Tugas Otomatis</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Nomor Surat</label>
          <input name="nomor_surat" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Nama Pegawai</label>
          <input name="nama" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>NIP</label>
          <input name="nip" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Jabatan</label>
          <input name="jabatan" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Kegiatan / Tugas</label>
          <textarea name="kegiatan" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box', height: '80px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Tanggal Pelaksanaan</label>
          <input name="tanggal" onChange={handleChange} required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ backgroundColor: '#0066cc', color: 'white', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
          Generate Surat (.docx)
        </button>
      </form>
    </main>
  );
}
