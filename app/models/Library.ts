// A library building, as served by booked-backend's `/libraries`.
export interface Library {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  mapUrl: string | null;
  hoursUrl: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  websiteUrl: string | null;
}

export type LibraryIndex = Map<string, Library>;
