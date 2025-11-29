export interface GeoFact {
  title: string;
  content: string;
  coordinates?: { lat: number; lng: number };
}

export enum AppState {
  LOADING = 'LOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HoverData {
  coords: Coordinates;
  country?: string;
}

export interface Controls {
  isDragging: boolean;
}