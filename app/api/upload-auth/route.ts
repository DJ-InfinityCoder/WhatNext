import { getUploadAuthParams } from "@imagekit/next/server";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    // Authenticate the user - only logged-in users can upload files
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { token, expire, signature } = getUploadAuthParams({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
            // expire is calculated automatically if not provided, token is uniquely generated
        });

        return NextResponse.json({
            token,
            expire,
            signature,
            publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
        });
    } catch (error) {
        console.error("Error generating ImageKit auth params:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
