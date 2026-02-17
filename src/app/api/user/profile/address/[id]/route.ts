import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import UserProfile from '@/models/UserProfiles.models';
import mongoose from 'mongoose';


export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;

    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: addressId } = await params;

    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid address ID' },
        { status: 400 }
      );
    }

    await dbConnect();

    const userProfile = await UserProfile.findOne({ userId: session.user.id });
    
    if (!userProfile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      );
    }

    // Remove the address with the specified ID
    userProfile.addresses = userProfile.addresses.filter(
      (address: { _id?: string }) => address._id?.toString() !== addressId
    );

    await userProfile.save();

    return NextResponse.json({
      success: true,
      message: 'Address deleted successfully',
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
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete address' },
      { status: 500 }
    );
  }
}