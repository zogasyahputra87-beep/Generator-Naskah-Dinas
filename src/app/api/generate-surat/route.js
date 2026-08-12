import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Path file template
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_surat_tugas.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ message: 'File template_surat_tugas.docx tidak ditemukan di public/templates/' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // 2. Normalisasi Dasar Hukum (Tambahkan 'no' eksplisit)
    const rawDasar = Array.isArray(body.dasar_list) ? body.dasar_list : [];
    const dasarListFormatted = rawDasar.map((d, idx) => ({
      no: idx + 1,
      dasar_hukum: typeof d === 'object' ? (d.dasar_hukum || d.teks || '-') : String(d || '-')
    }));

    // 3. Normalisasi Pegawai List (Tambahkan 'no' eksplisit)
    const rawPegawai = Array.isArray(body.pegawai_list) ? body.pegawai_list : [];
    const pegawaiListFormatted = rawPegawai.map((p, idx) => ({
      no: idx + 1,
      nama: typeof p === 'object' ? (p.nama || '-') : String(p || '-'),
      nip: typeof p === 'object' ? (p.nip || '-') : '-',
      pangkat_gol: typeof p === 'object' ? (p.pangkat_gol || '-') : '-',
      jabatan: typeof p === 'object' ? (p.jabatan || '-') : '-'
    }));

    // 4. Set Data Payload
    doc.setData({
      nomor_surat: body.nomor_surat || '-',
      dasar_list: dasarListFormatted.length > 0 ? dasarListFormatted : [{ no: 1, dasar_hukum: 'Peraturan Daerah Kabupaten Malang tentang Pokok-Pokok Pengelolaan Keuangan Daerah.' }],
      pegawai_list: pegawaiListFormatted.length > 0 ? pegawaiListFormatted : [{ no: 1, nama: '-', nip: '-', pangkat_gol: '-', jabatan: '-' }],
      penugasan: body.penugasan || '-',
      tanggal: body.tanggal || '-',
      tempat_tujuan: body.tempat_tujuan || '-'
    });

    // 5. Render
    doc.render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=Surat_Tugas.docx`
      }
    });

  } catch (error) {
    console.error('API Generate Surat Error:', error);
    return NextResponse.json(
      { message: 'Gagal merender Surat Tugas', error: error.message || String(error) },
      { status: 500 }
    );
  }
}
