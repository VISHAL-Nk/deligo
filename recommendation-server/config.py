"""
Configuration settings for the recommendation engine.
Loads environment variables and provides typed configuration.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""
    
    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    
    # MongoDB Configuration
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URI"
    )
    mongodb_db_name: str = Field(
        default="test",
        description="MongoDB database name"
    )
    
    # Model Configuration
    model_dir: str = Field(
        default="./trained_models",
        description="Directory for storing trained models"
    )
    
    # Training Configuration
    min_interactions_for_cf: int = Field(
        default=5,
        description="Minimum interactions required for collaborative filtering"
    )
    retrain_interval_hours: int = Field(
        default=24,
        description="Hours between automatic model retraining"
    )
    
    # Recommendation Configuration
    default_num_recommendations: int = Field(
        default=10,
        description="Default number of recommendations to return"
    )
    max_num_recommendations: int = Field(
        default=50,
        description="Maximum number of recommendations allowed"
    )
    
    # Hybrid Model Weights (must sum to 1.0)
    weight_collaborative: float = Field(
        default=0.4,
        description="Weight for collaborative filtering score"
    )
    weight_content: float = Field(
        default=0.35,
        description="Weight for content-based filtering score"
    )
    weight_popularity: float = Field(
        default=0.25,
        description="Weight for popularity score"
    )
    
    # Cold Start Configuration
    cold_start_use_popularity: bool = Field(
        default=True,
        description="Use popularity-based recommendations for cold start"
    )
    trending_time_window_days: int = Field(
        default=7,
        description="Days to consider for trending products"
    )
    
    # Cache Configuration
    # Lower TTL = more real-time but higher DB load
    # Higher TTL = faster responses but less fresh data
    cache_ttl_seconds: int = Field(
        default=30,
        description="Cache TTL in seconds (30 seconds for near real-time)"
    )
    cache_max_size: int = Field(
        default=1000,
        description="Maximum number of cached recommendations"
    )
    
    # CORS Configuration
    cors_origins: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed CORS origins"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env (Next.js env vars)
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def validate_weights(self) -> bool:
        """Validate that hybrid model weights sum to 1.0."""
        total = self.weight_collaborative + self.weight_content + self.weight_popularity
        return abs(total - 1.0) < 0.001


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Interaction type weights for collaborative filtering
# Higher weight = stronger signal of user preference
INTERACTION_WEIGHTS = {
    "view": 1.0,       # Basic interest signal
    "cart": 3.0,       # Strong purchase intent
    "purchase": 5.0,   # Strongest signal - actual purchase
    "wishlist": 2.5,   # Moderate interest signal
    "review": 4.0,     # Post-purchase engagement
}

# Product feature weights for content-based filtering
PRODUCT_FEATURE_WEIGHTS = {
    "category": 0.3,      # Category matching
    "name": 0.25,         # Name similarity
    "description": 0.2,   # Description similarity
    "tags": 0.15,         # Tag overlap
    "seller": 0.1,        # Same seller preference
}

# Trending score decay factor (newer = higher weight)
TRENDING_DECAY_FACTOR = 0.9

# Minimum similarity threshold for content-based recommendations
MIN_SIMILARITY_THRESHOLD = 0.01
