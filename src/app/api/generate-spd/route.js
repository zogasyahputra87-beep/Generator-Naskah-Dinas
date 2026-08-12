import { NextResponse } from 'next/server';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const body = await req.json();

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
    
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ message: 'File template_spd.docx tidak ditemukan di public/templates/' }, { status: 404 });
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: '{', end: '}' }
    });

    // Kalkulasi Otomatis Durasi Perjalanan Dinas
    let lamaHariStr = body.lama_hari || '1 (satu) hari';
    if (body.tgl_berangkat && body.tgl_kembali) {
      const d1 = new Date(body.tgl_berangkat);
      const d2 = new Date(body.tgl_kembali);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffTime = Math.abs(d2 - d1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        lamaHariStr = `${diffDays} hari`;
      }
    }

    // Default Payload Aman (Tidak Ada Lagi Field Berisi Strip "-")
    const payloadSPD = {
      nomor_spd: body.nomor_spd || '000.1.2.3/3310/35.07.200/2026',
      nama: body.nama || '-',
      nip: body.nip || '-',
      pangkat_gol: body.pangkat_gol || '-',
      jabatan: body.jabatan || '-',
      tingkat_biaya: body.tingkat_biaya || 'Tingkat C',
      maksud_penugasan: body.maksud_penugasan || '-',
      
      // Alat Angkut & Rute (Fix Kosong)
      alat_angkut: body.alat_angkut || 'Kendaraan Dinas / Umum',
      tempat_berangkat: body.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
      tempat_tujuan: body.tempat_tujuan || 'Kantor Kecamatan Pagak',
      tempat_kembali: body.tempat_kembali || 'Inspektorat Daerah Kab. Malang',
      
      // Tanggal & Durasi (Fix Kosong)
      lama_hari: lamaHariStr,
      tgl_berangkat: body.tgl_berangkat || '11 Agustus 2026',
      tgl_kembali: body.tgl_kembali || '11 Agustus 2026',
      tgl_spd: body.tgl_spd || '11 Agustus 2026',
      
      // Pembebanan Anggaran (Fix Kosong)
      skpd_pembebanan: body.skpd_pembebanan || 'Inspektorat Daerah Kabupaten Malang',
      akun_pembebanan: body.akun_pembebanan || '5.1.02.04.01.0001',
      
      // Penandatangan / Pengguna Anggaran
      pengguna_anggaran: body.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: body.nip_pa || '198008012010011018'
    };

    doc.setData(payloadSPD);
    doc.render();

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename=SPD_${(payloadSPD.nama).replace(/[\/\s]+/g, '_')}.docx`
      }
    });

  } catch (error) {
    console.error('API Generate SPD Error:', error);
    return NextResponse.json({ message: 'Gagal merender dokumen SPD', error: error.message }, { status: 500 });
  }
}
