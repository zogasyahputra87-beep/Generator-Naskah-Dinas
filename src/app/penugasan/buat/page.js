'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppNavbar from '../../../components/AppNavbar';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function BuatPenugasanPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nomor_surat: '',
    jenis_penugasan: 'Pemeriksaan / Audit Regular',
    maksud_penugasan: '',
    tempat_tujuan: '',
    tanggal_surat: new Date().toISOString().split('T')[0],
    tahap: 1,
    personil: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/penugasan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const result = await res.json();
        alert('Penugasan berhasil dibuat!');
        // Langsung arahkan ke halaman detail penugasan yang baru dibuat
        router.push(`/penugasan/${result[0].id}`);
      } else {
        alert('Gagal menyimpan penugasan.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <AppNavbar title="Buat Penugasan Baru" />

      <main style={{ padding: '28px 20px', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <Link href="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', fontSize: '13px' }}>
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
            📝 Form Input Penugasan Pengawasan
          </h2>

          <form onSubmit={handleSubmit}>
            {/* NOMOR SURAT */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Nomor Surat Dinas / ST:
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

            {/* JENIS PENUGASAN (PENTING UNTUK REKAP KINERJA & TAHAP 2) */}
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
                rows={4}
                placeholder="Deskripsi ringkas tugas pengawasan..."
                value={formData.maksud_penugasan}
                onChange={(e) => setFormData({ ...formData, maksud_penugasan: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* TEMPAT TUJUAN */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Tempat / Obrik Tujuan:
              </label>
              <input
                type="text"
                placeholder="Contoh: Dinas Kesehatan / Desa Karanglo"
                value={formData.tempat_tujuan}
                onChange={(e) => setFormData({ ...formData, tempat_tujuan: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
            </div>

            {/* TANGGAL SURAT */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                Tanggal Surat:
              </label>
              <input
                type="date"
                value={formData.tanggal_surat}
                onChange={(e) => setFormData({ ...formData, tanggal_surat: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
              />
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
              {submitting ? 'Simpan Data...' : '🚀 Simpan & Buat Penugasan'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
