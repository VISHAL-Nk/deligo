"""
Training Pipeline Service

Orchestrates the training of all recommendation models.
Handles:
- Data loading and preprocessing
- Model training for CF, content-based, and hybrid
- Model serialization and versioning
- Incremental training support
- Training scheduling and monitoring
"""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional
import pandas as pd
from loguru import logger

from config import get_settings
from services.data_loader import DataLoader
from models.collaborative import CollaborativeFilteringModel
from models.content_based import ContentBasedModel
from models.hybrid import HybridRecommender


class TrainingPipeline:
    """
    Training pipeline for recommendation models.
    
    This service handles the complete training workflow:
    1. Load data from MongoDB
    2. Preprocess and validate data
    3. Train individual models (CF, content-based)
    4. Build hybrid model with popularity data
    5. Save trained models to disk
    6. Report training metrics
    
    Supports both full retraining and incremental updates.
    """
    
    def __init__(self, data_loader: Optional[DataLoader] = None):
        """
        Initialize the training pipeline.
        
        Args:
            data_loader: Optional DataLoader instance. If not provided,
                        creates a new one.
        """
        self.settings = get_settings()
        self.data_loader = data_loader or DataLoader()
        
        # Models to be trained
        self.cf_model: Optional[CollaborativeFilteringModel] = None
        self.cb_model: Optional[ContentBasedModel] = None
        self.hybrid_model: Optional[HybridRecommender] = None
        
        # Training state
        self.is_training = False
        self.last_training_result: Optional[dict] = None
        
        # Model directory
        self.model_dir = Path(self.settings.model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
    
    async def train_all_models(
        self,
        force_retrain: bool = False,
        interaction_days: Optional[int] = None
    ) -> dict:
        """
        Train all recommendation models.
        
        This is the main entry point for model training.
        
        Args:
            force_retrain: If True, retrain even if recent models exist
            interaction_days: Only use interactions from last N days
        
        Returns:
            Training result dict with statistics and status
        """
        if self.is_training:
            logger.warning("Training already in progress")
            return {
                "success": False,
                "error": "Training already in progress",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        self.is_training = True
        start_time = datetime.utcnow()
        
        try:
            logger.info("Starting model training pipeline...")
            
            # Step 1: Load and validate data
            logger.info("Step 1: Loading data from database...")
            data = await self._load_training_data(interaction_days)
            
            if not self._validate_data(data):
                return {
                    "success": False,
                    "error": "Insufficient data for training",
                    "data_stats": data.get("stats", {}),
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Step 2: Train collaborative filtering model
            logger.info("Step 2: Training collaborative filtering model...")
            cf_result = await self._train_collaborative_model(data["interactions"])
            
            # Step 3: Train content-based model
            logger.info("Step 3: Training content-based model...")
            cb_result = await self._train_content_model(data["products"])
            
            # Step 4: Build hybrid model
            logger.info("Step 4: Building hybrid model...")
            hybrid_result = await self._build_hybrid_model(
                data["popularity"],
                data.get("trending")
            )
            
            # Step 5: Save models
            logger.info("Step 5: Saving trained models...")
            save_result = await self._save_models()
            
            # Calculate training duration
            end_time = datetime.utcnow()
            duration_seconds = (end_time - start_time).total_seconds()
            
            result = {
                "success": True,
                "timestamp": end_time.isoformat(),
                "duration_seconds": duration_seconds,
                "data_stats": data.get("stats", {}),
                "models": {
                    "collaborative": cf_result,
                    "content_based": cb_result,
                    "hybrid": hybrid_result
                },
                "saved_models": save_result
            }
            
            self.last_training_result = result
            logger.info(f"Training completed successfully in {duration_seconds:.2f}s")
            
            return result
            
        except Exception as e:
            logger.error(f"Training failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        finally:
            self.is_training = False
    
    async def _load_training_data(
        self,
        interaction_days: Optional[int] = None
    ) -> dict:
        """Load all data required for training."""
        await self.data_loader.connect()
        
        # Load interactions
        interactions_df = await self.data_loader.load_interactions(
            since_days=interaction_days
        )
        
        # Load products
        products_df = await self.data_loader.load_products(
            active_only=True,
            include_out_of_stock=False
        )
        
        # Load popularity scores
        popularity_df = await self.data_loader.load_popularity_scores()
        
        # Load trending data
        trending_df = await self.data_loader.load_trending_data(
            days=self.settings.trending_time_window_days
        )
        
        # Get data statistics
        stats = await self.data_loader.get_data_statistics()
        
        return {
            "interactions": interactions_df,
            "products": products_df,
            "popularity": popularity_df,
            "trending": trending_df,
            "stats": {
                **stats,
                "interactions_loaded": len(interactions_df),
                "products_loaded": len(products_df),
                "popularity_products": len(popularity_df),
                "trending_products": len(trending_df["product_id"].unique()) if not trending_df.empty else 0
            }
        }
    
    def _validate_data(self, data: dict) -> bool:
        """Validate that we have sufficient data for training."""
        interactions = data.get("interactions", pd.DataFrame())
        products = data.get("products", pd.DataFrame())
        
        # Need at least some products
        if products.empty:
            logger.warning("No products available for training")
            return False
        
        # We can still train content-based without interactions
        if interactions.empty:
            logger.warning("No interactions available - will use content-based and popularity only")
        
        return True
    
    async def _train_collaborative_model(
        self,
        interactions_df: pd.DataFrame
    ) -> dict:
        """Train the collaborative filtering model."""
        if interactions_df.empty:
            logger.warning("Skipping CF model - no interactions")
            self.cf_model = None
            return {
                "trained": False,
                "reason": "No interaction data available"
            }
        
        # Initialize and train model
        self.cf_model = CollaborativeFilteringModel(
            n_factors=min(50, len(interactions_df) // 10),
            min_interactions=self.settings.min_interactions_for_cf
        )
        
        # Run training (CPU-bound, run in thread pool)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self.cf_model.fit,
            interactions_df
        )
        
        return {
            "trained": self.cf_model.is_trained,
            **self.cf_model.get_model_info()
        }
    
    async def _train_content_model(
        self,
        products_df: pd.DataFrame
    ) -> dict:
        """Train the content-based filtering model."""
        if products_df.empty:
            logger.warning("Skipping content model - no products")
            self.cb_model = None
            return {
                "trained": False,
                "reason": "No product data available"
            }
        
        # Initialize and train model
        self.cb_model = ContentBasedModel(
            max_features=min(5000, len(products_df) * 10),
            ngram_range=(1, 2),
            min_df=1 if len(products_df) < 100 else 2
        )
        
        # Run training (CPU-bound, run in thread pool)
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            self.cb_model.fit,
            products_df
        )
        
        return {
            "trained": self.cb_model.is_trained,
            **self.cb_model.get_model_info()
        }
    
    async def _build_hybrid_model(
        self,
        popularity_df: pd.DataFrame,
        trending_df: Optional[pd.DataFrame] = None
    ) -> dict:
        """Build the hybrid recommendation model."""
        # Initialize hybrid model with sub-models
        self.hybrid_model = HybridRecommender(
            cf_model=self.cf_model,
            cb_model=self.cb_model,
            weight_collaborative=self.settings.weight_collaborative,
            weight_content=self.settings.weight_content,
            weight_popularity=self.settings.weight_popularity
        )
        
        # Set popularity data
        if not popularity_df.empty:
            self.hybrid_model.set_popularity_data(
                popularity_df,
                trending_df
            )
        
        # Mark training complete
        self.hybrid_model.finalize_training()
        
        return {
            "trained": self.hybrid_model.is_trained,
            **self.hybrid_model.get_model_info()
        }
    
    async def _save_models(self) -> dict:
        """Save all trained models to disk."""
        saved = {}
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        # Save collaborative filtering model
        if self.cf_model and self.cf_model.is_trained:
            cf_path = self.model_dir / "collaborative_model.pkl"
            cf_versioned = self.model_dir / f"collaborative_model_{timestamp}.pkl"
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.cf_model.save, str(cf_path))
            await loop.run_in_executor(None, self.cf_model.save, str(cf_versioned))
            
            saved["collaborative"] = str(cf_path)
            logger.info(f"Saved CF model to {cf_path}")
        
        # Save content-based model
        if self.cb_model and self.cb_model.is_trained:
            cb_path = self.model_dir / "content_model.pkl"
            cb_versioned = self.model_dir / f"content_model_{timestamp}.pkl"
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.cb_model.save, str(cb_path))
            await loop.run_in_executor(None, self.cb_model.save, str(cb_versioned))
            
            saved["content_based"] = str(cb_path)
            logger.info(f"Saved content model to {cb_path}")
        
        # Save hybrid model metadata
        if self.hybrid_model and self.hybrid_model.is_trained:
            hybrid_path = self.model_dir / "hybrid_model.pkl"
            hybrid_versioned = self.model_dir / f"hybrid_model_{timestamp}.pkl"
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.hybrid_model.save, str(hybrid_path))
            await loop.run_in_executor(None, self.hybrid_model.save, str(hybrid_versioned))
            
            saved["hybrid"] = str(hybrid_path)
            logger.info(f"Saved hybrid model to {hybrid_path}")
        
        return saved
    
    def get_models(self) -> tuple[
        Optional[CollaborativeFilteringModel],
        Optional[ContentBasedModel],
        Optional[HybridRecommender]
    ]:
        """Get the trained model instances."""
        return self.cf_model, self.cb_model, self.hybrid_model
    
    def get_training_status(self) -> dict:
        """Get current training status."""
        return {
            "is_training": self.is_training,
            "last_result": self.last_training_result,
            "models_loaded": {
                "collaborative": self.cf_model is not None and self.cf_model.is_trained,
                "content_based": self.cb_model is not None and self.cb_model.is_trained,
                "hybrid": self.hybrid_model is not None and self.hybrid_model.is_trained
            }
        }
    
    async def cleanup(self) -> None:
        """Clean up resources."""
        await self.data_loader.disconnect()


