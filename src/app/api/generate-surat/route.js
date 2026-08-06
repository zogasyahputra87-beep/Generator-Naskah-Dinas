import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

// Fungsi helper untuk memformat tanggal YYYY-MM-DD menjadi "DD Bulan YYYY"
function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

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

    // 2. Format ulang array dasar_list agar {no} dan {isi_dasar} siap untuk kolom terpisah
    const formattedDasarList = (body.dasar_list || []).map((item, index) => ({
      no: String(index + 1),
      isi_dasar: item.isi_dasar || ''
    }));

    // 3. Format ulang array pegawai_list
    const formattedPegawaiList = (body.pegawai_list || []).map((item, index) => ({
      no: String(index + 1),
      nama: item.nama || '',
      nip: item.nip || '',
      pangkat_gol: item.pangkat_gol || '',
      jabatan: item.jabatan || ''
    }));

    // 4. Render data ke variabel/placeholder di Word
    doc.render({
      nomor_surat: body.nomor_surat || '-',
      penugasan: body.penugasan || '-',
      tanggal: formatTanggalIndo(body.tanggal),

      // Data Dasar Hukum untuk tabel 4 kolom (kolom nomor & isi terpisah)
      dasar_list: formattedDasarList.length > 0 ? formattedDasarList : [{ no: '1', isi_dasar: '-' }],

      // Data Pegawai yang ditugaskan
      pegawai_list: formattedPegawaiList.length > 0 ? formattedPegawaiList : [{ no: '1', nama: '-', nip: '-', pangkat_gol: '-', jabatan: '-' }],

      // Data Paraf Hierarki (Baris Tabel Terpisah)
      tampilkan_paraf: body.tampilkan_paraf ?? true,
      paraf_list: body.paraf_list || []
    });

    // 5. Generate buffer file Word
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
