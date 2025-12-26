import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { dbConnect } from '@/lib/db';
import UserProfile from '@/models/UserProfiles.models';

export async function GET() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session = await getServerSession(authOptions as any) as any;

        if (!session || !session.user) {
            return NextResponse.json({
                success: true,
                wishlistName: 'My Wishlist', // Default for guests
            });
        }

        await dbConnect();

        // Fetch user profile
        const userProfile = await UserProfile.findOne({ userId: session.user.id });

        const wishlistName = userProfile?.preferences?.wishlistName || 'My Wishlist';

        return NextResponse.json({
            success: true,
            wishlistName,
        });
    } catch (error) {
        console.error('Error fetching wishlist name:', error);
        return NextResponse.json({
            success: true,
            wishlistName: 'My Wishlist', // Fallback
        });
    }
}