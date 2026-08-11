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
    
    // Tentukan file template yang digunakan
    let templateFileName = body.halaman_belakang_only 
      ? 'template_spd_belakang.docx' 
      : 'template_spd_depan.docx';

    let templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      // Fallback jika file spesifik belum ada, coba panggil template_spd.docx
      try {
        const fallbackPath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
        content = await fs.readFile(fallbackPath);
      } catch (fallbackErr) {
        return NextResponse.json({ 
          success: false, 
          message: `File template (${templateFileName}) tidak ditemukan di folder public/templates/.` 
        }, { status: 404 });
      }
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '-' 
    });

    // Tangkap daftar pegawai
    const listPegawaiInput = Array.isArray(body.pegawai_spd) 
      ? body.pegawai_spd 
      : (body.nama ? [body] : []);

    const formattedPegawaiSPD = listPegawaiInput.map((p) => ({
      nomor_spd: p.nomor_spd || body.nomor_spd || body.nomor_surat || '-',
      nama: typeof p === 'object' ? p.nama : String(p),
      nip: p.nip || '-',
      pangkat_gol: p.pangkat_gol || '-',
      jabatan: p.jabatan || '-',
      maksud_penugasan: p.maksud_penugasan || body.maksud_penugasan || '-',
      tempat_tujuan: p.tempat_tujuan || body.tempat_tujuan || '-',
      tgl_berangkat: formatTanggalIndo(p.tgl_berangkat || body.tanggal_surat),
      tgl_kembali: formatTanggalIndo(p.tgl_kembali || body.tanggal_surat),
      tgl_spd: formatTanggalIndo(p.tgl_spd || body.tanggal_spd || body.tanggal_surat),
      pengguna_anggaran: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: '198008012010011018'
    }));

    const singlePegawai = formattedPegawaiSPD[0] || {
      nomor_spd: body.nomor_spd || body.nomor_surat || '-',
      maksud_penugasan: body.maksud_penugasan || '-',
      tempat_tujuan: body.tempat_tujuan || '-',
      tgl_berangkat: formatTanggalIndo(body.tgl_berangkat || body.tanggal_surat),
      tgl_kembali: formatTanggalIndo(body.tgl_kembali || body.tanggal_surat),
      tgl_spd: formatTanggalIndo(body.tgl_spd || body.tanggal_spd || body.tanggal_surat),
      pengguna_anggaran: 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
      nip_pa: '198008012010011018'
    };

    // Render data tunggal & perulangan pegawai_spd sekaligus
    doc.render({
      ...singlePegawai,
      pegawai_spd: formattedPegawaiSPD
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    
    let namaFile = `SPD_Depan_${(singlePegawai.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;
    if (body.halaman_belakang_only) {
      namaFile = `SPD_Halaman_Belakang_Visum.docx`;
    } else if (listPegawaiInput.length > 1) {
      namaFile = `SPD_Depan_Gabungan_${listPegawaiInput.length}_Personil.docx`;
    }

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });

  } catch (error) {
    console.error('Error SPD Route:', error);
    return NextResponse.json({ success: false, message: 'Gagal membuat file SPD.', detail: error.toString() }, { status: 500 });
  }
}
