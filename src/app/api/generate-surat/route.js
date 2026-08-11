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

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_surat.docx');
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      return NextResponse.json({ 
        success: false, 
        message: 'File template_surat.docx tidak ditemukan di public/templates/' 
      }, { status: 404 });
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '' 
    });

    // Format array dasar hukum
    const rawDasar = Array.isArray(body.dasar_list) ? body.dasar_list : [];
    const formattedDasarList = rawDasar.map((d, index) => {
      const teksDasar = typeof d === 'object' ? (d.dasar || d.teks || d.nama || String(d)) : String(d);
      return {
        no: index + 1,
        nomor: index + 1,
        dasar: teksDasar,
        isi_dasar: teksDasar,
        teks: teksDasar,
        label_dasar_titik2: index === 0 ? 'Dasar:' : ''
      };
    });

    // Format array pegawai
    const rawPegawai = Array.isArray(body.pegawai_list) ? body.pegawai_list : [];
    const formattedPegawaiList = rawPegawai.map((p, index) => ({
      no: index + 1,
      nama: typeof p === 'object' ? p.nama || '-' : String(p),
      nip: typeof p === 'object' ? p.nip || '-' : '-',
      pangkat_gol: typeof p === 'object' ? p.pangkat_gol || '-' : '-',
      jabatan: typeof p === 'object' ? p.jabatan || '-' : '-',
      label_kepada_titik2: index === 0 ? 'Kepada:' : ''
    }));

    const payloadData = {
      nomor_surat: body.nomor_surat || '-',
      penugasan: body.penugasan || body.maksud_penugasan || '-',
      tempat_tujuan: body.tempat_tujuan || '-',
      tanggal: formatTanggalIndo(body.tanggal || body.tanggal_surat),
      dasar_list: formattedDasarList,
      pegawai_list: formattedPegawaiList,
      paraf_list: Array.isArray(body.paraf_list) ? body.paraf_list : []
    };

    doc.render(payloadData);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const namaFile = `Surat_Tugas_${(body.nomor_surat || 'ST').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });

  } catch (error) {
    console.error('Error Surat Tugas Route:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Gagal merender Surat Tugas.', 
      detail: error.toString() 
    }, { status: 500 });
  }
}
