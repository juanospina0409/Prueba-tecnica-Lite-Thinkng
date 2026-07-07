import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { Building2, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [user, setUser] = useState({ rol: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [formData, setFormData] = useState({ nit: '', nombre: '', direccion: '', telefono: '' });
  const [formError, setFormError] = useState('');

  const fetchEmpresas = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8000/api/empresas/', {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmpresas(data);
      } else {
        setError('Error al cargar la lista de empresas');
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
    fetchEmpresas();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ nit: '', nombre: '', direccion: '', telefono: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (emp) => {
    setModalMode('edit');
    setFormData({ nit: emp.nit, nombre: emp.nombre, direccion: emp.direccion, telefono: emp.telefono });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const token = localStorage.getItem('token');

    // Validaciones básicas requeridas por el Dominio
    if (formData.nombre.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres (Regla del Dominio)');
      return;
    }

    const url = modalMode === 'create'
      ? 'http://localhost:8000/api/empresas/'
      : `http://localhost:8000/api/empresas/${formData.nit}/`;

    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setIsModalOpen(false);
        fetchEmpresas();

        // Registrar transacción en el Ledger de Auditoría (Blockchain)
        try {
          await fetch('http://localhost:8001/api/micro/blockchain/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: modalMode === 'create' ? 'CREAR_EMPRESA' : 'EDITAR_EMPRESA',
              details: `Empresa con NIT ${formData.nit} y Nombre '${formData.nombre}'`
            })
          });
        } catch (bcErr) {
          console.error('Error logging to blockchain ledger:', bcErr);
        }
      } else {
        // Mostrar errores detallados devueltos por la validación Pydantic del Dominio
        if (data.error && data.detalles) {
          const detailMsg = data.detalles.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', ');
          setFormError(`Dominio rechaza datos: ${detailMsg}`);
        } else {
          setFormError(data.error || 'Error al guardar la empresa. Verifique que el NIT sea único.');
        }
      }
    } catch (err) {
      setFormError('Error de red al guardar la empresa');
    }
  };

  const handleDelete = async (nit, nombre) => {
    if (!confirm(`¿Está seguro de que desea eliminar la empresa ${nombre}? Se eliminarán todos sus productos asociados.`)) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:8000/api/empresas/${nit}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Token ${token}` }
      });

      if (res.ok) {
        fetchEmpresas();

        // Registrar en Blockchain
        try {
          await fetch('http://localhost:8001/api/micro/blockchain/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ELIMINAR_EMPRESA',
              details: `Empresa con NIT ${nit} y Nombre '${nombre}'`
            })
          });
        } catch (bcErr) {
          console.error('Error logging deletion to blockchain:', bcErr);
        }
      } else {
        alert('Error al eliminar la empresa. Verifique sus permisos.');
      }
    } catch (err) {
      alert('Error de red al eliminar la empresa');
    }
  };

  const isAdm = user.rol === 'Administrador';

  return (
    <Layout>
      <Head>
        <title>Empresas - DataSoft Inventory</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="page-subtitle">Visualización y gestión de las empresas registradas</p>
        </div>
        {isAdm && (
          <button onClick={openCreateModal} className="btn btn-primary" style={{ width: 'auto' }}>
            <Plus size={18} />
            <span>Registrar Empresa</span>
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
      ) : empresas.length === 0 ? (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Building2 size={48} style={{ strokeWidth: 1, marginBottom: '1rem', color: 'var(--primary)' }} />
          <p>No hay empresas registradas en el sistema.</p>
          {isAdm && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Utiliza el botón de arriba para registrar una nueva.</p>}
        </div>
      ) : (
        <div className="table-container">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NIT</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  {isAdm && <th style={{ textAlign: 'right' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {empresas.map((emp) => (
                  <tr key={emp.nit}>
                    <td style={{ fontWeight: '700' }}>{emp.nit}</td>
                    <td style={{ color: 'var(--text-main)', fontWeight: '600' }}>{emp.nombre}</td>
                    <td>{emp.direccion}</td>
                    <td>{emp.telefono}</td>
                    {isAdm && (
                      <td style={{ textAlign: 'right' }}>
                        <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEditModal(emp)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.35rem 0.6rem' }}
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.nit, emp.nombre)}
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

      {/* Modal Formulario Empresa */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
                {modalMode === 'create' ? 'Registrar Nueva Empresa' : 'Editar Empresa'}
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
              <div className="form-group">
                <label className="form-label" htmlFor="nit">NIT (Identificador Único)</label>
                <input
                  id="nit"
                  name="nit"
                  type="text"
                  className="form-control"
                  value={formData.nit}
                  onChange={handleInputChange}
                  disabled={modalMode === 'edit'} // No editable al actualizar
                  placeholder="Ej: 900.123.456-1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="nombre">Nombre de la Empresa</label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: DataSoft Inventory S.A.S."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="direccion">Dirección</label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  className="form-control"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Calle 100 # 15-20"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label" htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  name="telefono"
                  type="text"
                  className="form-control"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: +57 300 123 4567"
                  required
                />
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
