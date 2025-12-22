"""
Deligo Search Server - Main FastAPI Application

A high-performance search engine powered by Meilisearch with:
- Typo tolerance
- Synonym support
- Faceted search
- Real-time indexing
- Search analytics
"""
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from config import get_settings
from models import (
    SearchRequest, SearchResponse,
    AutocompleteRequest, AutocompleteResponse,
    IndexProductRequest, BulkIndexRequest, IndexResponse, IndexStats,
    SearchAnalyticsEvent, AnalyticsResponse,
    HealthResponse, ErrorResponse,
)
from services import (
    get_meilisearch_service,
    get_mongodb_service,
    get_indexer_service,
    get_analytics_service,
)

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/search_server.log",
    rotation="10 MB",
    retention="7 days",
    level="DEBUG"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Deligo Search Server...")
    
    try:
        # Initialize services
        indexer = await get_indexer_service()
        
        # Start auto-indexing
        indexer.start_auto_indexing()
        
        logger.info("Search Server started successfully!")
        
    except Exception as e:
        logger.error(f"Failed to start Search Server: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Search Server...")
    
    indexer = await get_indexer_service()
    indexer.stop_auto_indexing()
    
    mongodb = await get_mongodb_service()
    await mongodb.disconnect()
    
    logger.info("Search Server shut down complete")


