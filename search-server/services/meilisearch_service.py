"""
Meilisearch Service - Core search engine integration
"""
import meilisearch
from meilisearch.errors import MeilisearchApiError
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from loguru import logger
import asyncio
from functools import lru_cache

from config import get_settings, PRODUCTS_INDEX_CONFIG
from models import (
    SearchRequest, SearchResponse, ProductResult, FacetGroup, FacetValue,
    AutocompleteRequest, AutocompleteResponse, AutocompleteProduct, AutocompleteCategory,
    IndexProductRequest, IndexResponse, IndexStats, SortField, SortOrder
)


class MeilisearchService:
    """Service for interacting with Meilisearch."""
    
    PRODUCTS_INDEX = "products"
    CATEGORIES_INDEX = "categories"
    ANALYTICS_INDEX = "search_analytics"
    
    def __init__(self):
        settings = get_settings()
        self.client = meilisearch.Client(
            settings.meilisearch_url,
            settings.meilisearch_master_key
        )
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize indexes with proper configuration."""
        if self._initialized:
            return
            
        try:
            # Create products index if not exists
            try:
                self.client.create_index(self.PRODUCTS_INDEX, {"primaryKey": "id"})
                logger.info(f"Created index: {self.PRODUCTS_INDEX}")
            except MeilisearchApiError as e:
                if "index_already_exists" not in str(e):
                    raise
                logger.debug(f"Index {self.PRODUCTS_INDEX} already exists")
            
            # Configure the products index
            index = self.client.index(self.PRODUCTS_INDEX)
            
            # Update settings
            index.update_settings({
                "searchableAttributes": PRODUCTS_INDEX_CONFIG["searchableAttributes"],
                "filterableAttributes": PRODUCTS_INDEX_CONFIG["filterableAttributes"],
                "sortableAttributes": PRODUCTS_INDEX_CONFIG["sortableAttributes"],
                "rankingRules": PRODUCTS_INDEX_CONFIG["rankingRules"],
                "stopWords": PRODUCTS_INDEX_CONFIG["stopWords"],
                "synonyms": PRODUCTS_INDEX_CONFIG["synonyms"],
                "typoTolerance": PRODUCTS_INDEX_CONFIG["typoTolerance"],
                "faceting": PRODUCTS_INDEX_CONFIG["faceting"],
                "pagination": PRODUCTS_INDEX_CONFIG["pagination"],
            })
            
            logger.info("Meilisearch index configured successfully")
            self._initialized = True
            
        except Exception as e:
            logger.error(f"Failed to initialize Meilisearch: {e}")
            raise
    
    async def search(self, request: SearchRequest) -> SearchResponse:
        """
        Perform advanced search with filters, sorting, and facets.
        """
        start_time = datetime.utcnow()
        
        index = self.client.index(self.PRODUCTS_INDEX)
        
        # Build filters
        filters = self._build_filters(request)
        
        # Build sort
        sort = self._build_sort(request)
        
        # Search options
        search_params: Dict[str, Any] = {
            "limit": request.limit,
            "offset": (request.page - 1) * request.limit,
            "attributesToRetrieve": ["*"],
        }
        
        if filters:
            search_params["filter"] = filters
        
        if sort:
            search_params["sort"] = sort
        
        if request.highlight:
            search_params["attributesToHighlight"] = ["name", "description"]
            search_params["highlightPreTag"] = "<mark>"
            search_params["highlightPostTag"] = "</mark>"
        
        if request.show_facets:
            search_params["facets"] = ["category_name", "status"]
        
        # Execute search
        try:
            results = index.search(request.query, search_params)
        except MeilisearchApiError as e:
            logger.error(f"Search error: {e}")
            raise
        
        # Process results
        products = self._process_search_results(results.get("hits", []))
        
        # Process facets
        facets = None
        if request.show_facets and results.get("facetDistribution"):
            facets = self._process_facets(results["facetDistribution"])
        
        # Calculate pagination
        total_hits = results.get("estimatedTotalHits", 0)
        total_pages = (total_hits + request.limit - 1) // request.limit
        
        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return SearchResponse(
            query=request.query,
            products=products,
            total_hits=total_hits,
            page=request.page,
            limit=request.limit,
            total_pages=total_pages,
            has_next_page=request.page < total_pages,
            has_prev_page=request.page > 1,
            processing_time_ms=processing_time_ms,
            facets=facets,
        )
    
    async def autocomplete(self, request: AutocompleteRequest) -> AutocompleteResponse:
        """
        Get autocomplete suggestions for partial queries.
        """
        start_time = datetime.utcnow()
        
        index = self.client.index(self.PRODUCTS_INDEX)
        
        products: List[AutocompleteProduct] = []
        categories: List[AutocompleteCategory] = []
        suggestions: List[str] = []
        
        if request.include_products:
            # Get product suggestions
            product_results = index.search(request.query, {
                "limit": request.limit,
                "attributesToRetrieve": ["id", "name", "images", "price", "category_name"],
                "filter": "status = 'active'",
            })
            
            for hit in product_results.get("hits", []):
                products.append(AutocompleteProduct(
                    id=hit["id"],
                    name=hit["name"],
                    image=hit.get("images", [None])[0] if hit.get("images") else None,
                    price=hit.get("price", 0),
                    category_name=hit.get("category_name"),
                ))
            
            # Get unique suggestions from product names
            seen = set()
            for hit in product_results.get("hits", []):
                name = hit.get("name", "").lower()
                words = name.split()
                for word in words:
                    if request.query.lower() in word and word not in seen:
                        suggestions.append(word.capitalize())
                        seen.add(word)
                        if len(suggestions) >= 5:
                            break
        
        if request.include_categories:
            # Get category suggestions via facet search
            category_results = index.search(request.query, {
                "limit": 0,
                "facets": ["category_name"],
                "filter": "status = 'active'",
            })
            
            facet_dist = category_results.get("facetDistribution", {}).get("category_name", {})
            for cat_name, count in list(facet_dist.items())[:5]:
                if request.query.lower() in cat_name.lower():
                    categories.append(AutocompleteCategory(
                        id=cat_name.lower().replace(" ", "-"),
                        name=cat_name,
                        product_count=count,
                    ))
        
        end_time = datetime.utcnow()
        processing_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        return AutocompleteResponse(
            query=request.query,
            products=products,
            categories=categories,
            suggestions=suggestions[:5],
            processing_time_ms=processing_time_ms,
        )
    
    async def index_product(self, product: IndexProductRequest) -> IndexResponse:
        """Index a single product."""
        return await self.index_products([product])
    
    async def index_products(self, products: List[IndexProductRequest]) -> IndexResponse:
        """Bulk index products."""
        if not products:
            return IndexResponse(
                success=True,
                message="No products to index",
                indexed_count=0,
            )
        
        index = self.client.index(self.PRODUCTS_INDEX)
        
        # Convert to documents
        documents = []
        for product in products:
            doc = {
                "id": product.id,
                "seller_id": product.seller_id,
                "sku": product.sku,
                "name": product.name,
                "description": product.description or "",
                "category_id": product.category_id,
                "category_name": product.category_name or "",
                "price": product.price,
                "currency": product.currency,
                "discount": product.discount,
                "discounted_price": product.price * (1 - product.discount / 100) if product.discount > 0 else product.price,
                "images": product.images,
                "stock": product.stock,
                "in_stock": product.stock > 0,
                "status": product.status.value,
                "rating": product.rating,
                "review_count": product.review_count,
                "order_count": product.order_count,
                "view_count": product.view_count,
                "seller_name": product.seller_name or "",
                "variant_values": " ".join(product.variant_values) if product.variant_values else "",
                "seo_tags": " ".join(product.seo_tags) if product.seo_tags else "",
                "created_at": product.created_at.timestamp() if product.created_at else datetime.utcnow().timestamp(),
                "updated_at": product.updated_at.timestamp() if product.updated_at else datetime.utcnow().timestamp(),
            }
            documents.append(doc)
        
        try:
            task = index.add_documents(documents)
            logger.info(f"Indexing {len(documents)} products, task UID: {task.task_uid}")
            
            return IndexResponse(
                success=True,
                message=f"Successfully queued {len(documents)} products for indexing",
                indexed_count=len(documents),
                task_uid=task.task_uid,
            )
        except MeilisearchApiError as e:
            logger.error(f"Indexing error: {e}")
            return IndexResponse(
                success=False,
                message=f"Failed to index products: {str(e)}",
                failed_count=len(documents),
                errors=[str(e)],
            )
    
    async def delete_product(self, product_id: str) -> bool:
        """Delete a product from the index."""
        try:
            index = self.client.index(self.PRODUCTS_INDEX)
            index.delete_document(product_id)
            logger.info(f"Deleted product {product_id} from index")
            return True
        except MeilisearchApiError as e:
            logger.error(f"Failed to delete product {product_id}: {e}")
            return False
    
    async def delete_products(self, product_ids: List[str]) -> Tuple[int, int]:
        """Delete multiple products. Returns (success_count, failed_count)."""
        success = 0
        failed = 0
        
        for product_id in product_ids:
            if await self.delete_product(product_id):
                success += 1
            else:
                failed += 1
        
        return success, failed
    
    async def get_stats(self) -> IndexStats:
        """Get index statistics."""
        try:
            index = self.client.index(self.PRODUCTS_INDEX)
            stats = index.get_stats()
            
            # stats might be a special object, access it directly
            return IndexStats(
                total_products=stats.number_of_documents if hasattr(stats, 'number_of_documents') else 0,
                is_indexing=stats.is_indexing if hasattr(stats, 'is_indexing') else False,
            )
        except Exception as e:
            logger.error(f"Failed to get stats: {e}, {type(e)}")
            return IndexStats(total_products=0)
    
    async def clear_index(self) -> bool:
        """Clear all documents from the index."""
        try:
            index = self.client.index(self.PRODUCTS_INDEX)
            index.delete_all_documents()
            logger.warning("Cleared all documents from products index")
            return True
        except MeilisearchApiError as e:
            logger.error(f"Failed to clear index: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check if Meilisearch is healthy."""
        try:
            health = self.client.health()
            return health.get("status") == "available"
        except Exception as e:
            logger.error(f"Meilisearch health check failed: {e}")
            return False
    
    def _build_filters(self, request: SearchRequest) -> Optional[str]:
        """Build Meilisearch filter string."""
        filters = []
        
        if request.status:
            filters.append(f"status = '{request.status.value}'")
        
        if request.category_id:
            filters.append(f"category_id = '{request.category_id}'")
        
        if request.category_name:
            filters.append(f"category_name = '{request.category_name}'")
        
        if request.seller_id:
            filters.append(f"seller_id = '{request.seller_id}'")
        
        if request.min_price is not None:
            filters.append(f"price >= {request.min_price}")
        
        if request.max_price is not None:
            filters.append(f"price <= {request.max_price}")
        
        if request.in_stock:
            filters.append("stock > 0")
        
        if request.min_rating is not None:
            filters.append(f"rating >= {request.min_rating}")
        
        if request.has_discount:
            filters.append("discount > 0")
        
        return " AND ".join(filters) if filters else None
    
    def _build_sort(self, request: SearchRequest) -> Optional[List[str]]:
        """Build Meilisearch sort array."""
        if request.sort_by == SortField.RELEVANCE:
            return None  # Use default relevance ranking
        
        sort_field_map = {
            SortField.PRICE: "price",
            SortField.CREATED_AT: "created_at",
            SortField.ORDER_COUNT: "order_count",
            SortField.VIEW_COUNT: "view_count",
            SortField.RATING: "rating",
            SortField.DISCOUNT: "discount",
        }
        
        field = sort_field_map.get(request.sort_by)
        if not field:
            return None
        
        order = "asc" if request.sort_order == SortOrder.ASC else "desc"
        return [f"{field}:{order}"]
    
    def _process_search_results(self, hits: List[Dict[str, Any]]) -> List[ProductResult]:
        """Process raw search hits into ProductResult objects."""
        products = []
        
        for hit in hits:
            product = ProductResult(
                id=hit["id"],
                name=hit.get("name", ""),
                description=hit.get("description"),
                price=hit.get("price", 0),
                currency=hit.get("currency", "INR"),
                discount=hit.get("discount", 0),
                discounted_price=hit.get("discounted_price"),
                images=hit.get("images", []),
                category_id=hit.get("category_id", ""),
                category_name=hit.get("category_name"),
                seller_id=hit.get("seller_id", ""),
                seller_name=hit.get("seller_name"),
                stock=hit.get("stock", 0),
                in_stock=hit.get("stock", 0) > 0,
                rating=hit.get("rating"),
                review_count=hit.get("review_count", 0),
                order_count=hit.get("order_count", 0),
                status=hit.get("status", "active"),
                sku=hit.get("sku", ""),
                _formatted=hit.get("_formatted"),
            )
            products.append(product)
        
        return products
    
    def _process_facets(self, facet_distribution: Dict[str, Dict[str, int]]) -> List[FacetGroup]:
        """Process facet distribution into FacetGroup objects."""
        facets = []
        
        display_names = {
            "category_name": "Category",
            "seller_name": "Seller",
            "status": "Status",
        }
        
        for facet_name, values in facet_distribution.items():
            facet_values = [
                FacetValue(value=v, count=c)
                for v, c in sorted(values.items(), key=lambda x: x[1], reverse=True)
            ]
            
            facets.append(FacetGroup(
                name=facet_name,
                display_name=display_names.get(facet_name, facet_name.replace("_", " ").title()),
                values=facet_values,
            ))
        
        return facets


# Singleton instance
_meilisearch_service: Optional[MeilisearchService] = None


def get_meilisearch_service() -> MeilisearchService:
    """Get or create the Meilisearch service singleton."""
    global _meilisearch_service
    if _meilisearch_service is None:
        _meilisearch_service = MeilisearchService()
    return _meilisearch_service
