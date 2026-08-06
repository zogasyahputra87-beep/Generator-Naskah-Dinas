'use client';
import { useState } from 'react';

export default function HomePage() {
  // Penomoran Surat Otomatis
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

  // Modal Preview
  const [showPreview, setShowPreview] = useState(false);

  // Handlers Dasar Hukum
  const handleDasarChange = (index, value) => {
    const updated = [...dasarList];
    updated[index].isi_dasar = value;
    setDasarList(updated);
  };
  const tambahDasar = () => setDasarList([...dasarList, { no: String(dasarList.length + 1), isi_dasar: '' }]);
  const hapusDasar = (index) => {
    setDasarList(dasarList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  // Handlers Pegawai
  const handlePegawaiChange = (index, field, value) => {
    const updated = [...pegawaiList];
    updated[index][field] = value;
    setPegawaiList(updated);
  };
  const tambahPegawai = () => setPegawaiList([...pegawaiList, { no: String(pegawaiList.length + 1), nama: '', nip: '', pangkat_gol: '', jabatan: '' }]);
  const hapusPegawai = (index) => {
    setPegawaiList(pegawaiList.filter((_, i) => i !== index).map((item, i) => ({ ...item, no: String(i + 1) })));
  };

  // Handlers Paraf
  const handleParafChange = (index, value) => {
    const updated = [...parafList];
    updated[index].jabatan_paraf = value;
    setParafList(updated);
  };
  const tambahParaf = () => setParafList([...parafList, { jabatan_paraf: '' }]);
  const hapusParaf = (index) => setParafList(parafList.filter((_, i) => i !== index));

  // Download Docx
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

  // Format Tanggal Indonesia
  const formatTanggalIndo = (str) => {
    if (!str) return '-';
    const date = new Date(str);
    return isNaN(date.getTime()) ? str : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <main style={{ maxWidth: '800px', margin: '30px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* FORMULIR INPUT */}
      <div className="no-print" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Pembuat Surat Tugas Otomatis</h2>
        
        <form onSubmit={(e) => { e.preventDefault(); setShowPreview(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Penomoran Surat */}
          <div style={{ border: '1px solid #0066cc', padding: '15px', borderRadius: '6px', backgroundColor: '#f0f7ff' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px', color: '#004080' }}>Penomoran Surat:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode Klasifikasi</label>
                <select value={klasifikasi} onChange={(e) => setKlasifikasi(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                  <option value="700.1.2">700.1.2 (Pengawasan/Audit)</option>
                  <option value="000.1.2.3">000.1.2.3 (Umum/Kedinasan)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Nomor Urut Surat</label>
                <input type="text" value={nomorUrut} onChange={(e) => setNomorUrut(e.target.value)} placeholder="Contoh: 015" required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Kode OPD (Otomatis)</label>
                <input type="text" value={kodeOPD} disabled style={{ width: '100%', padding: '8px', marginTop: '4px', backgroundColor: '#e9ecef', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Tanggal Surat</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: '10px', padding: '6px', backgroundColor: '#fff', border: '1px dashed #0066cc', borderRadius: '4px', textAlign: 'center' }}>
              Preview Nomor: <strong style={{ color: '#0066cc' }}>{nomorSuratLengkap}</strong>
            </div>
          </div>

          {/* Dasar Hukum */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Dasar Hukum:</label>
            {dasarList.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <span style={{ padding: '8px 0' }}>{item.no}.</span>
                <input value={item.isi_dasar} onChange={(e) => handleDasarChange(index, e.target.value)} placeholder="Isi dasar hukum..." required style={{ flex: 1, padding: '8px' }} />
                {dasarList.length > 1 && <button type="button" onClick={() => hapusDasar(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>}
              </div>
            ))}
            <button type="button" onClick={tambahDasar} style={{ padding: '6px 12px', cursor: 'pointer' }}>+ Tambah Dasar Hukum</button>
          </div>

          {/* Pegawai */}
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
                {pegawaiList.length > 1 && <button type="button" onClick={() => hapusPegawai(index)} style={{ color: 'red', marginTop: '8px', cursor: 'pointer' }}>Hapus Pegawai Ini</button>}
              </div>
            ))}
            <button type="button" onClick={tambahPegawai} style={{ padding: '6px 12px', cursor: 'pointer', backgroundColor: '#eef', border: '1px solid #99c' }}>+ Tambah Personil</button>
          </div>

          {/* Maksud Penugasan */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Untuk (Maksud Penugasan):</label>
            <textarea value={penugasan} onChange={(e) => setPenugasan(e.target.value)} rows="3" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
          </div>

          {/* Paraf Hierarki */}
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              <input type="checkbox" checked={tampilkanParaf} onChange={(e) => setTampilkanParaf(e.target.checked)} />
              Cetak Tabel Paraf Hierarki
            </label>
            {tampilkanParaf && (
              <div style={{ marginTop: '10px', paddingLeft: '20px' }}>
                {parafList.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                    <input value={item.jabatan_paraf} onChange={(e) => handleParafChange(index, e.target.value)} style={{ flex: 1, padding: '6px' }} />
                    <button type="button" onClick={() => hapusParaf(index)} style={{ color: 'red', cursor: 'pointer' }}>Hapus</button>
                  </div>
                ))}
                <button type="button" onClick={tambahParaf} style={{ marginTop: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Tambah Baris Paraf</button>
              </div>
            )}
          </div>

          {/* Tombol Aksi */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, backgroundColor: '#28a745', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              👁️ Preview & Print
            </button>
            <button type="button" onClick={handleDownloadDocx} style={{ flex: 1, backgroundColor: '#0066cc', color: 'white', padding: '14px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>
              📥 Unduh Word (.docx)
            </button>
          </div>

        </form>
      </div>

      {/* JENDELA PREVIEW A4 */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px 0' }}>
          
          <div className="no-print" style={{ width: '100%', maxWidth: '210mm', backgroundColor: '#222', color: '#fff', padding: '12px 20px', borderRadius: '8px 8px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box' }}>
            <span style={{ fontWeight: 'bold' }}>Pratinjau Lembar Kerja (A4)</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => window.print()} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
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

          <div className="print-area" style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#fff', padding: '20mm', boxSizing: 'border-box', fontFamily: 'Times New Roman, Times, serif', fontSize: '11pt', lineHeight: '1.3', color: '#000', boxShadow: '0 0 15px rgba(0,0,0,0.3)' }}>
            
            {/* Kop Surat */}
            <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13pt', fontWeight: 'bold' }}>PEMERINTAH KABUPATEN MALANG</div>
              <div style={{ fontSize: '15pt', fontWeight: 'bold' }}>INSPEKTORAT DAERAH</div>
              <div style={{ fontSize: '8.5pt' }}>Jalan Raya Mondoroko 178 Singosari, Kabupaten Malang, Jawa Timur</div>
              <div style={{ fontSize: '8.5pt' }}>Telepon/Faksimile (0341) 451905 Laman: inspektorat.malangkab.go.id</div>
              <div style={{ fontSize: '8.5pt' }}>Pos-el: inspektorat@malangkab.go.id, Kode Pos: 65153</div>
            </div>

            {/* Judul & Nomor */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '13pt' }}>SURAT TUGAS</div>
              <div>NOMOR: {nomorSuratLengkap}</div>
            </div>

            {/* Tabel Dasar Hukum */}
            <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Dasar</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {dasarList.map((d, i) => {
                          const isLast = i === dasarList.length - 1;
                          let teks = (d.isi_dasar || '').trim();
                          if (isLast && teks.length > 0) {
                            if (teks.endsWith('.')) teks = teks.slice(0, -1);
                            teks = `${teks}, dengan ini:`;
                          }
                          return (
                            <tr key={i}>
                              <td style={{ width: '20px', verticalAlign: 'top', paddingBottom: '4px' }}>{i + 1}.</td>
                              <td style={{ verticalAlign: 'top', paddingBottom: '4px', textAlign: 'justify' }}>{teks}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ textAlign: 'center', fontWeight: 'bold', margin: '14px 0' }}>MEMERINTAHKAN:</div>

            {/* Tabel Pegawai */}
            <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Kepada</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top' }}>
                    {pegawaiList.map((p, i) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '20px', verticalAlign: 'top' }}>{i + 1}.</td>
                              <td style={{ width: '100px', verticalAlign: 'top' }}>Nama</td>
                              <td style={{ verticalAlign: 'top' }}>: {p.nama}</td>
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
            <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse', verticalAlign: 'top' }}>
              <tbody>
                <tr>
                  <td style={{ width: '60px', verticalAlign: 'top' }}>Untuk</td>
                  <td style={{ width: '15px', verticalAlign: 'top' }}>:</td>
                  <td style={{ verticalAlign: 'top', textAlign: 'justify' }}>{penugasan}</td>
                </tr>
              </tbody>
            </table>

            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Sesuai prosedur, setelah melaksanakan kegiatan dimaksud agar melaporkan hasilnya kepada Plt. Inspektur Kabupaten Malang.
            </p>
            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Selanjutnya dalam upaya menjaga integritas, ASN Inspektorat Daerah dalam melaksanakan tugas tidak menerima Gratifikasi dan Suap serta tidak memungut biaya apapun atas pelayanan yang diberikan.
            </p>

            <p style={{ textIndent: '30px', textAlign: 'justify', margin: '8px 0' }}>
              Demikian Surat Tugas ini disampaikan kepada yang bersangkutan untuk dilaksanakan dengan penuh tanggung jawab.
            </p>

            {/* Bagian Bawah: Tanggal, Tanda Tangan & Paraf */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', pageBreakInside: 'avoid' }}>
              
              {/* Paraf Hierarki */}
              <div style={{ width: '45%' }}>
                {tampilkanParaf && (
                  <table style={{ border: '1px solid #000', borderCollapse: 'collapse', width: '100%', fontSize: '9.5pt' }}>
                    <thead>
                      <tr>
                        <th colSpan="2" style={{ border: '1px solid #000', padding: '3px', textAlign: 'center' }}>PARAF HIERARKI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parafList.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ border: '1px solid #000', padding: '4px' }}>{item.jabatan_paraf}</td>
                          <td style={{ border: '1px solid #000', padding: '4px', width: '45px' }}></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Tanda Tangan */}
              <div style={{ width: '50%', paddingLeft: '20px' }}>
                Malang, {formatTanggalIndo(tanggal)}<br />
                Plt. Inspektur Kabupaten Malang<br /><br /><br /><br /><br />
                <strong><u>Arrie Hendrawan Mahardhika, S.H.</u></strong><br />
                Penata Tingkat I<br />
                NIP 198008012010011018
              </div>

            </div>

          </div>
        </div>
      )}

      {/* CSS Cetak */}
      <style jsx global>{`
        @media print {
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          .print-area { 
            box-shadow: none !important; 
            padding: 0 !important; 
            width: 100% !important; 
          }
        }
      `}</style>
    </main>
  );
}
