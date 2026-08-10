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

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_surat_tugas.docx');
    
    let content;
    try {
      content = await fs.readFile(templatePath);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'File template_surat_tugas.docx tidak ditemukan di public/templates/' },
        { status: 404 }
      );
    }

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

    // Format list dasar hukum tanpa nilai undefined
    const rawDasar = Array.isArray(body.dasar_list) ? body.dasar_list : (Array.isArray(body.dasar_hukum) ? body.dasar_hukum : []);
    const formattedDasarList = rawDasar.map((d, index, arr) => {
      let teks = typeof d === 'string' ? d : (d.isi_dasar || '');
      teks = teks.trim();
      const isLast = index === arr.length - 1;

      if (isLast && teks.length > 0) {
        if (teks.endsWith('.')) teks = teks.slice(0, -1);
        teks = `${teks}, dengan ini:`;
      } else if (teks.length > 0) {
        if (teks.endsWith('.')) teks = teks.slice(0, -1);
        teks = `${teks};`;
      }

      return {
        no: String(index + 1),
        isi_dasar: teks
      };
    });

    // Format list pegawai tanpa nilai undefined
    const rawPegawai = Array.isArray(body.pegawai_list) ? body.pegawai_list : (Array.isArray(body.personil) ? body.personil : []);
    const formattedPegawaiList = rawPegawai.map((p, index) => ({
      no: String(index + 1),
      nama: p.nama || '-',
      nip: p.nip || '-',
      pangkat_gol: p.pangkat_gol || '-',
      jabatan: p.jabatan || '-'
    }));

    // Format list paraf
    const rawParaf = Array.isArray(body.paraf_list) ? body.paraf_list : [];
    const formattedParafList = rawParaf.map((item) => ({
      jabatan_paraf: item.jabatan_paraf || ''
    }));

    doc.render({
      nomor_surat: body.nomor_surat || '-',
      dasar_list: formattedDasarList,
      pegawai_list: formattedPegawaiList,
      penugasan: body.penugasan || body.maksud_penugasan || '-',
      tanggal: formatTanggalIndo(body.tanggal || body.tanggal_surat),
      tampilkan_paraf: body.tampilkan_paraf !== false,
      paraf_list: formattedParafList
    });

    const buf = doc.getZip().generate({ type: 'nodebuffer' });
    const namaFile = `Surat_Tugas_${(body.nomor_surat || 'Draft').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });

  } catch (error) {
    console.error('Error Surat Tugas Word:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat Surat Tugas Word.', detail: error.toString() },
      { status: 500 }
    );
  }
}
