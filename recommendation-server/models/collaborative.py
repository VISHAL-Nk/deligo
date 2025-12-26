"""
Collaborative Filtering Model

Implements user-based and item-based collaborative filtering using
implicit feedback signals (views, cart additions, purchases).

Key concepts:
- User-item interaction matrix with weighted interactions
- Cosine similarity for finding similar users/items
- Matrix factorization for dimensionality reduction
- Handles cold-start problem by falling back to popularity
"""

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix, lil_matrix
from scipy.sparse.linalg import svds
from sklearn.metrics.pairwise import cosine_similarity
from typing import Optional
import joblib
from loguru import logger
from pathlib import Path

from config import get_settings, INTERACTION_WEIGHTS


class CollaborativeFilteringModel:
    """
    Collaborative Filtering recommendation model using implicit feedback.
    
    This model learns user preferences from their interaction history
    and recommends products that similar users have interacted with.
    
    Supports two modes:
    1. User-based CF: Find similar users, recommend their liked items
    2. Item-based CF: Find similar items to what user has interacted with
    
    Uses matrix factorization (SVD) for efficient similarity computation
    on large datasets.
    """
    
    def __init__(self, n_factors: int = 50, min_interactions: int = 5):
        """
        Initialize the collaborative filtering model.
        
        Args:
            n_factors: Number of latent factors for matrix factorization.
                      Higher = more expressive but slower and may overfit.
            min_interactions: Minimum interactions required for a user/item
                             to be included in the model.
        """
        self.n_factors = n_factors
        self.min_interactions = min_interactions
        self.settings = get_settings()
        
        # Mappings between IDs and matrix indices
        self.user_to_idx: dict[str, int] = {}
        self.idx_to_user: dict[int, str] = {}
        self.product_to_idx: dict[str, int] = {}
        self.idx_to_product: dict[int, str] = {}
        
        # Sparse interaction matrix (users x products)
        self.interaction_matrix: Optional[csr_matrix] = None
        
        # Factorized matrices from SVD
        # U: user factors, sigma: singular values, Vt: item factors
        self.user_factors: Optional[np.ndarray] = None
        self.item_factors: Optional[np.ndarray] = None
        
        # Pre-computed similarity matrices for fast lookup
        self.user_similarity: Optional[np.ndarray] = None
        self.item_similarity: Optional[np.ndarray] = None
        
        # Product popularity for cold-start fallback
        self.product_popularity: dict[str, float] = {}
        
        # Model metadata
        self.is_trained = False
        self.training_stats: dict = {}
    
    def fit(self, interactions_df: pd.DataFrame) -> None:
        """
        Train the collaborative filtering model on interaction data.
        
        Args:
            interactions_df: DataFrame with columns:
                - user_id: User identifier
                - product_id: Product identifier
                - weight: Interaction weight (from INTERACTION_WEIGHTS)
        """
        logger.info("Training collaborative filtering model...")
        
        if interactions_df.empty:
            logger.warning("No interactions provided for training")
            self.is_trained = False
            return
        
        # Step 1: Build user and product mappings
        self._build_mappings(interactions_df)
        
        if len(self.user_to_idx) == 0 or len(self.product_to_idx) == 0:
            logger.warning("Insufficient users or products for CF model")
            self.is_trained = False
            return
        
        # Step 2: Build sparse interaction matrix
        self._build_interaction_matrix(interactions_df)
        
        # Step 3: Calculate product popularity for cold-start
        self._calculate_popularity(interactions_df)
        
        # Step 4: Perform matrix factorization (SVD)
        self._factorize_matrix()
        
        # Step 5: Pre-compute item similarity for "customers also bought"
        self._compute_item_similarity()
        
        self.is_trained = True
        self.training_stats = {
            "n_users": len(self.user_to_idx),
            "n_products": len(self.product_to_idx),
            "n_interactions": len(interactions_df),
            "sparsity": 1 - (self.interaction_matrix.nnz / 
                           (len(self.user_to_idx) * len(self.product_to_idx))),
            "n_factors": self.n_factors
        }
        
        logger.info(f"CF model trained: {self.training_stats}")
    
    def _build_mappings(self, df: pd.DataFrame) -> None:
        """Build bidirectional mappings between IDs and matrix indices."""
        # Filter users with minimum interactions
        user_counts = df.groupby("user_id").size()
        valid_users = user_counts[user_counts >= self.min_interactions].index.tolist()
        
        # Filter products with minimum interactions
        product_counts = df.groupby("product_id").size()
        valid_products = product_counts[product_counts >= 1].index.tolist()
        
        # Build user mappings
        self.user_to_idx = {uid: idx for idx, uid in enumerate(valid_users)}
        self.idx_to_user = {idx: uid for uid, idx in self.user_to_idx.items()}
        
        # Build product mappings
        self.product_to_idx = {pid: idx for idx, pid in enumerate(valid_products)}
        self.idx_to_product = {idx: pid for pid, idx in self.product_to_idx.items()}
        
        logger.debug(f"Built mappings: {len(self.user_to_idx)} users, {len(self.product_to_idx)} products")
    
    def _build_interaction_matrix(self, df: pd.DataFrame) -> None:
        """
        Build sparse user-item interaction matrix.
        
        Uses LIL (List of Lists) format for efficient construction,
        then converts to CSR (Compressed Sparse Row) for fast operations.
        """
        n_users = len(self.user_to_idx)
        n_products = len(self.product_to_idx)
        
        # Use LIL format for efficient incremental construction
        matrix = lil_matrix((n_users, n_products), dtype=np.float32)
        
        for _, row in df.iterrows():
            user_id = row["user_id"]
            product_id = row["product_id"]
            weight = row.get("weight", 1.0)
            
            if user_id in self.user_to_idx and product_id in self.product_to_idx:
                user_idx = self.user_to_idx[user_id]
                product_idx = self.product_to_idx[product_id]
                # Accumulate weights for repeated interactions
                matrix[user_idx, product_idx] += weight
        
        # Convert to CSR for efficient row operations
        self.interaction_matrix = matrix.tocsr()
        
        # Log-transform to reduce impact of heavy users
        # log(1 + x) preserves zeros and compresses large values
        self.interaction_matrix.data = np.log1p(self.interaction_matrix.data)
        
        logger.debug(f"Built interaction matrix: {self.interaction_matrix.shape}, "
                    f"density: {self.interaction_matrix.nnz / (n_users * n_products):.4f}")
    
    def _calculate_popularity(self, df: pd.DataFrame) -> None:
        """Calculate popularity scores for cold-start fallback."""
        # Weight interactions by type
        popularity = df.groupby("product_id")["weight"].sum()
        
        # Normalize to 0-1 range
        max_pop = popularity.max()
        if max_pop > 0:
            popularity = popularity / max_pop
        
        self.product_popularity = popularity.to_dict()
    
    def _factorize_matrix(self) -> None:
        """
        Perform truncated SVD for matrix factorization.
        
        SVD decomposes R ≈ U * Σ * V^T where:
        - U: User latent factors (n_users x n_factors)
        - Σ: Singular values (importance of each factor)
        - V^T: Item latent factors (n_factors x n_items)
        
        This allows efficient similarity computation in reduced space.
        """
        if self.interaction_matrix is None or self.interaction_matrix.nnz == 0:
            logger.warning("Cannot factorize empty matrix")
            return
        
        # Determine number of factors (can't exceed matrix dimensions)
        k = min(
            self.n_factors,
            self.interaction_matrix.shape[0] - 1,
            self.interaction_matrix.shape[1] - 1
        )
        
        if k < 1:
            logger.warning("Matrix too small for factorization")
            return
        
        try:
            # Truncated SVD on sparse matrix
            U, sigma, Vt = svds(self.interaction_matrix.astype(np.float64), k=k)
            
            # Incorporate singular values into factors
            # This gives better similarity results than using raw U and Vt
            sigma_sqrt = np.sqrt(sigma)
            self.user_factors = U * sigma_sqrt
            self.item_factors = Vt.T * sigma_sqrt
            
            logger.debug(f"SVD completed: user_factors {self.user_factors.shape}, "
                        f"item_factors {self.item_factors.shape}")
        except Exception as e:
            logger.error(f"SVD factorization failed: {e}")
            self.user_factors = None
            self.item_factors = None
    
    def _compute_item_similarity(self) -> None:
        """
        Pre-compute item-item similarity matrix.
        
        Uses cosine similarity in the latent factor space.
        This is used for "customers also bought" recommendations.
        """
        if self.item_factors is None:
            logger.warning("Cannot compute item similarity without factorization")
            return
        
        # Compute cosine similarity between all item pairs
        # Result is (n_items x n_items) matrix
        self.item_similarity = cosine_similarity(self.item_factors)
        
        # Zero out self-similarity (diagonal)
        np.fill_diagonal(self.item_similarity, 0)
        
        logger.debug(f"Computed item similarity matrix: {self.item_similarity.shape}")
    
    # =========================================================================
    # RECOMMENDATION METHODS
    # =========================================================================
    
    def recommend_for_user(
        self,
        user_id: str,
        n_recommendations: int = 10,
        exclude_interacted: bool = True
    ) -> list[tuple[str, float]]:
        """
        Generate personalized recommendations for a user.
        
        Uses the user's latent factors to predict ratings for all items,
        then returns the highest-rated unseen items.
        
        Args:
            user_id: User identifier
            n_recommendations: Number of recommendations to return
            exclude_interacted: Whether to exclude items user has interacted with
        
        Returns:
            List of (product_id, score) tuples sorted by score descending
        """
        if not self.is_trained:
            logger.warning("Model not trained, returning empty recommendations")
            return []
        
        # Handle cold-start users (not in training data)
        if user_id not in self.user_to_idx:
            return self._cold_start_recommendations(n_recommendations)
        
        user_idx = self.user_to_idx[user_id]
        
        if self.user_factors is None or self.item_factors is None:
            return self._cold_start_recommendations(n_recommendations)
        
        # Predict scores: dot product of user factors with all item factors
        user_vector = self.user_factors[user_idx]
        predicted_scores = np.dot(self.item_factors, user_vector)
        
        # Get user's interaction history to exclude
        if exclude_interacted:
            user_interactions = self.interaction_matrix[user_idx].toarray().flatten()
            interacted_mask = user_interactions > 0
            predicted_scores[interacted_mask] = -np.inf
        
        # Get top N recommendations
        top_indices = np.argsort(predicted_scores)[::-1][:n_recommendations]
        
        recommendations = []
        for idx in top_indices:
            if predicted_scores[idx] > -np.inf:
                product_id = self.idx_to_product.get(idx)
                if product_id:
                    # Normalize score to 0-1 range
                    score = float(max(0, min(1, (predicted_scores[idx] + 1) / 2)))
                    recommendations.append((product_id, score))
        
        return recommendations
    
    def get_similar_items(
        self,
        product_id: str,
        n_similar: int = 10
    ) -> list[tuple[str, float]]:
        """
        Find items similar to a given product.
        
        Uses pre-computed item similarity matrix.
        Used for "customers also bought" recommendations.
        
        Args:
            product_id: Product identifier
            n_similar: Number of similar items to return
        
        Returns:
            List of (product_id, similarity_score) tuples
        """
        if not self.is_trained or self.item_similarity is None:
            return []
        
        if product_id not in self.product_to_idx:
            return []
        
        product_idx = self.product_to_idx[product_id]
        
        # Get similarity scores for this product
        similarities = self.item_similarity[product_idx]
        
        # Get top N similar items
        top_indices = np.argsort(similarities)[::-1][:n_similar]
        
        similar_items = []
        for idx in top_indices:
            if similarities[idx] > 0:
                similar_product_id = self.idx_to_product.get(idx)
                if similar_product_id:
                    similar_items.append((similar_product_id, float(similarities[idx])))
        
        return similar_items
    
    def get_users_who_bought_also_bought(
        self,
        product_id: str,
        n_recommendations: int = 10
    ) -> list[tuple[str, float]]:
        """
        Find products frequently bought together with the given product.
        
        This is a co-occurrence based approach:
        1. Find users who interacted with this product
        2. Find other products those users interacted with
        3. Rank by frequency and return top items
        
        Args:
            product_id: Source product identifier
            n_recommendations: Number of recommendations to return
        
        Returns:
            List of (product_id, score) tuples
        """
        if not self.is_trained or self.interaction_matrix is None:
            return []
        
        if product_id not in self.product_to_idx:
            return []
        
        product_idx = self.product_to_idx[product_id]
        
        # Get column (users who interacted with this product)
        product_col = self.interaction_matrix.getcol(product_idx).toarray().flatten()
        user_indices = np.where(product_col > 0)[0]
        
        if len(user_indices) == 0:
            return []
        
        # Aggregate interactions from these users
        co_occurrence = np.zeros(len(self.product_to_idx))
        
        for user_idx in user_indices:
            user_row = self.interaction_matrix.getrow(user_idx).toarray().flatten()
            co_occurrence += user_row
        
        # Remove the source product
        co_occurrence[product_idx] = 0
        
        # Normalize by number of users
        co_occurrence = co_occurrence / len(user_indices)
        
        # Get top recommendations
        top_indices = np.argsort(co_occurrence)[::-1][:n_recommendations]
        
        recommendations = []
        for idx in top_indices:
            if co_occurrence[idx] > 0:
                rec_product_id = self.idx_to_product.get(idx)
                if rec_product_id:
                    recommendations.append((rec_product_id, float(co_occurrence[idx])))
        
        return recommendations
    
    def _cold_start_recommendations(
        self,
        n_recommendations: int
    ) -> list[tuple[str, float]]:
        """
        Return popularity-based recommendations for cold-start users.
        
        When we don't have interaction history for a user,
        we fall back to recommending the most popular products.
        """
        if not self.product_popularity:
            return []
        
        sorted_products = sorted(
            self.product_popularity.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return sorted_products[:n_recommendations]
    
    # =========================================================================
    # MODEL PERSISTENCE
    # =========================================================================
    
    def save(self, path: str) -> None:
        """Save model to disk."""
        model_path = Path(path)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        
        model_data = {
            "user_to_idx": self.user_to_idx,
            "idx_to_user": self.idx_to_user,
            "product_to_idx": self.product_to_idx,
            "idx_to_product": self.idx_to_product,
            "interaction_matrix": self.interaction_matrix,
            "user_factors": self.user_factors,
            "item_factors": self.item_factors,
            "item_similarity": self.item_similarity,
            "product_popularity": self.product_popularity,
            "is_trained": self.is_trained,
            "training_stats": self.training_stats,
            "n_factors": self.n_factors,
            "min_interactions": self.min_interactions,
        }
        
        joblib.dump(model_data, path)
        logger.info(f"CF model saved to {path}")
    
    @classmethod
    def load(cls, path: str) -> "CollaborativeFilteringModel":
        """Load model from disk."""
        model_data = joblib.load(path)
        
        model = cls(
            n_factors=model_data.get("n_factors", 50),
            min_interactions=model_data.get("min_interactions", 5)
        )
        
        model.user_to_idx = model_data["user_to_idx"]
        model.idx_to_user = model_data["idx_to_user"]
        model.product_to_idx = model_data["product_to_idx"]
        model.idx_to_product = model_data["idx_to_product"]
        model.interaction_matrix = model_data["interaction_matrix"]
        model.user_factors = model_data["user_factors"]
        model.item_factors = model_data["item_factors"]
        model.item_similarity = model_data["item_similarity"]
        model.product_popularity = model_data["product_popularity"]
        model.is_trained = model_data["is_trained"]
        model.training_stats = model_data.get("training_stats", {})
        
        logger.info(f"CF model loaded from {path}")
        return model
    
    def get_model_info(self) -> dict:
        """Get model metadata and statistics."""
        return {
            "model_type": "collaborative_filtering",
            "is_trained": self.is_trained,
            "n_factors": self.n_factors,
            "min_interactions": self.min_interactions,
            **self.training_stats
        }
