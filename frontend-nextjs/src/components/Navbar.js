import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { LogOut, Box, Building2, ClipboardList, ShieldAlert, Cpu } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="brand">
          <Box size={22} className="brand-icon" style={{ stroke: '#6366f1' }} />
          <span>DataSoft Inventory</span>
        </Link>

        <div className="nav-links">
          <Link href="/" className={`nav-link ${router.pathname === '/' ? 'active' : ''}`}>
            Dashboard
          </Link>
          <Link href="/empresas" className={`nav-link ${router.pathname === '/empresas' ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Building2 size={16} /> Empresas
            </span>
          </Link>
          <Link href="/productos" className={`nav-link ${router.pathname === '/productos' ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Box size={16} /> Productos
            </span>
          </Link>
          <Link href="/inventario" className={`nav-link ${router.pathname === '/inventario' ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <ClipboardList size={16} /> Inventario
            </span>
          </Link>
          <Link href="/copiloto" className={`nav-link ${router.pathname === '/copiloto' ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Cpu size={16} /> IA & Auditoría
            </span>
          </Link>
        </div>

        <div className="user-profile">
          <span className={`role-badge ${user.rol === 'Administrador' ? 'admin' : 'externo'}`}>
            {user.rol}
          </span>
          <span style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500' }}>
            {user.correo}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto', padding: '0.4rem 0.6rem' }}
            title="Cerrar Sesión"
          >
            <LogOut size={15} />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