class ModelLoader:
    """
    Utility class for loading pre-trained models from disk.
    """
    
    @staticmethod
    def load_models(model_dir: str) -> tuple[
        Optional[CollaborativeFilteringModel],
        Optional[ContentBasedModel],
        Optional[HybridRecommender]
    ]:
        """
        Load all models from disk.
        
        Args:
            model_dir: Directory containing saved models
        
        Returns:
            Tuple of (cf_model, cb_model, hybrid_model)
        """
        model_path = Path(model_dir)
        
        cf_model = None
        cb_model = None
        hybrid_model = None
        
        # Load collaborative filtering model
        cf_path = model_path / "collaborative_model.pkl"
        if cf_path.exists():
            try:
                cf_model = CollaborativeFilteringModel.load(str(cf_path))
                logger.info(f"Loaded CF model from {cf_path}")
            except Exception as e:
                logger.error(f"Failed to load CF model: {e}")
        
        # Load content-based model
        cb_path = model_path / "content_model.pkl"
        if cb_path.exists():
            try:
                cb_model = ContentBasedModel.load(str(cb_path))
                logger.info(f"Loaded content model from {cb_path}")
            except Exception as e:
                logger.error(f"Failed to load content model: {e}")
        
        # Load hybrid model
        hybrid_path = model_path / "hybrid_model.pkl"
        if hybrid_path.exists():
            try:
                hybrid_model = HybridRecommender.load(
                    str(hybrid_path),
                    cf_model=cf_model,
                    cb_model=cb_model
                )
                logger.info(f"Loaded hybrid model from {hybrid_path}")
            except Exception as e:
                logger.error(f"Failed to load hybrid model: {e}")
        
        return cf_model, cb_model, hybrid_model
    
    @staticmethod
    def get_model_versions(model_dir: str) -> dict:
        """
        Get list of saved model versions.
        
        Args:
            model_dir: Directory containing saved models
        
        Returns:
            Dict mapping model type to list of version timestamps
        """
        model_path = Path(model_dir)
        versions = {
            "collaborative": [],
            "content_based": [],
            "hybrid": []
        }
        
        if not model_path.exists():
            return versions
        
        for file in model_path.glob("*.pkl"):
            name = file.stem
            if name.startswith("collaborative_model_"):
                versions["collaborative"].append(name.replace("collaborative_model_", ""))
            elif name.startswith("content_model_"):
                versions["content_based"].append(name.replace("content_model_", ""))
            elif name.startswith("hybrid_model_"):
                versions["hybrid"].append(name.replace("hybrid_model_", ""))
        
        # Sort versions (most recent first)
        for key in versions:
            versions[key].sort(reverse=True)
        
        return versions
