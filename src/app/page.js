'use client';
import { useState } from 'react';

export default function HomePage() {
  // Penomoran Surat
  const [klasifikasi, setKlasifikasi] = useState('700.1.2');
  const [nomorUrut, setNomorUrut] = useState('');
  const kodeOPD = '35.07.200';
  
  const today = new Date().toISOString().split('T')[0];
  const [tanggal, setTanggal] = useState(today);
  const tahun = tanggal ? new Date(tanggal).getFullYear() : new Date().getFullYear();

  const nomorSuratLengkap = `${klasifikasi}/${nomorUrut || '...'}/${kodeOPD}/${tahun}`;
  const [penugasan, setPenugasan] = useState('');

  // Dynamic Lists
  const [dasarList, setDasarList] = useState([{ no: '1', isi_dasar: '' }]);
  const [pegawaiList, setPegawaiList] = useState([
    { no: '1', nama: '', nip: '', pangkat_gol: '', jabatan: '' }
  ]);
  const [tampilkanParaf, setTampilkanParaf] = useState(true);
  const [parafList, setParafList] = useState([
    { jabatan_paraf: 'Plt. Sekretaris' },
    { jabatan_paraf: 'Inspektur Pembantu Wilayah I' },
    { jabatan_paraf: 'Auditor Ahli Madya' }
  ]);

  // State Modal Preview
  const [showPreview, setShowPreview] = useState(false);

  // Handlers Dasar Hukum & Pegawai
  const handleDasarChange = (index, value) => {
    const updated = [...dasarList];
    updated[index].isi_dasar = value;
    setDasarList(updated);
  };
  const tambahDasar = () => setDasarList([...dasarList, { no: String(dasarList.length + 1), isi_dasar: '' }]);
  const hapusDasar = (index) => {
    setDasarList(dasarList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => setPegawaiList([...pegawaiList, { no: String(pegawaiList.length + 1), nama: '', nip: '', pangkat_gol: '', jabatan: '' }]);
  const hapusPegawai = (index) => {
    setPegawaiList(pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  const handleParafChange = (index, value) => {
    const updated = [...parafList];
    updated[index].jabatan_paraf = value;
    setParafList(updated);
  };

  // Unduh File Word (.docx)
  const handleDownloadDocx = async () => {
    const payload = {
      nomor_surat: nomorSuratLengkap,
      dasar_list: dasarList,
      pegawai_list: pegawaiList,
      penugasan: penugasan,
      tanggal: tanggal,
      tampilkan_paraf: tampilkanParaf,
      paraf_list: parafList
    };

    const response = await fetch('/api/generate-surat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Surat_Tugas_${nomorSuratLengkap.replace(/[\/\s]+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      alert('Gagal mengunduh file Word.');
    }
  };

  // Fungsi Cetak Langsung
  const handlePrint = () => {
    window.print();
  };

  // Helper Format Tanggal Indonesia
  const formatTanggalIndo = (str) => {
    if (!str) return '-';
    const date = new Date(str);
    return isNaN(date.getTime()) ? str : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <main style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* AREA FORMULIR INPUT */}
      <div className="no-print" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Pembuat Surat Tugas Otomatis</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Penomoran Surat */}
          <div style={{ border: '1px solid #0066cc', padding: '15px', borderRadius: '6px', backgroundColor: '#f0f7ff' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Penomoran Surat:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '13px' }}>Kode Klasifikasi</label>
                <select value={klasifikasi} onChange={(e) => setKlasifikasi(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                  <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px' }}>Nomor Urut Surat</label>
                <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 015" required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px' }}>Kode OPD</label>
                <input type="text" value={kodeOPD} disabled style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9ecef', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px' }}>Tanggal Surat</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '6px', backgroundColor: '#fff', border: '1px dashed #0066cc', borderRadius: '4px', textAlign: 'center' }}>
              Preview Nomor: <strong>{nomorSuratLengkap}</strong>
            </div>
          </div>

          {/* Section Dasar Hukum */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Dasar Hukum:</label>
            {dasarList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span>{item.no}.</span>
                <input value={item.isi_dasar} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px' }} />
                {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red' }}>Hapus</button>}
              </div>
            ))}
            <button type="button" onClick={tambahDasar}>+ Tambah Dasar Hukum</button>
          </div>

          {/* Section Pegawai */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Daftar Personil Yang Ditugaskan:</label>
            {pegawaiList.map((item, index) => (
              <div key={index} style={{ borderBottom: '1px dashed #ccc', paddingBottom: '12px', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Pegawai Ke-{item.no}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input value={item.nama} onChange={(e) => handlePegawaiChange(index, 'nama', e.target.value)} placeholder="Nama Lengkap" required style={{ padding: '8px' }} />
                  <input value={item.nip} onChange={(e) => handlePegawaiChange(index, 'nip', e.target.value)} placeholder="NIP" required style={{ padding: '8px' }} />
                  <input value={item.pangkat_gol} onChange={(e) => handlePegawaiChange(index, 'pangkat_gol', e.target.value)} placeholder="Pangkat/Gol" required style={{ padding: '8px' }} />
                  <input value={item.jabatan} onChange={(e) => handlePegawaiChange(index, 'jabatan', e.target.value)} placeholder="Jabatan" required style={{ padding: '8px' }} />
                </div>
              </div>
            ))}
            <button type="button" onClick={tambahPegawai}>+ Tambah Personil</button>
          </div>

          {/* Maksud Penugasan */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Untuk (Maksud Penugasan):</label>
            <textarea value={penugasan} onChange={(e) => setPenugasan(e.target.value)} rows="3" required style={{ width: '100%', padding: '8px' }} />
          </div>

          {/* Paraf Hierarki */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <input type="checkbox" checked={tampilkanParaf} onChange={(e) => setTampilkanParaf(e.target.checked)} />
              Cetak Tabel Paraf Hierarki
            </label>
            {tampilkanParaf && (
              <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                {parafList.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input value={item.jabatan_paraf} onChange={(e) => handleParafChange(index, e.target.value)} style={{ flex: 1, padding: '6px' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, backgroundColor: '#28a745', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              👁️ Preview & Print
            </button>
            <button type="button" onClick={handleDownloadDocx} style={{ flex: 1, backgroundColor: '#0066cc', color: 'white', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              📥 Unduh Word (.docx)
            </button>
          </div>

        </form>
      </div>

      {/* MODAL / TAMPILAN PREVIEW DOKUMEN SIAP PRINT */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', width: '90%', maxWidth: '800px', height: '90vh', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Header Modal */}
            <div className="no-print" style={{ padding: '15px', backgroundColor: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Pratinjau Surat Tugas</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handlePrint} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🖨️ Cetak / Print
                </button>
                <button onClick={handleDownloadDocx} style={{ backgroundColor: '#0066cc', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  📥 Unduh .docx
                </button>
                <button onClick={() => setShowPreview(false)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Isi Kertas Surat (Preview A4) */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#fff', color: '#000', fontFamily: 'Times New Roman, serif', fontSize: '12pt', lineHeight: '1.4' }}>
              
              {/* Kop Surat */}
              <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '10px', marginBottom: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</h4>
                <h3 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</h3>
                <p style={{ margin: 0, fontSize: '9pt' }}>Jalan Raya Mondoroko 178 Singosari, Kabupaten Malang, Jawa Timur</p>
              </div>

              {/* Judul & Nomor */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <u style={{ fontWeight: 'bold', fontSize: '14pt' }}>SURAT TUGAS</u><br />
                NOMOR: {nomorSuratLengkap}
              </div>

              {/* Tabel Dasar Hukum */}
              <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '70px', verticalAlign: 'top' }}>Dasar</td>
                    <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                    <td style={{ verticalAlign: 'top' }}>
                      {dasarList.map((d, i) => (
                        <div key={i} style={{ display: 'flex', marginBottom: '4px' }}>
                          <span style={{ width: '25px' }}>{i + 1}.</span>
                          <span style={{ flex: 1 }}>{d.isi_dasar}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: '6px' }}>, dengan ini:</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '15px 0' }}>MEMERINTAHKAN:</div>

              {/* Tabel Pegawai */}
              <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '70px', verticalAlign: 'top' }}>Kepada</td>
                    <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                    <td style={{ verticalAlign: 'top' }}>
                      {pegawaiList.map((p, i) => (
                        <div key={i} style={{ marginBottom: '10px' }}>
                          <table style={{ width: '100%' }}>
                            <tbody>
                              <tr>
                                <td style={{ width: '25px', verticalAlign: 'top' }}>{i + 1}.</td>
                                <td style={{ width: '110px' }}>Nama</td>
                                <td>: {p.nama}</td>
                              </tr>
                              <tr>
                                <td></td>
                                <td>NIP</td>
                                <td>: {p.nip}</td>
                              </tr>
                              <tr>
                                <td></td>
                                <td>Pangkat/Gol</td>
                                <td>: {p.pangkat_gol}</td>
                              </tr>
                              <tr>
                                <td></td>
                                <td>Jabatan</td>
                                <td>: {p.jabatan}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Maksud Penugasan */}
              <table style={{ width: '100%', marginBottom: '20px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '70px', verticalAlign: 'top' }}>Untuk</td>
                    <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                    <td style={{ verticalAlign: 'top' }}>{penugasan}</td>
                  </tr>
                </tbody>
              </table>

              <p style={{ textIndent: '30px', textAlign: 'justify' }}>
                Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
              </p>
              <p style={{ textIndent: '30px', textAlign: 'justify' }}>
                Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan.
              </p>

              {/* Tanggal & Paraf / Tanda Tangan */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                
                {/* Paraf Hierarki */}
                <div>
                  {tampilkanParaf && (
                    <table style={{ border: '1px solid #000', borderCollapse: 'collapse', minWidth: '220px', fontSize: '10pt' }}>
                      <thead>
                        <tr>
                          <th colSpan="2" style={{ border: '1px solid #000', padding: '4px', textAlign: 'center' }}>PARAF HIERARKI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parafList.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #000', padding: '6px' }}>{item.jabatan_paraf}</td>
                            <td style={{ border: '1px solid #000', padding: '6px', width: '50px' }}></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Tanda Tangan */}
                <div style={{ textAlign: 'left', minWidth: '250px' }}>
                  Malang, {formatTanggalIndo(tanggal)}<br />
                  Plt. Inspektur Kabupaten Malang<br /><br /><br /><br />
                  <strong><u>Arrie Hendrawan Mahardhika, S.H.</u></strong><br />
                  Penata Tingkat I<br />
                  NIP. 198008012010011018
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* CSS Khusus Cetak (Sembunyikan Elemen Web saat Di-print) */}
      <style jsx global>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          main { max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
        }
      `}</style>
    </main>
  );
}
