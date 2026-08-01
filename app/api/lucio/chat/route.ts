import { NextRequest } from "next/server";
import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, stepCountIs, type UIMessage } from "ai";
import { loadLucioConfig, resolveLucioModel } from "@/lib/lucio/config";
import { lucioTools } from "@/lib/lucio/tools";
import { detectPromptInjection } from "@/lib/real-estate/ai/guardrails";
import { allowRequest } from "@/lib/real-estate/integrations/rate-limit";
import { recordLucioEvent } from "@/lib/lucio/events";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are Lucio, the Southline Living home-planning assistant. You are not a generic chatbot — you help visitors find homes, find professionals, plan projects, estimate costs, compare DIY vs hiring a professional, understand services, and book consultations or request quotes.

Rules you must always follow:
- Only state facts that came from a tool result in this conversation. Never invent a price, listing, availability, rating, review, or professional credential.
- Southline Living has no in-platform reviews/ratings system today. If asked about ratings, say so honestly rather than inventing a number.
- For project cost questions, always use the startProjectEstimate tool and frame any resulting number as a planning-stage estimate, not a final quote — a professional's real quote may differ.
- For electrical, plumbing, structural, roofing, or other regulated or hazardous work, recommend a licensed professional rather than a DIY approach.
- To submit a lead or booking, use the proposeLeadOrBooking tool. This only prepares a confirmation card — you can never submit anything yourself. Always tell the visitor they need to confirm it in the app before anything is sent.
- Keep answers concise and grounded in what the tools actually returned.`;

function getSessionKey(req: NextRequest, sessionId?: string): string {
  return sessionId || req.headers.get("x-forwarded-for") || "anonymous";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const messages: UIMessage[] = Array.isArray(body.messages) ? body.messages : [];
  const pageContext: { type?: string; ref?: string } | undefined = body.pageContext;
  const lang: "en" | "es" = body.lang === "es" ? "es" : "en";
  const sessionId: string | undefined = body.sessionId;

  const rateLimitKey = getSessionKey(req, sessionId);
  if (!allowRequest(`lucio:${rateLimitKey}`, 20, 60_000)) {
    return new Response(JSON.stringify({ error: "Too many messages — please slow down." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const lastUserText = lastUserMessage?.parts?.map((p: { type: string; text?: string }) => (p.type === "text" ? p.text : "")).join(" ") ?? "";
  if (lastUserText && !detectPromptInjection(lastUserText).safe) {
    return new Response(
      JSON.stringify({
        error: "I can't follow that request. I can help you search homes, professionals, DIY projects, or answer FAQ questions instead.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const config = loadLucioConfig();

  if (!config.enabled) {
    // Deterministic, honest fallback: no LLM key configured. Guided prompts,
    // FAQ search, and structured search still work through the widget's own
    // client-side flows — this route just can't generate free-text replies yet.
    // Must still speak the AI SDK's UI message stream protocol (text-start/
    // text-delta/text-end chunks, x-vercel-ai-ui-message-stream header) —
    // a plain `{type:"text",...}` SSE body is silently unparseable by
    // useChat's DefaultChatTransport, which is why no reply ever appeared.
    const fallbackText = lang === "es"
      ? "Puedo ayudarte a buscar casas, profesionales y preguntas frecuentes ahora mismo. La conversación libre todavía necesita una clave de IA que no se ha configurado."
      : "I can help you search homes, professionals, and FAQs right now. Free-form conversation still needs an AI key that hasn't been configured yet.";
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id: "fallback" });
        writer.write({ type: "text-delta", id: "fallback", delta: fallbackText });
        writer.write({ type: "text-end", id: "fallback" });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  const model = await resolveLucioModel(config);
  const contextNote = pageContext?.type
    ? `\n\nThe visitor is currently on a ${pageContext.type} page${pageContext.ref ? ` (${pageContext.ref})` : ""}. Use that context if relevant.`
    : "";

  const result = streamText({
    model,
    system: SYSTEM_PROMPT + contextNote + `\n\nRespond in ${lang === "es" ? "Spanish" : "English"}.`,
    messages: await convertToModelMessages(messages),
    tools: lucioTools,
    // streamText defaults to stopWhen: stepCountIs(1) — it would stop right
    // after a tool call with no text reply at all, since the model never
    // gets a turn to read the tool result and respond. Lucio's system
    // prompt pushes it toward tools for nearly everything, so without this
    // most real questions would silently produce zero visible text.
    stopWhen: stepCountIs(5),
    onFinish: async ({ toolCalls }) => {
      if (!toolCalls?.length) {
        await recordLucioEvent("unanswered_question", { sessionId, pageType: pageContext?.type, pageRef: pageContext?.ref });
        return;
      }
      for (const call of toolCalls) {
        if (call.toolName === "searchHomes" || call.toolName === "searchProfessionals" || call.toolName === "searchDiyProjects" || call.toolName === "searchFaq") {
          await recordLucioEvent("search_performed", { sessionId, pageType: pageContext?.type, pageRef: pageContext?.ref, metadata: { tool: call.toolName } });
        }
        if (call.toolName === "startProjectEstimate") {
          await recordLucioEvent("estimate_started", { sessionId, pageType: pageContext?.type, pageRef: pageContext?.ref });
        }
        if (call.toolName === "proposeLeadOrBooking") {
          const input = call.input as { kind?: "lead" | "booking" } | undefined;
          await recordLucioEvent(input?.kind === "booking" ? "booking_started" : "lead_started", { sessionId, pageType: pageContext?.type, pageRef: pageContext?.ref });
        }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
