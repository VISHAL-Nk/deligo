"""
Inference Service

Handles serving recommendations with low latency.
Provides:
- Model loading at startup
- Caching for frequently requested recommendations
- Request validation and error handling
- Fallback strategies for degraded performance
"""

import asyncio
from datetime import datetime
from typing import Optional
from cachetools import TTLCache
from loguru import logger

from config import get_settings
from models.collaborative import CollaborativeFilteringModel
from models.content_based import ContentBasedModel
from models.hybrid import HybridRecommender
from services.training import ModelLoader
from services.data_loader import DataLoader


class InferenceService:
    """
    Inference service for serving recommendations.
    
    This service handles all recommendation requests and provides:
    - Low-latency model inference
    - Result caching with TTL
    - Cold-start handling
    - Fallback to popularity-based recommendations
    - Request validation and sanitization
    """
    
    def __init__(self):
        """Initialize the inference service."""
        self.settings = get_settings()
        
        # Models
        self.cf_model: Optional[CollaborativeFilteringModel] = None
        self.cb_model: Optional[ContentBasedModel] = None
        self.hybrid_model: Optional[HybridRecommender] = None
        
        # Cache for recommendations
        # Key: (request_type, params_hash) -> recommendations
        self.cache: TTLCache = TTLCache(
            maxsize=self.settings.cache_max_size,
            ttl=self.settings.cache_ttl_seconds
        )
        
        # Data loader for user history lookups
        self.data_loader = DataLoader()
        
        # Service state
        self.is_ready = False
        self.models_loaded_at: Optional[datetime] = None
    
    async def initialize(self) -> bool:
        """
        Initialize the inference service by loading models.
        
        Called at application startup.
        
        Returns:
            True if at least one model was loaded successfully
        """
        logger.info("Initializing inference service...")
        
        try:
            # Load models from disk
            self.cf_model, self.cb_model, self.hybrid_model = ModelLoader.load_models(
                self.settings.model_dir
            )
            
            # Connect data loader
            await self.data_loader.connect()
            
            # Check if we have at least one working model
            models_available = (
                (self.cf_model is not None and self.cf_model.is_trained) or
                (self.cb_model is not None and self.cb_model.is_trained) or
                (self.hybrid_model is not None and self.hybrid_model.is_trained)
            )
            
            if models_available:
                self.is_ready = True
                self.models_loaded_at = datetime.utcnow()
                logger.info("Inference service initialized successfully")
            else:
                logger.warning("No trained models found - inference service running in degraded mode")
                self.is_ready = True  # Still ready, but with limited functionality
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize inference service: {e}")
            self.is_ready = False
            return False
    
    async def shutdown(self) -> None:
        """Clean up resources on shutdown."""
        await self.data_loader.disconnect()
        self.cache.clear()
        logger.info("Inference service shut down")
    
    def update_models(
        self,
        cf_model: Optional[CollaborativeFilteringModel],
        cb_model: Optional[ContentBasedModel],
        hybrid_model: Optional[HybridRecommender]
    ) -> None:
        """
        Update models after retraining.
        
        This allows hot-swapping models without service restart.
        """
        self.cf_model = cf_model
        self.cb_model = cb_model
        self.hybrid_model = hybrid_model
        
        # Clear cache since models changed
        self.cache.clear()
        
        self.models_loaded_at = datetime.utcnow()
        logger.info("Models updated in inference service")
    
    # =========================================================================
    # RECOMMENDATION ENDPOINTS
    # =========================================================================
    
    async def get_personalized_recommendations(
        self,
        user_id: str,
        n_recommendations: int = 10,
        category_filter: Optional[str] = None,
        realtime: bool = False
    ) -> dict:
        """
        Get personalized recommendations for a user.
        
        Uses recently viewed products from preferences to find similar items
        and prioritizes based on recency and frequency.
        
        Args:
            user_id: User identifier
            n_recommendations: Number of recommendations to return
            category_filter: Optional category to filter by
            realtime: If True, bypass cache for fresh real-time data
        
        Returns:
            Recommendation response dict
        """
        # Validate input
        n_recommendations = self._validate_n_recommendations(n_recommendations)
        
        # Check cache (skip if realtime mode)
        cache_key = f"personalized:{user_id}:{n_recommendations}:{category_filter}"
        if not realtime and cache_key in self.cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        try:
            recommendations = []
            seen_products = set()
            
            # 1. Get user's recently viewed products from preferences
            recently_viewed = await self.data_loader.get_user_recently_viewed(user_id, limit=20)
            recently_viewed_ids = [rv["product_id"] for rv in recently_viewed]
            
            logger.info(f"User {user_id} has {len(recently_viewed)} recently viewed products")
            
            # 2. Get similar products to recently viewed items (excluding recently viewed)
            if recently_viewed and self.hybrid_model and self.hybrid_model.is_trained:
                seen_products.update(recently_viewed_ids)  # Don't recommend same recently viewed
                for rv in recently_viewed[:5]:  # Use top 5 most recent
                    similar = self.hybrid_model.get_similar_products(
                        product_id=rv["product_id"],
                        n_similar=5
                    )
                    for rec in similar:
                        if rec["product_id"] not in seen_products:
                            seen_products.add(rec["product_id"])
                            # Boost score by recency weight
                            rec["score"] = rec["score"] * rv["recency_weight"]
                            rec["explanation"] = "Similar to products you viewed"
                            recommendations.append(rec)
            
            # 3. Use collaborative filtering for additional recommendations
            if len(recommendations) < n_recommendations:
                if self.hybrid_model and self.hybrid_model.is_trained:
                    cf_recs = self.hybrid_model.get_personalized_recommendations(
                        user_id=user_id,
                        n_recommendations=n_recommendations,
                        exclude_product_ids=list(seen_products),
                        category_filter=category_filter
                    )
                    for rec in cf_recs:
                        if rec["product_id"] not in seen_products:
                            seen_products.add(rec["product_id"])
                            recommendations.append(rec)
                            if len(recommendations) >= n_recommendations:
                                break
            
            # 4. Fallback to popularity if not enough recommendations
            if len(recommendations) < n_recommendations:
                logger.info(f"Adding popularity fallback. Current recs: {len(recommendations)}")
                fallback = await self._get_popularity_fallback(
                    n_recommendations,
                    []  # Don't pre-exclude, we'll handle below
                )
                # First add products not in seen_products
                for rec in fallback:
                    if len(recommendations) >= n_recommendations:
                        break
                    if rec["product_id"] not in seen_products:
                        seen_products.add(rec["product_id"])
                        rec["explanation"] = "Popular among customers"
                        recommendations.append(rec)
                
                # If still not enough, add popular products even if recently viewed
                # (User showed interest, so recommending similar popular items is valid)
                if len(recommendations) < n_recommendations:
                    for rec in fallback:
                        if len(recommendations) >= n_recommendations:
                            break
                        if rec["product_id"] not in [r["product_id"] for r in recommendations]:
                            rec["explanation"] = "Trending product you might like"
                            recommendations.append(rec)
            
            # Sort by score and limit
            recommendations.sort(key=lambda x: x["score"], reverse=True)
            recommendations = recommendations[:n_recommendations]
            
            logger.info(f"Final recommendations count: {len(recommendations)}")
            
            response = {
                "success": True,
                "user_id": user_id,
                "recommendations": recommendations,
                "count": len(recommendations),
                "type": "personalized",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            # Cache the result
            self.cache[cache_key] = response
            
            return response
            
        except Exception as e:
            logger.error(f"Error getting personalized recommendations: {e}")
            return self._error_response(str(e))
    
    async def get_similar_products(
        self,
        product_id: str,
        n_similar: int = 10
    ) -> dict:
        """
        Get products similar to a given product.
        
        Args:
            product_id: Source product identifier
            n_similar: Number of similar products to return
        
        Returns:
            Recommendation response dict
        """
        n_similar = self._validate_n_recommendations(n_similar)
        
        # Check cache
        cache_key = f"similar:{product_id}:{n_similar}"
        if cache_key in self.cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        try:
            # Verify product exists
            product = await self.data_loader.load_product_by_id(product_id)
            if not product:
                return {
                    "success": False,
                    "error": f"Product {product_id} not found",
                    "recommendations": [],
                    "count": 0
                }
            
            # Get similar products
            if self.hybrid_model and self.hybrid_model.is_trained:
                recommendations = self.hybrid_model.get_similar_products(
                    product_id=product_id,
                    n_similar=n_similar
                )
            elif self.cb_model and self.cb_model.is_trained:
                # Fallback to content-only
                similar = self.cb_model.get_similar_products(
                    product_id=product_id,
                    n_similar=n_similar
                )
                recommendations = [
                    {
                        "product_id": pid,
                        "score": score,
                        "source": "content_similarity",
                        "explanation": "Similar product features"
                    }
                    for pid, score in similar
                ]
            else:
                recommendations = []
            
            response = {
                "success": True,
                "source_product_id": product_id,
                "recommendations": recommendations,
                "count": len(recommendations),
                "type": "similar_products",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.cache[cache_key] = response
            return response
            
        except Exception as e:
            logger.error(f"Error getting similar products: {e}")
            return self._error_response(str(e))
    
    async def get_customers_also_bought(
        self,
        product_id: str,
        n_recommendations: int = 10
    ) -> dict:
        """
        Get products frequently bought together.
        
        Args:
            product_id: Source product identifier
            n_recommendations: Number of recommendations to return
        
        Returns:
            Recommendation response dict
        """
        n_recommendations = self._validate_n_recommendations(n_recommendations)
        
        # Check cache
        cache_key = f"also_bought:{product_id}:{n_recommendations}"
        if cache_key in self.cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        try:
            # Verify product exists
            product = await self.data_loader.load_product_by_id(product_id)
            if not product:
                return {
                    "success": False,
                    "error": f"Product {product_id} not found",
                    "recommendations": [],
                    "count": 0
                }
            
            # Get co-purchase recommendations
            if self.hybrid_model and self.hybrid_model.is_trained:
                recommendations = self.hybrid_model.get_customers_also_bought(
                    product_id=product_id,
                    n_recommendations=n_recommendations
                )
            elif self.cf_model and self.cf_model.is_trained:
                # Fallback to CF-only
                also_bought = self.cf_model.get_users_who_bought_also_bought(
                    product_id=product_id,
                    n_recommendations=n_recommendations
                )
                recommendations = [
                    {
                        "product_id": pid,
                        "score": score,
                        "source": "co_purchase",
                        "explanation": "Customers who bought this also bought"
                    }
                    for pid, score in also_bought
                ]
            else:
                # Fallback to similar products
                return await self.get_similar_products(product_id, n_recommendations)
            
            response = {
                "success": True,
                "source_product_id": product_id,
                "recommendations": recommendations,
                "count": len(recommendations),
                "type": "customers_also_bought",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.cache[cache_key] = response
            return response
            
        except Exception as e:
            logger.error(f"Error getting customers also bought: {e}")
            return self._error_response(str(e))
    
    async def get_trending_products(
        self,
        region: Optional[str] = None,
        n_recommendations: int = 10,
        category_filter: Optional[str] = None
    ) -> dict:
        """
        Get trending products, optionally filtered by region.
        
        Args:
            region: Optional region code for location-based trending
            n_recommendations: Number of recommendations to return
            category_filter: Optional category to filter by
        
        Returns:
            Recommendation response dict
        """
        n_recommendations = self._validate_n_recommendations(n_recommendations)
        
        # Check cache
        cache_key = f"trending:{region}:{n_recommendations}:{category_filter}"
        if cache_key in self.cache:
            logger.debug(f"Cache hit for {cache_key}")
            return self.cache[cache_key]
        
        try:
            if self.hybrid_model and self.hybrid_model.is_trained:
                recommendations = self.hybrid_model.get_trending_recommendations(
                    region=region,
                    n_recommendations=n_recommendations,
                    category_filter=category_filter
                )
            else:
                # Fallback to popularity from database
                recommendations = await self._get_popularity_fallback(
                    n_recommendations,
                    []
                )
            
            response = {
                "success": True,
                "region": region,
                "recommendations": recommendations,
                "count": len(recommendations),
                "type": "trending",
                "timestamp": datetime.utcnow().isoformat()
            }
            
            self.cache[cache_key] = response
            return response
            
        except Exception as e:
            logger.error(f"Error getting trending products: {e}")
            return self._error_response(str(e))
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _validate_n_recommendations(self, n: int) -> int:
        """Validate and constrain number of recommendations."""
        return max(1, min(n, self.settings.max_num_recommendations))
    
    async def _get_popularity_fallback(
        self,
        n_recommendations: int,
        exclude_products: list[str]
    ) -> list[dict]:
        """
        Fallback to popularity-based recommendations.
        
        Used when models are not available or for cold-start scenarios.
        """
        try:
            popularity_df = await self.data_loader.load_popularity_scores()
            
            if popularity_df.empty:
                return []
            
            exclude_set = set(exclude_products)
            
            recommendations = []
            for _, row in popularity_df.sort_values(
                "popularity_score", ascending=False
            ).iterrows():
                if len(recommendations) >= n_recommendations:
                    break
                
                product_id = row["product_id"]
                if product_id not in exclude_set:
                    recommendations.append({
                        "product_id": product_id,
                        "score": float(row["popularity_score"]),
                        "source": "popularity",
                        "explanation": "Popular among customers"
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Popularity fallback failed: {e}")
            return []
    
    def _error_response(self, error: str) -> dict:
        """Create standardized error response."""
        return {
            "success": False,
            "error": error,
            "recommendations": [],
            "count": 0,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def get_service_status(self) -> dict:
        """Get current service status and statistics."""
        return {
            "is_ready": self.is_ready,
            "models_loaded_at": self.models_loaded_at.isoformat() if self.models_loaded_at else None,
            "models": {
                "collaborative": {
                    "loaded": self.cf_model is not None,
                    "trained": self.cf_model.is_trained if self.cf_model else False,
                    "info": self.cf_model.get_model_info() if self.cf_model else None
                },
                "content_based": {
                    "loaded": self.cb_model is not None,
                    "trained": self.cb_model.is_trained if self.cb_model else False,
                    "info": self.cb_model.get_model_info() if self.cb_model else None
                },
                "hybrid": {
                    "loaded": self.hybrid_model is not None,
                    "trained": self.hybrid_model.is_trained if self.hybrid_model else False,
                    "info": self.hybrid_model.get_model_info() if self.hybrid_model else None
                }
            },
            "cache": {
                "size": len(self.cache),
                "max_size": self.cache.maxsize,
                "ttl_seconds": self.cache.ttl
            }
        }
    
    def clear_cache(self) -> int:
        """Clear recommendation cache. Returns number of entries cleared."""
        count = len(self.cache)
        self.cache.clear()
        logger.info(f"Cleared {count} cache entries")
        return count
