import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "louaidehamna-png/Premier-projet";
const BRANCH = "main";

const SYSTEM = `Tu es Sami, un agent web designer expert et autonome.
Tu as accès au code du site FacturePro (premier-projet-virid.vercel.app) via des outils GitHub.
Quand on te demande d'améliorer le site :
1. Liste les fichiers pour comprendre la structure
2. Lis les fichiers pertinents
3. Fais les modifications directement avec write_file
4. Explique ce que tu as fait et pourquoi

Tu te spécialises dans : Tailwind CSS, animations, design moderne, UX/UI, React/Next.js.
Sois proactif et concret — lis le code, modifie-le, ne demande pas de permission.
Réponds toujours en français.`;

const tools: any[] = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "Liste les fichiers d'un dossier du repo FacturePro",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Chemin du dossier (ex: 'app', 'components', '')" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Lit le contenu d'un fichier du repo FacturePro",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Chemin du fichier (ex: 'app/page.tsx')" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Crée ou modifie un fichier dans le repo FacturePro",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Chemin du fichier" },
          content: { type: "string", description: "Contenu complet du fichier" },
          message: { type: "string", description: "Message de commit" },
        },
        required: ["path", "content", "message"],
      },
    },
  },
];

async function listFiles(path: string) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map((f: any) => `${f.type === "dir" ? "📁" : "📄"} ${f.name}`).join("\n");
  }
  return JSON.stringify(data);
}

async function readFile(path: string) {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  const data = await res.json();
  if (data.content) return Buffer.from(data.content, "base64").toString("utf-8");
  return `Erreur: ${JSON.stringify(data)}`;
}

async function writeFile(path: string, content: string, message: string) {
  const getRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
  });
  let sha: string | undefined;
  if (getRes.ok) sha = (await getRes.json()).sha;

  const body: any = { message, content: Buffer.from(content).toString("base64"), branch: BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.ok
    ? `✅ ${path} modifié. Vercel redéploie automatiquement.`
    : `❌ Erreur: ${JSON.stringify(await res.json())}`;
}

async function runTool(name: string, args: any): Promise<string> {
  if (name === "list_files") return listFiles(args.path);
  if (name === "read_file") return readFile(args.path);
  if (name === "write_file") return writeFile(args.path, args.content, args.message);
  return "Outil inconnu";
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const allMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...messages,
  ];

  const steps: { type: string; label: string; result?: string }[] = [];

  // Agentic loop — max 8 iterations
  for (let i = 0; i < 8; i++) {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: allMessages,
      tools,
      tool_choice: "auto",
      max_tokens: 4096,
    });

    const msg = response.choices[0].message;
    allMessages.push(msg as any);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return NextResponse.json({ response: msg.content, steps });
    }

    for (const call of msg.tool_calls) {
      const args = JSON.parse(call.function.arguments);
      const label =
        call.function.name === "list_files" ? `📁 Liste ${args.path || "/"}` :
        call.function.name === "read_file" ? `📄 Lecture ${args.path}` :
        `✏️ Modification ${args.path}`;

      steps.push({ type: call.function.name, label });
      const result = await runTool(call.function.name, args);
      steps[steps.length - 1].result = result;

      allMessages.push({ role: "tool", tool_call_id: call.id, content: result });
    }
  }

  return NextResponse.json({ response: "Trop d'itérations.", steps });
}
