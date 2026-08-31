export const metadata = {
  title: 'SIM-PENUGASAN - Inspektorat Kabupaten Malang',
  description: 'Portal Layanan Penugasan, Perjalanan Dinas & Audit Internal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}
