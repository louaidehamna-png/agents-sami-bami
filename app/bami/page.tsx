import Chat from "@/components/Chat";

export default function BamiPage() {
  return (
    <Chat
      agent="bami"
      name="Bami"
      emoji="📣"
      gradient="from-orange-500 to-pink-600"
      placeholder="Dites-moi votre produit, votre cible, et je rédige vos annonces Meta..."
    />
  );
}
