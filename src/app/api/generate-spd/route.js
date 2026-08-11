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
    
    // Tangkap daftar pegawai dari payload frontend
    const listPegawaiInput = Array.isArray(body.pegawai_spd) 
      ? body.pegawai_spd 
      : (body.nama ? [body] : []);

    if (listPegawaiInput.length === 0) {
      return NextResponse.json({ success: false, message: 'Tidak ada data personil.' }, { status: 400 });
    }

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.docx');
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      return NextResponse.json({ success: false, message: 'File template_spd.docx tidak ditemukan di public/templates/' }, { status: 404 });
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '-' 
    });

    // Petakan array data untuk di-loop oleh {#pegawai_spd} di Word
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
    } catch (renderErr) {
      console.error('Docxtemplater Render Error:', renderErr);
      return NextResponse.json({ 
        success: false, 
        message: 'Gagal merender template Word. Periksa tag {#pegawai_spd} di file Word.',
        errorDetail: renderErr.message || renderErr.toString() 
      }, { status: 500 });
    }

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    
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
    console.error('Server Error SPD:', error);
    return NextResponse.json({ success: false, message: 'Server Error API SPD', detail: error.toString() }, { status: 500 });
  }
}
