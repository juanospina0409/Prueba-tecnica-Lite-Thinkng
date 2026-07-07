import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { ClipboardList, Download, Mail, Send, AlertCircle, CheckCircle2, Search } from 'lucide-react';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  
  // Email Form State
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // { type: 'success'|'error'|'simulated', msg: '' }

  const fetchProductos = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/productos/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      } else {
        setError('Error al obtener la información de inventario');
      }
    } catch (err) {
      setError('Error de conexión con el servidor backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  // Preparar productos para el microservicio
  const getProductDTOList = () => {
    return productos.map(p => ({
      codigo: p.codigo,
      nombre: p.nombre,
      caracteristicas: p.caracteristicas,
      precios: p.precios,
      empresa_nombre: p.empresa_detalle ? p.empresa_detalle.nombre : p.empresa
    }));
  };

  // REQUERIMIENTO d) Descargar Reporte PDF
  const handleDownloadPDF = async () => {
    if (productos.length === 0) return;
    
    try {
      const res = await fetch('http://localhost:8001/api/micro/pdf/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(getProductDTOList())
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_inventario_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert('Error al generar el PDF en el microservicio');
      }
    } catch (err) {
      alert('Error de red al conectar con el microservicio de PDF');
    }
  };

  // REQUERIMIENTO d) Enviar Reporte por Correo
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email || productos.length === 0) return;

    setEmailLoading(true);
    setEmailStatus(null);

    try {
      const res = await fetch('http://localhost:8001/api/micro/email/send-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          productos: getProductDTOList()
        })
      });

      const data = await res.json();

      if (res.ok) {
        setEmailStatus({
          type: data.status === 'simulated' ? 'simulated' : 'success',
          msg: data.message
        });
        setEmail('');
      } else {
        setEmailStatus({
          type: 'error',
          msg: data.detail || 'Error al enviar el correo'
        });
      }
    } catch (err) {
      setEmailStatus({
        type: 'error',
        msg: 'Error de red al conectar con el microservicio de correos'
      });
    } finally {
      setEmailLoading(false);
    }
  };

  // Filtrado de productos en tiempo real
  const filteredProductos = productos.filter(p => {
    const term = searchTerm.toLowerCase();
    const nombre = p.nombre.toLowerCase();
    const codigo = p.codigo.toLowerCase();
    const empresa = (p.empresa_detalle ? p.empresa_detalle.nombre : p.empresa).toLowerCase();
    return nombre.includes(term) || codigo.includes(term) || empresa.includes(term);
  });

  // Agrupar productos por empresa para mostrarlos estructuradamente
  const groupedProductos = filteredProductos.reduce((groups, prod) => {
    const empName = prod.empresa_detalle ? prod.empresa_detalle.nombre : prod.empresa;
    if (!groups[empName]) {
      groups[empName] = [];
    }
    groups[empName].push(prod);
    return groups;
  }, {});

  return (
    <Layout>
      <Head>
        <title>Inventario Consolidade - LiteInventory</title>
      </Head>

      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Inventario de Productos</h1>
          <p className="page-subtitle">Reporte consolidado de productos por empresa y exportación de datos</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={handleDownloadPDF} 
            className="btn btn-secondary" 
            style={{ width: 'auto' }}
            disabled={productos.length === 0}
          >
            <Download size={18} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Enviar por Correo Formulario */}
      <div style={{
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--border-color)',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={18} style={{ color: 'var(--primary)' }} />
          <span>Enviar Reporte por Correo Electrónico</span>
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Ingresa un correo electrónico y el microservicio generará el PDF actual y lo enviará vía SMTP o REST API.
        </p>

        {emailStatus && (
          <div className={`alert ${emailStatus.type === 'error' ? 'alert-danger' : 'alert-success'}`} style={{ padding: '0.75rem 1rem' }}>
            {emailStatus.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span style={{ fontSize: '0.85rem' }}>{emailStatus.msg}</span>
          </div>
        )}

        <form onSubmit={handleSendEmail} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="email"
            className="form-control"
            style={{ flex: 1, minWidth: '250px' }}
            placeholder="correo-destino@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={productos.length === 0 || emailLoading}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: 'auto' }}
            disabled={productos.length === 0 || emailLoading}
          >
            <Send size={16} />
            <span>{emailLoading ? 'Enviando...' : 'Enviar Reporte'}</span>
          </button>
        </form>
      </div>

      {/* Buscador */}
      <div className="search-wrapper">
        <Search size={18} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por producto, código o empresa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={productos.length === 0}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando inventario...</div>
      ) : productos.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <ClipboardList size={48} style={{ strokeWidth: 1, marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>No hay inventario registrado en este momento.</p>
        </div>
      ) : Object.keys(groupedProductos).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No se encontraron resultados para la búsqueda "{searchTerm}".
        </div>
      ) : (
        <div>
          {Object.entries(groupedProductos).map(([empresa, prods]) => (
            <div key={empresa} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '18px',
                  backgroundColor: 'var(--primary)',
                  borderRadius: '2px'
                }} />
                <span>{empresa}</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: 'var(--text-muted)',
                  marginLeft: '0.5rem'
                }}>
                  ({prods.length} {prods.length === 1 ? 'producto' : 'productos'})
                </span>
              </h2>

              <div className="table-container">
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '150px' }}>Código</th>
                        <th style={{ width: '250px' }}>Nombre de Producto</th>
                        <th>Características</th>
                        <th style={{ width: '300px' }}>Precios</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prods.map((prod) => (
                        <tr key={prod.id}>
                          <td style={{ fontWeight: '700' }}>{prod.codigo}</td>
                          <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{prod.nombre}</td>
                          <td>{prod.caracteristicas}</td>
                          <td>
                            {Object.entries(prod.precios).map(([moneda, valor]) => (
                              <span key={moneda} className="price-badge">
                                {moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$'} {valor.toLocaleString()} {moneda}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
