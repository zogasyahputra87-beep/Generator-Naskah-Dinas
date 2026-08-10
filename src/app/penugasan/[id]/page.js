// Handler Unduh SPD Terpilih / Gabungan menjadi 1 File Word
  const handleDownloadSPDMassal = async () => {
    if (!detail) return;
    const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const targetPersonil = listPersonil.filter((_, idx) => selectedPersonil.includes(idx));

    if (targetPersonil.length === 0) {
      alert('Pilih minimal satu personil untuk mendownload SPD.');
      return;
    }

    // Format payload array personil yang dipilih
    const payloadSPDMassal = {
      nomor_surat: detail.nomor_surat,
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tanggal_surat: detail.tanggal_surat,
      tanggal_spd: detail.tanggal_spd,
      pegawai_spd: targetPersonil.map(p => ({
        nomor_spd: detail.nomor_surat,
        nama: p.nama,
        nip: p.nip,
        pangkat_gol: p.pangkat_gol,
        jabatan: p.jabatan,
        maksud_penugasan: detail.maksud_penugasan,
        tempat_tujuan: detail.tempat_tujuan,
        tgl_berangkat: detail.tanggal_surat,
        tgl_kembali: detail.tanggal_surat,
        tgl_spd: detail.tanggal_spd,
      }))
    };

    const response = await fetch('/api/generate-spd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadSPDMassal),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SPD_Gabungan_${targetPersonil.length}_Personil.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal membuat file SPD Gabungan.');
    }
  };
