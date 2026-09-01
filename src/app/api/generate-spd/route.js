import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Opsi cetak Halaman Belakang vs Depan
    const isBelakang = body.halaman_belakang_only === true;
    const templateFileName = isBelakang
      ? 'template_spd_belakang.docx'
      : 'template_spd_depan.docx';

    let content;
    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      templateFileName
    );

    // 2. Pembacaan Template Fleksibel (FS Local / Vercel Serverless)
    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath);
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const templateUrl = `${protocol}://${host}/templates/${templateFileName}`;

      const response = await fetch(templateUrl, { cache: 'no-store' });

      if (!response.ok) {
        return NextResponse.json(
          { message: `File ${templateFileName} tidak ditemukan di public/templates/` },
          { status: 404 }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      content = Buffer.from(arrayBuffer);
    }

    // 3. Mapping Payload Data
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
      nip_pa: body.nip_pa || '198008012010011018',

      // Visum Halaman Belakang
      tujuan_1: body.tempat_tujuan || '-',
      tgl_berangkat_1: body.tgl_berangkat || '-',
      tgl_tiba_1: body.tgl_berangkat || '-',
    };

    // 4. Manipulasi XML Alignment TTD Aman (PizZip)
    const zip = new PizZip(content);
    const xmlFile = zip.file('word/document.xml');

    if (xmlFile) {
      let xmlText = xmlFile.asText();

      // Kata kunci TTD yang ingin dipaksa Rata Kiri (left)
      const targetKeywords = [
        'Kepala',
        'Pengguna Anggaran',
        'ARRIE HENDRAWAN MAHARDHIEKA',
        'Arrie Hendrawan Mahardhieka',
        'NIP.'
      ];

      // Ganti w:jc val="center" / "right" / "both" menjadi "left" secara aman
      targetKeywords.forEach((keyword) => {
        // Cari paragraf yang mengandung kata kunci tanpa merusak skema XML
        const regex = new RegExp(
          `(<w:p\\b[^>]*>(?:(?!<\\/w:p>)[\\s\\S])*?${keyword}[\\s\\S]*?<\\/w:p>)`,
          'gi'
        );

        xmlText = xmlText.replace(regex, (pMatch) => {
          if (/<w:jc\b/.test(pMatch)) {
            return pMatch.replace(/<w:jc\b[^>]*\/>/g, '<w:jc w:val="left"/>');
          } else if (/<w:pPr>/.test(pMatch)) {
            return pMatch.replace('<w:pPr>', '<w:pPr><w:jc w:val="left"/>');
          } else {
            return pMatch.replace('<w:p>', '<w:p><w:pPr><w:jc w:val="left"/></w:pPr>');
          }
        });
      });

      zip.file('word/document.xml', xmlText);
    }

    // 5. Inisialisasi & Render Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    doc.setData(payloadSPD);
    doc.render();

    // 6. Generate Buffer DOCX
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    const safeName = (payloadSPD.nama || 'Tanpa_Nama').replace(/[\/\\\s]+/g, '_');
    const filename = isBelakang
      ? `SPD_Belakang_${safeName}.docx`
      : `SPD_Depan_${safeName}.docx`;

    // 7. Return NextResponse Binary Stream
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('API Generate SPD Error:', error);
    return NextResponse.json(
      {
        message: 'Gagal merender dokumen SPD',
        error: error.message || String(error)
      },
      { status: 500 }
    );
  }
}
