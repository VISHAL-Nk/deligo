import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import User from '@/models/User.models';
import UserProfile from '@/models/UserProfiles.models';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find or create user profile
    let userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile) {
      // Create a default profile if it doesn't exist
      userProfile = await UserProfile.create({
        userId: session.user.id,
        fullName: session.user.name || '',
        preferences: {
          wishlistName: 'My Wishlist'
        }
      });

      // Update user to indicate they have a profile
      await User.findByIdAndUpdate(session.user.id, { hasProfile: true });
    }

    // Ensure preferences object exists
    if (!userProfile.preferences) {
      userProfile.preferences = { wishlistName: 'My Wishlist' };
      await userProfile.save();
    }

    return NextResponse.json({
      success: true,
      profile: {
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        gender: userProfile.gender || 'Prefer not to say',
        dateOfBirth: userProfile.dateOfBirth || '',
        addresses: userProfile.addresses || [],
        preferences: {
          wishlistName: userProfile.preferences?.wishlistName || 'My Wishlist',
          notifications: userProfile.preferences?.notifications || {
            email: true,
            sms: false,
            push: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { field, value } = await request.json();

    if (!field) {
      return NextResponse.json(
        { success: false, message: 'Field is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    let userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile) {
      userProfile = await UserProfile.create({
        userId: session.user.id,
        preferences: {}
      });
    }

    // Handle nested preferences fields
    if (field.startsWith('preferences.')) {
      const prefField = field.replace('preferences.', '');
      if (!userProfile.preferences) {
        userProfile.preferences = {};
      }
      userProfile.preferences[prefField] = value;
      userProfile.markModified('preferences');
    } else {
      // Handle direct fields
      userProfile[field] = value;
    }

    await userProfile.save();

    // Update user to indicate they have a profile
    await User.findByIdAndUpdate(session.user.id, { hasProfile: true });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        fullName: userProfile.fullName || '',
        phone: userProfile.phone || '',
        gender: userProfile.gender || 'Prefer not to say',
        dateOfBirth: userProfile.dateOfBirth || '',
        addresses: userProfile.addresses || [],
        preferences: {
          wishlistName: userProfile.preferences?.wishlistName || 'My Wishlist',
          notifications: userProfile.preferences?.notifications || {
            email: true,
            sms: false,
            push: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}