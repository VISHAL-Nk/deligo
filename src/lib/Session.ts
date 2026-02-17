import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth/next";

export async function Session() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as any) as any;
    return session;
}