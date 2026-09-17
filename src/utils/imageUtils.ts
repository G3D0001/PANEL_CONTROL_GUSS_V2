/**
 * Utility functions to extract, parse, clean and format product & variant image URLs safely.
 */

export function isValidImageUrl(url: any): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  if (trimmed === '[' || trimmed === ']' || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined' || trimmed.includes('[object Object]')) return false;
  if (trimmed.toLowerCase().startsWith('foto ') || trimmed.toLowerCase().startsWith('foto_') || trimmed.toLowerCase().startsWith('foto1') || trimmed.toLowerCase().startsWith('foto2')) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

export function parseImages(imgSource: any): string[] {
  if (!imgSource) return [];

  if (Array.isArray(imgSource)) {
    const result: string[] = [];
    for (const item of imgSource) {
      result.push(...parseImages(item));
    }
    return Array.from(new Set(result.filter(isValidImageUrl)));
  }

  if (typeof imgSource === 'string') {
    const trimmed = imgSource.trim();
    if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === '[]' || trimmed === 'null' || trimmed === 'undefined' || trimmed.includes('[object Object]')) {
      return [];
    }

    if (trimmed.toLowerCase().startsWith('foto ') || trimmed.toLowerCase().startsWith('foto_')) {
      return [];
    }

    // Handle stringified JSON array: e.g. '["https://...", "data:image..."]'
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseImages(parsed);
      } catch (e) {
        return [];
      }
    }

    // Handle Postgres array notation: e.g. '{"https://...","data:image..."}'
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      const items = trimmed
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, ''));
      return parseImages(items);
    }

    // Comma separated string list of URLs
    if (trimmed.includes(',') && !trimmed.startsWith('data:')) {
      const items = trimmed.split(',').map(s => s.trim());
      return parseImages(items);
    }

    // Single image URL or Base64 string
    if (isValidImageUrl(trimmed)) {
      return [trimmed];
    }
  }

  if (typeof imgSource === 'object' && imgSource !== null) {
    if (imgSource.url) return parseImages(imgSource.url);
    if (imgSource.src) return parseImages(imgSource.src);
    if (imgSource.publicUrl) return parseImages(imgSource.publicUrl);
  }

  return [];
}

export function getProductImages(item: any): string[] {
  if (!item) return [];

  const sources = [
    item.imagenes,
    item.imagen,
    item.fotos,
    item.imagenes_usuario,
    item.referencias,
    item.imagen_url,
    item.imagenes_referencia
  ];

  const all: string[] = [];
  for (const src of sources) {
    all.push(...parseImages(src));
  }

  return Array.from(new Set(all));
}

export function getProductMainImage(item: any): string {
  const imgs = getProductImages(item);
  return imgs.length > 0 ? imgs[0] : '';
}

export function getDisplayImage(product: any, selectedVariant?: any): string {
  if (selectedVariant) {
    const varImgs = getProductImages(selectedVariant);
    if (varImgs.length > 0) return varImgs[0];
  }
  return getProductMainImage(product);
}
