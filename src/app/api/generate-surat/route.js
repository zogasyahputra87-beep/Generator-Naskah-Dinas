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

    let templateFileName = 'template_surat_tugas.docx';
    let templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      try {
        templateFileName = 'template_surat.docx';
        templatePath = path.join(process.cwd(), 'public', 'templates', templateFileName);
        content = await fs.readFile(templatePath);
      } catch (fallbackErr) {
        return NextResponse.json({ 
          success: false, 
          message: 'File template Surat Tugas tidak ditemukan di public/templates/' 
        }, { status: 404 });
      }
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { 
      paragraphLoop: true, 
      linebreaks: true,
      nullGetter: () => '-' 
    });

    // Extract daftar dasar menjadi teks murni (mencegah [object Object])
    const rawDasar = Array.isArray(body.dasar_list) ? body.dasar_list : [];
    const formattedDasarList = rawDasar.map((d, index) => {
      let teksDasar = '-';
      if (typeof d === 'string') {
        teksDasar = d;
      } else if (typeof d === 'object' && d !== null) {
        teksDasar = d.dasar || d.teks || d.nama || d.isi_dasar || Object.values(d)[0] || '-';
      }
      return {
        no: index + 1,
        nomor: index + 1,
        dasar: teksDasar,
        isi_dasar: teksDasar,
        teks: teksDasar
      };
    });

    // Format array pegawai
    const rawPegawai = Array.isArray(body.pegawai_list) ? body.pegawai_list : [];
    const formattedPegawaiList = rawPegawai.map((p, index) => ({
      no: index + 1,
      nama: typeof p === 'object' ? p.nama || '-' : String(p),
      nip: typeof p === 'object' ? p.nip || '-' : '-',
      pangkat_gol: typeof p === 'object' ? p.pangkat_gol || '-' : '-',
      jabatan: typeof p === 'object' ? p.jabatan || '-' : '-'
    }));

    const payloadData = {
      nomor_surat: body.nomor_surat || body.nomor_penugasan || '-',
      penugasan: body.penugasan || body.maksud_penugasan || '-',
      tempat_tujuan: body.tempat_tujuan || '-',
      tanggal: formatTanggalIndo(body.tanggal || body.tanggal_surat),
      dasar_list: formattedDasarList,
      pegawai_list: formattedPegawaiList,
      paraf_list: Array.isArray(body.paraf_list) ? body.paraf_list : []
    };

    doc.render(payloadData);

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const namaFile = `Surat_Tugas_${(payloadData.nomor_surat || 'ST').replace(/[\/\s]+/g, '_')}.docx`;

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
