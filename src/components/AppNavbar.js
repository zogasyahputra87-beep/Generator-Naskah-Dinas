'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AppNavbar({ title = "Portal Penugasan" }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* OVERLAY SEMBUNYI SAAT SIDEBAR BUKA */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* SIDEBAR TUNGGAL COLLAPSIBLE (TERSEMBUNYI OTOMATIS) */}
      <aside style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        width: '280px',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        zIndex: 100,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 18px',
        boxShadow: isOpen ? '8px 0 24px rgba(0,0,0,0.2)' : 'none',
        boxSizing: 'border-box'
      }}>
        {/* HEADER SIDEBAR */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', color: '#fff' }}>
              🏛️
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '14px', color: '#fff', letterSpacing: '-0.3px' }}>INSPEKTORAT</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', letterSpacing: '0.5px' }}>KABUPATEN MALANG</div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* MENU UTAMA */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link 
            href="/dashboard" 
            onClick={() => setIsOpen(false)} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', backgroundColor: '#1e293b', color: '#818cf8', fontWeight: '700', textDecoration: 'none', fontSize: '14px' }}
          >
            <span>📊</span> Dashboard Utama
          </Link>
          <Link 
            href="/penugasan/baru" 
            onClick={() => setIsOpen(false)} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', color: '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}
          >
            <span>➕</span> Buat Penugasan Baru
          </Link>
        </nav>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '16px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
          SIM-PENUGASAN v2.0
        </div>
      </aside>

      {/* TOP NAVBAR */}
      <header style={{ height: '64px', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 40, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setIsOpen(true)}
            style={{ border: 'none', backgroundColor: '#f1f5f9', color: '#1e293b', fontSize: '14px', cursor: 'pointer', padding: '8px 14px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>☰</span> Menu
          </button>
          <span style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{title}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Tim Pengawasan</span>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
            TP
          </div>
        </div>
      </header>
    </>
  );
}
