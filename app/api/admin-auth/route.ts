import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { passkey } = await req.json();

  if(!process.env.ADMIN_PASSKEY) {
    console.error("ADMIN_PASSKEY is not set in environment variables");
    return NextResponse.json({success: false, message: "Server configuration error"}, {status: 500});
  }
  if (passkey === process.env.ADMIN_PASSKEY) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      // Fix: secure:true blocks the cookie in development (localhost), but it's needed in production. We can conditionally set it based on the environment.
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      // Expire after 8 hours (clinic work day)
      maxAge: 8 * 60 * 60,
    });

    return response;
  }

  return NextResponse.json(
    { success: false, message: "Invalid passkey" },
    { status: 401 }
  );
}