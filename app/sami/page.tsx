import AgentChat from "@/components/AgentChat";

export default function SamiPage() {
  return (
    <AgentChat
      apiPath="/api/sami"
      name="Sami"
      emoji="🎨"
      gradient="from-violet-600 to-indigo-600"
      placeholder="Ex: Rends la page d'accueil plus moderne, améliore le design du formulaire..."
    />
  );
}
