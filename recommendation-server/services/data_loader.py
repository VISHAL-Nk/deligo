"""
Data Loader Service

Responsible for loading and preprocessing data from MongoDB for model training.
Handles:
- User interaction data (views, cart additions, purchases)
- Product metadata (names, descriptions, categories)
- User profiles for personalization
- Regional data for trending recommendations
"""

import asyncio
from datetime import datetime, timedelta
from typing import Optional
import numpy as np
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from loguru import logger
from bson import ObjectId

from config import get_settings, INTERACTION_WEIGHTS


class DataLoader:
    """
    Async data loader for fetching recommendation training data from MongoDB.
    
    This service abstracts all database operations and returns clean DataFrames
    ready for model training.
    """
    
    def __init__(self, db: Optional[AsyncIOMotorDatabase] = None):
        """
        Initialize the data loader.
        
        Args:
            db: Optional MongoDB database instance. If not provided,
                creates a new connection using settings.
        """
        self.settings = get_settings()
        self._db = db
        self._client: Optional[AsyncIOMotorClient] = None
    
    async def connect(self) -> None:
        """Establish database connection if not already connected."""
        if self._db is None:
            self._client = AsyncIOMotorClient(self.settings.mongodb_uri)
            self._db = self._client[self.settings.mongodb_db_name]
            logger.info(f"Connected to MongoDB: {self.settings.mongodb_db_name}")
    
    async def disconnect(self) -> None:
        """Close database connection."""
        if self._client:
            self._client.close()
            logger.info("Disconnected from MongoDB")
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get database instance, raising error if not connected."""
        if self._db is None:
            raise RuntimeError("Database not connected. Call connect() first.")
        return self._db
    
    # =========================================================================
    # INTERACTION DATA LOADING
    # =========================================================================
    
    async def load_interactions(
        self,
        since_days: Optional[int] = None,
        interaction_types: Optional[list[str]] = None
    ) -> pd.DataFrame:
        """
        Load user-product interactions for collaborative filtering.
        
        Interactions include: views, cart additions, purchases, wishlist, reviews.
        Each interaction type has a different weight indicating signal strength.
        
        Args:
            since_days: Only load interactions from the last N days. None = all.
            interaction_types: Filter to specific types. None = all types.
        
        Returns:
            DataFrame with columns: user_id, product_id, interaction_type, 
            weight, timestamp
        """
        await self.connect()
        
        interactions = []
        
        # Build date filter if specified
        date_filter = {}
        if since_days:
            cutoff = datetime.utcnow() - timedelta(days=since_days)
            date_filter = {"$gte": cutoff}
        
        # 1. Load product views from analytics/view events
        if interaction_types is None or "view" in interaction_types:
            views = await self._load_view_interactions(date_filter)
            interactions.extend(views)
        
        # 2. Load cart additions
        if interaction_types is None or "cart" in interaction_types:
            cart_items = await self._load_cart_interactions(date_filter)
            interactions.extend(cart_items)
        
        # 3. Load purchases from orders
        if interaction_types is None or "purchase" in interaction_types:
            purchases = await self._load_purchase_interactions(date_filter)
            interactions.extend(purchases)
        
        # 4. Load wishlist additions
        if interaction_types is None or "wishlist" in interaction_types:
            wishlists = await self._load_wishlist_interactions(date_filter)
            interactions.extend(wishlists)
        
        # 5. Load reviews
        if interaction_types is None or "review" in interaction_types:
            reviews = await self._load_review_interactions(date_filter)
            interactions.extend(reviews)
        
        if not interactions:
            logger.warning("No interactions found in database")
            return pd.DataFrame(columns=[
                "user_id", "product_id", "interaction_type", "weight", "timestamp"
            ])
        
        df = pd.DataFrame(interactions)
        
        # Add weights based on interaction type
        df["weight"] = df["interaction_type"].map(
            lambda x: INTERACTION_WEIGHTS.get(x, 1.0)
        )
        
        logger.info(f"Loaded {len(df)} interactions from database")
        return df
    
    async def _load_view_interactions(self, date_filter: dict) -> list[dict]:
        """Load product view events from multiple sources."""
        views = []
        collections = await self.db.list_collection_names()
        
        # 1. PRIMARY SOURCE: Load from userprofiles.preferences.recentlyViewed
        # This is where Next.js analytics/view API stores the data
        if "userprofiles" in collections:
            cursor = self.db.userprofiles.find({"preferences.recentlyViewed": {"$exists": True, "$ne": []}})
            async for doc in cursor:
                user_id = str(doc.get("userId"))
                preferences = doc.get("preferences", {})
                recently_viewed = preferences.get("recentlyViewed", [])
                
                for view_item in recently_viewed:
                    product_id = view_item.get("productId")
                    viewed_at = view_item.get("viewedAt")
                    
                    # Apply date filter if specified
                    if date_filter and viewed_at:
                        if isinstance(viewed_at, str):
                            try:
                                viewed_at = datetime.fromisoformat(viewed_at.replace('Z', '+00:00'))
                            except:
                                viewed_at = datetime.utcnow()
                        cutoff = date_filter.get("$gte")
                        if cutoff and viewed_at < cutoff:
                            continue
                    
                    if user_id and product_id:
                        views.append({
                            "user_id": user_id,
                            "product_id": str(product_id),
                            "interaction_type": "view",
                            "timestamp": viewed_at or datetime.utcnow()
                        })
            
            logger.info(f"Loaded {len(views)} views from userprofiles.preferences.recentlyViewed")
        
        # 2. Also check productviews collection (legacy)
        if "productviews" in collections:
            query = {}
            if date_filter:
                query["timestamp"] = date_filter
            cursor = self.db.productviews.find(query)
            async for doc in cursor:
                user_id = doc.get("userId") or doc.get("sessionId")
                if user_id and doc.get("productId"):
                    views.append({
                        "user_id": str(user_id),
                        "product_id": str(doc["productId"]),
                        "interaction_type": "view",
                        "timestamp": doc.get("timestamp", datetime.utcnow())
                    })
        
        # 3. Also try analytics collection
        if "analytics" in collections:
            query = {"event": "product_view"}
            if date_filter:
                query["createdAt"] = date_filter
            cursor = self.db.analytics.find(query)
            async for doc in cursor:
                if doc.get("userId") and doc.get("productId"):
                    views.append({
                        "user_id": str(doc["userId"]),
                        "product_id": str(doc["productId"]),
                        "interaction_type": "view",
                        "timestamp": doc.get("createdAt", datetime.utcnow())
                    })
        
        return views
    
    async def _load_cart_interactions(self, date_filter: dict) -> list[dict]:
        """Load cart addition events from carts collection."""
        cart_items = []
        query = {}
        if date_filter:
            query["updatedAt"] = date_filter
        
        cursor = self.db.carts.find(query)
        async for doc in cursor:
            user_id = str(doc.get("userId") or doc.get("user"))
            items = doc.get("items", [])
            timestamp = doc.get("updatedAt", doc.get("createdAt", datetime.utcnow()))
            
            for item in items:
                product_id = str(item.get("productId") or item.get("product"))
                if user_id and product_id:
                    cart_items.append({
                        "user_id": user_id,
                        "product_id": product_id,
                        "interaction_type": "cart",
                        "timestamp": timestamp
                    })
        
        return cart_items
    
    async def _load_purchase_interactions(self, date_filter: dict) -> list[dict]:
        """Load purchase events from orders collection."""
        purchases = []
        query = {"status": {"$in": ["delivered", "shipped", "processing", "confirmed"]}}
        if date_filter:
            query["createdAt"] = date_filter
        
        cursor = self.db.orders.find(query)
        async for doc in cursor:
            user_id = str(doc.get("userId") or doc.get("user") or doc.get("customerId"))
            items = doc.get("items", [])
            timestamp = doc.get("createdAt", datetime.utcnow())
            
            for item in items:
                product_id = str(item.get("productId") or item.get("product"))
                if user_id and product_id:
                    purchases.append({
                        "user_id": user_id,
                        "product_id": product_id,
                        "interaction_type": "purchase",
                        "timestamp": timestamp
                    })
        
        return purchases
    
    async def _load_wishlist_interactions(self, date_filter: dict) -> list[dict]:
        """Load wishlist additions."""
        wishlists = []
        
        # Check if wishlist collection exists
        collections = await self.db.list_collection_names()
        if "wishlists" not in collections:
            return wishlists
        
        query = {}
        if date_filter:
            query["createdAt"] = date_filter
        
        cursor = self.db.wishlists.find(query)
        async for doc in cursor:
            user_id = str(doc.get("userId") or doc.get("user"))
            products = doc.get("products", [])
            timestamp = doc.get("updatedAt", doc.get("createdAt", datetime.utcnow()))
            
            for product_id in products:
                if user_id and product_id:
                    wishlists.append({
                        "user_id": user_id,
                        "product_id": str(product_id),
                        "interaction_type": "wishlist",
                        "timestamp": timestamp
                    })
        
        return wishlists
    
    async def _load_review_interactions(self, date_filter: dict) -> list[dict]:
        """Load product reviews."""
        reviews = []
        query = {}
        if date_filter:
            query["createdAt"] = date_filter
        
        cursor = self.db.reviews.find(query)
        async for doc in cursor:
            user_id = str(doc.get("userId") or doc.get("user"))
            product_id = str(doc.get("productId") or doc.get("product"))
            timestamp = doc.get("createdAt", datetime.utcnow())
            
            if user_id and product_id:
                reviews.append({
                    "user_id": user_id,
                    "product_id": product_id,
                    "interaction_type": "review",
                    "timestamp": timestamp
                })
        
        return reviews
    
    # =========================================================================
    # PRODUCT DATA LOADING
    # =========================================================================
    
    async def load_products(
        self,
        active_only: bool = True,
        include_out_of_stock: bool = False
    ) -> pd.DataFrame:
        """
        Load product catalog for content-based filtering.
        
        Args:
            active_only: Only load active/published products.
            include_out_of_stock: Include products with zero stock.
        
        Returns:
            DataFrame with product metadata including text features for TF-IDF.
        """
        await self.connect()
        
        query = {}
        if active_only:
            query["status"] = {"$in": ["active", "published"]}
        if not include_out_of_stock:
            query["stock"] = {"$gt": 0}
        
        products = []
        cursor = self.db.products.find(query)
        
        async for doc in cursor:
            # Extract category name if it's a reference
            category_id = doc.get("category")
            category_name = ""
            if category_id:
                cat_doc = await self.db.categories.find_one({"_id": ObjectId(str(category_id))})
                if cat_doc:
                    category_name = cat_doc.get("name", "")
            
            # Extract seller info
            seller_id = doc.get("seller") or doc.get("sellerId")
            
            products.append({
                "product_id": str(doc["_id"]),
                "name": doc.get("name", ""),
                "description": doc.get("description", ""),
                "category_id": str(category_id) if category_id else "",
                "category_name": category_name,
                "seller_id": str(seller_id) if seller_id else "",
                "price": float(doc.get("price", 0)),
                "discount_price": float(doc.get("discountPrice", doc.get("price", 0))),
                "stock": int(doc.get("stock", 0)),
                "tags": doc.get("tags", []),
                "rating": float(doc.get("averageRating", doc.get("rating", 0))),
                "review_count": int(doc.get("reviewCount", doc.get("numReviews", 0))),
                "order_count": int(doc.get("orderCount", doc.get("soldCount", 0))),
                "view_count": int(doc.get("viewCount", 0)),
                "created_at": doc.get("createdAt", datetime.utcnow()),
            })
        
        if not products:
            logger.warning("No products found in database")
            return pd.DataFrame()
        
        df = pd.DataFrame(products)
        
        # Create combined text field for TF-IDF
        df["text_features"] = (
            df["name"].fillna("") + " " +
            df["description"].fillna("") + " " +
            df["category_name"].fillna("") + " " +
            df["tags"].apply(lambda x: " ".join(x) if isinstance(x, list) else "")
        )
        
        logger.info(f"Loaded {len(df)} products from database")
        return df
    
    async def load_product_by_id(self, product_id: str) -> Optional[dict]:
        """Load a single product by ID."""
        await self.connect()
        
        try:
            doc = await self.db.products.find_one({"_id": ObjectId(product_id)})
            if doc:
                return {
                    "product_id": str(doc["_id"]),
                    "name": doc.get("name", ""),
                    "description": doc.get("description", ""),
                    "category_id": str(doc.get("category", "")),
                    "price": float(doc.get("price", 0)),
                    "tags": doc.get("tags", []),
                }
        except Exception as e:
            logger.error(f"Error loading product {product_id}: {e}")
        
        return None
    
    # =========================================================================
    # USER DATA LOADING
    # =========================================================================
    
    async def load_user_profile(self, user_id: str) -> Optional[dict]:
        """
        Load user profile data for personalization.
        
        Returns user's location, preferences, and interaction history summary.
        """
        await self.connect()
        
        try:
            # Load user document
            user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                return None
            
            # Get user's order history for category preferences
            orders = []
            cursor = self.db.orders.find({"userId": ObjectId(user_id)})
            async for order in cursor:
                orders.append(order)
            
            # Extract frequently purchased categories
            category_counts = {}
            for order in orders:
                for item in order.get("items", []):
                    cat_id = item.get("categoryId")
                    if cat_id:
                        cat_id = str(cat_id)
                        category_counts[cat_id] = category_counts.get(cat_id, 0) + 1
            
            return {
                "user_id": str(user["_id"]),
                "location": user.get("address", {}).get("city", ""),
                "region": user.get("address", {}).get("state", user.get("address", {}).get("region", "")),
                "preferred_categories": category_counts,
                "order_count": len(orders),
                "created_at": user.get("createdAt", datetime.utcnow()),
            }
        except Exception as e:
            logger.error(f"Error loading user profile {user_id}: {e}")
            return None
    
    async def get_user_interaction_history(
        self,
        user_id: str,
        limit: int = 100
    ) -> list[str]:
        """
        Get list of product IDs the user has interacted with.
        
        Useful for excluding already-seen products from recommendations.
        """
        await self.connect()
        
        product_ids = set()
        
        # Get from userprofiles preferences (recentlyViewed)
        try:
            profile = await self.db.userprofiles.find_one({"userId": ObjectId(user_id)})
            if profile and profile.get("preferences", {}).get("recentlyViewed"):
                for item in profile["preferences"]["recentlyViewed"]:
                    pid = item.get("productId")
                    if pid:
                        product_ids.add(str(pid))
        except Exception as e:
            logger.debug(f"Error getting user preferences: {e}")
        
        # Get from orders
        cursor = self.db.orders.find({"userId": ObjectId(user_id)}).limit(limit)
        async for order in cursor:
            for item in order.get("items", []):
                pid = item.get("productId") or item.get("product")
                if pid:
                    product_ids.add(str(pid))
        
        # Get from cart
        cart = await self.db.carts.find_one({"userId": ObjectId(user_id)})
        if cart:
            for item in cart.get("items", []):
                pid = item.get("productId") or item.get("product")
                if pid:
                    product_ids.add(str(pid))
        
        return list(product_ids)
    
    async def get_user_recently_viewed(
        self,
        user_id: str,
        limit: int = 20
    ) -> list[dict]:
        """
        Get user's recently viewed products with timestamps and category info.
        
        Returns list of dicts with product_id, viewed_at, and frequency weighting.
        Most recent items have higher weight.
        """
        await self.connect()
        
        try:
            profile = await self.db.userprofiles.find_one({"userId": ObjectId(user_id)})
            if not profile:
                return []
            
            preferences = profile.get("preferences", {})
            recently_viewed = preferences.get("recentlyViewed", [])[:limit]
            category_interests = preferences.get("categoryInterests", {})
            
            result = []
            for idx, item in enumerate(recently_viewed):
                product_id = item.get("productId")
                if product_id:
                    # Weight by recency (more recent = higher weight)
                    recency_weight = 1.0 - (idx * 0.05)  # 1.0, 0.95, 0.90, ...
                    result.append({
                        "product_id": str(product_id),
                        "viewed_at": item.get("viewedAt"),
                        "recency_weight": max(0.1, recency_weight)
                    })
            
            return result
            
        except Exception as e:
            logger.error(f"Error getting recently viewed for user {user_id}: {e}")
            return []
    
    async def get_user_category_interests(
        self,
        user_id: str
    ) -> dict:
        """
        Get user's category interests with frequency counts.
        
        Returns dict mapping category_id to interest score.
        """
        await self.connect()
        
        try:
            profile = await self.db.userprofiles.find_one({"userId": ObjectId(user_id)})
            if not profile:
                return {}
            
            return profile.get("preferences", {}).get("categoryInterests", {})
            
        except Exception as e:
            logger.error(f"Error getting category interests for user {user_id}: {e}")
            return {}
    
    # =========================================================================
    # TRENDING & POPULARITY DATA
    # =========================================================================
    
    async def load_trending_data(
        self,
        region: Optional[str] = None,
        days: int = 7
    ) -> pd.DataFrame:
        """
        Load recent order data for trending calculations.
        
        Args:
            region: Filter by region/city. None = all regions.
            days: Number of days to consider for trending.
        
        Returns:
            DataFrame with product sales aggregated by recency.
        """
        await self.connect()
        
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Build aggregation pipeline
        pipeline = [
            {"$match": {
                "createdAt": {"$gte": cutoff},
                "status": {"$in": ["delivered", "shipped", "processing", "confirmed"]}
            }},
            {"$unwind": "$items"},
            {"$group": {
                "_id": {
                    "product_id": "$items.productId",
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}}
                },
                "count": {"$sum": "$items.quantity"},
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
            }},
            {"$sort": {"_id.date": -1}}
        ]
        
        # Add region filter if specified
        if region:
            pipeline[0]["$match"]["shippingAddress.region"] = region
        
        results = []
        async for doc in self.db.orders.aggregate(pipeline):
            results.append({
                "product_id": str(doc["_id"]["product_id"]),
                "date": doc["_id"]["date"],
                "order_count": doc["count"],
                "revenue": doc["revenue"]
            })
        
        if not results:
            return pd.DataFrame(columns=["product_id", "date", "order_count", "revenue"])
        
        return pd.DataFrame(results)
    
    async def load_popularity_scores(self) -> pd.DataFrame:
        """
        Calculate popularity scores for all products.
        
        Combines order count, view count, and review count into a single score.
        """
        products_df = await self.load_products(active_only=True)
        
        if products_df.empty:
            return pd.DataFrame(columns=["product_id", "popularity_score"])
        
        # Normalize each metric to 0-1 range
        for col in ["order_count", "view_count", "review_count"]:
            max_val = products_df[col].max()
            if max_val > 0:
                products_df[f"{col}_norm"] = products_df[col] / max_val
            else:
                products_df[f"{col}_norm"] = 0
        
        # Calculate weighted popularity score
        products_df["popularity_score"] = (
            0.5 * products_df["order_count_norm"] +
            0.3 * products_df["view_count_norm"] +
            0.2 * products_df["review_count_norm"]
        )
        
        return products_df[["product_id", "popularity_score", "order_count", "view_count", "review_count"]]
    
    # =========================================================================
    # DATA STATISTICS
    # =========================================================================
    
    async def get_data_statistics(self) -> dict:
        """Get statistics about available data for training."""
        await self.connect()
        
        stats = {
            "products_count": await self.db.products.count_documents({"status": {"$in": ["active", "published"]}}),
            "users_count": await self.db.users.count_documents({}),
            "orders_count": await self.db.orders.count_documents({}),
            "reviews_count": await self.db.reviews.count_documents({}),
        }
        
        # Check for carts collection
        collections = await self.db.list_collection_names()
        if "carts" in collections:
            stats["carts_count"] = await self.db.carts.count_documents({})
        
        return stats
