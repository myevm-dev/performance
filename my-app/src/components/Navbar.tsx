// src/components/Navbar.tsx
import Lottie from "lottie-react"
import dnaAnimation from "../lottie/DNA.json"

type ThemeMode = "light" | "dark"

type NavbarProps = {
  activeStore: string
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}) {
  const nextTheme = theme === "light" ? "dark" : "light"

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
      className="inline-flex min-h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--stroke2)] bg-[color-mix(in_srgb,var(--card2)_56%,transparent)] px-3 py-1.5 text-sm font-black text-[var(--text)] transition hover:-translate-y-px hover:border-cyan-300/40 hover:bg-[color-mix(in_srgb,var(--card2)_72%,transparent)]"
    >
      <span className="inline-grid h-6 w-6 place-items-center rounded-full border border-[var(--stroke)] bg-gradient-to-br from-fuchsia-500/25 to-cyan-300/20 text-xs">
        {theme === "light" ? "☀" : "☾"}
      </span>
      <span>{theme === "light" ? "Light" : "Dark"}</span>
    </button>
  )
}

export default function Navbar({ activeStore, theme, setTheme }: NavbarProps) {
  return (
    <>
      <header className="w-full">
        <div className="grid min-h-[56px] w-full grid-cols-[minmax(220px,1fr)_auto_minmax(160px,1fr)] items-center gap-5 px-8 py-1 max-[760px]:flex max-[760px]:min-h-[58px] max-[760px]:items-center max-[760px]:justify-between max-[760px]:gap-3 max-[760px]:px-4 max-[760px]:py-2">
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <div
              aria-hidden="true"
              className="flex h-[44px] w-[58px] shrink-0 items-center justify-center overflow-visible max-[760px]:hidden"
            >
              <div className="h-[92px] w-[92px] scale-[1.08] [&_svg]:overflow-visible">
                <Lottie animationData={dnaAnimation} loop autoplay />
              </div>
            </div>

            <div className="min-w-0">
              <div className="whitespace-nowrap text-[22px] font-black leading-none tracking-[-0.04em] text-[var(--text)] max-[760px]:text-[23px]">
                Dayta DNA
              </div>
            </div>
          </div>

          <nav
            aria-label="Desktop navigation links"
            className="flex items-center justify-center gap-8 justify-self-center max-[760px]:hidden"
          >
            <a
              href={`https://www.daytadna.com/team/${activeStore}`}
              target="_blank"
              rel="noreferrer"
              title={`Open Team ${activeStore}`}
              className="group relative inline-flex min-h-8 items-center justify-center whitespace-nowrap px-1 text-sm font-black text-[var(--muted)] no-underline outline-none transition hover:-translate-y-px hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40"
            >
              <span className="absolute -top-2 left-1/2 h-1 w-full max-w-36 -translate-x-1/2 scale-x-0 rounded-b-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition group-hover:scale-x-100" />
              View Team {activeStore}
            </a>

            <a
              href="https://www.daytadna.com/league"
              target="_blank"
              rel="noreferrer"
              title="League Preview is Live"
              className="group relative inline-flex min-h-8 items-center justify-center whitespace-nowrap px-1 text-sm font-black text-[var(--muted)] no-underline outline-none transition hover:-translate-y-px hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/40"
            >
              <span className="absolute -top-2 left-1/2 h-1 w-full max-w-36 -translate-x-1/2 scale-x-0 rounded-b-full bg-gradient-to-r from-[var(--a1)] to-pink-500 transition group-hover:scale-x-100" />
              League Preview
            </a>
          </nav>

          <div className="flex items-center justify-end justify-self-end">
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>
        </div>

        <div className="h-0.5 bg-gradient-to-r from-transparent via-fuchsia-500 to-cyan-300 opacity-85" />
      </header>

      <nav
        aria-label="Mobile bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 hidden border-t border-[var(--stroke)] bg-[color-mix(in_srgb,var(--card2)_88%,transparent)] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl max-[760px]:block"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <a
            href="/"
            className="flex min-h-12 flex-col items-center justify-center rounded-2xl border border-[var(--stroke2)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] px-2 text-xs font-black text-[var(--text)] no-underline"
          >
            <span className="text-base leading-none">⌂</span>
            <span className="mt-1">Home</span>
          </a>
            <a
            href="https://www.daytadna.com/league"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 flex-col items-center justify-center rounded-2xl border border-[var(--stroke2)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] px-2 text-xs font-black text-[var(--text)] no-underline"
          >
            <span className="text-base leading-none">⚔</span>
            <span className="mt-1">League</span>
          </a>
          <a
            href={`https://www.daytadna.com/team/${activeStore}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 flex-col items-center justify-center rounded-2xl border border-[var(--stroke2)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] px-2 text-xs font-black text-[var(--text)] no-underline"
          >
            <span className="text-base leading-none">👥</span>
            <span className="mt-1">Team</span>
          </a>

          
        </div>
      </nav>
    </>
  )
}