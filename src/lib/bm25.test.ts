import { describe, it, expect } from 'vitest';
import { buscarConBM25, type Zapatilla } from './bm25';

const catalogoMock: Zapatilla[] = [
  {
    Tienda: 'Marathon',
    Marca: 'Nike',
    Modelo: 'Air Zoom Pegasus 40 Running Hombre',
    Precio: 499.9,
    Moneda: 'PEN',
    URL: 'https://marathon.store/1',
    'Fecha de scrapeo': '2026-11-23',
  },
  {
    Tienda: 'Triathlon',
    Marca: 'Adidas',
    Modelo: 'Ultraboost Light Urbano',
    Precio: 599.0,
    Moneda: 'PEN',
    URL: 'https://triathlon.com.pe/2',
    'Fecha de scrapeo': '2026-11-23',
  },
  {
    Tienda: 'Footloose',
    Marca: 'Atlético',
    Modelo: 'Zapatillas Atlético Deportivo Clásico',
    Precio: 149.9,
    Moneda: 'PEN',
    URL: 'https://footloose.pe/3',
    'Fecha de scrapeo': '2026-11-23',
  },
];

describe('Buscador BM25 de Zapatillas', () => {
  it('ordena correctamente por relevancia BM25 para consulta multicriterio', () => {
    const resultados = buscarConBM25(catalogoMock, 'nike running hombre');
    expect(resultados.length).toBeGreaterThan(0);
    expect(resultados[0].Marca).toBe('Nike');
    expect(resultados[0].Tienda).toBe('Marathon');
    expect(resultados[0].score).toBeGreaterThan(0);
  });

  it('ignora mayúsculas y tildes devolviendo exactamente el mismo orden', () => {
    const resMayusTilde = buscarConBM25(catalogoMock, 'ZAPATILLAS ATLÉTICO');
    const resMinusSinTilde = buscarConBM25(catalogoMock, 'zapatillas atletico');

    expect(resMayusTilde.length).toBe(resMinusSinTilde.length);
    expect(resMayusTilde.map((r) => r.Modelo)).toEqual(
      resMinusSinTilde.map((r) => r.Modelo)
    );
    expect(resMayusTilde[0].Marca).toBe('Atlético');
  });
});