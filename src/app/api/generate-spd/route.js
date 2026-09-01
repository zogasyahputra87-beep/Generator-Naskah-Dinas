import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    // 1. Cek opsi cetak Halaman Belakang vs Depan
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

    // 2. Pembacaan Template (FS Local + Vercel Fallback)
    if (fs.existsSync(templatePath)) {
      content = fs.readFileSync(templatePath);
    } else {
      const host = req.headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      const templateUrl = `${protocol}://${host}/templates/${templateFileName}`;

      const response = await fetch(templateUrl);

      if (!response.ok) {
        return NextResponse.json(
          {
            message: `File ${templateFileName} tidak ditemukan di public/templates/`
          },
          { status: 404 }
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      content = Buffer.from(arrayBuffer);
    }

    // 3. Init Docxtemplater
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: '{',
        end: '}'
      }
    });

    // 4. Mapping Payload (Depan & Belakang)
    const payloadSPD = {
      // Data Utama SPD Depan & Belakang
      nomor_spd: body.nomor_spd || '-',
      nama: body.nama || '-',
      nip: body.nip || '-',
      pangkat_gol: body.pangkat_gol || '-',
      jabatan: body.jabatan || '-',
      tingkat_biaya: body.tingkat_biaya || ' ',
      maksud_penugasan: body.maksud_penugasan || '-',
      alat_angkut: body.alat_angkut || 'Angkutan Darat',
      tempat_berangkat:
        body.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: body.tempat_tujuan || '-',
      tempat_kembali:
        body.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      lama_hari: body.lama_hari || '1 (satu) hari',
      tgl_berangkat: body.tgl_berangkat || '-',
      tgl_kembali: body.tgl_kembali || '-',
      tgl_spd: body.tgl_spd || '-',
      skpd_pembebanan:
        body.skpd_pembebanan ||
        'Inspektorat Daerah Kabupaten Malang',
      akun_pembebanan: body.akun_pembebanan || ' ',
      pengguna_anggaran:
        body.pengguna_anggaran ||
        'ARRIE HENDRAWAN MAHARDHIEKA, S.H.',
      nip_pa: body.nip_pa || '198008012010011018',

      // Field Khusus Halaman Belakang (Visum I - V)
      tujuan_1: body.tempat_tujuan || '-',
      tgl_berangkat_1: body.tgl_berangkat || '-',
      tgl_tiba_1: body.tgl_berangkat || '-',
    };

    // 5. Render Data
    doc.setData(payloadSPD);
    doc.render();

    // ============================================================
    // 6. PERBAIKAN ALIGNMENT TTD DALAM TABEL
    // ============================================================

    const documentXmlFile = doc.getZip().file('word/document.xml');

    if (documentXmlFile) {
      let xml = documentXmlFile.asText();

      /*
       * Memaksa paragraf yang mengandung:
       * - Kepala
       * - Pengguna Anggaran
       * - nama pejabat
       * - NIP
       *
       * menjadi rata kiri.
       *
       * Kita tidak mengubah alignment seluruh tabel,
       * hanya paragraf yang berkaitan dengan TTD.
       */

      const keywordsTTD = [
        'Kepala',
        'Pengguna Anggaran',
        'ARRIE HENDRAWAN MAHARDHIEKA',
        'Arrie Hendrawan Mahardhieka',
        'NIP.'
      ];

      // Memproses setiap paragraf Word
      xml = xml.replace(
        /<w:p\b[^>]*>[\s\S]*?<\/w:p>/g,
        (paragraph) => {

          // Ambil teks dari paragraf
          const textMatches = [
            ...paragraph.matchAll(/<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g)
          ];

          const paragraphText = textMatches
            .map((match) => match[1])
            .join('')
            .trim();

          // Cek apakah paragraf merupakan bagian TTD
          const isTTD = keywordsTTD.some((keyword) =>
            paragraphText
              .toLowerCase()
              .includes(keyword.toLowerCase())
          );

          if (!isTTD) {
            return paragraph;
          }

          // --------------------------------------------------------
          // Hapus alignment lama:
          // center, right, justify, dll.
          // --------------------------------------------------------
          paragraph = paragraph.replace(
            /<w:jc\b[^>]*\/>/g,
            ''
          );

          paragraph = paragraph.replace(
            /<w:jc\b[^>]*>[\s\S]*?<\/w:jc>/g,
            ''
          );

          // --------------------------------------------------------
          // Tambahkan alignment LEFT
          // --------------------------------------------------------
          if (/<w:pPr\b[^>]*>/.test(paragraph)) {
            paragraph = paragraph.replace(
              /(<w:pPr\b[^>]*>)/,
              '$1<w:jc w:val="left"/>'
            );
          } else {
            paragraph = paragraph.replace(
              /(<w:p\b[^>]*>)/,
              '$1<w:pPr><w:jc w:val="left"/></w:pPr>'
            );
          }

          return paragraph;
        }
      );

      // Simpan kembali XML yang sudah diperbaiki
      doc.getZip().file(
        'word/document.xml',
        xml
      );
    }

    // ============================================================
    // 7. Generate DOCX
    // ============================================================

    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // 8. Nama File
    const safeName = (payloadSPD.nama || 'Tanpa_Nama')
      .replace(/[\/\\\s]+/g, '_');

    const filename = isBelakang
      ? `SPD_Belakang_${safeName}.docx`
      : `SPD_Depan_${safeName}.docx`;

    // 9. Return File
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

        'Content-Disposition':
          `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('API Generate SPD Error:', error);

    return NextResponse.json(
      {
        message: 'Gagal merender dokumen SPD',
        error: error.message || String(error)
      },
      {
        status: 500
      }
    );
  }
}
