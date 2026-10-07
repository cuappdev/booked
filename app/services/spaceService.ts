import { Space, ReservationType } from '../models/Space';
import { WP_API, fetchAllPages, decodeEntities } from './wordpress';

const API_URL = `${WP_API}/library_spaces`;
const MEDIA_URL = `${WP_API}/media`;

const TAXONOMIES = ['sound_level', 'space_features', 'space_type', 'space_type_2', 'audience_type', 'support_type'] as const;
type Taxonomy = typeof TAXONOMIES[number];

interface ApiSpace {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  link: string;
  modified_gmt: string;
  sound_level: number[];
  space_features: number[];
  space_type: number[];
  space_type_2: number[];
  audience_type: number[];
  support_type: number[];
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

async function fetchTaxonomyMaps(): Promise<Record<Taxonomy, Map<number, string>>> {
  const entries = await Promise.all(
    TAXONOMIES.map(async (taxonomy) => {
      const terms = await fetchAllPages<ApiTerm>(`${WP_API}/${taxonomy}`);
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

const RESERVATION_FEATURES: Record<string, ReservationType> = {
  Reservable: 'Reservable',
  'By request': 'By request',
};

const ACCESSIBLE = 'Accessible';

let cachedSpaces: Promise<Space[]> | null = null;

export function fetchSpaces({ refresh = false } = {}): Promise<Space[]> {
  if (!cachedSpaces || refresh) {
    cachedSpaces = loadSpaces().catch((error) => {
      cachedSpaces = null;
      console.error('Error fetching library spaces:', error);
      throw error;
    });
  }
  return cachedSpaces;
}

export async function fetchSpace(id: number): Promise<Space | undefined> {
  const spaces = await fetchSpaces();
  return spaces.find((space) => space.id === id);
}

async function loadSpaces(): Promise<Space[]> {
  const spaces = await fetchAllPages<ApiSpace>(API_URL);
  const [taxonomyMaps, imageMap] = await Promise.all([
    fetchTaxonomyMaps(),
    fetchImageMap(spaces.map((space) => space.id)),
  ]);

  return spaces.map((space) => toSpace(space, taxonomyMaps, imageMap));
}

function toSpace(
  apiSpace: ApiSpace,
  taxonomyMaps: Record<Taxonomy, Map<number, string>>,
  imageMap: Map<number, string>
): Space {
  const features = namesFromIds(apiSpace.space_features || [], taxonomyMaps.space_features);
  const support = namesFromIds(apiSpace.support_type || [], taxonomyMaps.support_type);
  const reservationFeature = features.find((feature) => feature in RESERVATION_FEATURES);

  // Cornell's API no longer exposes the ACF fields (description, building,
  // booking ID); `url` links to the page that still shows them.
  return {
    id: apiSpace.id,
    slug: apiSpace.slug || '',
    title: decodeEntities(apiSpace.title?.rendered || ''),
    url: apiSpace.link,
    imageUrl: imageMap.get(apiSpace.id),
    updatedAt: apiSpace.modified_gmt,
    spaceTypes: namesFromIds(apiSpace.space_type_2 || [], taxonomyMaps.space_type_2),
    reservationType: reservationFeature ? RESERVATION_FEATURES[reservationFeature] : 'No reservation',
    soundLevels: namesFromIds(apiSpace.sound_level || [], taxonomyMaps.sound_level),
    activities: namesFromIds(apiSpace.space_type || [], taxonomyMaps.space_type),
    amenities: features.filter((feature) => !(feature in RESERVATION_FEATURES) && feature !== ACCESSIBLE),
    audiences: namesFromIds(apiSpace.audience_type || [], taxonomyMaps.audience_type),
    accessible: features.includes(ACCESSIBLE) || support.includes(ACCESSIBLE),
    support: support.filter((item) => item !== ACCESSIBLE),
  };
}
