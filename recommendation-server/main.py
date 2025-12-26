"""
Deligo Recommendation Engine - FastAPI Application

Production-ready ML-based recommendation microservice for e-commerce.
Provides personalized recommendations using collaborative filtering,
content-based filtering, and hybrid approaches.

API Endpoints:
- GET /recommend/personalized - Personalized recommendations for a user
- GET /recommend/similar-products - Products similar to a given product
- GET /recommend/customers-also-bought - Co-purchase recommendations
- GET /recommend/trending - Trending products by region
- POST /train - Trigger model retraining
- GET /health - Health check endpoint
- GET /status - Service status and model info
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from loguru import logger
import sys

from config import get_settings

# Try to import ML services, handle gracefully if dependencies missing
try:
    from services.data_loader import DataLoader
    from services.training import TrainingPipeline
    from services.inference import InferenceService
    ML_DEPENDENCIES_AVAILABLE = True
    logger.info("✅ ML dependencies loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️ ML dependencies not available: {e}")
    logger.warning("🔧 Recommendation server will run in basic mode without ML features")
    DataLoader = None
    TrainingPipeline = None
    InferenceService = None
    ML_DEPENDENCIES_AVAILABLE = False


# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)
logger.add(
    "logs/recommendation_server.log",
    rotation="100 MB",
    retention="7 days",
    level="DEBUG"
)

# Global services
settings = get_settings()
inference_service: Optional[InferenceService] = None
training_pipeline: Optional[TrainingPipeline] = None


# ============================================================================
# PYDANTIC MODELS FOR REQUEST/RESPONSE
# ============================================================================

class RecommendationItem(BaseModel):
    """Single recommendation item."""
    product_id: str
    score: float
    source: str = "hybrid"
    explanation: str = "Recommended for you"
    scores: Optional[dict] = None


class RecommendationResponse(BaseModel):
    """Standard recommendation response."""
    success: bool
    recommendations: list[RecommendationItem]
    count: int
    type: str
    timestamp: str
    user_id: Optional[str] = None
    source_product_id: Optional[str] = None
    region: Optional[str] = None
    error: Optional[str] = None


class TrainingRequest(BaseModel):
    """Training request parameters."""
    force_retrain: bool = Field(default=False, description="Force retraining even if recent models exist")
    interaction_days: Optional[int] = Field(default=None, description="Only use interactions from last N days")


class TrainingResponse(BaseModel):
    """Training response."""
    success: bool
    message: str
    timestamp: str
    duration_seconds: Optional[float] = None
    data_stats: Optional[dict] = None
    models: Optional[dict] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    version: str = "1.0.0"


class StatusResponse(BaseModel):
    """Service status response."""
    service: str
    is_ready: bool
    models_loaded_at: Optional[str]
    models: dict
    cache: dict
    settings: dict


# ============================================================================
# APPLICATION LIFECYCLE
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    
    Handles startup and shutdown events for proper resource management.
    """
    global inference_service, training_pipeline
    
    # Startup
    logger.info("Starting Deligo Recommendation Engine...")
    
    if ML_DEPENDENCIES_AVAILABLE:
        # Initialize services
        data_loader = DataLoader()
        training_pipeline = TrainingPipeline(data_loader)
        inference_service = InferenceService()
        
        # Initialize inference service (load models)
        await inference_service.initialize()
        
        # Check if models exist, if not, trigger initial training
        if not inference_service.is_ready or (
            inference_service.cf_model is None and 
            inference_service.cb_model is None
        ):
            logger.info("No trained models found - triggering initial training...")
            # Run initial training in background
            asyncio.create_task(_background_training())
    else:
        logger.info("Running in basic mode - ML features disabled")
    
    logger.info("Recommendation Engine started successfully")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("Shutting down Recommendation Engine...")
    if inference_service:
        await inference_service.shutdown()
    if training_pipeline:
        await training_pipeline.cleanup()
    logger.info("Recommendation Engine shut down complete")


def _get_fallback_response(recommendation_type: str, user_id: str = None, 
                         product_id: str = None, region: str = None, n: int = 10) -> RecommendationResponse:
    """Generate a fallback response when ML services are not available."""
    return RecommendationResponse(
        success=True,
        recommendations=[],
        count=0,
        type=recommendation_type,
        timestamp=datetime.utcnow().isoformat(),
        user_id=user_id,
        source_product_id=product_id,
        region=region,
        error="ML services not available - running in basic mode"
    )


