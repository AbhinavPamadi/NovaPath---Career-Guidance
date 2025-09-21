"use server";

import { ChatGroq } from "@langchain/groq";
import { HumanMessage } from "@langchain/core/messages";

export interface ProvideContextualHelpInput {
  userActivity: string;
  pageContent: string;
  userInfo?: string;
}

export interface ProvideContextualHelpOutput {
  helpMessage: string;
}

// ------------------ LLM factory ------------------
function getLLM() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("❌ Missing GROQ_API_KEY in .env");
  }

  return new ChatGroq({
    // ✅ Valid Groq-supported model
    model: "llama-3.1-8b-instant",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.2,
  });
}

// ------------------ Main function ------------------
export async function provideContextualHelp(
  input: ProvideContextualHelpInput
): Promise<ProvideContextualHelpOutput> {
  const { userActivity, pageContent, userInfo } = input;

  const prompt = `
You are a friendly and helpful AI career guidance avatar on the Nova AI website.
Your goal is to provide helpful and relevant guidance to students based on their questions and activity on the site.

User Query: ${userActivity}
Current Page: ${pageContent}
User Info (if available): ${userInfo ?? "N/A"}

Instructions:
- Always provide exactly 3 concise suggestions.
- Explain each point with just a few words or a single short sentence.
- Do NOT expand with detailed explanations unless the user explicitly asks.
- If the input is NOT related to careers or education, reply exactly:
  "I can only help with career and educational advice. Could you please rephrase your question?"
- Keep answers minimal, clear, and structured.
`;

  const llm = getLLM();
  const response = await llm.invoke([new HumanMessage(prompt)]);

  return {
    helpMessage: response.content as string,
  };
}
