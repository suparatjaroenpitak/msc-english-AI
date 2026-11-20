import "server-only";

import Groq from "groq-sdk";

let client: Groq | null = null;

export function isGroqConfigured() {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && key !== "replace_me");
}

export function getGroqClient() {
  if (!isGroqConfigured()) return null;
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

export function getGroqModel(variant: "standard" | "advanced" = "standard") {
  return variant === "advanced"
    ? (process.env.GROQ_ADVANCED_MODEL || "openai/gpt-oss-120b")
    : (process.env.GROQ_MODEL || "openai/gpt-oss-20b");
}
