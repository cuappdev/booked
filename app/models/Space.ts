import { Library, LibraryIndex } from './Library';

export type ReservationType = 'Reservable' | 'By request' | 'No reservation';

// A single room or study area, from Cornell's `library_spaces` endpoint.
export interface Space {
  id: number;
  slug: string;
  title: string;
  // Cornell's page for the space; it holds the description and Reserve link
  // that the API no longer exposes.
  url: string;
  imageUrl?: string;
  updatedAt: string;

  // The API doesn't say which library a space belongs to, so this stays
  // unset until a sync from the space's page fills it in.
  libraryId?: number;
  spaceTypes: string[];
  reservationType: ReservationType;
  soundLevels: string[];
  activities: string[];
  amenities: string[];
  audiences: string[];
  accessible: boolean;
  support: string[];
}

export function libraryOf(space: Space, libraries: LibraryIndex): Library | undefined {
  return space.libraryId === undefined ? undefined : libraries.get(space.libraryId);
}

export type FacetKey =
  | 'library'
  | 'spaceType'
  | 'reservationType'
  | 'soundLevel'
  | 'activity'
  | 'amenity'
  | 'audience';

export type FacetSelection = Partial<Record<FacetKey, string>>;

type Facet = { label: string; values: (space: Space, libraries: LibraryIndex) => string[] };

export const FACETS: Record<FacetKey, Facet> = {
  library: {
    label: 'Library',
    values: (s, libraries) => {
      const library = libraryOf(s, libraries);
      return library ? [library.name] : [];
    },
  },
  spaceType: { label: 'Space Type', values: (s) => s.spaceTypes },
  reservationType: { label: 'Reservation', values: (s) => [s.reservationType] },
  soundLevel: { label: 'Sound Level', values: (s) => s.soundLevels },
  activity: { label: 'Activity', values: (s) => s.activities },
  amenity: { label: 'Amenities', values: (s) => (s.accessible ? [...s.amenities, 'Accessible'] : s.amenities) },
  audience: { label: 'Audience', values: (s) => s.audiences },
};

export const FACET_KEYS = Object.keys(FACETS) as FacetKey[];

export function facetOptions(spaces: Space[], facet: FacetKey, libraries: LibraryIndex): string[] {
  const values = new Set(spaces.flatMap((space) => FACETS[facet].values(space, libraries)));
  return [...values].sort((a, b) => a.localeCompare(b));
}

export function matchesFacets(space: Space, selection: FacetSelection, libraries: LibraryIndex): boolean {
  return FACET_KEYS.every((facet) => {
    const selected = selection[facet];
    return !selected || FACETS[facet].values(space, libraries).includes(selected);
  });
}

const SOUND_RANK: Record<string, number> = { Silent: 0, Quiet: 1, Collaborative: 2 };

function quietestRank(space: Space): number {
  return Math.min(...space.soundLevels.map((level) => SOUND_RANK[level] ?? 3), 3);
}

export type SortKey = 'title' | 'library' | 'quietest' | 'recentlyUpdated';

type Sort = { label: string; compare: (a: Space, b: Space, libraries: LibraryIndex) => number };

const byTitle = (a: Space, b: Space) => a.title.localeCompare(b.title, undefined, { numeric: true });

export const SORTS: Record<SortKey, Sort> = {
  title: { label: 'Name', compare: byTitle },
  library: {
    label: 'Library',
    compare: (a, b, libraries) => {
      const nameA = libraryOf(a, libraries)?.name ?? '￿';
      const nameB = libraryOf(b, libraries)?.name ?? '￿';
      return nameA.localeCompare(nameB) || byTitle(a, b);
    },
  },
  quietest: { label: 'Quietest', compare: (a, b) => quietestRank(a) - quietestRank(b) || byTitle(a, b) },
  recentlyUpdated: { label: 'Recently Updated', compare: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
};
