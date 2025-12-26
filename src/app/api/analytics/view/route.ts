/**
 * Product View Analytics API
 * 
 * Tracks product views for the recommendation engine.
 * Updates user preferences with recently viewed products (queue structure).
 * This data feeds into collaborative filtering to improve suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import mongoose from 'mongoose';
import Product from '@/models/Products.models';
import UserProfile from '@/models/UserProfiles.models';

// Max items in recently viewed queue
const MAX_RECENTLY_VIEWED = 20;
const MAX_RECENT_SEARCHES = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, userId, searchQuery, timestamp } = body;

    if (!productId && !searchQuery) {
      return NextResponse.json(
        { error: 'productId or searchQuery is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // If tracking a product view
    if (productId) {
      // 1. Increment view count on the Product itself
      const product = await Product.findByIdAndUpdate(
        productId,
        { 
          $inc: { viewCount: 1 },
          $set: { lastViewedAt: new Date() }
        },
        { new: true }
      );

      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      // 2. Update user preferences if logged in
      if (userId) {
        await updateUserPreferences(userId, {
          type: 'view',
          productId,
          categoryId: product.categoryId?.toString(),
          timestamp: timestamp ? new Date(timestamp) : new Date()
        });
      }

      return NextResponse.json({ 
        success: true, 
        viewCount: product.viewCount,
        message: 'View tracked successfully'
      });
    }

    // If tracking a search query
    if (searchQuery && userId) {
      await updateUserPreferences(userId, {
        type: 'search',
        query: searchQuery,
        timestamp: timestamp ? new Date(timestamp) : new Date()
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Search tracked successfully'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Anonymous activity tracked'
    });

  } catch (error) {
    console.error('Analytics view error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track view' },
      { status: 500 }
    );
  }
}

/**
 * Update user preferences with recently viewed products (queue structure)
 */
async function updateUserPreferences(
  userId: string, 
  activity: { 
    type: 'view' | 'search' | 'click'; 
    productId?: string; 
    categoryId?: string;
    query?: string;
    timestamp: Date;
  }
) {
  try {
    const userProfile = await UserProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!userProfile) {
      // Create profile if doesn't exist
      const newPreferences = {
        recentlyViewed: activity.productId ? [{
          productId: activity.productId,
          viewedAt: activity.timestamp
        }] : [],
        recentSearches: activity.query ? [{
          query: activity.query,
          searchedAt: activity.timestamp
        }] : [],
        categoryInterests: activity.categoryId ? {
          [activity.categoryId]: 1
        } : {},
        lastActivityAt: activity.timestamp
      };

      await UserProfile.create({
        userId: new mongoose.Types.ObjectId(userId),
        preferences: newPreferences
      });
      return;
    }

    const preferences = userProfile.preferences || {};
    
    // Initialize arrays if not exist
    if (!preferences.recentlyViewed) preferences.recentlyViewed = [];
    if (!preferences.recentSearches) preferences.recentSearches = [];
    if (!preferences.categoryInterests) preferences.categoryInterests = {};

    // Handle product view - Queue structure (FIFO)
    if (activity.type === 'view' && activity.productId) {
      // Remove if already exists (to move to front)
      preferences.recentlyViewed = preferences.recentlyViewed.filter(
        (item: { productId: string }) => item.productId !== activity.productId
      );
      
      // Add to front of queue
      preferences.recentlyViewed.unshift({
        productId: activity.productId,
        viewedAt: activity.timestamp
      });
      
      // Trim to max size (dequeue old items)
      if (preferences.recentlyViewed.length > MAX_RECENTLY_VIEWED) {
        preferences.recentlyViewed = preferences.recentlyViewed.slice(0, MAX_RECENTLY_VIEWED);
      }

      // Update category interest
      if (activity.categoryId) {
        const currentCount = preferences.categoryInterests[activity.categoryId] || 0;
        preferences.categoryInterests[activity.categoryId] = currentCount + 1;
      }
    }

    // Handle search query - Queue structure
    if (activity.type === 'search' && activity.query) {
      // Remove duplicate
      preferences.recentSearches = preferences.recentSearches.filter(
        (item: { query: string }) => item.query.toLowerCase() !== activity.query!.toLowerCase()
      );
      
      // Add to front
      preferences.recentSearches.unshift({
        query: activity.query,
        searchedAt: activity.timestamp
      });
      
      // Trim to max size
      if (preferences.recentSearches.length > MAX_RECENT_SEARCHES) {
        preferences.recentSearches = preferences.recentSearches.slice(0, MAX_RECENT_SEARCHES);
      }
    }

    preferences.lastActivityAt = activity.timestamp;

    // Save updated preferences
    await UserProfile.updateOne(
      { userId: new mongoose.Types.ObjectId(userId) },
      { $set: { preferences } }
    );

  } catch (error) {
    console.error('Error updating user preferences:', error);
  }
}

// GET endpoint to check view counts and user preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const userId = searchParams.get('user_id');

    await dbConnect();

    // Get product view count
    if (productId) {
      const product = await Product.findById(productId).select('viewCount name');
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ 
        productId, 
        viewCount: product.viewCount || 0,
        name: product.name
      });
    }

    // Get user's recently viewed and preferences
    if (userId) {
      const userProfile = await UserProfile.findOne({ 
        userId: new mongoose.Types.ObjectId(userId) 
      }).select('preferences');
      
      return NextResponse.json({ 
        success: true,
        preferences: userProfile?.preferences || {
          recentlyViewed: [],
          recentSearches: [],
          categoryInterests: {}
        }
      });
    }

    // Return trending products (most viewed in last 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trendingProducts = await Product.find({
      status: 'active',
      lastViewedAt: { $gte: last7Days }
    })
      .sort({ viewCount: -1 })
      .limit(10)
      .select('_id name viewCount');

    return NextResponse.json({ 
      success: true,
      period: 'last_7_days',
      trending: trendingProducts 
    });

  } catch (error) {
    console.error('Analytics get error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}
