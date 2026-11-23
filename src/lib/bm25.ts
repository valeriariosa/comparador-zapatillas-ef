export interface Zapatilla {
  Tienda: string;
  Marca: string;
  Modelo: string;
  Precio: number;
  Moneda: string;
  URL: string;
  'Fecha de scrapeo': string;
}

export interface ResultadoBM25 extends Zapatilla {
  score: number;
}

export function normalizarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function tokenizar(texto: string): string[] {
  const limpio = normalizarTexto(texto);
  return limpio ? limpio.split(/\s+/) : [];
}

export function buscarConBM25(
  productos: Zapatilla[],
  consulta: string,
  k1 = 1.5,
  b = 0.75
): ResultadoBM25[] {
  const queryTokens = tokenizar(consulta);

  if (queryTokens.length === 0) {
    return productos.map((p) => ({ ...p, score: 0 }));
  }

  const docs = productos.map((p) => tokenizar(`${p.Marca} ${p.Modelo}`));
  const N = docs.length;
  if (N === 0) return [];

  const avgdl = docs.reduce((acc, doc) => acc + doc.length, 0) / N || 1;

  const terminosUnicos = Array.from(new Set(queryTokens));
  const df: Record<string, number> = {};
  for (const term of terminosUnicos) {
    df[term] = docs.filter((doc) => doc.includes(term)).length;
  }

  const resultados: ResultadoBM25[] = productos.map((prod, idx) => {
    const doc = docs[idx];
    const dl = doc.length;
    let score = 0;

    for (const term of queryTokens) {
      const tf = doc.filter((t) => t === term).length;
      if (tf === 0) continue;

      const docFreq = df[term] || 0;
      const idf = Math.log(1 + (N - docFreq + 0.5) / (docFreq + 0.5));
      const numerador = tf * (k1 + 1);
      const denominador = tf + k1 * (1 - b + b * (dl / avgdl));
      score += idf * (numerador / denominador);
    }

    return { ...prod, score: Number(score.toFixed(4)) };
  });

  return resultados
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.Precio - b.Precio);
}
