const handleDownloadSPD = async (pegawai) => {
  const payload = {
    nomor_spd: `000.1.2.3/${nomorUrut || '...'}/${kodeOPD}/${tahun}`,
    nama: pegawai.nama,
    nip: pegawai.nip,
    pangkat_gol: pegawai.pangkat_gol,
    jabatan: pegawai.jabatan,
    maksud_penugasan: penugasan,
    tempat_tujuan: 'Lokasi Penugasan', // Bisa dibuatkan input text jika ingin kustom
    tgl_berangkat: tanggal,
    tgl_kembali: tanggal,
  };

  const response = await fetch('/api/generate-spd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SPD_${(pegawai.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } else {
    alert('Gagal mengunduh SPD.');
  }
};
