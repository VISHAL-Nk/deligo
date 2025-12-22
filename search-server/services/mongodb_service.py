"""
MongoDB Service - Database operations for syncing products
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any, AsyncGenerator
from datetime import datetime
from loguru import logger
from bson import ObjectId

from config import get_settings
from models import IndexProductRequest, ProductStatus


class MongoDBService:
    """Service for MongoDB operations."""
    
    def __init__(self):
        self.settings = get_settings()
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
    
    async def connect(self) -> None:
        """Connect to MongoDB."""
        try:
            self.client = AsyncIOMotorClient(self.settings.mongodb_uri)
            self.db = self.client[self.settings.mongodb_db_name]
            
            # Test connection
            await self.client.admin.command("ping")
            logger.info(f"Connected to MongoDB: {self.settings.mongodb_db_name}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    async def health_check(self) -> bool:
        """Check if MongoDB is healthy."""
        try:
            if self.client:
                await self.client.admin.command("ping")
                return True
            return False
        except Exception as e:
            logger.error(f"MongoDB health check failed: {e}")
            return False
    
    async def get_all_products_for_indexing(
        self,
        batch_size: int = 100,
        status_filter: Optional[List[str]] = None
    ) -> AsyncGenerator[List[IndexProductRequest], None]:
        """
        Fetch all products from MongoDB in batches for indexing.
        Yields batches of products.
        """
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        
        products_collection = self.db["products"]
        categories_collection = self.db["categories"]
        seller_profiles_collection = self.db["sellerprofiles"]
        
        # Build query
        query: Dict[str, Any] = {}
        if status_filter:
            query["status"] = {"$in": status_filter}
        else:
            # Default: only index active products
            query["status"] = "active"
        
        # Get total count
        total = await products_collection.count_documents(query)
        logger.info(f"Found {total} products to index")
        
        # Fetch in batches
        skip = 0
        while True:
            cursor = products_collection.find(query).skip(skip).limit(batch_size)
            products = await cursor.to_list(length=batch_size)
            
            if not products:
                break
            
            # Process batch
            indexed_products: List[IndexProductRequest] = []
            
            for product in products:
                try:
                    # Get category name
                    category_name = None
                    if product.get("categoryId"):
                        category = await categories_collection.find_one(
                            {"_id": ObjectId(product["categoryId"])}
                        )
                        if category:
                            category_name = category.get("name")
                    
                    # Get seller name
                    seller_name = None
                    if product.get("sellerId"):
                        seller = await seller_profiles_collection.find_one(
                            {"_id": ObjectId(product["sellerId"])}
                        )
                        if seller:
                            seller_name = seller.get("businessName")
                    
                    # Extract variant values for search
                    variant_values = []
                    for variant in product.get("variants", []):
                        variant_values.extend(variant.get("values", []))
                    
                    # Extract SEO tags
                    seo_tags = []
                    if product.get("seo"):
                        seo_tags = product["seo"].get("tags", [])
                    
                    indexed_product = IndexProductRequest(
                        id=str(product["_id"]),
                        seller_id=str(product.get("sellerId", "")),
                        sku=product.get("sku", ""),
                        name=product.get("name", ""),
                        description=product.get("description"),
                        category_id=str(product.get("categoryId", "")),
                        category_name=category_name,
                        price=float(product.get("price", 0)),
                        currency=product.get("currency", "INR"),
                        discount=float(product.get("discount", 0)),
                        images=product.get("images", []),
                        stock=int(product.get("stock", 0)),
                        status=ProductStatus(product.get("status", "active")),
                        rating=None,  # Will be calculated from reviews
                        review_count=0,  # Will be updated
                        order_count=int(product.get("orderCount", 0)),
                        view_count=int(product.get("viewCount", 0)),
                        seller_name=seller_name,
                        variant_values=variant_values if variant_values else None,
                        seo_tags=seo_tags if seo_tags else None,
                        created_at=product.get("createdAt"),
                        updated_at=product.get("updatedAt"),
                    )
                    indexed_products.append(indexed_product)
                    
                except Exception as e:
                    logger.error(f"Error processing product {product.get('_id')}: {e}")
                    continue
            
            if indexed_products:
                yield indexed_products
            
            skip += batch_size
            logger.info(f"Processed {min(skip, total)}/{total} products")
    
    async def get_product_by_id(self, product_id: str) -> Optional[IndexProductRequest]:
        """Fetch a single product by ID for indexing."""
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        
        try:
            products_collection = self.db["products"]
            categories_collection = self.db["categories"]
            seller_profiles_collection = self.db["sellerprofiles"]
            
            product = await products_collection.find_one({"_id": ObjectId(product_id)})
            
            if not product:
                return None
            
            # Get category name
            category_name = None
            if product.get("categoryId"):
                category = await categories_collection.find_one(
                    {"_id": ObjectId(product["categoryId"])}
                )
                if category:
                    category_name = category.get("name")
            
            # Get seller name
            seller_name = None
            if product.get("sellerId"):
                seller = await seller_profiles_collection.find_one(
                    {"_id": ObjectId(product["sellerId"])}
                )
                if seller:
                    seller_name = seller.get("businessName")
            
            # Extract variant values
            variant_values = []
            for variant in product.get("variants", []):
                variant_values.extend(variant.get("values", []))
            
            # Extract SEO tags
            seo_tags = product.get("seo", {}).get("tags", [])
            
            return IndexProductRequest(
                id=str(product["_id"]),
                seller_id=str(product.get("sellerId", "")),
                sku=product.get("sku", ""),
                name=product.get("name", ""),
                description=product.get("description"),
                category_id=str(product.get("categoryId", "")),
                category_name=category_name,
                price=float(product.get("price", 0)),
                currency=product.get("currency", "INR"),
                discount=float(product.get("discount", 0)),
                images=product.get("images", []),
                stock=int(product.get("stock", 0)),
                status=ProductStatus(product.get("status", "active")),
                order_count=int(product.get("orderCount", 0)),
                view_count=int(product.get("viewCount", 0)),
                seller_name=seller_name,
                variant_values=variant_values if variant_values else None,
                seo_tags=seo_tags if seo_tags else None,
                created_at=product.get("createdAt"),
                updated_at=product.get("updatedAt"),
            )
            
        except Exception as e:
            logger.error(f"Error fetching product {product_id}: {e}")
            return None
    
    async def get_products_updated_since(
        self,
        since: datetime,
        batch_size: int = 100
    ) -> AsyncGenerator[List[IndexProductRequest], None]:
        """
        Fetch products updated since a given timestamp.
        Used for incremental indexing.
        """
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        
        products_collection = self.db["products"]
        
        query = {"updatedAt": {"$gte": since}}
        total = await products_collection.count_documents(query)
        logger.info(f"Found {total} products updated since {since}")
        
        skip = 0
        while True:
            cursor = products_collection.find(query).skip(skip).limit(batch_size)
            products = await cursor.to_list(length=batch_size)
            
            if not products:
                break
            
            # Reuse the main indexing logic
            async for batch in self.get_all_products_for_indexing(batch_size):
                yield batch
                break  # Only yield matching products
            
            skip += batch_size
    
    async def get_categories(self) -> List[Dict[str, Any]]:
        """Fetch all categories."""
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        
        categories_collection = self.db["categories"]
        cursor = categories_collection.find({"status": "active"})
        categories = await cursor.to_list(length=1000)
        
        return [
            {
                "id": str(cat["_id"]),
                "name": cat.get("name", ""),
                "slug": cat.get("slug", ""),
                "description": cat.get("description", ""),
            }
            for cat in categories
        ]
    
    async def get_product_stats(self) -> Dict[str, int]:
        """Get product statistics from MongoDB."""
        if self.db is None:
            raise RuntimeError("MongoDB not connected")
        
        products_collection = self.db["products"]
        
        total = await products_collection.count_documents({})
        active = await products_collection.count_documents({"status": "active"})
        draft = await products_collection.count_documents({"status": "draft"})
        
        return {
            "total": total,
            "active": active,
            "draft": draft,
        }


# Singleton instance
_mongodb_service: Optional[MongoDBService] = None


async def get_mongodb_service() -> MongoDBService:
    """Get or create the MongoDB service singleton."""
    global _mongodb_service
    if _mongodb_service is None:
        _mongodb_service = MongoDBService()
        await _mongodb_service.connect()
    return _mongodb_service
