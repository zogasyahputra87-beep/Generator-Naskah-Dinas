import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Cek Keberadaan Template
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { message: 'File template_spd.docx tidak ditemukan di public/templates/' },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // 2. Normalisasi Data (Gunakan Nilai Cadangan '-' Agar Tidak Crash)
    const payloadSPD = {
      nomor_spd: body.nomor_spd || '-',
      nama: body.nama || '-',
      nip: body.nip || '-',
      pangkat_gol: body.pangkat_gol || '-',
      jabatan: body.jabatan || '-',
      tingkat_biaya: body.tingkat_biaya || 'Tingkat C',
      maksud_penugasan: body.maksud_penugasan || '-',
      alat_angkut: body.alat_angkut || 'Kendaraan Dinas / Umum',
      tempat_berangkat: body.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: body.tempat_tujuan || '-',
      tempat_kembali: body.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      lama_hari: body.lama_hari || '1 (satu) hari',
      tgl_berangkat: body.tgl_berangkat || '-',
      tgl_kembali: body.tgl_kembali || '-',
      tgl_spd: body.tgl_spd || '-',
      skpd_pembebanan: body.skpd_pembebanan || 'Inspektorat Daerah Kabupaten Malang',
      akun_pembebanan: body.akun_pembebanan || '5.1.02.04.01.0001',
      pengguna_anggaran: body.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: body.nip_pa || '198008012010011018'
    };

    // 3. Inject & Render
    doc.setData(payloadSPD);
    doc.render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 4. Return File Word
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=SPD_${(payloadSPD.nama).replace(/[\/\s]+/g, '_')}.docx`
      }
    });

  } catch (error) {
    console.error('API Generate SPD Error Detail:', error);
    return NextResponse.json(
      { message: 'Gagal merender dokumen SPD', error: error.message || String(error) },
      { status: 500 }
    );
  }
}
