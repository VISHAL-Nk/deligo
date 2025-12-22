# 🔍 Deligo Search Server

A high-performance search engine for the Deligo e-commerce platform, powered by **Meilisearch** and **FastAPI**.

## ✨ Features

- **🎯 Typo Tolerance** - Finds products even with spelling mistakes
- **📚 Synonym Support** - "phone" matches "mobile", "smartphone", etc.
- **⚡ Lightning Fast** - Sub-50ms search responses
- **🏷️ Faceted Search** - Filter by category, price, rating, stock
- **🔮 Autocomplete** - Real-time search suggestions
- **📊 Analytics** - Track popular searches, zero-result queries
- **🔄 Real-time Indexing** - Products indexed instantly on creation/update
- **📈 Relevance Tuning** - Popular products rank higher

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Search Server   │────▶│   Meilisearch   │
│   (Frontend)    │     │    (FastAPI)     │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │     MongoDB      │
                        │  (Source Data)   │
                        └──────────────────┘
```

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Navigate to search-server directory
cd search-server

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB URI
nano .env

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Manual Installation

1. **Install Meilisearch**
   ```bash
   # macOS
   brew install meilisearch
   
   # Or download from https://www.meilisearch.com/docs/learn/getting_started/installation
   ```

2. **Start Meilisearch**
   ```bash
   meilisearch --master-key="deligo_search_master_key_2024"
   ```

3. **Install Python Dependencies**
   ```bash
   cd search-server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Run the Server**
   ```bash
   python main.py
   # Or: uvicorn main:app --reload --port 8001
   ```

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc
- **Health Check**: http://localhost:8001/health

### Key Endpoints

#### Search Products
```http
POST /search
Content-Type: application/json

{
  "query": "iphone",
  "page": 1,
  "limit": 20,
  "category_name": "Electronics",
  "min_price": 10000,
  "max_price": 100000,
  "in_stock": true,
  "sort_by": "price",
  "sort_order": "asc"
}
```

#### Autocomplete
```http
GET /autocomplete?q=iph&limit=10
```

#### Index a Product (Webhook)
```http
POST /index/product
Content-Type: application/json

{
  "id": "product_id",
  "name": "iPhone 15",
  "description": "Latest Apple smartphone",
  "price": 79999,
  "category_id": "cat_id",
  "category_name": "Electronics",
  "seller_id": "seller_id",
  "stock": 100,
  "status": "active"
}
```

#### Trigger Full Reindex
```http
POST /index/reindex
```

#### Get Analytics
```http
GET /analytics?period=last_7d
```

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MEILISEARCH_URL` | Meilisearch server URL | `http://localhost:7700` |
| `MEILISEARCH_MASTER_KEY` | Meilisearch API key | `deligo_search_master_key_2024` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB_NAME` | Database name | `deligo` |
| `SEARCH_SERVER_PORT` | Server port | `8001` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:3000` |
| `AUTO_INDEX_INTERVAL` | Auto-index interval in seconds | `300` |

### Search Configuration

The search is configured with:
- **Searchable Fields**: name, description, category_name, sku, seo_tags
- **Filterable Fields**: category_id, price, stock, status, rating
- **Sortable Fields**: price, created_at, order_count, view_count, rating

### Synonyms

Pre-configured synonyms include:
```python
{
    "phone": ["mobile", "smartphone", "cellphone"],
    "laptop": ["notebook", "computer", "pc"],
    "tv": ["television", "smart tv"],
    "cheap": ["affordable", "budget", "discount"],
    # ... more in config.py
}
```

## 🔗 Next.js Integration

### Add to Next.js

1. **Add environment variable**
   ```env
   SEARCH_SERVER_URL=http://localhost:8001
   ```

2. **Create search utility**
   ```typescript
   // src/lib/search.ts
   const SEARCH_URL = process.env.SEARCH_SERVER_URL || 'http://localhost:8001';

   export async function searchProducts(query: string, options?: SearchOptions) {
     const response = await fetch(`${SEARCH_URL}/search`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ query, ...options }),
     });
     return response.json();
   }

   export async function getAutocomplete(query: string) {
     const response = await fetch(`${SEARCH_URL}/autocomplete?q=${encodeURIComponent(query)}&limit=10`);
     return response.json();
   }
   ```

3. **Webhook for Product Updates**
   In your product create/update API:
   ```typescript
   // After saving product to MongoDB
   await fetch(`${SEARCH_URL}/index/product`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       id: product._id.toString(),
       name: product.name,
       // ... other fields
     }),
   });
   ```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8001/health
```

### Index Statistics
```bash
curl http://localhost:8001/index/stats
```

### Search Analytics
```bash
curl http://localhost:8001/analytics?period=last_24h
```

## 🧪 Testing

```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run tests
pytest tests/
```

## 🐳 Production Deployment

### Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  meilisearch:
    image: getmeili/meilisearch:v1.6
    environment:
      - MEILI_ENV=production
      - MEILI_MASTER_KEY=${MEILISEARCH_MASTER_KEY}
    volumes:
      - meilisearch_data:/meili_data
    deploy:
      resources:
        limits:
          memory: 2G

  search-server:
    build: .
    environment:
      - MEILISEARCH_URL=http://meilisearch:7700
      - MONGODB_URI=${MONGODB_URI}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
```

### Kubernetes

See `k8s/` directory for Kubernetes manifests.

## 🔒 Security

- Always set a strong `MEILISEARCH_MASTER_KEY` in production
- Use environment variables for sensitive data
- Configure CORS appropriately
- Consider rate limiting for public endpoints

## 📈 Performance Tips

1. **Index Optimization**: Run full reindex during off-peak hours
2. **Batch Indexing**: Use `/index/bulk` for multiple products
3. **Caching**: Add Redis cache for repeated queries
4. **Monitoring**: Track response times and adjust resources

## 📝 License

MIT License - Part of the Deligo E-commerce Platform
