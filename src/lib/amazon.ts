export function generateAmazonUrl(query: string): string {
  const params = new URLSearchParams({ k: query });
  return `https://www.amazon.es/s?${params.toString()}`;
}
