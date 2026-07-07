import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { Box, Plus, Edit2, Trash2, X, AlertCircle, Sparkles, Wand2 } from 'lucide-react';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [user, setUser] = useState({ rol: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formError, setFormError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    id: null,
    codigo: '',
    nombre: '',
    caracteristicas: '',
    empresa: '',
    precioUSD: '',
    precioCOP: '',
    precioEUR: ''
  });

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Token ${token}` };

    try {
      const [resProd, resEmp] = await Promise.all([
        fetch('http://localhost:8000/api/productos/', { headers }),
        fetch('http://localhost:8000/api/empresas/', { headers })
      ]);

      if (resProd.ok && resEmp.ok) {
        const prodData = await resProd.json();
        const empData = await resEmp.json();
        setProductos(prodData);
        setEmpresas(empData);
      } else {
        setError('Error al obtener los datos del servidor');
      }
    } catch (err) {
      setError('Error de conexión con el backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    fetchData();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      id: null,
      codigo: '',
      nombre: '',
      caracteristicas: '',
      empresa: empresas.length > 0 ? empresas[0].nit : '',
      precioUSD: '',
      precioCOP: '',
      precioEUR: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (prod) => {
    setModalMode('edit');
    setFormData({
      id: prod.id,
      codigo: prod.codigo,
      nombre: prod.nombre,
      caracteristicas: prod.caracteristicas,
      empresa: prod.empresa,
      precioUSD: prod.precios.USD || '',
      precioCOP: prod.precios.COP || '',
      precioEUR: prod.precios.EUR || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // REQUERIMIENTO g) Asistente de Optimización de Características con IA
  const handleAISuggest = async () => {
    if (!formData.nombre) {
      setFormError('Escriba el nombre del producto primero para guiar al asistente de IA');
      return;
    }
    setAiLoading(true);
    setFormError('');
    try {
      const res = await fetch('http://localhost:8001/api/micro/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          caracteristicas: formData.caracteristicas || 'Ninguna características especificada'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, caracteristicas: data.suggested }));
      } else {
        setFormError('No se pudo obtener sugerencia de la IA.');
      }
    } catch (err) {
      setFormError('Error de red al conectar con el microservicio de IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const token = localStorage.getItem('token');

    if (!formData.empresa) {
      setFormError('Debe asociar el producto a una empresa. Registre una empresa primero si no hay.');
      return;
    }

    // Estructurar el diccionario de precios
    const precios = {};
    if (formData.precioUSD) precios.USD = parseFloat(formData.precioUSD);
    if (formData.precioCOP) precios.COP = parseFloat(formData.precioCOP);
    if (formData.precioEUR) precios.EUR = parseFloat(formData.precioEUR);

    if (Object.keys(precios).length === 0) {
      setFormError('Debe ingresar al menos un precio en alguna moneda');
      return;
    }

    const payload = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      caracteristicas: formData.caracteristicas,
      empresa: formData.empresa,
      precios
    };

    const url = modalMode === 'create'
      ? 'http://localhost:8000/api/productos/'
      : `http://localhost:8000/api/productos/${formData.id}/`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();

        // Registrar en Blockchain
        try {
          await fetch('http://localhost:8001/api/micro/blockchain/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: modalMode === 'create' ? 'CREAR_PRODUCTO' : 'EDITAR_PRODUCTO',
              details: `Producto Código ${formData.codigo}, Nombre '${formData.nombre}', Empresa NIT ${formData.empresa}`
            })
          });
        } catch (bcErr) {
          console.error(bcErr);
        }
      } else {
        const data = await res.json();
        setFormError(data.error || 'Error al guardar el producto. Verifique que el código sea único.');
      }
    } catch (err) {
      setFormError('Error de red al guardar el producto');
    }
  };

  const handleDelete = async (id, codigo, nombre) => {
    if (!confirm(`¿Está seguro de que desea eliminar el producto ${nombre} (${codigo})?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/productos/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (res.ok) {
        fetchData();

        // Registrar en Blockchain
        try {
          await fetch('http://localhost:8001/api/micro/blockchain/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ELIMINAR_PRODUCTO',
              details: `Producto Código ${codigo}, Nombre '${nombre}'`
            })
          });
        } catch (bcErr) {
          console.error(bcErr);
        }
      } else {
        alert('Error al eliminar el producto.');
      }
    } catch (err) {
      alert('Error de red al eliminar el producto');
    }
  };

  const isAdm = user.rol === 'Administrador';

  return (
    <Layout>
      <Head>
        <title>Productos - DataSoft Inventory</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Productos</h1>
          <p className="page-subtitle">Visualización y gestión del catálogo global de productos</p>
        </div>
        {isAdm && (
          <button onClick={openCreateModal} className="btn btn-primary" style={{ width: 'auto' }}>
            <Plus size={18} />
            <span>Registrar Producto</span>
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando listado...</div>
      ) : productos.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Box size={48} style={{ strokeWidth: 1, marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>No hay productos registrados en el catálogo.</p>
          {isAdm && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Utiliza el botón de arriba para registrar uno nuevo.</p>}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Empresa</th>
                  <th>Características</th>
                  <th>Precios</th>
                  {isAdm && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: '700' }}>{prod.codigo}</td>
                    <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{prod.nombre}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '500' }}>
                      {prod.empresa_detalle ? prod.empresa_detalle.nombre : prod.empresa}
                    </td>
                    <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={prod.caracteristicas}>
                      {prod.caracteristicas}
                    </td>
                    <td>
                      {Object.entries(prod.precios).map(([moneda, valor]) => (
                        <span key={moneda} className="price-badge">
                          {moneda === 'USD' ? '$' : moneda === 'EUR' ? '€' : '$'} {valor.toLocaleString()} {moneda}
                        </span>
                      ))}
                    </td>
                    {isAdm && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(prod)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.codigo, prod.nombre)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Formulario Producto */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {modalMode === 'create' ? 'Registrar Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ padding: '0.75rem 1rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="codigo">Código Único</label>
                  <input
                    id="codigo"
                    name="codigo"
                    type="text"
                    className="form-control"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    placeholder="Ej: PROD-001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="nombre">Nombre del Producto</label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    className="form-control"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Laptop Gamer X"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="empresa">Empresa Propietaria</label>
                <select
                  id="empresa"
                  name="empresa"
                  className="form-control"
                  value={formData.empresa}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>Seleccione una empresa</option>
                  {empresas.map((emp) => (
                    <option key={emp.nit} value={emp.nit}>
                      {emp.nombre} (NIT: {emp.nit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" htmlFor="caracteristicas" style={{ marginBottom: 0 }}>Características</label>
                  <button
                    type="button"
                    onClick={handleAISuggest}
                    className="btn btn-outline btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.2rem 0.6rem',
                      borderColor: 'var(--primary)',
                      color: 'var(--text-main)',
                      fontSize: '0.75rem',
                      background: 'rgba(99, 102, 241, 0.1)'
                    }}
                    disabled={aiLoading}
                  >
                    <Sparkles size={12} style={{ color: 'var(--primary)' }} />
                    <span>{aiLoading ? 'Generando...' : 'Optimizar con IA'}</span>
                  </button>
                </div>
                <textarea
                  id="caracteristicas"
                  name="caracteristicas"
                  className="form-control"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={formData.caracteristicas}
                  onChange={handleInputChange}
                  placeholder="Ej: Memoria RAM de 16GB, Procesador Intel i7..."
                  required
                />
              </div>

              <label className="form-label">Precios por Moneda (Mínimo uno)</label>
              <div className="form-row" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }} htmlFor="precioUSD">Precio en USD ($)</label>
                  <input
                    id="precioUSD"
                    name="precioUSD"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.precioUSD}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }} htmlFor="precioCOP">Precio en COP ($)</label>
                  <input
                    id="precioCOP"
                    name="precioCOP"
                    type="number"
                    className="form-control"
                    value={formData.precioCOP}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }} htmlFor="precioEUR">Precio en EUR (€)</label>
                  <input
                    id="precioEUR"
                    name="precioEUR"
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.precioEUR}
                    onChange={handleInputChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === 'create' ? 'Registrar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
