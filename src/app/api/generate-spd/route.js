import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

// Helper format tanggal Indonesia
function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'template_spd.docx'
    );

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Format Pengikut (jika ada)
    const rawPengikut = body.pengikut_list || [];
    const formattedPengikut = rawPengikut.map((item, index) => ({
      no: String(index + 1),
      nama_pengikut: item.nama_pengikut || '',
      tgl_lahir: item.tgl_lahir || '',
      keterangan: item.keterangan || ''
    }));

    doc.render({
      // Nomor & Pejabat
      nomor_spd: body.nomor_spd || '-',
      pengguna_anggaran: body.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: body.nip_pa || '198008012010011018',

      // Data Pegawai Yang Diperintah
      nama: body.nama || '-',
      nip: body.nip || '-',
      pangkat_gol: body.pangkat_gol || '-',
      jabatan: body.jabatan || '-',
      tingkat_biaya: body.tingkat_biaya || '-',

      // Detail Perjalanan
      maksud_penugasan: body.maksud_penugasan || '-',
      alat_angkutan: body.alat_angkutan || 'Angkutan Darat',
      tempat_berangkat: body.tempat_berangkat || 'Inspektorat Daerah Kabupaten Malang',
      tempat_tujuan: body.tempat_tujuan || '-',
      lama_hari: body.lama_hari || '1 (satu) hari',
      tgl_berangkat: formatTanggalIndo(body.tgl_berangkat),
      tgl_kembali: formatTanggalIndo(body.tgl_kembali),

      // Pengikut
      pengikut_list: formattedPengikut,

      // Pembebanan Anggaran & Ket
      skpd: body.skpd || 'Inspektorat Daerah Kabupaten Malang',
      akun: body.akun || '-',
      keterangan_lain: body.keterangan_lain || '-',

      // Tanggal & Dikeluarkan
      kota_dikeluarkan: body.kota_dikeluarkan || 'Singosari',
      tgl_spd: formatTanggalIndo(body.tgl_spd || body.tgl_berangkat)
    });

    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const namaFile = `SPD_${(body.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Gagal generate SPD:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat dokumen SPD.' },
      { status: 500 }
    );
  }
}
