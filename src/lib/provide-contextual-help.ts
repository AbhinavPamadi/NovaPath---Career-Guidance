import type {
  ProvideContextualHelpInput,
  ProvideContextualHelpOutput,
} from "@/ai/flows/provide-contextual-help";

export async function provideContextualHelp(
  input: ProvideContextualHelpInput
): Promise<ProvideContextualHelpOutput> {
  const res = await fetch("/api/provide-contextual-help", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error("❌ Failed to fetch AI response");
  }

  // Check if response is JSON before parsing
  const contentType = res.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`❌ Expected JSON response but received: ${text.substring(0, 100)}...`);
  }

  return res.json();
}
