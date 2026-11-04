import { Space } from '../models/Space';
import { Library, LibraryIndex } from '../models/Library';

// The booked-backend server, which syncs spaces and libraries from Cornell.
// Set in `.env.local` for development (see `.env.example`).
const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

async function request(path: string): Promise<Response> {
  if (!API_URL) {
    throw new Error('EXPO_PUBLIC_API_URL is not set');
  }
  return fetch(`${API_URL}${path}`);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await request(path);
  if (!response.ok) {
    throw new Error(`Booked API returned ${response.status} for ${path}`);
  }
  return response.json();
}

export function fetchSpaces(): Promise<Space[]> {
  return getJson('/rooms');
}

export async function fetchSpace(id: string): Promise<Space | undefined> {
  const response = await request(`/rooms/${encodeURIComponent(id)}`);
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Booked API returned ${response.status} for /rooms/${id}`);
  }
  return response.json();
}

export async function fetchLibraries(): Promise<LibraryIndex> {
  const libraries = await getJson<Library[]>('/libraries');
  return new Map(libraries.map((library) => [library.id, library]));
}
