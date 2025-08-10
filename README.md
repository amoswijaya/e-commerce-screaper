# E-commerce Scraper

A Node.js-based web scraper for e-commerce product listings with AI-powered content extraction.

## Installation

### 1. Clone & Install

```bash
git clone https://github.com/amoswijaya/e-commerce-screaper.git
cd e-commerce-screaper
npm install
```

### 2. Environment Setup

Create your `.env` file (see "Environment Variables" section below).

### 3. Run the Server

```bash
node src/server.js
# or if you have a script:
# npm run start
```

Server defaults to `http://localhost:3000`.

## API Usage

### `GET /scrape`

Scrapes product listings (with pagination) and visits each detail page. Returns normalized JSON with `name`, `price`, `description`, `link` (missing fields are `"-"`).

#### Query Parameters

- `url` (optional): Start URL. Defaults to `START_URL` from `.env`.
- `maxPages` (optional): How many listing pages to crawl. Defaults to `MAX_PAGES`.
- `limit` (optional): Max total items to return. Default `20`.

#### Example Request

```bash
curl -G "http://localhost:3000/scrape" \
  --data-urlencode "url=https://www.ebay.com/sch/i.html?_nkw=nike&_pgn=1" \
  --data-urlencode "maxPages=2" \
  --data-urlencode "limit=30"
```

#### Sample Response

```json
{
  "source": "ebay",
  "startUrl": "https://www.ebay.com/sch/i.html?_nkw=nike&_pgn=1",
  "pagesCrawled": 2,
  "count": 30,
  "items": [
    {
      "name": "Nike Air Max 90 ...",
      "price": 129.99,
      "description": "Brand new with box ...",
      "link": "https://www.ebay.com/itm/xxxxxxxx"
    }
  ]
}
```

## Environment Variables

Create a `.env` file in the project root with:

```ini
# Server
PORT=3000

# DeepSeek (AI extraction)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Scraper defaults
START_URL=https://www.ebay.com/sch/i.html?_from=R40&_nkw=nike&_sacat=0&rt=nc&_pgn=1
MAX_PAGES=2
REQUEST_DELAY_MS=500

# Puppeteer
HEADLESS=new
BLOCK_RESOURCES=image,font,media,stylesheet

# Parallel detail tabs
CONCURRENCY=6

# AI input cap (shorter = faster)
AI_MAX_INPUT_CHARS=8000

# Logging level: error|warn|info|debug
LOG_LEVEL=debug
```

**Important:** Keep your real `DEEPSEEK_API_KEY` **out of version control**. Add `.env` to `.gitign
