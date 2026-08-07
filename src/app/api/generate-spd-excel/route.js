import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs/promises'; // Menggunakan API berbasis Promise

function formatTanggalIndo(tanggalStr) {
  if (!tanggalStr) return '-';
  const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
  const date = new Date(tanggalStr);
  return isNaN(date.getTime()) ? tanggalStr : date.toLocaleDateString('id-ID', opsi);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const listPegawai = body.pegawai_spd || (body.nama ? [body] : []);

    if (listPegawai.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tidak ada data pegawai yang dikirim.' },
        { status: 400 }
      );
    }

    // Perbaikan cara membaca file statis di Next.js API Route
    const templatePath = path.join(process.cwd(), 'public', 'templates', 'template_spd.xlsx');
    let fileBuffer;

    try {
      fileBuffer = await fs.readFile(templatePath);
    } catch (err) {
      console.error('Gagal membaca file template:', err);
      return NextResponse.json(
        { success: false, message: 'File template_spd.xlsx tidak ditemukan di folder public/templates/' },
        { status: 404 }
      );
    }

    const outputWorkbook = new ExcelJS.Workbook();

    for (let index = 0; index < listPegawai.length; index++) {
      const dataPegawai = listPegawai[index];

      // Membaca buffer per pegawai menggunakan copy dari template asli
      const templateWorkbook = new ExcelJS.Workbook();
      await templateWorkbook.xlsx.load(fileBuffer);

      const dataMapping = {
        '{nomor_spd}': dataPegawai.nomor_spd || '-',
        '{pengguna_anggaran}': dataPegawai.pengguna_anggaran || 'ARRIE HENDRAWAN MAHADHIEKA, S.H.',
        '{nama}': dataPegawai.nama || '-',
        '{nip}': dataPegawai.nip || '-',
        '{pangkat_gol}': dataPegawai.pangkat_gol || '-',
        '{jabatan}': dataPegawai.jabatan || '-',
        '{tingkat_biaya}': dataPegawai.tingkat_biaya || '-',
        '{maksud_penugasan}': dataPegawai.maksud_penugasan || '-',
        '{alat_angkutan}': dataPegawai.alat_angkutan || 'Angkutan Darat',
        '{tempat_berangkat}': dataPegawai.tempat_berangkat || 'Inspektorat Daerah Kab. Malang',
        '{tempat_tujuan}': dataPegawai.tempat_tujuan || '-',
        '{lama_hari}': dataPegawai.lama_hari || '1 (satu) hari',
        '{tgl_berangkat}': formatTanggalIndo(dataPegawai.tgl_berangkat),
        '{tgl_kembali}': formatTanggalIndo(dataPegawai.tgl_kembali),
        '{skpd}': dataPegawai.skpd || 'Inspektorat Daerah Kabupaten Malang',
        '{akun}': dataPegawai.akun || '-',
        '{keterangan_lain}': dataPegawai.keterangan_lain || '-',
        '{tgl_spd}': formatTanggalIndo(dataPegawai.tgl_spd || dataPegawai.tgl_berangkat),
        '{nip_pa}': dataPegawai.nip_pa || '198008012010011018'
      };

      // Terapkan data ke semua sheet
      templateWorkbook.worksheets.forEach((sheet, sheetIdx) => {
        sheet.eachRow({ includeEmpty: true }, (row) => {
          row.eachCell({ includeEmpty: true }, (cell) => {
            if (cell.value && typeof cell.value === 'string') {
              let text = cell.value;
              let isModified = false;
              
              Object.keys(dataMapping).forEach((tag) => {
                if (text.includes(tag)) {
                  text = text.split(tag).join(dataMapping[tag]); // Cara lebih aman dari replaceAll di bbrp Node.js
                  isModified = true;
                }
              });
              
              if (isModified) {
                cell.value = text;
              }
            }
          });
        });

        // Penamaan Sheet (agar jika ada pegawai dengan nama sama tidak error)
        const cleanNama = (dataPegawai.nama || `Pegawai_${index + 1}`).substring(0, 10).replace(/[^a-zA-Z0-9]/g, '');
        const sheetName = sheetIdx === 0 ? `Depan_${cleanNama}_${index}` : `Visum_${cleanNama}_${index}`;
        sheet.name = sheetName;
      });

      // Pindahkan sheet dari templateWorkbook ke outputWorkbook utama
      templateWorkbook.worksheets.forEach((sheet) => {
        const newSheet = outputWorkbook.addWorksheet(sheet.name);
        newSheet.model = sheet.model;
      });
    }

    // Tulis ke buffer output
    const outputBuffer = await outputWorkbook.xlsx.writeBuffer();
    
    // Tentukan nama file
    let namaFile = 'SPD.xlsx';
    if (listPegawai.length === 1 && listPegawai[0].nama) {
        namaFile = `SPD_${listPegawai[0].nama.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    } else {
        namaFile = `SPD_GABUNGAN_${listPegawai.length}_PEGAWAI.xlsx`;
    }

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${namaFile}"`,
      },
    });

  } catch (error) {
    console.error('API Error details:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal membuat file Excel.', detail: error.toString() },
      { status: 500 }
    );
  }
}
