import { NextResponse } from "next/server";
import { provideContextualHelp } from "@/ai/flows/provide-contextual-help";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = await provideContextualHelp(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error in provide-contextual-help API:", error);

    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
