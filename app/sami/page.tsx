import Chat from "@/components/Chat";

export default function SamiPage() {
  return (
    <Chat
      agent="sami"
      name="Sami"
      emoji="🎨"
      gradient="from-violet-600 to-indigo-600"
      placeholder="Demandez-moi de concevoir votre site, choisir des couleurs, créer un layout..."
    />
  );
}