async def _background_training():
    """Run training in background without blocking startup."""
    global inference_service, training_pipeline
    
    try:
        await asyncio.sleep(5)  # Wait for services to fully initialize
        
        if training_pipeline:
            result = await training_pipeline.train_all_models()
            
            if result.get("success") and inference_service:
                # Update inference service with new models
                cf_model, cb_model, hybrid_model = training_pipeline.get_models()
                inference_service.update_models(cf_model, cb_model, hybrid_model)
                logger.info("Initial training completed and models loaded")
            else:
                logger.warning(f"Initial training failed: {result.get('error')}")
    except Exception as e:
        logger.error(f"Background training failed: {e}")


# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Deligo Recommendation Engine",
    description="ML-based product recommendation microservice for e-commerce",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# HEALTH & STATUS ENDPOINTS
# ============================================================================

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint.
    
    Returns basic health status for load balancer checks.
    """
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0"
    )


@app.get("/status", response_model=StatusResponse, tags=["System"])
async def get_status():
    """
    Get detailed service status.
    
    Returns information about loaded models, cache, and configuration.
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return StatusResponse(
            service="deligo-recommendation-engine",
            is_ready=True,
            models_loaded_at=None,
            models={"message": "ML dependencies not available - running in basic mode"},
            cache={"enabled": False},
            settings={
                "default_recommendations": 10,
                "max_recommendations": 50,
                "mode": "basic"
            }
        )
    
    status = inference_service.get_service_status()
    
    return StatusResponse(
        service="deligo-recommendation-engine",
        is_ready=status["is_ready"],
        models_loaded_at=status["models_loaded_at"],
        models=status["models"],
        cache=status["cache"],
        settings={
            "default_recommendations": settings.default_num_recommendations,
            "max_recommendations": settings.max_num_recommendations,
            "cache_ttl_seconds": settings.cache_ttl_seconds,
            "weights": {
                "collaborative": settings.weight_collaborative,
                "content": settings.weight_content,
                "popularity": settings.weight_popularity
            }
        }
    )


# ============================================================================
# RECOMMENDATION ENDPOINTS
# ============================================================================

