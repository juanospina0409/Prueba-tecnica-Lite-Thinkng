import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { Cpu, ShieldCheck, ShieldAlert, Sparkles, RefreshCw, Layers } from 'lucide-react';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'https://microservice-fastapi.onrender.com';

export default function Copiloto() {
  const [ledger, setLedger] = useState({ chain: [], is_valid: true, length: 0 });
  const [loadingLedger, setLoadingLedger] = useState(true);

  // AI Playground State
  const [aiName, setAiName] = useState('');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetchLedger = async () => {
    setLoadingLedger(true);
    try {
      const res = await fetch(`${FASTAPI_URL}/api/micro/blockchain/ledger`);
      if (res.ok) {
        const data = await res.json();
        setLedger(data);
      }
    } catch (err) {
      console.error('Error fetching blockchain ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleAISubmit = async (e) => {
    e.preventDefault();
    if (!aiName) return;

    setAiLoading(true);
    setAiResult('');

    try {
      const res = await fetch(`${FASTAPI_URL}/api/micro/ai/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: aiName,
          caracteristicas: aiFeatures || 'Sin especificar'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data.suggested);
      } else {
        setAiResult('Error al procesar la sugerencia');
      }
    } catch (err) {
      setAiResult('Error de conexión con el microservicio de IA');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>IA y Auditoría Blockchain - DataSoft Inventory</title>
      </Head>

      <div className="page-header">
        <div>
          <h1 className="page-title">IA y Auditoría Blockchain</h1>
          <p className="page-subtitle">Funcionalidad novedosa integrada en el flujo del sistema (Requerimiento g)</p>
        </div>
      </div>

      <div className="copilot-section">
        {/* Lado Izquierdo: Playground de IA */}
        <div className="glow-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
            <span>Asistente Copiloto de IA</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Esta herramienta utiliza un modelo de Lenguaje de Inteligencia Artificial para optimizar descripciones.
            Está integrado en el botón <strong>"Optimizar con IA"</strong> del formulario de registro de productos,
            pero puedes probarlo de manera independiente en este laboratorio:
          </p>

          <form onSubmit={handleAISubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="aiName">Nombre de Producto Ejemplo</label>
              <input
                id="aiName"
                type="text"
                className="form-control"
                placeholder="Ej: Teclado Mecánico RGB Pro"
                value={aiName}
                onChange={(e) => setAiName(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="aiFeatures">Características en bruto</label>
              <textarea
                id="aiFeatures"
                className="form-control"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Ej: switches cherry brown, bateria recargable, Bluetooth 5.1"
                value={aiFeatures}
                onChange={(e) => setAiFeatures(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: 'auto', alignSelf: 'flex-start' }} disabled={aiLoading}>
              <Cpu size={16} />
              <span>{aiLoading ? 'Procesando con IA...' : 'Generar Sugerencia'}</span>
            </button>
          </form>

          {aiResult && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.05)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              marginTop: '0.5rem'
            }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Descripción sugerida por la IA:
              </h4>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                {aiResult}
              </p>
            </div>
          )}
        </div>

        {/* Lado Derecho: Libro de Auditoría Criptográfica (Blockchain) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glow-card" style={{ borderTop: '3px solid var(--secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--secondary)' }} />
                <span>Auditoría Blockchain</span>
              </h2>
              <button
                onClick={fetchLedger}
                className="btn btn-outline btn-sm"
                style={{ width: 'auto', padding: '0.35rem 0.5rem' }}
                title="Sincronizar Ledger"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Cada acción de creación, edición o eliminación en la base de datos Django de Empresas o Productos
              registra una transacción inmutable en el microservicio FastAPI. Los bloques están enlazados criptográficamente mediante hashes SHA-256.
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: ledger.is_valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${ledger.is_valid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
              borderRadius: '0.75rem',
              color: ledger.is_valid ? '#34d399' : '#f87171',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              {ledger.is_valid ? (
                <>
                  <ShieldCheck size={20} />
                  <span>Cadena Integra & Verificada (100% Segura)</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={20} />
                  <span>¡Advertencia! Cadena corrupta o alterada.</span>
                </>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <span>Total Bloques: <strong>{ledger.length}</strong></span>
              <span>Estado: <strong>Operativo</strong></span>
            </div>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase' }}>
              Historial de Bloques
            </h3>

            {loadingLedger ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Cargando cadena...</div>
            ) : (
              <div className="blockchain-timeline">
                {ledger.chain.slice().reverse().map((block) => (
                  <div key={block.index} className={`blockchain-node ${block.index === 0 ? 'genesis' : ''}`}>
                    <div className="node-header">
                      <span className="node-title" style={{ color: block.index === 0 ? 'var(--primary)' : 'var(--secondary)' }}>
                        Bloque #{block.index}: {block.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(block.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span className="form-label" style={{ display: 'inline', fontSize: '0.75rem', marginRight: '0.5rem' }}>Detalle:</span>
                      <span className="node-body" style={{ color: 'var(--text-main)' }}>{block.details}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                      <div>
                        <span className="form-label" style={{ display: 'inline', fontSize: '0.75rem', marginRight: '0.5rem' }}>Hash:</span>
                        <span className="node-hash">{block.hash.substring(0, 16)}...</span>
                      </div>
                      {block.index > 0 && (
                        <div>
                          <span className="form-label" style={{ display: 'inline', fontSize: '0.75rem', marginRight: '0.5rem' }}>Prev Hash:</span>
                          <span className="node-hash">{block.previous_hash.substring(0, 16)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
