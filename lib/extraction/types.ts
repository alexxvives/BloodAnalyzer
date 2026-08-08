export type ExtractedMarker = {
  /** Known id when mapped; null if user must pick */
  biomarkerId: string | null;
  name: string;
  value: number | null;
  valueDisplay?: string;
  unit: string;
  /** 0–1 */
  confidence: number;
};

export type ExtractionResult = {
  markers: ExtractedMarker[];
  warnings: string[];
  /** How the file was parsed */
  method:
    | "csv"
    | "pdf-text"
    | "text-lab"
    | "image-pending"
    | "manual";
};

export type Extractor = {
  /** MIME / extension hints this extractor can handle */
  accepts(file: { type: string; name: string }): boolean;
  extract(input: Blob, meta: { name: string; type: string }): Promise<ExtractionResult>;
};
