'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const SUPABASE_URL = 'https://todwehphhdfqmibixcbz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_QN0KavM3e4dg1yjTE8nLnA_VvtqDaFa';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Cek akun ke tabel users di Supabase
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&password=eq.${encodeURIComponent(password)}&select=*`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          // Login Berhasil
          const user = data[0];
          localStorage.setItem('user_session', JSON.stringify({
            id: user.id,
            username: user.username,
            nama_lengkap: user.nama_lengkap,
            role: user.role
          }));
          
          router.push('/dashboard');
        } else {
          setErrorMsg('Username atau password salah!');
        }
      } else {
        setErrorMsg('Gagal terhubung ke database.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7fafc', fontFamily: 'sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#1a202c', fontSize: '20px' }}>Sistem Naskah Dinas</h2>
          <p style={{ margin: '4px 0 0 0', color: '#718096', fontSize: '13px' }}>Inspektorat Daerah Kabupaten Malang</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fed7d7', color: '#9b2c2c', padding: '10px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '4px' }}>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="Masukkan username" 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#4a5568', marginBottom: '4px' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Masukkan password" 
              required 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ backgroundColor: '#2b6cb0', color: '#fff', padding: '12px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', marginTop: '8px' }}
          >
            {loading ? 'Memeriksa Akun...' : 'Masuk Aplikasi'}
          </button>
        </form>

      </div>
    </div>
  );
}