# Create FastAPI app
app = FastAPI(
    title="Deligo Search Server",
    description="High-performance search engine for Deligo e-commerce platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Health & Status Endpoints ============

@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Returns the status of the search server and its dependencies.
    """
    meilisearch = get_meilisearch_service()
    mongodb = await get_mongodb_service()
    
    meilisearch_healthy = await meilisearch.health_check()
    mongodb_healthy = await mongodb.health_check()
    
    status = "healthy" if (meilisearch_healthy and mongodb_healthy) else "degraded"
    
    return HealthResponse(
        status=status,
        meilisearch_status="connected" if meilisearch_healthy else "disconnected",
        mongodb_status="connected" if mongodb_healthy else "disconnected",
        timestamp=datetime.utcnow(),
    )


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Deligo Search Server",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


# ============ Search Endpoints ============

@app.post("/search", response_model=SearchResponse, tags=["Search"])
async def search_products(
    request: SearchRequest,
    background_tasks: BackgroundTasks,
):
    """
    Search for products with advanced filtering and sorting.
    
    Features:
    - Full-text search with typo tolerance
    - Category, price, rating filters
    - Multiple sort options
    - Faceted search results
    - Highlighted matches
    """
    try:
        meilisearch = get_meilisearch_service()
        analytics = get_analytics_service()
        
        # Perform search
        response = await meilisearch.search(request)
        
        # Track analytics in background
        event = SearchAnalyticsEvent(
            query=request.query,
            results_count=response.total_hits,
            filters_used={
                "category_id": request.category_id,
                "category_name": request.category_name,
                "min_price": request.min_price,
                "max_price": request.max_price,
                "in_stock": request.in_stock,
            }
        )
        background_tasks.add_task(analytics.track_search, event)
        
        return response
        
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search", response_model=SearchResponse, tags=["Search"])
async def search_products_get(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_name: Optional[str] = Query(None, description="Filter by category name"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    in_stock: Optional[bool] = Query(None, description="Only in-stock items"),
    sort_by: str = Query("relevance", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    background_tasks: BackgroundTasks = None,
):
    """
    Search products via GET request (for simpler integrations).
    """
    from models import SortField, SortOrder as SortOrderEnum
    
    request = SearchRequest(
        query=query,
        page=page,
        limit=limit,
        category_id=category_id,
        category_name=category_name,
        min_price=min_price,
        max_price=max_price,
        in_stock=in_stock,
        sort_by=SortField(sort_by) if sort_by in [e.value for e in SortField] else SortField.RELEVANCE,
        sort_order=SortOrderEnum(sort_order) if sort_order in [e.value for e in SortOrderEnum] else SortOrderEnum.DESC,
    )
    
    return await search_products(request, background_tasks)


@app.post("/autocomplete", response_model=AutocompleteResponse, tags=["Search"])
async def autocomplete(request: AutocompleteRequest):
    """
    Get autocomplete suggestions for partial search queries.
    
    Returns:
    - Product name suggestions
    - Category suggestions
    - Popular search terms
    """
    try:
        meilisearch = get_meilisearch_service()
        response = await meilisearch.autocomplete(request)
        return response
        
    except Exception as e:
        logger.error(f"Autocomplete error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/autocomplete", response_model=AutocompleteResponse, tags=["Search"])
async def autocomplete_get(
    q: str = Query(..., min_length=1, description="Partial query"),
    limit: int = Query(10, ge=1, le=20, description="Max suggestions"),
):
    """Get autocomplete suggestions via GET request."""
    request = AutocompleteRequest(query=q, limit=limit)
    return await autocomplete(request)


@app.get("/suggestions", response_model=AutocompleteResponse, tags=["Search"])
async def suggestions(
    q: str = Query(..., min_length=1, description="Partial query"),
    limit: int = Query(10, ge=1, le=20, description="Max suggestions"),
):
    """Alias for autocomplete endpoint (for compatibility)."""
    return await autocomplete_get(q=q, limit=limit)


# ============ Indexing Endpoints ============

@app.post("/index/product", response_model=IndexResponse, tags=["Indexing"])
async def index_single_product(product: IndexProductRequest):
    """
    Index or update a single product.
    Use this for real-time updates when a product is created or modified.
    """
    try:
        indexer = await get_indexer_service()
        response = await indexer.index_single_product(product.id)
        return response
        
    except Exception as e:
        logger.error(f"Index product error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/bulk", response_model=IndexResponse, tags=["Indexing"])
async def bulk_index_products(request: BulkIndexRequest):
    """
    Bulk index multiple products.
    Maximum 1000 products per request.
    """
    try:
        meilisearch = get_meilisearch_service()
        response = await meilisearch.index_products(request.products)
        return response
        
    except Exception as e:
        logger.error(f"Bulk index error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/reindex", response_model=IndexResponse, tags=["Indexing"])
async def full_reindex(background_tasks: BackgroundTasks):
    """
    Trigger a full reindex of all products from MongoDB.
    This is an async operation that runs in the background.
    """
    try:
        indexer = await get_indexer_service()
        
        # Run reindex in background
        background_tasks.add_task(indexer.full_reindex)
        
        return IndexResponse(
            success=True,
            message="Full reindex started in background",
        )
        
    except Exception as e:
        logger.error(f"Reindex error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/index/incremental", response_model=IndexResponse, tags=["Indexing"])
async def incremental_index():
    """
    Perform incremental indexing of recently updated products.
    """
    try:
        indexer = await get_indexer_service()
        response = await indexer.incremental_index()
        return response
        
    except Exception as e:
        logger.error(f"Incremental index error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/index/product/{product_id}", tags=["Indexing"])
async def delete_product_from_index(product_id: str):
    """
    Remove a product from the search index.
    """
    try:
        indexer = await get_indexer_service()
        success = await indexer.delete_product_from_index(product_id)
        
        if success:
            return {"success": True, "message": f"Product {product_id} removed from index"}
        else:
            raise HTTPException(status_code=404, detail="Product not found in index")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete product error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/index/stats", response_model=IndexStats, tags=["Indexing"])
async def get_index_stats():
    """
    Get current index statistics.
    """
    try:
        indexer = await get_indexer_service()
        stats = await indexer.get_index_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Analytics Endpoints ============

@app.get("/analytics", response_model=AnalyticsResponse, tags=["Analytics"])
async def get_search_analytics(
    period: str = Query("last_24h", description="Time period: last_24h, last_7d, last_30d"),
):
    """
    Get search analytics and insights.
    
    Returns:
    - Total searches
    - Top queries
    - Zero-result queries
    - Popular categories
    - Search trends
    """
    try:
        analytics = get_analytics_service()
        response = await analytics.get_analytics(period)
        return response
        
    except Exception as e:
        logger.error(f"Analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analytics/track-click", tags=["Analytics"])
async def track_search_click(
    query: str = Query(..., description="Search query"),
    product_id: str = Query(..., description="Clicked product ID"),
    position: int = Query(..., ge=1, description="Position in results"),
    user_id: Optional[str] = Query(None, description="User ID if logged in"),
    session_id: Optional[str] = Query(None, description="Session ID"),
):
    """
    Track when a user clicks on a search result.
    Used for improving search relevance.
    """
    try:
        analytics = get_analytics_service()
        await analytics.track_click(
            query=query,
            product_id=product_id,
            position=position,
            user_id=user_id,
            session_id=session_id,
        )
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Track click error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ Error Handlers ============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error=exc.detail,
            code=f"HTTP_{exc.status_code}",
        ).model_dump(mode='json'),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle unexpected exceptions."""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content=ErrorResponse(
            error="Internal server error",
            detail=str(exc) if settings.meilisearch_master_key == "deligo_search_master_key_2024" else None,
            code="INTERNAL_ERROR",
        ).model_dump(mode='json'),
    )


# ============ Run Server ============

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.search_server_host,
        port=settings.search_server_port,
        reload=True,
        log_level="info",
    )
