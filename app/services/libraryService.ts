import { Library, LibraryIndex } from '../models/Library';
import { WP_API, fetchAllPages, decodeEntities } from './wordpress';

const API_URL = `${WP_API}/unit_libraries`;

interface ApiLibrary {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  acf: {
    library_unit?: { label?: string };
    library_address?: string;
    google_map_location?: string;
    full_hours?: string;
    library_url?: string;
    reference_phone?: string;
    circulation_phone?: string;
    email_contact?: string;
    library_photo?: { url?: string } | false;
    floor_plan_url?: string;
    libraries_strengths?: string;
  };
}

let cachedLibraries: Promise<LibraryIndex> | null = null;

export function fetchLibraries({ refresh = false } = {}): Promise<LibraryIndex> {
  if (!cachedLibraries || refresh) {
    cachedLibraries = loadLibraries().catch((error) => {
      cachedLibraries = null;
      console.error('Error fetching libraries:', error);
      throw error;
    });
  }
  return cachedLibraries;
}

async function loadLibraries(): Promise<LibraryIndex> {
  const libraries = await fetchAllPages<ApiLibrary>(`${API_URL}?_fields=id,slug,title,acf`);
  return new Map(libraries.map((library) => [library.id, toLibrary(library)]));
}

// ACF leaves unset text fields as empty strings.
const optional = (value: string | undefined) => value?.trim() || undefined;

function toLibrary(apiLibrary: ApiLibrary): Library {
  const acf = apiLibrary.acf || {};
  return {
    id: apiLibrary.id,
    slug: apiLibrary.slug,
    name: acf.library_unit?.label || decodeEntities(apiLibrary.title?.rendered || ''),
    address: optional(acf.library_address?.replace(/\r\n/g, '\n')),
    mapUrl: optional(acf.google_map_location),
    hoursUrl: optional(acf.full_hours),
    website: optional(acf.library_url),
    referencePhone: optional(acf.reference_phone),
    circulationPhone: optional(acf.circulation_phone),
    email: optional(acf.email_contact),
    photoUrl: optional(acf.library_photo ? acf.library_photo.url : undefined),
    floorPlanUrl: optional(acf.floor_plan_url),
    strengths: optional(acf.libraries_strengths),
  };
}
