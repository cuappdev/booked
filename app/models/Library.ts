// A library building, from Cornell's `unit_libraries` endpoint.
export interface Library {
  id: number;
  slug: string;
  name: string;
  address?: string;
  mapUrl?: string;
  hoursUrl?: string;
  website?: string;
  referencePhone?: string;
  circulationPhone?: string;
  email?: string;
  photoUrl?: string;
  floorPlanUrl?: string;
  strengths?: string;
}

export type LibraryIndex = Map<number, Library>;
