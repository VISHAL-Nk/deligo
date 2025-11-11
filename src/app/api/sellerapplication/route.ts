import { dbConnect } from "@/lib/db";
import { Session } from "@/lib/Session";
import SellerProfile from "@/models/SellerProfiles.models";
import { sellerApplicationSchema } from "@/schema/sellerApplicationSchema";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await Session();
    
        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const body = await req.json();
        const parseResult = sellerApplicationSchema.safeParse(body);
    
        if (!parseResult.success) {
            return new Response(JSON.stringify({ error: parseResult.error.issues }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        const {businessName , gstNumber , panNumber , bankDetails , store} = parseResult.data;
        
        await dbConnect();
        const existing = await SellerProfile.findOne({ userId: session.user.id });
        if (existing) {
            return new Response(JSON.stringify({ error: "Seller application already submitted" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    
        const newApplication = await SellerProfile.create({
            userId: session.user.id,
            businessName,
            gstNumber,
            panNumber,
            bankDetails,
            store,
            kycStatus: "pending"
        });
    
        return new Response(JSON.stringify({ message: "Seller application submitted successfully", application: newApplication }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Seller Application Route Error:", error.message, {
                stack: error.stack,
            });
        } else {
            console.error("Seller Application Route encountered a non-Error exception:", error);
        }
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
        
    }
}

export async function GET() {
    try {
        const session = await Session();
    
        if (!session || !session.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        await dbConnect();

        const application = await SellerProfile.findOne({ userId: session.user.id });
        
        if (!application) {
            return new Response(JSON.stringify({
                message: "No seller application found",
                application: 0
             }),{
                status: 200,
                headers: { 'Content-Type': 'application/json' }
             });
        }
        if (application.kycStatus === "approved") {
            return new Response(JSON.stringify({
                message: "Seller application already approved",
                application: 2
             }),{
                status: 200,
                headers: { 'Content-Type': 'application/json' }
             });
        }
        else if(application.kycStatus === "rejected") {
            return new Response(JSON.stringify({
                message: "Seller application rejected",
                application: 3,
                rejectedReason: application.rejectionReason || "No reason provided"
             }),{
                status: 200,
                headers: { 'Content-Type': 'application/json' }
             });
        }
        else {
            return new Response(JSON.stringify({
                message: "Seller application pending",
                application: 1
             }),{
                status: 200,
                headers: { 'Content-Type': 'application/json' }
             });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Seller Application GET Route Error:", errorMessage, {
            stack: error instanceof Error ? error.stack : "No stack trace",
        });
        return new Response(JSON.stringify({ error: "Internal Server Error" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

}