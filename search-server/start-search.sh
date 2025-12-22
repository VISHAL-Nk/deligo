#!/bin/bash

echo "🚀 Starting Deligo Search Services with Docker..."
echo ""

# Create network if it doesn't exist
echo "📡 Creating Docker network..."
docker network create deligo-network 2>/dev/null && echo "✅ Network created" || echo "ℹ️  Network already exists"
echo ""

# Start Meilisearch
echo "🔍 Starting Meilisearch..."
docker run -d \
  --name meilisearch \
  --network deligo-network \
  --restart unless-stopped \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=masterKey123 \
  -e MEILI_ENV=production \
  -v meilisearch_data:/meili_data \
  getmeili/meilisearch:v1.11 2>/dev/null && echo "✅ Meilisearch started" || docker start meilisearch && echo "✅ Meilisearch restarted"

# Wait for Meilisearch to be ready
echo "⏳ Waiting for Meilisearch to be ready..."
sleep 5

# Create .env.docker if it doesn't exist
if [ ! -f .env.docker ]; then
    echo "📝 Creating .env.docker..."
    cat > .env.docker <<EOF
MEILISEARCH_URL=http://meilisearch:7700
MEILISEARCH_MASTER_KEY=masterKey123
MONGODB_URI=mongodb+srv://vishalnaik9239_db_user:0EnkmhUlw5dmeP5j@cluster0.0kcemx2.mongodb.net/
MONGODB_DB_NAME=test
SEARCH_SERVER_HOST=0.0.0.0
SEARCH_SERVER_PORT=8001
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
AUTO_INDEX_INTERVAL=300
EOF
    echo "✅ .env.docker created"
fi
echo ""

# Build search server
echo "🔨 Building search server image..."
docker build -t deligo-search-server . || { echo "❌ Build failed"; exit 1; }
echo "✅ Build complete"
echo ""

# Start search server
echo "🚀 Starting search server..."
docker stop search-server 2>/dev/null && docker rm search-server 2>/dev/null
docker run -d \
  --name search-server \
  --network deligo-network \
  --restart unless-stopped \
  -p 8001:8001 \
  --env-file .env.docker \
  deligo-search-server && echo "✅ Search server started" || { echo "❌ Failed to start search server"; exit 1; }

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "═══════════════════════════════════════"
echo "✅ Services Started Successfully!"
echo "═══════════════════════════════════════"
echo "Meilisearch:   http://localhost:7700"
echo "Search Server: http://localhost:8001"
echo "═══════════════════════════════════════"
echo ""

echo "🔍 Checking health status..."
echo ""
curl -s http://localhost:8001/health | python3 -m json.tool 2>/dev/null || curl http://localhost:8001/health
echo ""
echo ""

echo "📊 Checking index stats..."
curl -s http://localhost:8001/index/stats | python3 -m json.tool 2>/dev/null || curl http://localhost:8001/index/stats
echo ""
echo ""

echo "💡 Useful Commands:"
echo "  View logs:      docker logs -f search-server"
echo "  Stop services:  ./stop-search.sh"
echo "  Reindex:        curl -X POST http://localhost:8001/index/reindex"
echo "  Test search:    curl 'http://localhost:8001/autocomplete?q=vitamin'"
echo ""
