// Unduh Halaman Depan Terpilih Menjadi 1 File Word Gabungan Langsung
  const handleDownloadSPDDepanMassal = async () => {
    if (!detail) return;
    const listPersonil = Array.isArray(detail.personil) ? detail.personil : [];
    const targetPersonil = listPersonil.filter((_, idx) => selectedPersonil.includes(idx));

    if (targetPersonil.length === 0) {
      alert('Pilih minimal satu personil.');
      return;
    }

    const payloadSPDMassal = {
      nomor_spd: detail.nomor_surat,
      maksud_penugasan: detail.maksud_penugasan,
      tempat_tujuan: detail.tempat_tujuan,
      tanggal_surat: detail.tanggal_surat,
      tanggal_spd: detail.tanggal_spd,
      pegawai_spd: targetPersonil.map(p => ({
        nomor_spd: detail.nomor_surat,
        nama: typeof p === 'object' ? p.nama : p,
        nip: typeof p === 'object' ? p.nip : '',
        pangkat_gol: typeof p === 'object' ? p.pangkat_gol : '',
        jabatan: typeof p === 'object' ? p.jabatan : '',
        maksud_penugasan: detail.maksud_penugasan,
        tempat_tujuan: detail.tempat_tujuan,
        tgl_berangkat: detail.tanggal_surat,
        tgl_kembali: detail.tanggal_surat,
        tgl_spd: detail.tanggal_spd,
      }))
    };

    await fetchSPDFile(payloadSPDMassal, `SPD_Depan_Gabungan_${targetPersonil.length}_Personil.docx`);
  };
