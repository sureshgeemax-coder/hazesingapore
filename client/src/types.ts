export type DirectionId = 'east' | 'west' | 'north' | 'south';
export type SelectionMethod = 'place' | 'mrt' | 'direction';
export interface Direction { id: DirectionId; name: string }
export interface MrtLineRef { id: string; name: string; color: string }
export interface MrtLine { id: string; name: string; shortName: string; color: string; stations: { code: string; name: string }[] }
export interface Location { id: string; name: string; direction: DirectionId; type: 'place' | 'station'; codes?: string[]; lines?: MrtLineRef[]; selectedCode?: string; selectedLine?: MrtLineRef; latitude?: number; longitude?: number; searchName?: string }
export interface Category { label: string; color: string; explanation: string; guidance: string }
export interface Reading {
  selectionKey: string; selectedLocation: Location & { selectionMethod: SelectionMethod; selectedMrtLine?: string | null; latitude: number; longitude: number };
  relationshipNotice: string; aqi: number; category: Category; standard: string; classificationSource: string;
  pollutants: Record<string, number | null>; pollutantUnits: Record<string, string>; monitoringStation: { id: string | number; name: string; latitude: number | null; longitude: number | null };
  sourceTimestamp: string; retrievedAt: string; freshness: { status: string; stale: boolean; ageMinutes: number | null }; sourceUrl: string; provider: string; cache: string;
  alert: { triggered: boolean; reason?: string; status?: string; result?: string; error?: string; episodeId?: string };
}
export interface HistoryItem { id: string; timestamp: string; aqi: number; pm25: number | null; pm10: number | null; category: string }
export interface AlertSettings { alertThreshold: number; recipientEmails: string[]; emailEnabled: boolean; monitoringMethod: SelectionMethod; monitoredDirection: DirectionId; monitoredPlaceId: string; monitoredMrtLineId: string; monitoredStationId: string; refreshIntervalMinutes: number; alertCooldownMinutes: number; escalationStep: number; lastAlertTime: string; lastAlertStatus: string }
export interface AlertHistoryItem { id: string; timestamp: string; location: string; selectionMethod: string; aqi: number | null; threshold: number | null; recipient: string; status: string; result: string; error: string; episodeId: string }
