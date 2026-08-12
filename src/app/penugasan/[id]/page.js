const handleDownloadSuratTugas = async () => {
    if (!detail) return;

    // Menyiapkan Dasar Hukum secara bersih
    const rawDasar = Array.isArray(detail.dasar_hukum) ? detail.dasar_hukum : [];
    const dasarListClean = rawDasar.map(d => typeof d === 'object' ? (d.dasar_hukum || d.teks || '-') : String(d));

    // Menyiapkan Pegawai List secara bersih
    const rawPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const pegawaiListClean = rawPersonil.map(p => {
      if (typeof p === 'object') {
        return {
          nama: p.nama || '-',
          nip: p.nip || '-',
          pangkat_gol: p.pangkat_gol || '-',
          jabatan: p.jabatan || '-'
        };
      }
      return { nama: String(p), nip: '-', pangkat_gol: '-', jabatan: '-' };
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
