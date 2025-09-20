import { NextResponse } from "next/server";
import { provideContextualHelp } from "@/ai/flows/provide-contextual-help";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    if (!process.env.GROQ_API_KEY) {
      console.error("❌ Missing GROQ_API_KEY environment variable");
      return NextResponse.json(
        { error: "AI service not configured. Please check environment variables." },
        { status: 503 }
      );
    }

    const body = await req.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await provideContextualHelp(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("❌ Error in provide-contextual-help API:", error);

    // Provide more specific error messages
    const errorMessage = error.message?.includes('API key') 
      ? "AI service authentication failed" 
      : "Failed to get AI response";

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
