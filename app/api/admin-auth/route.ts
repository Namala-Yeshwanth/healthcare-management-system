import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { passkey } = await req.json();

  if (passkey === process.env.ADMIN_PASSKEY) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("admin-auth", "true", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return response;
  }

  return NextResponse.json(
    { success: false },
    { status: 401 }
  );
}