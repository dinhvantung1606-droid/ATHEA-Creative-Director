/* =========================================================
   ATHEA – FRONTEND GEMINI SERVICE (SAFE VERSION)
   ❌ No GoogleGenerativeAI
   ❌ No API KEY
   ✅ Only call backend APIs
========================================================= */

import { ImageSize } from "../types";

/* =========================
   HELPER: POST JSON
========================= */
type ApiError = {
  error?: string;
  detail?: string;
};

async function postJSON<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as ApiError;
    throw new Error(err.error || err.detail || "API request failed");
  }

  return data as T;
}

/* =========================
   SUGGEST SHOOTING CONTEXTS
========================= */
export async function suggestShootingContexts(
  imageBase64: string
): Promise<string[]> {
  const res = await postJSON<{ contexts: string[] }>(
    "/api/suggest-contexts",
    { imageBase64 }
  );
  return res.contexts;
}

/* =========================
   SUGGEST MODEL STYLES
========================= */
export async function suggestModelStyles(
  imageBase64: string
): Promise<string[]> {
  const res = await postJSON<{ styles: string[] }>(
    "/api/suggest-model-styles",
    { imageBase64 }
  );
  return res.styles;
}

/* =========================
   GENERATE SHOOTING PLAN
========================= */
export async function generateShootingPlan(params: {
  imageBase64: string;
  context: string;
  modelStyle: string;
  closeupImageBase64?: string | null;
  faceImageBase64?: string | null;
}): Promise<string> {
  const res = await postJSON<{ text: string }>(
    "/api/generate-shooting-plan",
    params
  );
  return res.text;
}

/* =========================
   GENERATE POSE PROMPT (JSON)
========================= */
export async function generatePosePrompt(params: {
  imageBase64: string;
  concept: string;
  poseDescription: string;
  userContext: string;
}): Promise<string> {
  const res = await postJSON<{ json: string }>(
    "/api/generate-pose-prompt",
    params
  );
  return res.json;
}

/* =========================
   GENERATE IMAGE FROM JSON PROMPT
========================= */
export async function generateImageFromJsonPrompt(params: {
  imageBase64: string;
  jsonPrompt: string;
  size: ImageSize;
}): Promise<string> {
  const res = await postJSON<{ base64: string }>(
    "/api/generate-image",
    params
  );

  return `data:image/png;base64,${res.base64}`;
}
