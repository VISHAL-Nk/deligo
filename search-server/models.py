"""
Pydantic Models for Search Server
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


# ============ Enums ============

class ProductStatus(str, Enum):
    ACTIVE = "active"
    DRAFT = "draft"
    BANNED = "banned"
    DELETED = "deleted"


class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    RELEVANCE = "relevance"
    PRICE = "price"
    CREATED_AT = "created_at"
    ORDER_COUNT = "order_count"
    VIEW_COUNT = "view_count"
    RATING = "rating"
    DISCOUNT = "discount"


# ============ Request Models ============

class SearchRequest(BaseModel):
    """Search request parameters."""
    query: str = Field(..., min_length=1, max_length=500, description="Search query string")
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Results per page")
    
    # Filters
    category_id: Optional[str] = Field(None, description="Filter by category ID")
    category_name: Optional[str] = Field(None, description="Filter by category name")
    seller_id: Optional[str] = Field(None, description="Filter by seller ID")
    status: Optional[ProductStatus] = Field(ProductStatus.ACTIVE, description="Product status filter")
    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    in_stock: Optional[bool] = Field(None, description="Filter for in-stock items only")
    min_rating: Optional[float] = Field(None, ge=0, le=5, description="Minimum rating filter")
    has_discount: Optional[bool] = Field(None, description="Filter for discounted items")
    
    # Sorting
    sort_by: SortField = Field(SortField.RELEVANCE, description="Sort field")
    sort_order: SortOrder = Field(SortOrder.DESC, description="Sort order")
    
    # Advanced options
    highlight: bool = Field(True, description="Highlight matching terms")
    show_facets: bool = Field(True, description="Return facet counts")
    typo_tolerance: bool = Field(True, description="Enable typo tolerance")


class AutocompleteRequest(BaseModel):
    """Autocomplete/suggestions request."""
    query: str = Field(..., min_length=1, max_length=200, description="Partial query string")
    limit: int = Field(10, ge=1, le=20, description="Max suggestions to return")
    include_categories: bool = Field(True, description="Include category suggestions")
    include_products: bool = Field(True, description="Include product suggestions")


class IndexProductRequest(BaseModel):
    """Request to index a single product."""
    id: str = Field(..., description="Product ID")
    seller_id: str = Field(..., description="Seller ID")
    sku: str = Field(..., description="Product SKU")
    name: str = Field(..., description="Product name")
    description: Optional[str] = Field(None, description="Product description")
    category_id: str = Field(..., description="Category ID")
    category_name: Optional[str] = Field(None, description="Category name")
    price: float = Field(..., ge=0, description="Product price")
    currency: str = Field("INR", description="Currency code")
    discount: float = Field(0, ge=0, le=100, description="Discount percentage")
    images: List[str] = Field(default_factory=list, description="Image URLs")
    stock: int = Field(0, ge=0, description="Stock quantity")
    status: ProductStatus = Field(ProductStatus.ACTIVE, description="Product status")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Average rating")
    review_count: int = Field(0, ge=0, description="Number of reviews")
    order_count: int = Field(0, ge=0, description="Number of orders")
    view_count: int = Field(0, ge=0, description="Number of views")
    seller_name: Optional[str] = Field(None, description="Seller business name")
    variant_values: Optional[List[str]] = Field(None, description="Variant values for search")
    seo_tags: Optional[List[str]] = Field(None, description="SEO tags for search")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Update timestamp")


class BulkIndexRequest(BaseModel):
    """Request to bulk index products."""
    products: List[IndexProductRequest] = Field(..., min_length=1, max_length=1000)


class SearchAnalyticsEvent(BaseModel):
    """Search analytics event for tracking."""
    query: str = Field(..., description="Search query")
    user_id: Optional[str] = Field(None, description="User ID if logged in")
    session_id: Optional[str] = Field(None, description="Session ID")
    results_count: int = Field(0, description="Number of results returned")
    clicked_product_id: Optional[str] = Field(None, description="Product ID if clicked")
    position: Optional[int] = Field(None, description="Position in results if clicked")
    filters_used: Optional[Dict[str, Any]] = Field(None, description="Filters applied")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============ Response Models ============

class ProductResult(BaseModel):
    """Single product in search results."""
    id: str
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "INR"
    discount: float = 0
    discounted_price: Optional[float] = None
    images: List[str] = []
    category_id: str
    category_name: Optional[str] = None
    seller_id: str
    seller_name: Optional[str] = None
    stock: int = 0
    in_stock: bool = True
    rating: Optional[float] = None
    review_count: int = 0
    order_count: int = 0
    status: str = "active"
    sku: str
    created_at: Optional[datetime] = None
    
    # Highlighted fields (with matched terms wrapped)
    formatted: Optional[Dict[str, Any]] = Field(None, alias="_formatted")
    
    class Config:
        populate_by_name = True


class FacetValue(BaseModel):
    """Single facet value with count."""
    value: str
    count: int


class FacetGroup(BaseModel):
    """Facet group for filtering."""
    name: str
    display_name: str
    values: List[FacetValue]


class SearchResponse(BaseModel):
    """Search response with results and metadata."""
    query: str
    products: List[ProductResult]
    total_hits: int
    page: int
    limit: int
    total_pages: int
    has_next_page: bool
    has_prev_page: bool
    processing_time_ms: int
    facets: Optional[List[FacetGroup]] = None
    
    # Search metadata
    query_corrected: Optional[str] = Field(None, description="Auto-corrected query if typos found")
    suggestions: Optional[List[str]] = Field(None, description="Related search suggestions")


class AutocompleteProduct(BaseModel):
    """Product suggestion in autocomplete."""
    id: str
    name: str
    image: Optional[str] = None
    price: float
    category_name: Optional[str] = None


class AutocompleteCategory(BaseModel):
    """Category suggestion in autocomplete."""
    id: str
    name: str
    product_count: int


class AutocompleteResponse(BaseModel):
    """Autocomplete response."""
    query: str
    products: List[AutocompleteProduct] = []
    categories: List[AutocompleteCategory] = []
    suggestions: List[str] = []
    processing_time_ms: int


class IndexStats(BaseModel):
    """Index statistics."""
    total_products: int
    indexed_at: Optional[datetime] = None
    last_update: Optional[datetime] = None
    index_size_bytes: Optional[int] = None
    is_indexing: bool = False


class IndexResponse(BaseModel):
    """Response after indexing operation."""
    success: bool
    message: str
    indexed_count: int = 0
    failed_count: int = 0
    task_uid: Optional[int] = None
    errors: Optional[List[str]] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    meilisearch_status: str
    mongodb_status: str
    timestamp: datetime
    version: str = "1.0.0"
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AnalyticsResponse(BaseModel):
    """Search analytics response."""
    total_searches: int
    unique_queries: int
    avg_results_per_query: float
    top_queries: List[Dict[str, Any]]
    zero_result_queries: List[str]
    popular_categories: List[Dict[str, Any]]
    search_trends: List[Dict[str, Any]]
    period: str  # e.g., "last_24h", "last_7d", "last_30d"


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
