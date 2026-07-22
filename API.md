# Lunch Menu API Documentation

A simple, public API providing daily lunch menus for restaurants in Lund, Sweden.

## Base URL

```
https://lunch-menu-coral.vercel.app
```

## Authentication

No authentication required. The API is free and open to use.

## Endpoints

### Get All Menus

Retrieves lunch menus for all supported restaurants.

**Endpoint:** `GET /api/menus`

**Parameters:** None

**Response:** `200 OK`

Returns a JSON object with restaurant menus organized by restaurant key. Each restaurant contains an array of menu items.

```json
{
  "edison": MenuItem[],
  "bricks": MenuItem[],
  "kantin": MenuItem[],
  "smakapakina": MenuItem[],
  "eatery": MenuItem[],
  "foodhall": MenuItem[],
  "grenden": MenuItem[],
  "linneabasilika": MenuItem[],
  "troppo": MenuItem[]
}
```

### Force Menu Refresh

Invalidates the cache and immediately re-fetches menus from all restaurants. Useful when a restaurant has updated its menu mid-week.

**Endpoint:** `POST /api/menus/refresh`

**Parameters:** None

**Response:** `200 OK`

```json
{
  "ok": true,
  "refreshed": "2026-02-24T09:55:12.000Z",
  "menus": { ... }
}
```

## Data Types

### MenuItem

Each menu item has the following structure:

| Field   | Type             | Description                                    |
| ------- | ---------------- | ---------------------------------------------- |
| `name`  | `string`         | Name of the dish                               |
| `price` | `number \| null` | Price in SEK. `null` if price is not available |
| `day`   | `string`         | Swedish weekday (`Måndag` through `Fredag`)    |

Courses available throughout the week are returned once for each weekday. The API does not use a
separate weekly value.

## Example Response

```json
{
  "edison": [
    {
      "name": "Pasta Carbonara",
      "price": 115,
      "day": "Måndag"
    },
    {
      "name": "Vegetarisk lasagne",
      "price": 110,
      "day": "Måndag"
    }
  ],
  "bricks": [
    {
      "name": "Fish and Chips",
      "price": null,
      "day": "Tisdag"
    }
  ],
  "kantin": [],
  "smakapakina": [
    {
      "name": "Grillad lax",
      "price": 125,
      "day": "Måndag"
    },
    {
      "name": "Grillad lax",
      "price": 125,
      "day": "Tisdag"
    }
  ],
  "eatery": [],
  "foodhall": [],
  "grenden": [],
  "linneabasilika": [
    {
      "name": "Wokad kycklingfilé med grönsaker",
      "price": 155,
      "day": "Torsdag"
    }
  ],
  "troppo": []
}
```

## Supported Restaurants

| Key              | Restaurant Name   | Location |
| ---------------- | ----------------- | -------- |
| `edison`         | Edison            | Lund     |
| `bricks`         | Brick's Eatery    | Lund     |
| `kantin`         | Kantin            | Lund     |
| `smakapakina`    | Smakapåkina       | Lund     |
| `eatery`         | Eatery            | Lund     |
| `foodhall`       | Food Hall         | Lund     |
| `grenden`        | Grenden           | Lund     |
| `linneabasilika` | Linnea & Basilika | Lund     |
| `troppo`         | Troppo            | Lund     |

## Caching & Data Freshness

- Menu data is cached until the next daily refresh at **10:00 local time**
- A background refresh runs daily at 10:00 and shortly after application startup
- Empty arrays (`[]`) indicate no menu data available or scraper failure for that restaurant
- Data is scraped directly from restaurant websites

## Usage Examples

### JavaScript/Fetch

```javascript
fetch('https://your-deployment-url.vercel.app/api/menus')
  .then(response => response.json())
  .then(data => {
    console.log('Edison menu:', data.edison);
  });
```

### cURL

```bash
curl https://your-deployment-url.vercel.app/api/menus
```

### Python

```python
import requests

response = requests.get('https://your-deployment-url.vercel.app/api/menus')
menus = response.json()
print(menus['edison'])
```

## Error Handling

Individual restaurant scraper failures do not affect the entire API response. If a scraper fails, that restaurant's array will be empty (`[]`).

The API returns HTTP 200 even if some or all scrapers fail, as this is considered normal operation.

## Rate Limiting

No rate limiting is currently enforced, but please be respectful:
- Don't poll more frequently than every 15 minutes
- Cache responses when possible
- The underlying data only updates daily

## Source Code

This API is open source. View the code at: [github.com/morberg/lunch-menu](https://github.com/morberg/lunch-menu)
