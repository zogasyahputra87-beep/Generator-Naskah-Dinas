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
    
    const listPegawaiInput = Array.isArray(body.pegawai_spd) 
      ? body.pegawai_spd 
      : (body.nama ? [body] : []);

    if (listPegawaiInput.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data personil untuk SPD.' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'File template_spd.docx tidak ditemukan.' }, { status: 404 });
    }

    const zip = new PizZip(content);
    
    // Gunakan parser aman agar file docx tidak corrupt
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '' 
    });

    const formattedPegawaiSPD = listPegawaiInput.map((p) => ({
      nomor_spd: p.nomor_spd || body.nomor_surat || '-',
      nama: p.nama || '-',
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

    const singlePegawai = formattedPegawaiSPD[0];

    try {
      doc.render({
        ...singlePegawai,
        pegawai_spd: formattedPegawaiSPD
      });
    } catch (renderError) {
      console.error('Error rendering docx XML:', renderError);
      return NextResponse.json({ 
        success: false, 
        message: 'Format tag di template_spd.docx tidak valid.', 
        detail: renderError.toString() 
      }, { status: 500 });
    }

    const buf = doc.getZip().generate({ 
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });
    
    const namaFile = listPegawaiInput.length > 1 
      ? `SPD_Gabungan_${listPegawaiInput.length}_Personil.docx` 
      : `SPD_${(singlePegawai.nama || 'Pegawai').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });

  } catch (error) {
    console.error('Error SPD Word:', error);
    return NextResponse.json({ success: false, message: 'Gagal membuat file SPD.', detail: error.toString() }, { status: 500 });
  }
}
