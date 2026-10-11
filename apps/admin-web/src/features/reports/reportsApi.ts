import { adminApiClient } from '@/services/api-client';
import { env } from '@/config/env';

export interface DailyReportRow {
  date: string;
  procuredUnits: number;
  deliveredUnits: number;
  damagedUnits: number;
  grossRevenue: number;
  activeSubscriptions: number;
  cashCollected: number;
}

export const reportsApi = {
  async getDailyReports(): Promise<DailyReportRow[]> {
    if (env.USE_MOCK_API) {
      return [
        {
          date: '2026-10-11',
          procuredUnits: 700,
          deliveredUnits: 685,
          damagedUnits: 3,
          grossRevenue: 49820,
          activeSubscriptions: 240,
          cashCollected: 3820,
        },
        {
          date: '2026-10-10',
          procuredUnits: 680,
          deliveredUnits: 672,
          damagedUnits: 2,
          grossRevenue: 48900,
          activeSubscriptions: 238,
          cashCollected: 2940,
        },
        {
          date: '2026-10-09',
          procuredUnits: 690,
          deliveredUnits: 680,
          damagedUnits: 4,
          grossRevenue: 49100,
          activeSubscriptions: 236,
          cashCollected: 4120,
        },
      ];
    }
    return adminApiClient.get<DailyReportRow[]>('/admin/reports/daily');
  },
};
