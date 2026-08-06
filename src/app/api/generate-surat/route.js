import { NextResponse } from 'next/server';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';

// Helper format tanggal Indonesia (misal: "6 Agustus 2026")
function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export async function POST(request) {
  try {
    const body = await request.json();

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

    const rawDasarList = body.dasar_list || [];
    const totalDasar = rawDasarList.length;

    // LOGIKA UTAMA: Otomatis menempelkan ", dengan ini:" khusus di poin terakhir
    // Tanpa karakter '\n' agar baris tabel Word terduplikasi rapi per baris
    const formattedDasarList = rawDasarList.map((item, index) => {
      const isTerakhir = index === totalDasar - 1;
      let teksDasar = (item.isi_dasar || '').trim();

      if (teksDasar.length > 0) {
        if (isTerakhir) {
          // Hapus titik di akhir jika ada, lalu tempelkan ", dengan ini:"
          if (teksDasar.endsWith('.')) {
            teksDasar = teksDasar.slice(0, -1);
          }
          teksDasar = `${teksDasar}, dengan ini:`;
        }
      }

      return {
        no: String(index + 1),
        isi_dasar: teksDasar
      };
    });

    const formattedPegawaiList = (body.pegawai_list || []).map((item, index) => ({
      no: String(index + 1),
      nama: item.nama || '',
      nip: item.nip || '',
      pangkat_gol: item.pangkat_gol || '',
      jabatan: item.jabatan || ''
    }));

    doc.render({
      nomor_surat: body.nomor_surat || '-',
      penugasan: body.penugasan || '-',
      tanggal: formatTanggalIndo(body.tanggal),

      // Array Dasar Hukum
      dasar_list: formattedDasarList.length > 0 ? formattedDasarList : [{ no: '1', isi_dasar: ', dengan ini:' }],

      // Array Pegawai
      pegawai_list: formattedPegawaiList.length > 0 ? formattedPegawaiList : [{ no: '1', nama: '-', nip: '-', pangkat_gol: '-', jabatan: '-' }],

      // Paraf Hierarki
      tampilkan_paraf: body.tampilkan_paraf ?? true,
      paraf_list: body.paraf_list || []
    });

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
