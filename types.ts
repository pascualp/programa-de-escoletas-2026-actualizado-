export interface LocationData {
  [key: string]: string;
}

export interface Product {
  code: string;
  name: string;
  unit: string;
  multiplier?: number;
  locations: LocationData;
}

export interface Column {
  key: string;
  label: string;
  width: string;
}
