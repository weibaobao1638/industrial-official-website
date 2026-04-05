export function getDirectusAssetUrl(assetId?: string | null) {
  if (!assetId || !process.env.DIRECTUS_URL) {
    return null;
  }

  const base = process.env.DIRECTUS_URL.replace(/\/$/, '');
  return `${base}/assets/${assetId}`;
}