@app.get("/recommend/personalized", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_personalized_recommendations(
    user_id: str = Query(..., description="User identifier"),
    n: int = Query(default=10, ge=1, le=50, description="Number of recommendations"),
    category: Optional[str] = Query(default=None, description="Filter by category ID"),
    realtime: bool = Query(default=False, description="Bypass cache for real-time fresh data")
):
    """
    Get personalized recommendations for a user.
    
    Uses the user's browsing and purchase history to generate personalized
    product recommendations using collaborative filtering and content-based
    approaches.
    
    **Real-time Mode:**
    Set `realtime=true` to bypass cache and get fresh recommendations based on
    latest user activity. Useful after user views/purchases products.
    
    **Response includes:**
    - `recommendations`: List of recommended products with scores
    - `score`: Confidence score (0-1)
    - `source`: Algorithm that contributed most to this recommendation
    - `explanation`: Human-readable reason for the recommendation
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return _get_fallback_response("personalized", user_id=user_id)
    
    result = await inference_service.get_personalized_recommendations(
        user_id=user_id,
        n_recommendations=n,
        category_filter=category,
        realtime=realtime
    )
    
    return _format_response(result)


@app.get("/recommend/similar-products", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_similar_products(
    product_id: str = Query(..., description="Source product identifier"),
    n: int = Query(default=10, ge=1, le=50, description="Number of similar products")
):
    """
    Get products similar to a given product.
    
    Finds products with similar attributes (name, description, category, tags)
    using TF-IDF vectorization and cosine similarity.
    
    **Use cases:**
    - "You might also like" section on product pages
    - "Similar items" carousel
    - Alternative products when out of stock
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return _get_fallback_response("similar_products", product_id=product_id)
    
    result = await inference_service.get_similar_products(
        product_id=product_id,
        n_similar=n
    )
    
    return _format_response(result)


@app.get("/recommend/customers-also-bought", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_customers_also_bought(
    product_id: str = Query(..., description="Source product identifier"),
    n: int = Query(default=10, ge=1, le=50, description="Number of recommendations")
):
    """
    Get products frequently purchased together.
    
    Analyzes purchase patterns to find products that are commonly bought
    together with the given product.
    
    **Use cases:**
    - "Customers also bought" section
    - Cart upsell suggestions
    - Bundle recommendations
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return _get_fallback_response("customers_also_bought", product_id=product_id)
    
    result = await inference_service.get_customers_also_bought(
        product_id=product_id,
        n_recommendations=n
    )
    
    return _format_response(result)


@app.get("/recommend/trending", response_model=RecommendationResponse, tags=["Recommendations"])
async def get_trending_products(
    region: Optional[str] = Query(default=None, description="Region code for location-based trending"),
    n: int = Query(default=10, ge=1, le=50, description="Number of trending products"),
    category: Optional[str] = Query(default=None, description="Filter by category ID")
):
    """
    Get trending products.
    
    Returns products that are currently popular, with optional filtering
    by region for location-based trends.
    
    **Trending calculation:**
    - Recent order volume with time decay
    - Regional popularity (if region specified)
    - Overall platform popularity as fallback
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return _get_fallback_response("trending", region=region)
    
    result = await inference_service.get_trending_products(
        region=region,
        n_recommendations=n,
        category_filter=category
    )
    
    return _format_response(result)


# ============================================================================
# TRAINING ENDPOINTS
# ============================================================================

@app.post("/train", response_model=TrainingResponse, tags=["Training"])
async def train_models(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger model retraining.
    
    Starts a background training job that retrains all recommendation models.
    Training typically takes 1-5 minutes depending on data size.
    
    **Options:**
    - `force_retrain`: Force retraining even if recent models exist
    - `interaction_days`: Only use interactions from the last N days
    
    **Note:** Training runs asynchronously. Check `/train/status` for progress.
    """
    if not ML_DEPENDENCIES_AVAILABLE or not training_pipeline:
        return TrainingResponse(
            success=False,
            message="Training not available - ML dependencies not installed",
            task_id="N/A",
            estimated_duration_minutes=0
        )
    
    if training_pipeline.is_training:
        return TrainingResponse(
            success=False,
            message="Training already in progress",
            timestamp=datetime.utcnow().isoformat(),
            error="Training already in progress"
        )
    
    # Start training in background
    background_tasks.add_task(
        _run_training,
        request.force_retrain,
        request.interaction_days
    )
    
    return TrainingResponse(
        success=True,
        message="Training started in background",
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/train/status", tags=["Training"])
async def get_training_status():
    """
    Get current training status.
    
    Returns information about ongoing or last completed training job.
    """
    if not training_pipeline:
        raise HTTPException(status_code=503, detail="Training service not initialized")
    
    return training_pipeline.get_training_status()


async def _run_training(force_retrain: bool, interaction_days: Optional[int]):
    """Background task for model training."""
    global inference_service, training_pipeline
    
    try:
        result = await training_pipeline.train_all_models(
            force_retrain=force_retrain,
            interaction_days=interaction_days
        )
        
        if result.get("success") and inference_service:
            # Update inference service with new models
            cf_model, cb_model, hybrid_model = training_pipeline.get_models()
            inference_service.update_models(cf_model, cb_model, hybrid_model)
            logger.info("Training completed and models updated")
        else:
            logger.warning(f"Training completed with errors: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Training task failed: {e}")


# ============================================================================
# CACHE MANAGEMENT
# ============================================================================

@app.post("/cache/clear", tags=["System"])
async def clear_cache():
    """
    Clear the recommendation cache.
    
    Forces all subsequent requests to compute fresh recommendations.
    """
    if not ML_DEPENDENCIES_AVAILABLE or not inference_service:
        return {"message": "Cache not available - running in basic mode", "cleared_count": 0}
    
    count = inference_service.clear_cache()
    
    return {
        "success": True,
        "message": f"Cleared {count} cache entries",
        "timestamp": datetime.utcnow().isoformat()
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _format_response(result: dict) -> RecommendationResponse:
    """Format internal result to API response."""
    recommendations = [
        RecommendationItem(
            product_id=rec.get("product_id", ""),
            score=rec.get("score", 0.0),
            source=rec.get("source", "unknown"),
            explanation=rec.get("explanation", "Recommended for you"),
            scores=rec.get("scores")
        )
        for rec in result.get("recommendations", [])
    ]
    
    return RecommendationResponse(
        success=result.get("success", False),
        recommendations=recommendations,
        count=result.get("count", len(recommendations)),
        type=result.get("type", "unknown"),
        timestamp=result.get("timestamp", datetime.utcnow().isoformat()),
        user_id=result.get("user_id"),
        source_product_id=result.get("source_product_id"),
        region=result.get("region"),
        error=result.get("error")
    )


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An unexpected error occurred",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug"
    )
