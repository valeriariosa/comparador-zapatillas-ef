import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Search, ExternalLink, Clock, Tag, Store } from 'lucide-react';
import { buscarConBM25, type Zapatilla } from './lib/bm25';

export function App() {
  const [productos, setProductos] = useState<Zapatilla[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarExcel() {
      try {
        const resp = await fetch(`/zapatillas.xlsx?t=${Date.now()}`);
        if (!resp.ok) throw new Error('No se pudo cargar zapatillas.xlsx');
        const buffer = await resp.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const hoja = workbook.Sheets[workbook.SheetNames[0]];
        const filasRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja);
        const filas = filasRaw.map((r) => ({
          ...r,
          Precio: Number(r.Precio ?? r.Precio_Oferta_PEN ?? r.Precio_Lista_PEN ?? 0),
          Moneda: String(r.Moneda ?? 'PEN'),
          'Fecha de scrapeo': String(r['Fecha de scrapeo'] ?? r.Fecha_Extraccion ?? 'Sin registro'),
        })) as unknown as Zapatilla[];
        setProductos(filas);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error leyendo Excel');
      } finally {
        setCargando(false);
      }
    }
    cargarExcel();
  }, []);

  const resultados = useMemo(
    () => buscarConBM25(productos, busqueda),
    [productos, busqueda]
  );

  const ultimaFecha = productos[0]?.['Fecha de scrapeo'] || 'Sin registro';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Comparador de Precios de Zapatillas (BM25)</h1>
        <p style={{ color: '#4b5563', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={16} /> Último scrapeo registrado: <strong>{ultimaFecha}</strong> · Total catálogo: <strong>{productos.length} productos</strong>
        </p>
      </header>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={20} style={{ position: 'absolute', left: 14, top: 14, color: '#6b7280' }} />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar zapatillas por marca o modelo (ej. nike running hombre, zapatillas atletico)..."
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
            fontSize: '1rem',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {cargando && <p>Cargando catálogo desde zapatillas.xlsx...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!cargando && !error && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem' }}>Tienda</th>
                <th style={{ padding: '0.75rem' }}>Marca</th>
                <th style={{ padding: '0.75rem' }}>Modelo</th>
                <th style={{ padding: '0.75rem' }}>Precio</th>
                {busqueda.trim() && <th style={{ padding: '0.75rem' }}>Score BM25</th>}
                <th style={{ padding: '0.75rem' }}>Enlace</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Store size={15} /> {item.Tienda}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Tag size={14} /> {item.Marca}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>{item.Modelo}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 700, color: '#059669' }}>
                    {item.Moneda || 'PEN'} {Number(item.Precio).toFixed(2)}
                  </td>
                  {busqueda.trim() && (
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>
                      {item.score.toFixed(4)}
                    </td>
                  )}
                  <td style={{ padding: '0.75rem' }}>
                    <a
                      href={item.URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Ver tienda <ExternalLink size={14} />
                    </a>
                  </td>
                </tr>
              ))}
              {resultados.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: '#6b7280' }}>
                    No se encontraron zapatillas que coincidan con "{busqueda}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
