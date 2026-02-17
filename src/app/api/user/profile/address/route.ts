import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import UserProfile from '@/models/UserProfiles.models';

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const addressData = await request.json();

    // Validate required fields
    const { label, line1, city, state, postalCode, country } = addressData;
    if (!label || !line1 || !city || !state || !postalCode || !country) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    await dbConnect();

    let userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile) {
      userProfile = await UserProfile.create({
        userId: session.user.id,
        addresses: []
      });
    }

    // Add the new address
    if (!userProfile.addresses) {
      userProfile.addresses = [];
    }

    userProfile.addresses.push({
      label,
      line1,
      line2: addressData.line2 || '',
      city,
      state,
      postalCode,
      country
    });

    await userProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Address added successfully',
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
    console.error('Error adding address:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to add address' },
      { status: 500 }
    );
  }
}