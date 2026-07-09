import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Building2, Box, ArrowRight, ClipboardList, ShieldAlert, Cpu } from 'lucide-react';

const DJANGO_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend-django-3dq5.onrender.com';

export default function Home() {
  const [stats, setStats] = useState({ empresas: 0, productos: 0 });
  const [user, setUser] = useState({ correo: '', rol: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar datos de usuario
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Cargar estadísticas
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Token ${token}` };

      try {
        const [resEmp, resProd] = await Promise.all([
          fetch(`${DJANGO_URL}/api/empresas/`, { headers }),
          fetch(`${DJANGO_URL}/api/productos/`, { headers })
        ]);

        if (resEmp.ok && resProd.ok) {
          const emps = await resEmp.json();
          const prods = await resProd.json();
          setStats({
            empresas: emps.length,
            productos: prods.length
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Dashboard - DataSoft Inventory</title>
      </Head>

      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Bienvenido de nuevo a tu panel de control de inventario</p>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-color)',
        borderRadius: '1.25rem',
        padding: '2rem',
        marginBottom: '2.5rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>
          Hola, <span style={{ color: 'var(--primary)' }}>{user.correo}</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Tu nivel de acceso actual es <span className={`role-badge ${user.rol === 'Administrador' ? 'admin' : 'externo'}`} style={{ display: 'inline-block', float: 'none', margin: '0 0.25rem' }}>{user.rol}</span>.
          {user.rol === 'Administrador'
            ? ' Tienes control total sobre el inventario, incluyendo el registro, edición y eliminación de empresas y productos.'
            : ' Puedes navegar y visualizar la información del inventario de empresas como visitante.'}
        </p>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-info">
            <h3>Empresas</h3>
            <p>{loading ? '...' : stats.empresas}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <Box size={24} />
          </div>
          <div className="stat-info">
            <h3>Productos</h3>
            <p>{loading ? '...' : stats.productos}</p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem' }}>Acciones Rápidas</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem'
      }}>
        <Link href="/empresas" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
            className="quick-action-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'none';
            }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Ver Empresas</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lista de socios y proveedores</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--primary)' }} />
          </div>
        </Link>

        <Link href="/productos" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
            className="quick-action-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'none';
            }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Ver Productos</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Administrar el catálogo de productos</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--primary)' }} />
          </div>
        </Link>

        <Link href="/inventario" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
            className="quick-action-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'none';
            }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Reporte de Inventario</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Exportación de PDF y envío de emails</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--primary)' }} />
          </div>
        </Link>

        <Link href="/copiloto" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '1rem',
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'var(--transition)'
          }}
            className="quick-action-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'none';
            }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.25rem' }}>Copiloto IA & Ledger</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verificar Blockchain y sugerir con IA</p>
            </div>
            <ArrowRight size={20} style={{ color: 'var(--primary)' }} />
          </div>
        </Link>
      </div>
    </Layout>
  );
}
