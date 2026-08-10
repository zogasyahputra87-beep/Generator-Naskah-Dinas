import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import path from 'path';
import fs from 'fs/promises';

function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const listPegawai = body.pegawai_spd || (body.nama ? [body] : []);

    if (listPegawai.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data pegawai.' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'File template_spd.docx tidak ditemukan di public/templates/' }, { status: 404 });
    }

    // Ambil data pegawai pertama (atau gabungan)
    const dataPegawai = listPegawai[0];
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    doc.render({
      nomor_spd: dataPegawai.nomor_spd || body.nomor_surat || '-',
      nama: dataPegawai.nama || '-',
      nip: dataPegawai.nip || '-',
      pangkat_gol: dataPegawai.pangkat_gol || '-',
      jabatan: dataPegawai.jabatan || '-',
      maksud_penugasan: dataPegawai.maksud_penugasan || body.maksud_penugasan || '-',
      tempat_tujuan: dataPegawai.tempat_tujuan || body.tempat_tujuan || '-',
      tgl_berangkat: formatTanggalIndo(dataPegawai.tgl_berangkat || body.tanggal_surat),
      tgl_kembali: formatTanggalIndo(dataPegawai.tgl_kembali || body.tanggal_surat),
      tgl_spd: formatTanggalIndo(dataPegawai.tgl_spd || body.tanggal_spd || body.tanggal_surat),
      pengguna_anggaran: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: '198008012010011018'
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const namaFile = `SPD_${(dataPegawai.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Error SPD Word:', error);
    return NextResponse.json({ success: false, message: 'Gagal membuat file Word SPD.' }, { status: 500 });
  }
}
