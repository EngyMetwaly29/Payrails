# AlphaVantage API Tests (Playwright + TypeScript + Zod)

## Overview
This is a lightweight API test framework showcasing:
- Playwright Test for HTTP
- Zod schemas for strict validation
- Clean client wrapper + retries
- API (`TIME_SERIES_DAILY`) and error scenarios (invalid key, missing params)



## 📋 Prerequisites
| Requirement | Version | Link |
|-------------|---------|------|
| Node.js | 18+ | [Download](https://nodejs.org/) |
| npm | 8+ | Included with Node.js |
| AlphaVantage API Key | Free/Premium | [Get API Key](https://www.alphavantage.co/support/#api-key) |


## Setup
```bash
git clone "https://github.com/EngyMetwaly29/Payrails.git"
cd payrails
cp .env.example .env
# put your key into .env

#Installinf Dependency
npm install

#Running test
npm test

#Shown report
npx playwright show-report



## 🛠️ Development

### Adding New Tests

1. Create test file in `tests/api/`
2. Create required schemas and utilities
3. Follow existing test patterns
4. Update CI/CD workflows if needed

### Schema Validation

```typescript
import { timeSeriesDailySchema } from '../schema/timeSeriesDaily.schema';

// Validate API response
const validated = timeSeriesDailySchema.parse(apiResponse);

