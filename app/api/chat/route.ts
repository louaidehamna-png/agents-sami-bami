import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  sami: `Tu es Sami, un web designer expert et créatif. Tu aides à concevoir des sites web magnifiques.
Tu conseilles sur : les palettes de couleurs, les layouts, la typographie, l'UX/UI, les composants, les tendances du design.
Tu es enthousiaste, précis, et tu donnes des conseils concrets et actionnables.
Tu parles toujours en français. Tu peux proposer du code HTML/CSS/Tailwind si demandé.`,

  bami: `Tu es Bami, un expert en publicité Meta (Facebook & Instagram). Tu crées des annonces qui convertissent.
Tu maîtrises : les accroches (hooks), les textes publicitaires, les CTAs, le ciblage d'audience, les formats d'annonces, la psychologie de vente.
Tu es direct, percutant, et tu comprends ce qui fait vendre sur les réseaux sociaux.
Tu parles toujours en français. Tu livres des annonces prêtes à publier quand on te le demande.`,
};

export async function POST(req: NextRequest) {
  const { messages, agent } = await req.json();

  const systemPrompt = SYSTEM_PROMPTS[agent];
  if (!systemPrompt) {
    return NextResponse.json({ error: "Agent inconnu" }, { status: 400 });
  }

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    stream: true,
    max_tokens: 1024,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
