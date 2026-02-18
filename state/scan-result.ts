type ScanResult = { barcode: string; at: number };

let lastScan: ScanResult | null = null;

export function setLastScan(barcode: string) {
  lastScan = { barcode, at: Date.now() };
}

export function consumeLastScan(): ScanResult | null {
  const v = lastScan;
  lastScan = null;
  return v;
}