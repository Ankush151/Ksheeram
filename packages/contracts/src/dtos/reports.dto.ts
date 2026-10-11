export interface DailyReportDto {
  date: string; // YYYY-MM-DD
  procuredUnits: number;
  deliveredUnits: number;
  damagedUnits: number;
  fulfillmentRatePct: number;
  shrinkageRatePct: number;
  grossRevenuePaise: number;
  activeSubscriptionsCount: number;
  cashCollectedPaise: number;
}
