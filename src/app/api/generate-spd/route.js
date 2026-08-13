import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Tentukan nama template berdasarkan permintaan (Depan vs Belakang)
    const isBelakang = body.halaman_belakang_only === true;
    const templateFileName = isBelakang ? 'template_spd_belakang.docx' : 'template_spd_depan.docx';

    let content;
    const templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);

    // 2. Pembacaan File (Lokal FS -> Fallback HTTP Fetch jika di Vercel)
    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath, 'binary');
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const templateUrl = `${protocol}://${host}/templates/${templateFileName}`;

      const response = await fetch(templateUrl);
      if (!response.ok) {
        return NextResponse.json(
          { message: `File ${templateFileName} tidak ditemukan di public/templates/ (Status 404)` },
          { status: 404 }
        );
      }
      const arrayBuffer = await response.arrayBuffer();
      content = Buffer.from(arrayBuffer);
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // 3. Payload SPD Lengkap (Semua bidang terisi aman)
    const payloadSPD = {
      nomor_spd: body.nomor_spd || '-',
      nama: body.nama || '-',
      nip: body.nip || '-',
      pangkat_gol: body.pangkat_gol || '-',
      jabatan: body.jabatan || '-',
      tingkat_biaya: body.tingkat_biaya || ' ',
      maksud_penugasan: body.maksud_penugasan || '-',
      alat_angkut: body.alat_angkut || 'Angkutan Darat',
      tempat_berangkat: body.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: body.tempat_tujuan || '-',
      tempat_kembali: body.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      lama_hari: body.lama_hari || '1 (satu) hari',
      tgl_berangkat: body.tgl_berangkat || '-',
      tgl_kembali: body.tgl_kembali || '-',
      tgl_spd: body.tgl_spd || '-',
      skpd_pembebanan: body.skpd_pembebanan || 'Inspektorat Daerah Kabupaten Malang',
      akun_pembebanan: body.akun_pembebanan || ' ',
      pengguna_anggaran: body.pengguna_anggaran || 'ARRIE HENDRAWAN MAHARDHIEKA, S.H.',
      nip_pa: body.nip_pa || '198008012010011018'
    };

    doc.setData(payloadSPD);
    doc.render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    const prefixFilename = isBelakang ? 'SPD_Belakang_Visum' : `SPD_Depan_${(payloadSPD.nama).replace(/[\/\s]+/g, '_')}`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=${prefixFilename}.docx`
      }
    });

  } catch (error) {
    console.error('API Generate SPD Error:', error);
    return NextResponse.json(
      { message: 'Gagal merender dokumen SPD', error: error.message || String(error) },
      { status: 500 }
    );
  }
}
