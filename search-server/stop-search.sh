#!/bin/bash

echo "🛑 Stopping Deligo Search Services..."
echo ""

docker stop search-server meilisearch 2>/dev/null

echo "✅ Services stopped"
echo ""
echo "To start again: ./start-search.sh"
echo "To remove completely: docker rm search-server meilisearch"
echo ""
