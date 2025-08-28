// tests/api/time_series_daily.spec.ts
import { test, expect, request } from '@playwright/test';
import * as dotenv from 'dotenv';
import { AlphaVantageClient } from '../../src/client/alphavantageClient';
import { timeSeriesDailySchema, TimeSeriesDaily } from '../../src/schema/timeSeriesDaily.schema';
import { parseCsv, toNum } from '../../src/utils/utils';
dotenv.config();

const FN = 'TIME_SERIES_DAILY';
const SYM = { us: 'IBM', dot: 'BRK.B', intl: '600104.SHH', bad: 'INVALID123' };

test.describe(FN, () => {
  let client: AlphaVantageClient, ctx: any;

  test.beforeAll(async ({ baseURL }) => {
    ctx = await request.newContext({ baseURL });
    expect(process.env.ALPHA_VANTAGE_API_KEY).toBeTruthy();
    client = new AlphaVantageClient(ctx, process.env.ALPHA_VANTAGE_API_KEY!);
  });

  test('TC1: JSON, compact, baseline shape & keys (IBM)', async () => {
    const { status, json } = await client.get({ function: FN, symbol: SYM.us });
    expect(status).toBe(200);

    const parsed = timeSeriesDailySchema.parse(json) as TimeSeriesDaily;
    const md = parsed['Meta Data']; 
    expect(md['2. Symbol']).toContain('IBM');

    const series = parsed['Time Series (Daily)'];
    const dates = Object.keys(series);
    expect(dates.length).toBeLessThanOrEqual(100);

    const sorted = [...dates].sort((a,b)=>(a<b?1:a>b?-1:0));
    expect(dates[0]).toBe(sorted[0]);
    const today = new Date();
    for (const d of dates.slice(0, 30)) {
      const dt = new Date(d + 'T00:00:00Z');
      expect(dt.getTime()).toBeLessThanOrEqual(today.getTime());
      const wd = dt.getUTCDay();
      expect([0,6]).not.toContain(wd); //As the json data does not include weekends (sunday, saturday)
      const row = series[d];
      const o=toNum(row['1. open']), h=toNum(row['2. high']),
            l=toNum(row['3. low']), c=toNum(row['4. close']),
            v=toNum(row['5. volume']);
      expect(h).toBeGreaterThanOrEqual(Math.max(o,c));
      expect(l).toBeLessThanOrEqual(Math.min(o,c));
      expect(h).toBeGreaterThanOrEqual(l);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  test('TC2: Outputsize: full > compact & same latest', async () => {
    const compact = await client.get({ function: FN, symbol: SYM.us, outputsize: 'compact' });
    const full    = await client.get({ function: FN, symbol: SYM.us, outputsize: 'full' });

    const c = timeSeriesDailySchema.parse(compact.json) as TimeSeriesDaily;
    const f = timeSeriesDailySchema.parse(full.json) as TimeSeriesDaily;
    const cd = Object.keys(c['Time Series (Daily)']);
    const fd = Object.keys(f['Time Series (Daily)']);
    expect(fd.length).toBeGreaterThan(cd.length);
    expect(fd[0]).toBe(cd[0]); // latest date matches
    expect(cd.length).toBeLessThanOrEqual(100); // compact guard
  });


  test('TC3: CSV on latest (IBM, compact)', async () => {
    const url = `/query?function=${FN}&symbol=${SYM.us}&outputsize=compact&datatype=csv&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const res = await ctx.get(url); expect(res.status()).toBe(200);
    const { headers, rows } = parseCsv(await res.text());
    expect(headers).toEqual(['timestamp','open','high','low','close','volume']);
    expect(rows.length).toBeLessThanOrEqual(100);
  });

  test('TC4:CSV vs JSON parity on latest (IBM, compact)', async () => {
    const { status, json } = await client.get({ function: FN, symbol: 'MSFT', outputsize: 'compact', datatype: 'json' });
    expect(status).toBe(200);
    
    const jsonParsed = timeSeriesDailySchema.parse(json) as TimeSeriesDaily;
    const metaData = jsonParsed['Meta Data'];
    expect(metaData['2. Symbol']).toContain('MSFT');

    const jsonTimeSeries = jsonParsed['Time Series (Daily)']; 
    const latestDate = Object.keys(jsonTimeSeries)[0]; 
    const latestRecord = jsonTimeSeries[latestDate];
    // console.log('Latest date:', latestDate, latestRecord);

    const url = `/query?function=${FN}&symbol=MSFT&outputsize=compact&datatype=csv&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`;
    const res = await ctx.get(url); expect(res.status()).toBe(200);
    const { headers, rows } = parseCsv(await res.text());
    expect(headers).toEqual(['timestamp','open','high','low','close','volume']);

    const [csvDate, o, h, l, c, v] = rows[0];
    expect(csvDate).toBe(latestDate);
    expect(toNum(o)).toEqual(toNum(latestRecord['1. open']));
    expect(toNum(h)).toEqual(toNum(latestRecord['2. high']));
    expect(toNum(l)).toEqual(toNum(latestRecord['3. low']));
    expect(toNum(c)).toEqual(toNum(latestRecord['4. close']));
    expect(toNum(v)).toEqual(toNum(latestRecord['5. volume']));
  });

  test('TC5: Edge symbols: BRK.B, 7203.T', async () => {
    for (const symbol of [SYM.dot, SYM.intl]) {

      const { json } = await client.get({ function: FN, symbol, outputsize: 'compact' });
      const parsed = timeSeriesDailySchema.parse(json) as TimeSeriesDaily;
      const md = parsed['Meta Data'];
      expect(md['2. Symbol']).toContain(symbol);
      expect(Object.keys(parsed['Time Series (Daily)']).length).toBeGreaterThan(0);
    }
  });

  test('TC6: NEG: Invalid symbol', async () => {
    const { json } = await client.get({ function: FN, symbol: SYM.bad });
    expect(AlphaVantageClient.isErrorMessage(json)).toBeTruthy();
  });

  test('TC7: invalid outputsize return default', async () => {
      const { json } = await client.get({ function: FN, symbol: SYM.us, outputsize: 'giant' });
      console.log("GIANT:", json);
      const parsed = timeSeriesDailySchema.parse(json) as TimeSeriesDaily;
      const md = parsed['Meta Data'];
      expect(md['4. Output Size']).toContain('Compact');
      expect(Object.keys(parsed['Time Series (Daily)']).length).toBeGreaterThan(0);
  });

    test('TC8: invalid datatype return default', async () => {
      const { json } = await client.get({ function: FN, symbol: SYM.us, datatype: 'xml' });
      console.log("XML:", json);
      const parsed = timeSeriesDailySchema.parse(json) as TimeSeriesDaily;
      expect(Object.keys(parsed['Time Series (Daily)']).length).toBeGreaterThan(0);
  });


  test('TC7: NEG: invalid outputsize / datatype / missing symbol', async () => {
      const { json } = await client.get({ function: FN });
      expect(AlphaVantageClient.isErrorMessage(json)).toBeTruthy();
  });


  test('TC8: NEG: Missing APIKey', async () => {
    const url = `/query?function=${FN}&symbol=${SYM.us}`;
    const res = await ctx.get(url); 
    expect(AlphaVantageClient.isErrorMessage(await res.json())).toBeTruthy();
  });

});
