"""
Hybrid Recommendation Model

Combines multiple recommendation strategies into a unified model:
1. Collaborative Filtering - User behavior patterns
2. Content-Based Filtering - Product similarity
3. Popularity-Based - Trending and popular items

The hybrid approach addresses the limitations of each individual method:
- CF handles cold-start users poorly -> Use popularity/content
- Content-based has filter bubble issues -> Use CF for diversity
- Popularity is not personalized -> Use CF for personalization
"""

import numpy as np
import pandas as pd
from typing import Optional
import joblib
from loguru import logger
from pathlib import Path
from datetime import datetime, timedelta

from config import get_settings, TRENDING_DECAY_FACTOR
from .collaborative import CollaborativeFilteringModel
from .content_based import ContentBasedModel


class HybridRecommender:
    """
    Hybrid recommendation model that combines multiple recommendation strategies.
    
    Score calculation:
    final_score = w_cf * cf_score + w_cb * cb_score + w_pop * pop_score
    
    Where:
    - w_cf: Weight for collaborative filtering (default: 0.4)
    - w_cb: Weight for content-based filtering (default: 0.35)
    - w_pop: Weight for popularity (default: 0.25)
    
    The weights are adjusted dynamically based on:
    - User's interaction history (more history -> higher CF weight)
    - Product's age (newer products -> higher content weight)
    - Request context (trending requests -> higher popularity weight)
    """
    
    def __init__(
        self,
        cf_model: Optional[CollaborativeFilteringModel] = None,
        cb_model: Optional[ContentBasedModel] = None,
        weight_collaborative: float = 0.4,
        weight_content: float = 0.35,
        weight_popularity: float = 0.25
    ):
        """
        Initialize the hybrid recommender.
        
        Args:
            cf_model: Pre-trained collaborative filtering model (optional)
            cb_model: Pre-trained content-based model (optional)
            weight_collaborative: Weight for CF scores (0-1)
            weight_content: Weight for content-based scores (0-1)
            weight_popularity: Weight for popularity scores (0-1)
        """
        self.settings = get_settings()
        
        # Sub-models
        self.cf_model = cf_model
        self.cb_model = cb_model
        
        # Weights (should sum to 1.0)
        self.weight_collaborative = weight_collaborative
        self.weight_content = weight_content
        self.weight_popularity = weight_popularity
        
        # Popularity data
        self.product_popularity: dict[str, float] = {}
        self.trending_scores: dict[str, float] = {}
        self.regional_popularity: dict[str, dict[str, float]] = {}
        
        # Product metadata for filtering and enrichment
        self.product_metadata: dict[str, dict] = {}
        
        # Model state
        self.is_trained = False
        self.last_training_time: Optional[datetime] = None
    
    def set_models(
        self,
        cf_model: CollaborativeFilteringModel,
        cb_model: ContentBasedModel
    ) -> None:
        """Set or update the sub-models."""
        self.cf_model = cf_model
        self.cb_model = cb_model
        logger.info("Sub-models updated in hybrid recommender")
    
    def set_popularity_data(
        self,
        popularity_df: pd.DataFrame,
        trending_df: Optional[pd.DataFrame] = None
    ) -> None:
        """
        Set popularity and trending data.
        
        Args:
            popularity_df: DataFrame with columns: product_id, popularity_score
            trending_df: Optional DataFrame with columns: product_id, date, order_count
        """
        # Store product popularity
        if not popularity_df.empty:
            self.product_popularity = dict(zip(
                popularity_df["product_id"],
                popularity_df["popularity_score"]
            ))
            
            # Store additional metadata
            for col in ["order_count", "view_count", "review_count"]:
                if col in popularity_df.columns:
                    for _, row in popularity_df.iterrows():
                        pid = row["product_id"]
                        if pid not in self.product_metadata:
                            self.product_metadata[pid] = {}
                        self.product_metadata[pid][col] = row[col]
        
        # Calculate trending scores with time decay
        if trending_df is not None and not trending_df.empty:
            self._calculate_trending_scores(trending_df)
        
        logger.info(f"Popularity data set: {len(self.product_popularity)} products")
    
    def _calculate_trending_scores(self, trending_df: pd.DataFrame) -> None:
        """
        Calculate trending scores with time decay.
        
        More recent orders have higher weight.
        Score decay factor is applied per day.
        """
        self.trending_scores = {}
        
        # Group by product and aggregate with time decay
        today = datetime.utcnow().date()
        
        for product_id in trending_df["product_id"].unique():
            product_data = trending_df[trending_df["product_id"] == product_id]
            
            score = 0.0
            for _, row in product_data.iterrows():
                order_date = datetime.strptime(row["date"], "%Y-%m-%d").date()
                days_ago = (today - order_date).days
                
                # Apply decay factor based on age
                decay = TRENDING_DECAY_FACTOR ** days_ago
                score += row["order_count"] * decay
            
            self.trending_scores[product_id] = score
        
        # Normalize to 0-1 range
        if self.trending_scores:
            max_score = max(self.trending_scores.values())
            if max_score > 0:
                self.trending_scores = {
                    pid: score / max_score
                    for pid, score in self.trending_scores.items()
                }
    
    def set_regional_popularity(self, regional_data: dict[str, pd.DataFrame]) -> None:
        """
        Set regional popularity data for location-based trending.
        
        Args:
            regional_data: Dict mapping region code to popularity DataFrame
        """
        for region, df in regional_data.items():
            if not df.empty:
                self.regional_popularity[region] = dict(zip(
                    df["product_id"],
                    df["popularity_score"]
                ))
        
        logger.info(f"Regional popularity set for {len(self.regional_popularity)} regions")
    
    # =========================================================================
    # RECOMMENDATION METHODS
    # =========================================================================
    
    def get_personalized_recommendations(
        self,
        user_id: str,
        n_recommendations: int = 10,
        exclude_product_ids: Optional[list[str]] = None,
        category_filter: Optional[str] = None
    ) -> list[dict]:
        """
        Get personalized recommendations for a user.
        
        Combines CF personalization with content diversity and popularity.
        
        Args:
            user_id: User identifier
            n_recommendations: Number of recommendations to return
            exclude_product_ids: Products to exclude (e.g., already purchased)
            category_filter: Optional category to filter by
        
        Returns:
            List of recommendation dicts with product_id, score, and explanation
        """
        exclude_set = set(exclude_product_ids or [])
        
        # Collect scores from all models
        all_scores: dict[str, dict] = {}
        
        # 1. Get collaborative filtering scores
        cf_available = (
            self.cf_model is not None and 
            self.cf_model.is_trained and
            user_id in self.cf_model.user_to_idx
        )
        
        if cf_available:
            cf_recs = self.cf_model.recommend_for_user(
                user_id, 
                n_recommendations=n_recommendations * 3,
                exclude_interacted=True
            )
            for product_id, score in cf_recs:
                if product_id not in exclude_set:
                    all_scores[product_id] = {"cf_score": score}
        
        # 2. Get content-based scores (based on user's history)
        if self.cb_model is not None and self.cb_model.is_trained:
            # Get user's interaction history for content-based
            user_history = []
            if self.cf_model and hasattr(self.cf_model, 'interaction_matrix'):
                if user_id in self.cf_model.user_to_idx:
                    user_idx = self.cf_model.user_to_idx[user_id]
                    user_row = self.cf_model.interaction_matrix.getrow(user_idx).toarray().flatten()
                    interacted_indices = np.where(user_row > 0)[0]
                    user_history = [
                        self.cf_model.idx_to_product.get(idx)
                        for idx in interacted_indices[:20]  # Limit to recent
                        if self.cf_model.idx_to_product.get(idx)
                    ]
            
            if user_history:
                cb_recs = self.cb_model.get_similar_to_multiple(
                    user_history,
                    n_similar=n_recommendations * 3,
                    exclude_source=True
                )
                for product_id, score in cb_recs:
                    if product_id not in exclude_set:
                        if product_id in all_scores:
                            all_scores[product_id]["cb_score"] = score
                        else:
                            all_scores[product_id] = {"cb_score": score}
        
        # 3. Add popularity scores
        for product_id in list(all_scores.keys()):
            pop_score = self.product_popularity.get(product_id, 0.0)
            all_scores[product_id]["pop_score"] = pop_score
        
        # 4. Add popular products for cold-start/diversity
        if len(all_scores) < n_recommendations * 2:
            sorted_popular = sorted(
                self.product_popularity.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for product_id, pop_score in sorted_popular[:n_recommendations * 2]:
                if product_id not in exclude_set and product_id not in all_scores:
                    all_scores[product_id] = {"pop_score": pop_score}
        
        # 5. Calculate hybrid scores
        recommendations = self._calculate_hybrid_scores(
            all_scores,
            user_is_cold_start=not cf_available
        )
        
        # 6. Apply category filter if specified
        if category_filter and self.cb_model:
            recommendations = [
                rec for rec in recommendations
                if self.cb_model.product_metadata.get(rec["product_id"], {}).get("category_id") == category_filter
            ]
        
        return recommendations[:n_recommendations]
    
    def get_similar_products(
        self,
        product_id: str,
        n_similar: int = 10,
        exclude_product_ids: Optional[list[str]] = None
    ) -> list[dict]:
        """
        Get products similar to a given product.
        
        Combines:
        - Content similarity (description, category, tags)
        - Co-purchase patterns from CF
        - Popularity boost
        
        Args:
            product_id: Source product identifier
            n_similar: Number of similar products to return
            exclude_product_ids: Products to exclude from results
        
        Returns:
            List of recommendation dicts
        """
        exclude_set = set(exclude_product_ids or [])
        exclude_set.add(product_id)
        
        all_scores: dict[str, dict] = {}
        
        # 1. Content-based similarity
        if self.cb_model is not None and self.cb_model.is_trained:
            cb_similar = self.cb_model.get_similar_products(
                product_id,
                n_similar=n_similar * 3
            )
            for similar_id, score in cb_similar:
                if similar_id not in exclude_set:
                    all_scores[similar_id] = {"cb_score": score}
        
        # 2. Collaborative "similar items" from SVD
        if self.cf_model is not None and self.cf_model.is_trained:
            cf_similar = self.cf_model.get_similar_items(
                product_id,
                n_similar=n_similar * 3
            )
            for similar_id, score in cf_similar:
                if similar_id not in exclude_set:
                    if similar_id in all_scores:
                        all_scores[similar_id]["cf_score"] = score
                    else:
                        all_scores[similar_id] = {"cf_score": score}
        
        # 3. Add popularity scores
        for similar_id in list(all_scores.keys()):
            pop_score = self.product_popularity.get(similar_id, 0.0)
            all_scores[similar_id]["pop_score"] = pop_score
        
        # Calculate hybrid scores with content-heavy weighting
        recommendations = self._calculate_hybrid_scores(
            all_scores,
            weight_override={
                "cf": 0.3,
                "cb": 0.5,  # Content is more important for "similar"
                "pop": 0.2
            }
        )
        
        return recommendations[:n_similar]
    
    def get_customers_also_bought(
        self,
        product_id: str,
        n_recommendations: int = 10,
        exclude_product_ids: Optional[list[str]] = None
    ) -> list[dict]:
        """
        Get products frequently bought together with the given product.
        
        Primarily uses collaborative filtering co-occurrence data.
        
        Args:
            product_id: Source product identifier
            n_recommendations: Number of recommendations to return
            exclude_product_ids: Products to exclude
        
        Returns:
            List of recommendation dicts
        """
        exclude_set = set(exclude_product_ids or [])
        exclude_set.add(product_id)
        
        all_scores: dict[str, dict] = {}
        
        # 1. Co-purchase patterns from CF
        if self.cf_model is not None and self.cf_model.is_trained:
            cf_recs = self.cf_model.get_users_who_bought_also_bought(
                product_id,
                n_recommendations=n_recommendations * 3
            )
            for rec_id, score in cf_recs:
                if rec_id not in exclude_set:
                    all_scores[rec_id] = {"cf_score": score}
        
        # 2. Add some content-similar products for diversity
        if self.cb_model is not None and self.cb_model.is_trained:
            cb_similar = self.cb_model.get_similar_products(
                product_id,
                n_similar=n_recommendations,
                same_category_only=True
            )
            for similar_id, score in cb_similar:
                if similar_id not in exclude_set:
                    if similar_id in all_scores:
                        all_scores[similar_id]["cb_score"] = score
                    else:
                        all_scores[similar_id] = {"cb_score": score * 0.5}  # Lower weight
        
        # 3. Add popularity scores
        for rec_id in list(all_scores.keys()):
            pop_score = self.product_popularity.get(rec_id, 0.0)
            all_scores[rec_id]["pop_score"] = pop_score
        
        # Calculate with CF-heavy weighting for "also bought"
        recommendations = self._calculate_hybrid_scores(
            all_scores,
            weight_override={
                "cf": 0.6,  # Co-purchase is most important
                "cb": 0.2,
                "pop": 0.2
            }
        )
        
        return recommendations[:n_recommendations]
    
    def get_trending_recommendations(
        self,
        region: Optional[str] = None,
        n_recommendations: int = 10,
        exclude_product_ids: Optional[list[str]] = None,
        category_filter: Optional[str] = None
    ) -> list[dict]:
        """
        Get trending products, optionally filtered by region.
        
        Uses:
        - Time-decayed recent order counts
        - Regional popularity (if region specified)
        - Overall popularity as fallback
        
        Args:
            region: Optional region code for location-based trending
            n_recommendations: Number of recommendations to return
            exclude_product_ids: Products to exclude
            category_filter: Optional category to filter by
        
        Returns:
            List of trending product dicts
        """
        exclude_set = set(exclude_product_ids or [])
        
        # Get base trending scores
        if region and region in self.regional_popularity:
            # Use regional popularity
            base_scores = self.regional_popularity[region]
            source = f"trending_regional_{region}"
        elif self.trending_scores:
            # Use time-decayed trending scores
            base_scores = self.trending_scores
            source = "trending_global"
        else:
            # Fall back to overall popularity
            base_scores = self.product_popularity
            source = "popularity"
        
        # Filter and sort
        filtered_scores = [
            (pid, score) for pid, score in base_scores.items()
            if pid not in exclude_set
        ]
        
        # Apply category filter if specified
        if category_filter and self.cb_model:
            filtered_scores = [
                (pid, score) for pid, score in filtered_scores
                if self.cb_model.product_metadata.get(pid, {}).get("category_id") == category_filter
            ]
        
        # Sort by score
        filtered_scores.sort(key=lambda x: x[1], reverse=True)
        
        # Build recommendations
        recommendations = []
        for product_id, score in filtered_scores[:n_recommendations]:
            recommendations.append({
                "product_id": product_id,
                "score": float(score),
                "source": source,
                "explanation": f"Trending {'in ' + region if region else 'overall'}"
            })
        
        return recommendations
    
    # =========================================================================
    # SCORE CALCULATION
    # =========================================================================
    
    def _calculate_hybrid_scores(
        self,
        all_scores: dict[str, dict],
        user_is_cold_start: bool = False,
        weight_override: Optional[dict[str, float]] = None
    ) -> list[dict]:
        """
        Calculate final hybrid scores from component scores.
        
        Args:
            all_scores: Dict mapping product_id to component scores
            user_is_cold_start: If True, reduce CF weight
            weight_override: Optional custom weights
        
        Returns:
            Sorted list of recommendation dicts
        """
        if not all_scores:
            return []
        
        # Determine weights
        if weight_override:
            w_cf = weight_override.get("cf", self.weight_collaborative)
            w_cb = weight_override.get("cb", self.weight_content)
            w_pop = weight_override.get("pop", self.weight_popularity)
        else:
            w_cf = self.weight_collaborative
            w_cb = self.weight_content
            w_pop = self.weight_popularity
        
        # Adjust for cold-start users
        if user_is_cold_start:
            # Reduce CF weight, increase popularity
            w_cf = 0.1
            w_pop = w_pop + (self.weight_collaborative - 0.1) * 0.6
            w_cb = w_cb + (self.weight_collaborative - 0.1) * 0.4
        
        # Normalize weights to sum to 1
        total_weight = w_cf + w_cb + w_pop
        w_cf /= total_weight
        w_cb /= total_weight
        w_pop /= total_weight
        
        recommendations = []
        
        for product_id, scores in all_scores.items():
            cf_score = scores.get("cf_score", 0.0)
            cb_score = scores.get("cb_score", 0.0)
            pop_score = scores.get("pop_score", 0.0)
            
            # Calculate weighted hybrid score
            hybrid_score = (
                w_cf * cf_score +
                w_cb * cb_score +
                w_pop * pop_score
            )
            
            # Determine primary source for explanation
            sources = []
            if cf_score > 0:
                sources.append("user_behavior")
            if cb_score > 0:
                sources.append("product_similarity")
            if pop_score > 0 and not sources:
                sources.append("popularity")
            
            recommendations.append({
                "product_id": product_id,
                "score": float(hybrid_score),
                "scores": {
                    "collaborative": float(cf_score),
                    "content": float(cb_score),
                    "popularity": float(pop_score)
                },
                "source": sources[0] if sources else "popularity",
                "explanation": self._generate_explanation(sources)
            })
        
        # Sort by hybrid score descending
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return recommendations
    
    def _generate_explanation(self, sources: list[str]) -> str:
        """Generate human-readable explanation for recommendation."""
        explanations = {
            "user_behavior": "Based on your browsing and purchase history",
            "product_similarity": "Similar to products you've viewed",
            "popularity": "Popular among other customers"
        }
        
        if not sources:
            return "Recommended for you"
        
        return explanations.get(sources[0], "Recommended for you")
    
    # =========================================================================
    # MODEL MANAGEMENT
    # =========================================================================
    
    def finalize_training(self) -> None:
        """Mark training as complete."""
        self.is_trained = (
            (self.cf_model is not None and self.cf_model.is_trained) or
            (self.cb_model is not None and self.cb_model.is_trained) or
            len(self.product_popularity) > 0
        )
        self.last_training_time = datetime.utcnow()
        logger.info(f"Hybrid model training finalized. Is trained: {self.is_trained}")
    
    def save(self, path: str) -> None:
        """Save hybrid model state to disk."""
        model_path = Path(path)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        
        model_data = {
            "weight_collaborative": self.weight_collaborative,
            "weight_content": self.weight_content,
            "weight_popularity": self.weight_popularity,
            "product_popularity": self.product_popularity,
            "trending_scores": self.trending_scores,
            "regional_popularity": self.regional_popularity,
            "product_metadata": self.product_metadata,
            "is_trained": self.is_trained,
            "last_training_time": self.last_training_time,
        }
        
        joblib.dump(model_data, path)
        logger.info(f"Hybrid model saved to {path}")
    
    @classmethod
    def load(
        cls,
        path: str,
        cf_model: Optional[CollaborativeFilteringModel] = None,
        cb_model: Optional[ContentBasedModel] = None
    ) -> "HybridRecommender":
        """Load hybrid model from disk."""
        model_data = joblib.load(path)
        
        model = cls(
            cf_model=cf_model,
            cb_model=cb_model,
            weight_collaborative=model_data.get("weight_collaborative", 0.4),
            weight_content=model_data.get("weight_content", 0.35),
            weight_popularity=model_data.get("weight_popularity", 0.25)
        )
        
        model.product_popularity = model_data.get("product_popularity", {})
        model.trending_scores = model_data.get("trending_scores", {})
        model.regional_popularity = model_data.get("regional_popularity", {})
        model.product_metadata = model_data.get("product_metadata", {})
        model.is_trained = model_data.get("is_trained", False)
        model.last_training_time = model_data.get("last_training_time")
        
        logger.info(f"Hybrid model loaded from {path}")
        return model
    
    def get_model_info(self) -> dict:
        """Get model metadata and statistics."""
        cf_info = self.cf_model.get_model_info() if self.cf_model else None
        cb_info = self.cb_model.get_model_info() if self.cb_model else None
        
        return {
            "model_type": "hybrid",
            "is_trained": self.is_trained,
            "last_training_time": self.last_training_time.isoformat() if self.last_training_time else None,
            "weights": {
                "collaborative": self.weight_collaborative,
                "content": self.weight_content,
                "popularity": self.weight_popularity
            },
            "n_products_with_popularity": len(self.product_popularity),
            "n_trending_products": len(self.trending_scores),
            "n_regions": len(self.regional_popularity),
            "collaborative_model": cf_info,
            "content_model": cb_info
        }
