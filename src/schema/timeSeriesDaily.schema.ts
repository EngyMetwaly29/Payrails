import { z } from 'zod';

export const metaDaily = z.object({
  '1. Information': z.string(),
  '2. Symbol': z.string(),
  '3. Last Refreshed': z.string(),
  '4. Output Size': z.string().optional(),
  '5. Time Zone': z.string()
});

export const dailyPoint = z.object({
  '1. open': z.string(),
  '2. high': z.string(),
  '3. low': z.string(),
  '4. close': z.string(),
  '5. volume': z.string()
});

export const timeSeriesDailySchema = z.object({
  'Meta Data': metaDaily,
  'Time Series (Daily)': z.record(dailyPoint)
});
export type TimeSeriesDaily = z.infer<typeof timeSeriesDailySchema>;
