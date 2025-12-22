"""
Deligo Search Server Configuration
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Meilisearch Configuration
    meilisearch_url: str = "http://localhost:7700"
    meilisearch_master_key: str = "deligo_search_master_key_2024"
    
    # MongoDB Configuration
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "deligo"
    
    # Server Configuration
    search_server_port: int = 8001
    search_server_host: str = "0.0.0.0"
    
    # CORS Configuration
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    
    # Indexing Configuration
    index_batch_size: int = 100
    auto_index_interval: int = 300  # 5 minutes
    
    # Search Configuration
    default_search_limit: int = 20
    max_search_limit: int = 100
    typo_tolerance_enabled: bool = True
    typo_tolerance_min_word_size_one_typo: int = 5
    typo_tolerance_min_word_size_two_typos: int = 9
    
    # Analytics
    enable_search_analytics: bool = True
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Product index configuration for Meilisearch
PRODUCTS_INDEX_CONFIG = {
    "primaryKey": "id",
    "searchableAttributes": [
        "name",
        "description",
        "category_name",
        "sku",
        "seo_tags",
        "seller_name",
        "variant_values",
    ],
    "filterableAttributes": [
        "category_id",
        "category_name",
        "seller_id",
        "status",
        "price",
        "stock",
        "discount",
        "rating",
        "created_at",
    ],
    "sortableAttributes": [
        "price",
        "created_at",
        "order_count",
        "view_count",
        "rating",
        "discount",
        "stock",
    ],
    "rankingRules": [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
        "order_count:desc",  # Popular products rank higher
        "view_count:desc",   # More viewed products rank higher
    ],
    "distinctAttribute": None,
    "stopWords": [
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "will", "would",
        "could", "should", "may", "might", "must", "shall", "can", "need",
        "this", "that", "these", "those", "it", "its"
    ],
    "synonyms": {
        "phone": ["mobile", "smartphone", "cellphone", "handset"],
        "laptop": ["notebook", "computer", "pc", "macbook"],
        "tv": ["television", "smart tv", "led tv", "oled tv"],
        "headphone": ["headphones", "earphone", "earphones", "earbuds", "headset"],
        "shirt": ["tshirt", "t-shirt", "tee", "top"],
        "pants": ["trousers", "jeans", "bottoms"],
        "shoes": ["footwear", "sneakers", "boots", "sandals"],
        "watch": ["smartwatch", "wristwatch", "timepiece"],
        "bag": ["backpack", "handbag", "purse", "satchel"],
        "camera": ["dslr", "mirrorless", "webcam"],
        "cheap": ["affordable", "budget", "low price", "discount"],
        "expensive": ["premium", "luxury", "high-end"],
        "good": ["great", "excellent", "best", "top"],
        "fast": ["quick", "speedy", "rapid"],
        "new": ["latest", "newest", "recent", "fresh"],
    },
    "typoTolerance": {
        "enabled": True,
        "minWordSizeForTypos": {
            "oneTypo": 5,
            "twoTypos": 9
        },
        "disableOnWords": [],
        "disableOnAttributes": ["sku"]
    },
    "faceting": {
        "maxValuesPerFacet": 100,
        "sortFacetValuesBy": {
            "*": "count"
        }
    },
    "pagination": {
        "maxTotalHits": 10000
    }
}

# Search analytics index configuration
ANALYTICS_INDEX_CONFIG = {
    "primaryKey": "id",
    "searchableAttributes": ["query", "user_id"],
    "filterableAttributes": ["user_id", "timestamp", "results_count", "clicked_product_id"],
    "sortableAttributes": ["timestamp", "results_count"]
}
