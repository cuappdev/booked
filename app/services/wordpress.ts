export const WP_API = 'https://www.library.cornell.edu/wp-json/wp/v2';

export async function fetchAllPages<T>(url: string): Promise<T[]> {
  const firstResponse = await fetch(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=1`);
  if (!firstResponse.ok) {
    throw new Error(`Network response was not ok for ${url}`);
  }
  const totalPages = Number(firstResponse.headers.get('X-WP-TotalPages') || '1');
  const firstPage: T[] = await firstResponse.json();

  if (totalPages <= 1) {
    return firstPage;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map(async (page) => {
      const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
      if (!response.ok) {
        throw new Error(`Network response was not ok for ${url} page ${page}`);
      }
      return response.json() as Promise<T[]>;
    })
  );

  return [firstPage, ...remainingPages].flat();
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
