import { APIRequestContext } from '@playwright/test';

type Query = Record<string, string | number>;

export class AlphaVantageClient {
  constructor(private request: APIRequestContext, private apiKey: string) {}

  async get<T>(params: Query): Promise<{status: number; json: T}> {
    const url = '/query';
    const searchParams = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), apikey: this.apiKey });
    const res = await this.request.get(`${url}?${searchParams.toString()}`);
    const json = await res.json();
    return { status: res.status(), json };
  }
  static isErrorMessage(obj: any): boolean {
    console.log("Result:", obj && (obj['Error Message'] || obj.Information));
    return obj && (obj['Error Message'] || obj.Information);
  }
}
