"""
Indexer Service - Handles product indexing and synchronization
"""
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List
from loguru import logger

from services.meilisearch_service import get_meilisearch_service, MeilisearchService
from services.mongodb_service import get_mongodb_service, MongoDBService
from models import IndexResponse, IndexStats
from config import get_settings


class IndexerService:
    """Service for managing product indexing."""
    
    def __init__(self):
        self.settings = get_settings()
        self.meilisearch: Optional[MeilisearchService] = None
        self.mongodb: Optional[MongoDBService] = None
        self._last_full_index: Optional[datetime] = None
        self._last_incremental_index: Optional[datetime] = None
        self._is_indexing: bool = False
        self._auto_index_task: Optional[asyncio.Task] = None
    
    async def initialize(self) -> None:
        """Initialize the indexer service."""
        self.meilisearch = get_meilisearch_service()
        self.mongodb = await get_mongodb_service()
        
        # Initialize Meilisearch indexes
        await self.meilisearch.initialize()
        
        logger.info("Indexer service initialized")
    
    async def full_reindex(self) -> IndexResponse:
        """
        Perform a full reindex of all products from MongoDB.
        This clears the existing index and rebuilds it.
        """
        if self._is_indexing:
            return IndexResponse(
                success=False,
                message="Indexing already in progress",
            )
        
        self._is_indexing = True
        start_time = datetime.utcnow()
        total_indexed = 0
        total_failed = 0
        errors: List[str] = []
        
        try:
            logger.info("Starting full reindex...")
            
            # Clear existing index
            await self.meilisearch.clear_index()
            
            # Index all products in batches
            async for batch in self.mongodb.get_all_products_for_indexing(
                batch_size=self.settings.index_batch_size
            ):
                result = await self.meilisearch.index_products(batch)
                
                if result.success:
                    total_indexed += result.indexed_count
                else:
                    total_failed += result.failed_count
                    if result.errors:
                        errors.extend(result.errors)
                
                # Small delay between batches to avoid overwhelming the service
                await asyncio.sleep(0.1)
            
            self._last_full_index = datetime.utcnow()
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            
            logger.info(
                f"Full reindex completed: {total_indexed} indexed, "
                f"{total_failed} failed, took {elapsed:.2f}s"
            )
            
            return IndexResponse(
                success=total_failed == 0,
                message=f"Full reindex completed in {elapsed:.2f}s",
                indexed_count=total_indexed,
                failed_count=total_failed,
                errors=errors if errors else None,
            )
            
        except Exception as e:
            logger.error(f"Full reindex failed: {e}")
            return IndexResponse(
                success=False,
                message=f"Full reindex failed: {str(e)}",
                errors=[str(e)],
            )
        finally:
            self._is_indexing = False
    
    async def incremental_index(self, since: Optional[datetime] = None) -> IndexResponse:
        """
        Perform incremental indexing of products updated since last index.
        """
        if self._is_indexing:
            return IndexResponse(
                success=False,
                message="Indexing already in progress",
            )
        
        self._is_indexing = True
        
        try:
            # Determine the timestamp to check from
            check_since = since or self._last_incremental_index or (
                datetime.utcnow() - timedelta(hours=1)
            )
            
            logger.info(f"Starting incremental index since {check_since}...")
            
            total_indexed = 0
            total_failed = 0
            errors: List[str] = []
            
            async for batch in self.mongodb.get_products_updated_since(
                since=check_since,
                batch_size=self.settings.index_batch_size
            ):
                result = await self.meilisearch.index_products(batch)
                
                if result.success:
                    total_indexed += result.indexed_count
                else:
                    total_failed += result.failed_count
                    if result.errors:
                        errors.extend(result.errors)
            
            self._last_incremental_index = datetime.utcnow()
            
            logger.info(
                f"Incremental index completed: {total_indexed} indexed, "
                f"{total_failed} failed"
            )
            
            return IndexResponse(
                success=total_failed == 0,
                message=f"Incremental index completed: {total_indexed} products",
                indexed_count=total_indexed,
                failed_count=total_failed,
                errors=errors if errors else None,
            )
            
        except Exception as e:
            logger.error(f"Incremental index failed: {e}")
            return IndexResponse(
                success=False,
                message=f"Incremental index failed: {str(e)}",
                errors=[str(e)],
            )
        finally:
            self._is_indexing = False
    
    async def index_single_product(self, product_id: str) -> IndexResponse:
        """Index or update a single product."""
        try:
            product = await self.mongodb.get_product_by_id(product_id)
            
            if not product:
                return IndexResponse(
                    success=False,
                    message=f"Product {product_id} not found",
                )
            
            result = await self.meilisearch.index_product(product)
            return result
            
        except Exception as e:
            logger.error(f"Failed to index product {product_id}: {e}")
            return IndexResponse(
                success=False,
                message=f"Failed to index product: {str(e)}",
                errors=[str(e)],
            )
    
    async def delete_product_from_index(self, product_id: str) -> bool:
        """Remove a product from the search index."""
        return await self.meilisearch.delete_product(product_id)
    
    async def get_index_stats(self) -> IndexStats:
        """Get current index statistics."""
        stats = await self.meilisearch.get_stats()
        stats.indexed_at = self._last_full_index
        stats.last_update = self._last_incremental_index
        return stats
    
    def start_auto_indexing(self) -> None:
        """Start automatic periodic indexing."""
        if self._auto_index_task:
            logger.warning("Auto indexing already running")
            return
        
        self._auto_index_task = asyncio.create_task(self._auto_index_loop())
        logger.info(
            f"Started auto indexing with interval {self.settings.auto_index_interval}s"
        )
    
    def stop_auto_indexing(self) -> None:
        """Stop automatic periodic indexing."""
        if self._auto_index_task:
            self._auto_index_task.cancel()
            self._auto_index_task = None
            logger.info("Stopped auto indexing")
    
    async def _auto_index_loop(self) -> None:
        """Background task for periodic incremental indexing."""
        while True:
            try:
                await asyncio.sleep(self.settings.auto_index_interval)
                await self.incremental_index()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Auto index error: {e}")
                await asyncio.sleep(60)  # Wait a minute before retry


# Singleton instance
_indexer_service: Optional[IndexerService] = None


async def get_indexer_service() -> IndexerService:
    """Get or create the Indexer service singleton."""
    global _indexer_service
    if _indexer_service is None:
        _indexer_service = IndexerService()
        await _indexer_service.initialize()
    return _indexer_service
