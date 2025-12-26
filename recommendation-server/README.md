# Deligo Recommendation Engine

Production-ready ML-based recommendation microservice for e-commerce applications.

## Features

- **Collaborative Filtering**: User-based recommendations using implicit feedback (views, cart, purchases)
- **Content-Based Filtering**: Product similarity using TF-IDF vectorization
- **Hybrid Recommendations**: Combines CF, content, and popularity with configurable weights
- **Cold-Start Handling**: Graceful fallback to popularity-based recommendations
- **Real-time Inference**: Low-latency recommendations with caching
- **Background Training**: Automatic model retraining without service interruption
- **Docker Support**: Production-ready containerization

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/recommend/personalized` | GET | Personalized recommendations for a user |
| `/recommend/similar-products` | GET | Products similar to a given product |
| `/recommend/customers-also-bought` | GET | Co-purchase recommendations |
| `/recommend/trending` | GET | Trending products by region |
| `/train` | POST | Trigger model retraining |
| `/train/status` | GET | Get training status |
| `/health` | GET | Health check |
| `/status` | GET | Service status and model info |
| `/cache/clear` | POST | Clear recommendation cache |

## Quick Start

### Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017

# Create directories
mkdir -p trained_models logs

# Run the server
python main.py
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f recommendation-engine

# Stop the service
docker-compose down
```

## API Usage Examples

### Get Personalized Recommendations

```bash
curl "http://localhost:8000/recommend/personalized?user_id=USER_ID&n=10"
```

Response:
```json
{
  "success": true,
  "recommendations": [
    {
      "product_id": "abc123",
      "score": 0.85,
      "source": "user_behavior",
      "explanation": "Based on your browsing and purchase history"
    }
  ],
  "count": 10,
  "type": "personalized",
  "user_id": "USER_ID"
}
```

### Get Similar Products

```bash
curl "http://localhost:8000/recommend/similar-products?product_id=PRODUCT_ID&n=10"
```

### Get Customers Also Bought

```bash
curl "http://localhost:8000/recommend/customers-also-bought?product_id=PRODUCT_ID&n=10"
```

### Get Trending Products

```bash
# Global trending
curl "http://localhost:8000/recommend/trending?n=10"

# Regional trending
curl "http://localhost:8000/recommend/trending?region=Karnataka&n=10"
```

### Trigger Model Training

```bash
curl -X POST "http://localhost:8000/train" \
  -H "Content-Type: application/json" \
  -d '{"force_retrain": true}'
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |
| `DEBUG` | `false` | Enable debug mode |
| `MONGODB_URI` | `mongodb://localhost:27017` | MongoDB connection URI |
| `MONGODB_DB_NAME` | `deligo` | Database name |
| `MODEL_DIR` | `./trained_models` | Directory for model storage |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `WEIGHT_COLLABORATIVE` | `0.4` | CF weight in hybrid model |
| `WEIGHT_CONTENT` | `0.35` | Content weight in hybrid model |
| `WEIGHT_POPULARITY` | `0.25` | Popularity weight in hybrid model |
| `CACHE_TTL_SECONDS` | `300` | Cache TTL (5 minutes) |
| `RETRAIN_INTERVAL_HOURS` | `24` | Hours between retraining |

### Hybrid Model Weights

The hybrid model combines three signals:
- **Collaborative (0.4)**: User behavior patterns
- **Content (0.35)**: Product similarity
- **Popularity (0.25)**: Overall product popularity

Adjust weights based on your data characteristics:
- More user data → Increase collaborative weight
- New products → Increase content weight
- Cold-start users → Increase popularity weight

## Architecture

```
recommendation-server/
├── main.py                 # FastAPI application
├── config.py               # Configuration and settings
├── models/
│   ├── collaborative.py    # Collaborative filtering (SVD-based)
│   ├── content_based.py    # Content-based filtering (TF-IDF)
│   └── hybrid.py           # Hybrid recommender
├── services/
│   ├── data_loader.py      # MongoDB data loading
│   ├── training.py         # Training pipeline
│   └── inference.py        # Recommendation serving
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## ML Models

### Collaborative Filtering

- Uses implicit feedback (views, cart, purchases) with different weights
- Matrix factorization via truncated SVD
- Handles cold-start users with popularity fallback
- Pre-computes item-item similarity for "also bought" recommendations

### Content-Based Filtering

- TF-IDF vectorization of product text (name, description, category, tags)
- Cosine similarity for finding similar products
- Supports category-filtered recommendations
- Works well for new products without interaction history

### Hybrid Model

- Weighted combination of CF, content, and popularity scores
- Dynamic weight adjustment for cold-start scenarios
- Caching for frequently requested recommendations
- Supports regional trending with time decay

## Integration with Next.js

Add the recommendation client to your Next.js application:

```typescript
// src/lib/recommendations.ts
const RECOMMENDATION_SERVER_URL = process.env.RECOMMENDATION_SERVER_URL || 'http://localhost:8000';

export async function getPersonalizedRecommendations(userId: string, n = 10) {
  const response = await fetch(
    `${RECOMMENDATION_SERVER_URL}/recommend/personalized?user_id=${userId}&n=${n}`
  );
  return response.json();
}

export async function getSimilarProducts(productId: string, n = 10) {
  const response = await fetch(
    `${RECOMMENDATION_SERVER_URL}/recommend/similar-products?product_id=${productId}&n=${n}`
  );
  return response.json();
}
```

## Performance

- Typical inference latency: 10-50ms
- Cache hit ratio: ~60-80% (depends on traffic patterns)
- Training time: 1-5 minutes (depends on data size)
- Memory usage: 512MB-2GB (depends on model size)

## Monitoring

- Logs are written to `logs/recommendation_server.log`
- Health check at `/health` for load balancer
- Detailed status at `/status` including model info

## License

MIT License - See LICENSE file for details.
