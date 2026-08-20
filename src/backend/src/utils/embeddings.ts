/**
 * Simulates or generates a 768-dimension dummy vector for embeddings.
 * This is used to ensure clean compilation without requiring live model API keys.
 */
export function getDummyEmbedding(text: string): number[] {
  const embedding: number[] = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  for (let i = 0; i < 768; i++) {
    // Generate a float between -0.5 and 0.5 based on the hash and dimension index
    const val = Math.sin(hash + i) * 0.1;
    embedding.push(parseFloat(val.toFixed(6)));
  }
  return embedding;
}

/**
 * Format vector as a PostgreSQL vector string representation: e.g. '[0.1,0.2,-0.3,...]'
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(',')}]`;
}
