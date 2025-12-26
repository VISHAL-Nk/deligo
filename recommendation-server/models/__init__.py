"""
Models package initialization.
Exports all recommendation model classes.
"""

from .collaborative import CollaborativeFilteringModel
from .content_based import ContentBasedModel
from .hybrid import HybridRecommender

__all__ = [
    "CollaborativeFilteringModel",
    "ContentBasedModel",
    "HybridRecommender",
]
