import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const body = await request.json();

    // 1. Ambil file template Word dari folder public/templates/
    const templatePath = path.join(
      process.cwd(),
      'public',
      'templates',
      'template_surat_tugas.docx'
    );

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 2. Render data ke variabel/placeholder di Word
    doc.render({
      nomor_surat: body.nomor_surat || '-',
      penugasan: body.penugasan || '-',
      tanggal: body.tanggal || '-',

      // Array Dasar Hukum
      dasar_list: body.dasar_list && body.dasar_list.length > 0 
        ? body.dasar_list 
        : [{ no: '1', isi_dasar: '-' }],

      // Array Pegawai (Bisa 1 atau banyak orang tanpa terpotong)
      pegawai_list: body.pegawai_list && body.pegawai_list.length > 0 
        ? body.pegawai_list 
        : [{ no: '1', nama: '-', nip: '-', pangkat_gol: '-', jabatan: '-' }],

      // Opsi Tampilkan Tabel Paraf (True/False)
      tampilkan_paraf: body.tampilkan_paraf ?? true,

      // Array Jabatan Paraf Hierarki Dinamis
      paraf_list: body.paraf_list || []
    });

    // 3. Generate buffer file Word
    const buffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    const namaFile = `Surat_Tugas_${(body.nomor_surat || 'Baru').replace(/[\/\s]+/g, '_')}.docx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });
  } catch (error) {
    console.error('Gagal generate surat:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat dokumen Word.' },
      { status: 500 }
    );
  }
}
