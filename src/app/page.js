import { redirect } from 'next/navigation';

export default function RootPage() {
  // Otomatis mengarahkan pengunjung URL utama ke halaman login
  redirect('/login');
}
