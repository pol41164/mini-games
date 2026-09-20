import Link from "next/link";

type Game = {
  href: string;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  glow: string;
  ring: string;
};

const GAMES: Game[] = [
  {
    href: "/snake",
    emoji: "🐍",
    name: "貪吃蛇",
    tagline: "經典街機遊戲",
    description:
      "用方向鍵或 WASD 控制小蛇吃食物，吃越多身體越長，撞牆或咬到自己就結束。",
    accent: "from-emerald-400 to-green-600",
    glow: "group-hover:shadow-[0_0_40px_rgba(52,211,153,0.35)]",
    ring: "group-hover:ring-emerald-400/40",
  },
  {
    href: "/solitaire",
    emoji: "🃏",
    name: "接龍",
    tagline: "FreeCell 自由儲存接龍",
    description:
      "8 欄牌列、4 個自由儲存格，支援拖曳移動，把 52 張牌依花色收集到 A～K。",
    accent: "from-amber-400 to-emerald-600",
    glow: "group-hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]",
    ring: "group-hover:ring-amber-400/40",
  },
  {
    href: "/minesweeper",
    emoji: "💣",
    name: "踩地雷",
    tagline: "考驗邏輯與運氣",
    description:
      "三種難度可選，翻開所有安全方格即獲勝，右鍵插旗、雙擊數字格可快速展開。",
    accent: "from-sky-400 to-blue-600",
    glow: "group-hover:shadow-[0_0_40px_rgba(56,189,248,0.35)]",
    ring: "group-hover:ring-sky-400/40",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-amber-500/20 blur-[120px]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <a href="#top" className="flex items-center gap-2 font-bold tracking-wide">
            <span className="text-xl">🎮</span>
            <span>mini 的小工具箱</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-zinc-300 sm:flex">
            <a href="#games" className="transition-colors hover:text-white">
              遊戲總覽
            </a>
            <Link href="/snake" className="transition-colors hover:text-white">
              貪吃蛇
            </Link>
            <Link href="/solitaire" className="transition-colors hover:text-white">
              接龍
            </Link>
            <Link href="/minesweeper" className="transition-colors hover:text-white">
              踩地雷
            </Link>
          </nav>
          <a
            href="#games"
            className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200"
          >
            開始遊玩
          </a>
        </div>
      </header>

      <main id="top" className="relative z-10 flex-1">
        {/* hero */}
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center sm:pt-32">
          <span className="rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-medium tracking-wide text-zinc-300">
            免費・免安裝・開箱即玩
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            打發時間的
            <span className="bg-gradient-to-r from-emerald-300 via-amber-300 to-sky-400 bg-clip-text text-transparent">
              {" "}
              小遊戲工具箱
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
            三款經典小遊戲，通通不用註冊、不用安裝，打開就能玩。
            滑蛇吃食物、玩一局接龍，或是挑戰踩地雷考驗邏輯。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#games"
              className="rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-sky-500 px-8 py-3 text-sm font-bold text-zinc-950 shadow-lg transition-transform hover:scale-105"
            >
              探索三款遊戲 ↓
            </a>
          </div>
        </section>

        {/* games */}
        <section id="games" className="mx-auto w-full max-w-5xl px-6 pb-28">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              三個分頁，三款遊戲
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              點選卡片，直接進入遊戲頁面
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {GAMES.map((game) => (
              <Link
                key={game.href}
                href={game.href}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:ring-1 ${game.ring} ${game.glow}`}
              >
                <div
                  className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${game.accent} opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-40`}
                />
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${game.accent} text-2xl shadow-lg`}
                >
                  {game.emoji}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">
                  {game.name}
                </h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {game.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-6 text-zinc-400">
                  {game.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white">
                  立即遊玩
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/10 bg-zinc-950/80">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4 px-6 py-10 text-sm text-zinc-500 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="text-lg">🎮</span>
            <span className="font-semibold">mini 的小工具箱</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link href="/snake" className="hover:text-white">
              貪吃蛇
            </Link>
            <Link href="/solitaire" className="hover:text-white">
              接龍
            </Link>
            <Link href="/minesweeper" className="hover:text-white">
              踩地雷
            </Link>
          </nav>
          <p>© {new Date().getFullYear()} mini 的小工具箱．All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
