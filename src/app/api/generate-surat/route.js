import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

// DAFTAR DASAR HUKUM DEFAULT RESMI (4 PERATURAN)
const DASAR_HUKUM_DEFAULT = [
  'Peraturan Pemerintah Nomor 12 Tahun 2017 tentang Pembinaan dan Pengawasan Penyelenggaraan Pemerintah Daerah',
  'Peraturan Daerah Kabupaten Malang Nomor 3 Tahun 2023 Tentang Perubahan Keempat atas Peraturan Daerah Nomor 9 Tahun 2016 Tentang Pembentukan dan Susunan Perangkat Daerah',
  'Peraturan Bupati Nomor 10 Tahun 2026 Tentang Perubahan Ketiga Atas Peraturan Bupati Malang Nomor 63 Tahun 2016 Tentang Kedudukan, Susunan Organisasi, Tugas dan Fungsi, Serta Tata Kerja Inspektorat Daerah',
  'Dokumen Pelaksanaan Perubahan Anggaran Inspektorat Daerah Kabupaten Malang Tahun Anggaran 2026 Nomor: DPA/A.2/6.01.0.00.0.00.01.0000/001/2026 tanggal 9 Juni 2026'
];

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Ambil Template Word (Lokal FS -> Fallback HTTP Fetch jika di Vercel)
    let content;
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_surat_tugas.docx');

    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath, 'binary');
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const templateUrl = `${protocol}://${host}/templates/template_surat_tugas.docx`;

      const response = await fetch(templateUrl);
      if (!response.ok) {
        return NextResponse.json({ message: 'File template_surat_tugas.docx tidak ditemukan di public/templates/' }, { status: 404 });
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

    // 2. Normalisasi Dasar Hukum (Gunakan default jika kosong + Otomatis tempelkan ", dengan ini:" di item terakhir)
    const rawDasar = Array.isArray(body.dasar_list) && body.dasar_list.length > 0 
      ? body.dasar_list 
      : DASAR_HUKUM_DEFAULT;

    const dasarListFormatted = rawDasar.map((d, idx) => {
      let textStr = typeof d === 'object' ? (d.dasar_hukum || d.teks || '-') : String(d || '-');
      // Bersihkan tanda baca titik/koma/spasi di ujung kalimat
      textStr = textStr.trim().replace(/[.;,]+$/, '');

      // Jika elemen terakhir, tambahkan ", dengan ini:"
      if (idx === rawDasar.length - 1) {
        textStr = `${textStr}, dengan ini:`;
      } else {
        textStr = `${textStr};`;
      }

      return {
        no: idx + 1,
        dasar_hukum: textStr
      };
    });

    // 3. Normalisasi Pegawai List
    const rawPegawai = Array.isArray(body.pegawai_list) ? body.pegawai_list : [];
    const pegawaiListFormatted = rawPegawai.map((p, idx) => ({
      no: idx + 1,
      nama: typeof p === 'object' ? (p.nama || '-') : String(p || '-'),
      nip: typeof p === 'object' ? (p.nip || '-') : '-',
      pangkat_gol: typeof p === 'object' ? (p.pangkat_gol || '-') : '-',
      jabatan: typeof p === 'object' ? (p.jabatan || '-') : '-'
    }));

    // 4. Set Data Payload untuk Docxtemplater
    doc.setData({
      nomor_surat: body.nomor_surat || '-',
      dasar_list: dasarListFormatted,
      kalimat_penghubung: ', dengan ini:',
      kata_memerintahkan: 'MEMERINTAHKAN:',
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
    return NextResponse.json({ message: 'Gagal merender Surat Tugas', error: error.message }, { status: 500 });
  }
}
