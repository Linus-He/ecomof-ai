export type SourceDatabase =
  | 'CoRE MOF'
  | 'QMOF'
  | 'CSD'
  | 'Literature'
  | 'User Upload'
  | 'Demo'
  | 'Unknown';

export type EvidenceLevel =
  | 'experimental'
  | 'literature'
  | 'literature-supported'
  | 'simulation'
  | 'simulation-supported'
  | 'ML-predicted'
  | 'ml-predicted'
  | 'rule-based'
  | 'database'
  | 'needs-validation';

export type CurationStatus = 'curated' | 'pending' | 'missing' | 'needs-review' | 'demo' | 'raw-import';
export type DataRoute = 'core-mof-2024-cr' | 'open-mof-seed';
export type DataMode = DataRoute | 'real' | 'demo';

export interface DescriptorSource {
  database?: SourceDatabase | string;
  recordId?: string;
  url?: string;
  doi?: string;
  citation?: string;
  retrievedAt?: string;
}

export interface Descriptor {
  name: string;
  value: number | string | boolean | null;
  unit?: string;
  source?: string | DescriptorSource;
  evidenceLevel?: EvidenceLevel;
  curationStatus: CurationStatus;
}

export interface DescriptorStatus {
  value: number | string | boolean | null;
  unit?: string;
  source?: DescriptorSource;
  evidenceLevel: EvidenceLevel;
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
  displayName?: string;
  rawName?: string;
  aliasNames?: string[];
  sourceDatabase?: SourceDatabase | string;
  sourceRecordId?: string;
  sourceVersion?: string;
  sourceUrl?: string;
  citation?: string;
  license?: string;
  retrievedAt?: string;
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
  evidenceLevel?: EvidenceLevel;
  curatedDescriptors: number;
  totalDescriptors: number;
  descriptors: Descriptor[] | Record<string, DescriptorStatus | number | string | boolean | null>;
  sourceDoi?: string;
  notes?: string;
  dataMode?: DataMode;
}
