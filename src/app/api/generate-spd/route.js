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

    // 2. Pembacaan File Template (Optimasi Buffer untuk Vercel & Node.js)
    try {
      if (fs.existsSync(templatePath)) {
        content = fs.readFileSync(templatePath);
      } else {
        // Fallback untuk Vercel Serverless Function
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
    } catch (err) {
      console.error('Error saat membaca file template:', err);
      return NextResponse.json(
        { message: `Gagal membaca template ${templateFileName}`, error: err.message },
        { status: 500 }
      );
    }

    // 3. Init PizZip & Docxtemplater
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // 4. Payload SPD Lengkap (Gabungan Halaman Depan & Halaman Belakang / Visum)
    const payloadSPD = {
      // Data SPD Depan
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

      // Data Visum / SPD Belakang (Poin I - V)
      tujuan_visum_1: body.tempat_tujuan || 'Kantor Kejaksaan Negeri Kabupaten Malang',
      tgl_berangkat_1: body.tgl_berangkat || '-',
      tgl_tiba_1: body.tgl_berangkat || '-',
      pejabat_tujuan_1: body.pejabat_tujuan_1 || '.......................................................',
      nip_pejabat_tujuan_1: body.nip_pejabat_tujuan_1 || '...................................',
      
      // Catatan Tambahan Jika Ada Tujuan Ke-2 / Ke-3
      tujuan_visum_2: body.tujuan_visum_2 || '',
      tgl_tiba_2: body.tgl_tiba_2 || '',
      tgl_berangkat_2: body.tgl_berangkat_2 || ''
    };

    // Render Dokumen
    doc.setData(payloadSPD);
    
    try {
      doc.render();
    } catch (error) {
      console.error('Docxtemplater Render Error:', error);
      return NextResponse.json(
        { message: 'Gagal melakukan render data ke template .docx', error: error.message },
        { status: 500 }
      );
    }

    const buf = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE' // Menjamin kompresi zip docx stabil dan tidak corrupt
    });

    const prefixFilename = isBelakang 
      ? `SPD_Belakang_${(payloadSPD.nama).replace(/[\/\s]+/g, '_')}` 
      : `SPD_Depan_${(payloadSPD.nama).replace(/[\/\s]+/g, '_')}`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${prefixFilename}.docx"`
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
