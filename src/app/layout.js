export const metadata = {
  title: 'Generator Naskah Dinas',
  description: 'Aplikasi Pembuat Surat Otomatis',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, backgroundColor: '#f4f6f8' }}>{children}</body>
    </html>
  );
}
