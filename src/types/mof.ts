export type CurationStatus = 'curated' | 'pending' | 'missing';
export type DataMode = 'real' | 'demo';

export interface Descriptor {
  name: string;
  value: number | string;
  unit: string;
  source: string;
  curationStatus: CurationStatus;
}

export interface IsothermPoint {
  pressure: number;
  uptake: number;
  temperature: number;
  gas: string;
  isDesorption: boolean;
}

export interface MOFData {
  id: string;
  name: string;
  formula?: string;
  surfaceArea?: number;
  poreVolume?: number;
  isothermData: IsothermPoint[];
  selectivity?: {
    value: number;
    gasPair: string;
    method: 'IAST' | 'Henry' | 'Ideal' | 'Breakthrough';
    condition: string;
    source: string;
  };
  heatOfAdsorption?: number;
  curationStatus: CurationStatus;
  curatedDescriptors: number;
  totalDescriptors: number;
  descriptors: Descriptor[];
  sourceDoi?: string;
  notes?: string;
  dataMode?: DataMode;
}
