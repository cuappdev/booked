import { Library } from '../models/Library';

const API_URL = 'https://www.library.cornell.edu/wp-json/wp/v2/library_spaces';
const MEDIA_URL = 'https://www.library.cornell.edu/wp-json/wp/v2/media';

const TAXONOMIES = ['sound_level', 'space_features', 'space_type', 'audience_type'] as const;
type Taxonomy = typeof TAXONOMIES[number];

interface ApiLibrarySpace {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  link: string;
  sound_level: number[];
  space_features: number[];
  space_type: number[];
  audience_type: number[];
}

interface ApiTerm {
  id: number;
  name: string;
}

interface ApiMedia {
  id: number;
  post: number;
  source_url: string;
}

async function fetchAllPages<T>(url: string): Promise<T[]> {
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

async function fetchTaxonomyMaps(): Promise<Record<Taxonomy, Map<number, string>>> {
  const entries = await Promise.all(
    TAXONOMIES.map(async (taxonomy) => {
      const terms = await fetchAllPages<ApiTerm>(`https://www.library.cornell.edu/wp-json/wp/v2/${taxonomy}`);
      return [taxonomy, new Map(terms.map((term) => [term.id, term.name]))] as const;
    })
  );
  return Object.fromEntries(entries) as Record<Taxonomy, Map<number, string>>;
}

async function fetchImageMap(postIds: number[]): Promise<Map<number, string>> {
  if (postIds.length === 0) {
    return new Map();
  }

  const params = postIds.map((id) => `parent[]=${id}`).join('&');
  const media = await fetchAllPages<ApiMedia>(`${MEDIA_URL}?${params}&_fields=id,post,source_url`);

  const imageMap = new Map<number, string>();
  for (const item of media) {
    if (!imageMap.has(item.post)) {
      imageMap.set(item.post, item.source_url);
    }
  }
  return imageMap;
}

function namesFromIds(ids: number[], termMap: Map<number, string>): string[] {
  return ids.map((id) => termMap.get(id)).filter((name): name is string => Boolean(name));
}

export async function fetchLibrarySpaces(): Promise<Library[]> {
  try {
    const spaces = await fetchAllPages<ApiLibrarySpace>(API_URL);
    const [taxonomyMaps, imageMap] = await Promise.all([
      fetchTaxonomyMaps(),
      fetchImageMap(spaces.map((space) => space.id)),
    ]);

    return spaces.map((space) => transformApiLibraryToModel(space, taxonomyMaps, imageMap));
  } catch (error) {
    console.error('Error fetching library spaces:', error);
    throw error;
  }
}

function transformApiLibraryToModel(
  apiLibrary: ApiLibrarySpace,
  taxonomyMaps: Record<Taxonomy, Map<number, string>>,
  imageMap: Map<number, string>
): Library {
  return {
    id: apiLibrary.id,
    title: apiLibrary.title?.rendered || '',
    slug: apiLibrary.slug || '',
    spaceInfo: {
      // Cornell's API no longer exposes these ACF text fields (space_library,
      // space_name, space_description, space_category, reservation_type,
      // space_id) on the library_spaces endpoint; they default empty until
      // Cornell restores or relocates them.
      library: '',
      name: '',
      description: '',
      category: '',
      reservationType: '',
      spaceId: '',
    },
    features: {
      soundLevel: namesFromIds(apiLibrary.sound_level || [], taxonomyMaps.sound_level),
      spaceFeatures: namesFromIds(apiLibrary.space_features || [], taxonomyMaps.space_features),
      spaceType: namesFromIds(apiLibrary.space_type || [], taxonomyMaps.space_type),
      audienceTypes: namesFromIds(apiLibrary.audience_type || [], taxonomyMaps.audience_type),
    },
    imageUrl: imageMap.get(apiLibrary.id),
  };
}
