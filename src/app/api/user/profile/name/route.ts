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
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        await dbConnect();

        // Fetch user profile
        const userProfile = await UserProfile.findOne({ userId: session.user.id });

        if (!userProfile || !userProfile.fullName) {
            return NextResponse.json({
                success: true,
                name: session.user.email?.split('@')[0] || 'User', // Fallback to email username
            });
        }

        return NextResponse.json({
            success: true,
            name: userProfile.fullName,
        });
    } catch (error) {
        console.error('Error fetching user profile name:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch user profile' },
            { status: 500 }
        );
    }
}
