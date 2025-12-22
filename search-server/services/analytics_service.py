"""
Search Analytics Service - Track and analyze search patterns
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from collections import defaultdict
import asyncio
from loguru import logger

from config import get_settings
from models import SearchAnalyticsEvent, AnalyticsResponse


class SearchAnalyticsService:
    """Service for tracking and analyzing search patterns."""
    
    def __init__(self):
        self.settings = get_settings()
        self._events: List[SearchAnalyticsEvent] = []
        self._events_lock = asyncio.Lock()
        self._max_events = 10000  # Keep last N events in memory
    
    async def track_search(self, event: SearchAnalyticsEvent) -> None:
        """Track a search event."""
        if not self.settings.enable_search_analytics:
            return
        
        async with self._events_lock:
            self._events.append(event)
            
            # Trim old events if exceeding max
            if len(self._events) > self._max_events:
                self._events = self._events[-self._max_events:]
    
    async def track_click(
        self,
        query: str,
        product_id: str,
        position: int,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> None:
        """Track when a user clicks on a search result."""
        event = SearchAnalyticsEvent(
            query=query,
            user_id=user_id,
            session_id=session_id,
            results_count=0,  # Not applicable for click events
            clicked_product_id=product_id,
            position=position,
        )
        await self.track_search(event)
    
    async def get_analytics(self, period: str = "last_24h") -> AnalyticsResponse:
        """Get search analytics for a given period."""
        # Calculate time range
        now = datetime.utcnow()
        
        if period == "last_24h":
            start_time = now - timedelta(hours=24)
        elif period == "last_7d":
            start_time = now - timedelta(days=7)
        elif period == "last_30d":
            start_time = now - timedelta(days=30)
        else:
            start_time = now - timedelta(hours=24)
        
        async with self._events_lock:
            # Filter events by time range
            filtered_events = [
                e for e in self._events
                if e.timestamp >= start_time
            ]
        
        if not filtered_events:
            return AnalyticsResponse(
                total_searches=0,
                unique_queries=0,
                avg_results_per_query=0,
                top_queries=[],
                zero_result_queries=[],
                popular_categories=[],
                search_trends=[],
                period=period,
            )
        
        # Calculate metrics
        total_searches = len(filtered_events)
        unique_queries = len(set(e.query.lower() for e in filtered_events))
        
        results_counts = [e.results_count for e in filtered_events if e.results_count > 0]
        avg_results = sum(results_counts) / len(results_counts) if results_counts else 0
        
        # Top queries
        query_counts: Dict[str, int] = defaultdict(int)
        zero_result_queries: List[str] = []
        
        for event in filtered_events:
            query_lower = event.query.lower()
            query_counts[query_lower] += 1
            
            if event.results_count == 0:
                zero_result_queries.append(event.query)
        
        top_queries = [
            {"query": q, "count": c}
            for q, c in sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:20]
        ]
        
        # Unique zero result queries
        zero_result_queries = list(set(zero_result_queries))[:20]
        
        # Popular categories (from filters used)
        category_counts: Dict[str, int] = defaultdict(int)
        for event in filtered_events:
            if event.filters_used and event.filters_used.get("category_name"):
                category_counts[event.filters_used["category_name"]] += 1
        
        popular_categories = [
            {"category": c, "count": cnt}
            for c, cnt in sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        # Search trends (hourly for last 24h, daily for longer periods)
        trends: List[Dict[str, Any]] = []
        
        if period == "last_24h":
            # Hourly buckets
            for i in range(24):
                bucket_start = now - timedelta(hours=24-i)
                bucket_end = now - timedelta(hours=23-i)
                bucket_count = sum(
                    1 for e in filtered_events
                    if bucket_start <= e.timestamp < bucket_end
                )
                trends.append({
                    "timestamp": bucket_start.isoformat(),
                    "count": bucket_count,
                })
        else:
            # Daily buckets
            days = 7 if period == "last_7d" else 30
            for i in range(days):
                bucket_start = now - timedelta(days=days-i)
                bucket_end = now - timedelta(days=days-i-1)
                bucket_count = sum(
                    1 for e in filtered_events
                    if bucket_start <= e.timestamp < bucket_end
                )
                trends.append({
                    "timestamp": bucket_start.date().isoformat(),
                    "count": bucket_count,
                })
        
        return AnalyticsResponse(
            total_searches=total_searches,
            unique_queries=unique_queries,
            avg_results_per_query=round(avg_results, 2),
            top_queries=top_queries,
            zero_result_queries=zero_result_queries,
            popular_categories=popular_categories,
            search_trends=trends,
            period=period,
        )
    
    async def clear_analytics(self) -> None:
        """Clear all analytics data."""
        async with self._events_lock:
            self._events.clear()
        logger.info("Cleared all analytics data")


# Singleton instance
_analytics_service: Optional[SearchAnalyticsService] = None


def get_analytics_service() -> SearchAnalyticsService:
    """Get or create the Analytics service singleton."""
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = SearchAnalyticsService()
    return _analytics_service
