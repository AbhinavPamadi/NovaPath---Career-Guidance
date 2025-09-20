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

  return res.json();
}
