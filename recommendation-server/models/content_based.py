"""
Content-Based Filtering Model

Implements content-based recommendations using product metadata.
Uses TF-IDF vectorization and cosine similarity to find similar products
based on their textual features (name, description, category, tags).

Key concepts:
- TF-IDF (Term Frequency-Inverse Document Frequency) for text vectorization
- Cosine similarity for measuring product similarity
- Feature weighting for different product attributes
- Handles cold-start items (new products without interaction history)
"""

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity, linear_kernel
from sklearn.preprocessing import normalize
from typing import Optional
import joblib
from loguru import logger
from pathlib import Path

from config import get_settings, PRODUCT_FEATURE_WEIGHTS, MIN_SIMILARITY_THRESHOLD


class ContentBasedModel:
    """
    Content-based recommendation model using product metadata.
    
    This model finds similar products based on their textual content
    (name, description, category, tags) rather than user behavior.
    
    Ideal for:
    - Cold-start items (new products without interaction history)
    - "Similar products" recommendations
    - Diversifying recommendations beyond collaborative filtering
    """
    
    def __init__(
        self,
        max_features: int = 5000,
        ngram_range: tuple[int, int] = (1, 2),
        min_df: int = 2,
        max_df: float = 0.95
    ):
        """
        Initialize the content-based model.
        
        Args:
            max_features: Maximum number of TF-IDF features to extract.
                         Higher = more expressive but slower.
            ngram_range: Range of n-grams to consider. (1,2) means unigrams and bigrams.
            min_df: Minimum document frequency for a term to be included.
            max_df: Maximum document frequency (fraction). Terms appearing in more
                   documents than this are excluded (common words).
        """
        self.max_features = max_features
        self.ngram_range = ngram_range
        self.min_df = min_df
        self.max_df = max_df
        self.settings = get_settings()
        
        # TF-IDF vectorizer for text features
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        
        # TF-IDF matrix (n_products x n_features)
        self.tfidf_matrix: Optional[np.ndarray] = None
        
        # Pre-computed similarity matrix (optional, can be large)
        self.similarity_matrix: Optional[np.ndarray] = None
        
        # Product ID mappings
        self.product_to_idx: dict[str, int] = {}
        self.idx_to_product: dict[int, str] = {}
        
        # Product metadata for enriching recommendations
        self.product_metadata: dict[str, dict] = {}
        
        # Category-based groupings for faster category recommendations
        self.category_products: dict[str, list[str]] = {}
        
        # Model state
        self.is_trained = False
        self.training_stats: dict = {}
    
    def fit(self, products_df: pd.DataFrame) -> None:
        """
        Train the content-based model on product data.
        
        Args:
            products_df: DataFrame with columns:
                - product_id: Product identifier
                - name: Product name
                - description: Product description
                - category_name: Category name
                - tags: List of tags
                - text_features: Combined text for TF-IDF (optional, will be created)
        """
        logger.info("Training content-based filtering model...")
        
        if products_df.empty:
            logger.warning("No products provided for training")
            self.is_trained = False
            return
        
        # Step 1: Build product mappings
        self._build_mappings(products_df)
        
        # Step 2: Prepare text features
        text_features = self._prepare_text_features(products_df)
        
        # Step 3: Fit TF-IDF vectorizer and transform
        self._fit_tfidf(text_features)
        
        # Step 4: Store product metadata
        self._store_metadata(products_df)
        
        # Step 5: Build category index
        self._build_category_index(products_df)
        
        # Step 6: Pre-compute similarity matrix (if dataset is small enough)
        if len(products_df) <= 10000:
            self._precompute_similarity()
        
        self.is_trained = True
        self.training_stats = {
            "n_products": len(self.product_to_idx),
            "n_features": self.tfidf_matrix.shape[1] if self.tfidf_matrix is not None else 0,
            "n_categories": len(self.category_products),
            "similarity_precomputed": self.similarity_matrix is not None
        }
        
        logger.info(f"Content-based model trained: {self.training_stats}")
    
    def _build_mappings(self, df: pd.DataFrame) -> None:
        """Build product ID to index mappings."""
        product_ids = df["product_id"].unique().tolist()
        
        self.product_to_idx = {pid: idx for idx, pid in enumerate(product_ids)}
        self.idx_to_product = {idx: pid for pid, idx in self.product_to_idx.items()}
        
        logger.debug(f"Built mappings for {len(self.product_to_idx)} products")
    
    def _prepare_text_features(self, df: pd.DataFrame) -> list[str]:
        """
        Prepare combined text features for TF-IDF vectorization.
        
        Combines different product attributes with appropriate weighting.
        """
        text_features = []
        
        for _, row in df.iterrows():
            # Weight different features by repeating them
            # This is a simple way to implement feature weighting in TF-IDF
            parts = []
            
            # Name (weight: 0.25 -> repeat 5 times)
            name = str(row.get("name", "")).strip()
            if name:
                parts.extend([name] * 5)
            
            # Category (weight: 0.3 -> repeat 6 times)
            category = str(row.get("category_name", "")).strip()
            if category:
                parts.extend([category] * 6)
            
            # Description (weight: 0.2 -> repeat 4 times)
            description = str(row.get("description", "")).strip()
            if description:
                # Truncate long descriptions to avoid dominating
                description = description[:500]
                parts.extend([description] * 4)
            
            # Tags (weight: 0.15 -> repeat 3 times each)
            tags = row.get("tags", [])
            if isinstance(tags, list) and tags:
                tag_text = " ".join(tags)
                parts.extend([tag_text] * 3)
            
            # Seller (weight: 0.1 -> repeat 2 times)
            seller = str(row.get("seller_id", "")).strip()
            if seller:
                parts.extend([f"seller_{seller}"] * 2)
            
            combined = " ".join(parts)
            text_features.append(combined if combined else "unknown product")
        
        return text_features
    
    def _fit_tfidf(self, text_features: list[str]) -> None:
        """
        Fit TF-IDF vectorizer and transform text features.
        
        TF-IDF (Term Frequency-Inverse Document Frequency):
        - TF: How often a term appears in a document
        - IDF: How rare a term is across all documents
        - TF-IDF = TF * IDF (common words get down-weighted)
        """
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=self.max_features,
            ngram_range=self.ngram_range,
            min_df=self.min_df,
            max_df=self.max_df,
            stop_words="english",
            lowercase=True,
            strip_accents="unicode",
            # Use sublinear TF scaling: log(1 + tf) instead of tf
            # This reduces the impact of very frequent terms
            sublinear_tf=True,
            # Smooth IDF by adding 1 to document frequencies
            smooth_idf=True,
            # Normalize vectors to unit length
            norm="l2"
        )
        
        self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(text_features)
        
        logger.debug(f"TF-IDF matrix shape: {self.tfidf_matrix.shape}")
    
    def _store_metadata(self, df: pd.DataFrame) -> None:
        """Store product metadata for enriching recommendations."""
        for _, row in df.iterrows():
            product_id = row["product_id"]
            self.product_metadata[product_id] = {
                "name": row.get("name", ""),
                "category_id": row.get("category_id", ""),
                "category_name": row.get("category_name", ""),
                "price": row.get("price", 0),
                "rating": row.get("rating", 0),
                "seller_id": row.get("seller_id", ""),
            }
    
    def _build_category_index(self, df: pd.DataFrame) -> None:
        """Build index of products by category for fast category-based lookup."""
        self.category_products = {}
        
        for _, row in df.iterrows():
            category_id = str(row.get("category_id", ""))
            product_id = row["product_id"]
            
            if category_id:
                if category_id not in self.category_products:
                    self.category_products[category_id] = []
                self.category_products[category_id].append(product_id)
    
    def _precompute_similarity(self) -> None:
        """
        Pre-compute full similarity matrix if dataset is small enough.
        
        For large datasets, we compute similarity on-demand to save memory.
        Cosine similarity: cos(θ) = (A · B) / (|A| * |B|)
        Since TF-IDF vectors are L2-normalized, this simplifies to dot product.
        """
        if self.tfidf_matrix is None:
            return
        
        logger.debug("Pre-computing similarity matrix...")
        
        # Use linear_kernel (dot product) since vectors are normalized
        # This is equivalent to cosine_similarity but faster
        self.similarity_matrix = linear_kernel(self.tfidf_matrix, self.tfidf_matrix)
        
        # Zero out diagonal (self-similarity)
        np.fill_diagonal(self.similarity_matrix, 0)
        
        logger.debug(f"Similarity matrix shape: {self.similarity_matrix.shape}")
    
    # =========================================================================
    # RECOMMENDATION METHODS
    # =========================================================================
    
    def get_similar_products(
        self,
        product_id: str,
        n_similar: int = 10,
        same_category_only: bool = False,
        exclude_product_ids: Optional[list[str]] = None
    ) -> list[tuple[str, float]]:
        """
        Find products similar to a given product based on content.
        
        Args:
            product_id: Source product identifier
            n_similar: Number of similar products to return
            same_category_only: Only return products from the same category
            exclude_product_ids: Products to exclude from results
        
        Returns:
            List of (product_id, similarity_score) tuples
        """
        if not self.is_trained or self.tfidf_matrix is None:
            logger.warning("Model not trained")
            return []
        
        if product_id not in self.product_to_idx:
            logger.debug(f"Product {product_id} not in model")
            return []
        
        product_idx = self.product_to_idx[product_id]
        exclude_set = set(exclude_product_ids or [])
        exclude_set.add(product_id)  # Always exclude the source product
        
        # Get similarity scores
        if self.similarity_matrix is not None:
            # Use pre-computed matrix
            similarities = self.similarity_matrix[product_idx]
        else:
            # Compute on-demand for this product
            product_vector = self.tfidf_matrix[product_idx]
            similarities = linear_kernel(product_vector, self.tfidf_matrix).flatten()
            similarities[product_idx] = 0  # Zero out self-similarity
        
        # Apply filters
        if same_category_only:
            source_category = self.product_metadata.get(product_id, {}).get("category_id")
            if source_category:
                # Zero out products from different categories
                for idx in range(len(similarities)):
                    other_id = self.idx_to_product.get(idx)
                    if other_id:
                        other_category = self.product_metadata.get(other_id, {}).get("category_id")
                        if other_category != source_category:
                            similarities[idx] = 0
        
        # Get top similar products
        top_indices = np.argsort(similarities)[::-1]
        
        similar_products = []
        for idx in top_indices:
            if len(similar_products) >= n_similar:
                break
            
            if similarities[idx] < MIN_SIMILARITY_THRESHOLD:
                break
            
            similar_id = self.idx_to_product.get(idx)
            if similar_id and similar_id not in exclude_set:
                similar_products.append((similar_id, float(similarities[idx])))
        
        return similar_products
    
    def get_products_by_category(
        self,
        category_id: str,
        n_products: int = 10,
        exclude_product_ids: Optional[list[str]] = None
    ) -> list[str]:
        """
        Get products from a specific category.
        
        Args:
            category_id: Category identifier
            n_products: Maximum number of products to return
            exclude_product_ids: Products to exclude
        
        Returns:
            List of product IDs
        """
        if category_id not in self.category_products:
            return []
        
        exclude_set = set(exclude_product_ids or [])
        products = [
            pid for pid in self.category_products[category_id]
            if pid not in exclude_set
        ]
        
        return products[:n_products]
    
    def get_similar_to_multiple(
        self,
        product_ids: list[str],
        n_similar: int = 10,
        exclude_source: bool = True
    ) -> list[tuple[str, float]]:
        """
        Find products similar to a set of products.
        
        Useful for recommending based on user's browsing/purchase history.
        Computes centroid of product vectors and finds nearest neighbors.
        
        Args:
            product_ids: List of source product identifiers
            n_similar: Number of similar products to return
            exclude_source: Whether to exclude source products from results
        
        Returns:
            List of (product_id, similarity_score) tuples
        """
        if not self.is_trained or self.tfidf_matrix is None:
            return []
        
        # Get indices for valid products
        valid_indices = [
            self.product_to_idx[pid]
            for pid in product_ids
            if pid in self.product_to_idx
        ]
        
        if not valid_indices:
            return []
        
        # Compute centroid (average) of product vectors
        product_vectors = self.tfidf_matrix[valid_indices]
        centroid = np.asarray(product_vectors.mean(axis=0)).flatten()
        
        # Normalize centroid
        centroid = centroid / (np.linalg.norm(centroid) + 1e-10)
        
        # Compute similarities to centroid
        similarities = self.tfidf_matrix.dot(centroid)
        
        # Exclude source products if requested
        exclude_set = set(product_ids) if exclude_source else set()
        
        # Get top similar products
        top_indices = np.argsort(similarities)[::-1]
        
        similar_products = []
        for idx in top_indices:
            if len(similar_products) >= n_similar:
                break
            
            product_id = self.idx_to_product.get(idx)
            if product_id and product_id not in exclude_set:
                score = float(similarities[idx])
                if score > MIN_SIMILARITY_THRESHOLD:
                    similar_products.append((product_id, score))
        
        return similar_products
    
    def get_product_features(self, product_id: str) -> Optional[dict]:
        """
        Get the top TF-IDF features for a product.
        
        Useful for understanding why products are considered similar.
        """
        if not self.is_trained or self.tfidf_vectorizer is None:
            return None
        
        if product_id not in self.product_to_idx:
            return None
        
        idx = self.product_to_idx[product_id]
        feature_names = self.tfidf_vectorizer.get_feature_names_out()
        product_vector = self.tfidf_matrix[idx].toarray().flatten()
        
        # Get top features by TF-IDF score
        top_indices = np.argsort(product_vector)[::-1][:20]
        top_features = [
            (feature_names[i], float(product_vector[i]))
            for i in top_indices
            if product_vector[i] > 0
        ]
        
        return {
            "product_id": product_id,
            "top_features": top_features,
            "metadata": self.product_metadata.get(product_id, {})
        }
    
    # =========================================================================
    # MODEL PERSISTENCE
    # =========================================================================
    
    def save(self, path: str) -> None:
        """Save model to disk."""
        model_path = Path(path)
        model_path.parent.mkdir(parents=True, exist_ok=True)
        
        model_data = {
            "tfidf_vectorizer": self.tfidf_vectorizer,
            "tfidf_matrix": self.tfidf_matrix,
            "similarity_matrix": self.similarity_matrix,
            "product_to_idx": self.product_to_idx,
            "idx_to_product": self.idx_to_product,
            "product_metadata": self.product_metadata,
            "category_products": self.category_products,
            "is_trained": self.is_trained,
            "training_stats": self.training_stats,
            "max_features": self.max_features,
            "ngram_range": self.ngram_range,
            "min_df": self.min_df,
            "max_df": self.max_df,
        }
        
        joblib.dump(model_data, path)
        logger.info(f"Content-based model saved to {path}")
    
    @classmethod
    def load(cls, path: str) -> "ContentBasedModel":
        """Load model from disk."""
        model_data = joblib.load(path)
        
        model = cls(
            max_features=model_data.get("max_features", 5000),
            ngram_range=model_data.get("ngram_range", (1, 2)),
            min_df=model_data.get("min_df", 2),
            max_df=model_data.get("max_df", 0.95)
        )
        
        model.tfidf_vectorizer = model_data["tfidf_vectorizer"]
        model.tfidf_matrix = model_data["tfidf_matrix"]
        model.similarity_matrix = model_data["similarity_matrix"]
        model.product_to_idx = model_data["product_to_idx"]
        model.idx_to_product = model_data["idx_to_product"]
        model.product_metadata = model_data["product_metadata"]
        model.category_products = model_data["category_products"]
        model.is_trained = model_data["is_trained"]
        model.training_stats = model_data.get("training_stats", {})
        
        logger.info(f"Content-based model loaded from {path}")
        return model
    
    def get_model_info(self) -> dict:
        """Get model metadata and statistics."""
        return {
            "model_type": "content_based",
            "is_trained": self.is_trained,
            "max_features": self.max_features,
            "ngram_range": self.ngram_range,
            **self.training_stats
        }
