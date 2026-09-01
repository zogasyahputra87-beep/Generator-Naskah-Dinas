'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '../../../components/AppNavbar';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah;',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah;',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah;',
  'Dokumen Pelaksanaan Perubahan Anggaran Inspektorat Daerah Kabupaten Malang Tahun Anggaran 2026 Nomor: DPA/A.2/6.01.0.00.0.00.01.0000/001/2026 tanggal 9 Juni 2026, dengan ini:'
];

export default function BuatPenugasanBaruPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Form State Utama
  const [formData, setFormData] = useState({
    nomor_surat: '',
    jenis_penugasan: 'Pemeriksaan / Audit Regular', // <-- Penambahan bidang baru
    maksud_penugasan: '',
    tempat_berangkat: 'Inspektorat Daerah Kabupaten Malang',
    tempat_tujuan: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    tanggal_spd: new Date().toISOString().split('T')[0],
    tahap: 1
  });

  // Dynamic Array Input
  const [listDasarHukum, setListDasarHukum] = useState(DASAR_HUKUM_DEFAULT);
  const [listPersonil, setListPersonil] = useState([
    { nama: '', nip: '', pangkat_gol: '', jabatan: '' }
  ]);

  // Handler Tambah & Hapus Dasar Hukum
  const handleAddDasarHukum = () => setListDasarHukum([...listDasarHukum, '']);
  const handleRemoveDasarHukum = (index) => setListDasarHukum(listDasarHukum.filter((_, i) => i !== index));
  const handleDasarHukumChange = (index, value) => {
    const updated = [...listDasarHukum];
    updated[index] = value;
    setListDasarHukum(updated);
  };

  // Handler Tambah & Hapus Personil
  const handleAddPersonil = () => {
    setListPersonil([...listPersonil, { nama: '', nip: '', pangkat_gol: '', jabatan: '' }]);
  };
  const handleRemovePersonil = (index) => {
    setListPersonil(listPersonil.filter((_, i) => i !== index));
  };
  const handlePersonilChange = (index, field, value) => {
    const updated = [...listPersonil];
    updated[index][field] = value;
    setListPersonil(updated);
  };

  // Submit Handler ke Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        dasar_hukum: listDasarHukum.filter(item => item.trim() !== ''),
        personil: listPersonil
      };

      const res = await fetch(`${SUPABASE_URL}/rest/v1/penugasan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        alert('Penugasan berhasil dibuat!');
        router.push(`/penugasan/${result[0].id}`);
      } else {
        alert('Gagal menyimpan penugasan. Periksa kembali isian form.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi saat menyimpan penugasan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <AppNavbar title="Buat Penugasan Baru" />

      <main style={{ padding: '28px 20px', maxWidth: '850px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            📝 Form Input Penugasan Baru
          </h2>

          <form onSubmit={handleSubmit}>
            {/* NOMOR SURAT */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Nomor Surat Tugas:
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: 005/123/35.07.060/2026"
                value={formData.nomor_surat}
                onChange={(e) => setFormData({ ...formData, nomor_surat: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* JENIS PENUGASAN (FITUR PENAMBAHAN BARU) */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Jenis / Sifat Penugasan Pengawasan:
              </label>
              <select
                value={formData.jenis_penugasan}
                onChange={(e) => setFormData({ ...formData, jenis_penugasan: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  backgroundColor: '#fff',
                  fontWeight: '600',
                  color: '#1e1b4b',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Pemeriksaan / Audit Regular">Pemeriksaan / Audit Regular</option>
                <option value="Pemeriksaan APBDes">Pemeriksaan APBDes / Desa</option>
                <option value="Pemeriksaan Dengan Tujuan Tertentu (PDTT)">Pemeriksaan Dengan Tujuan Tertentu (PDTT)</option>
                <option value="Reviu (RKA / LKPJ / LPPD / LKPD)">Reviu (RKA / LKPJ / LPPD / LKPD)</option>
                <option value="Evaluasi / Monitoring">Evaluasi / Monitoring</option>
                <option value="Pendampingan / Asistensi / E-Consulting">Pendampingan / Asistensi</option>
                <option value="Pemeriksaan Khusus / Pengaduan (BAK)">Pemeriksaan Khusus / Pengaduan</option>
                <option value="Perjalanan Dinas / Rapat Koordinasi">Perjalanan Dinas / Rapat Koordinasi</option>
              </select>
            </div>

            {/* MAKSUD PENUGASAN */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Maksud Penugasan:
              </label>
              <textarea
                required
                rows={3}
                placeholder="Rincian maksud penugasan..."
                value={formData.maksud_penugasan}
                onChange={(e) => setFormData({ ...formData, maksud_penugasan: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* LOKASI BERANGKAT & TUJUAN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Tempat Berangkat:
                </label>
                <input
                  type="text"
                  value={formData.tempat_berangkat}
                  onChange={(e) => setFormData({ ...formData, tempat_berangkat: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Tempat Tujuan (Obrik):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kantor Kejaksaan Negeri Kab. Malang"
                  value={formData.tempat_tujuan}
                  onChange={(e) => setFormData({ ...formData, tempat_tujuan: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* TANGGAL SURAT & TANGGAL SPD */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Tanggal Surat Tugas:
                </label>
                <input
                  type="date"
                  value={formData.tanggal_surat}
                  onChange={(e) => setFormData({ ...formData, tanggal_surat: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                  Tanggal SPD:
                </label>
                <input
                  type="date"
                  value={formData.tanggal_spd}
                  onChange={(e) => setFormData({ ...formData, tanggal_spd: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* INPUT DASAR HUKUM */}
            <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e1b4b' }}>
                  Dasar Hukum Penugasan
                </label>
                <button
                  type="button"
                  onClick={handleAddDasarHukum}
                  style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + Tambah Dasar
                </button>
              </div>

              {listDasarHukum.map((dasar, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={dasar}
                    onChange={(e) => handleDasarHukumChange(idx, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px' }}
                  />
                  {listDasarHukum.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDasarHukum(idx)}
                      style={{ backgroundColor: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* INPUT SUSUNAN PERSONIL / TIM */}
            <div style={{ marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#1e1b4b' }}>
                  Personil Tim Penugasan
                </label>
                <button
                  type="button"
                  onClick={handleAddPersonil}
                  style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  + Tambah Personil
                </button>
              </div>

              {listPersonil.map((p, pIdx) => (
                <div key={pIdx} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569' }}>Personil #{pIdx + 1}</span>
                    {listPersonil.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePersonil(pIdx)}
                        style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                      >
                        Hapus Personil
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Nama Pegawai"
                      value={p.nama}
                      onChange={(e) => handlePersonilChange(pIdx, 'nama', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="NIP"
                      value={p.nip}
                      onChange={(e) => handlePersonilChange(pIdx, 'nip', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Pangkat / Golongan"
                      value={p.pangkat_gol}
                      onChange={(e) => handlePersonilChange(pIdx, 'pangkat_gol', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      placeholder="Jabatan Tim (misal: Penanggung Jawab / Ketua / Anggota)"
                      value={p.jabatan}
                      onChange={(e) => handlePersonilChange(pIdx, 'jabatan', e.target.value)}
                      style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 20px',
                backgroundColor: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}
            >
              {submitting ? 'Menyimpan Data...' : '🚀 Simpan & Terbitkan Penugasan'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
