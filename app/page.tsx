import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-white mb-2">Vos Agents IA</h1>
      <p className="text-gray-400 mb-12">Choisissez votre assistant</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/sami" className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-8 hover:scale-105 transition-transform block">
          <div className="text-5xl mb-4">🎨</div>
          <h2 className="text-2xl font-bold text-white">Sami</h2>
          <p className="text-violet-200 mt-2">Web Designer expert — couleurs, layouts, UX/UI</p>
        </Link>

        <Link href="/bami" className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-8 hover:scale-105 transition-transform block">
          <div className="text-5xl mb-4">📣</div>
          <h2 className="text-2xl font-bold text-white">Bami</h2>
          <p className="text-orange-100 mt-2">Expert Meta Ads — annonces Facebook & Instagram</p>
        </Link>
      </div>
    </main>
  );
}
