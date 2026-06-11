// src/components/Navbar.tsx

import { useLocation } from "react-router-dom"

type ThemeMode = "light" | "dark"

type NavbarProps = {
  activeStore: string
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

type NavItemProps = {
  href: string
  label: string
  colorClass: string
  activeColorClass: string
  isActive: boolean
  external?: boolean
  title?: string
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

function DesktopNavItem({
  href,
  label,
  colorClass,
  activeColorClass,
  isActive,
  external = false,
  title,
}: NavItemProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      title={title || label}
      className={`group relative inline-flex min-h-8 items-center justify-center gap-1.5 whitespace-nowrap px-1 text-base font-black no-underline outline-none transition hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/40 ${
        isActive ? colorClass : "text-[var(--muted)] hover:text-[var(--text)]"
      }`}
    >
      <span
        className={`absolute -top-2 left-1/2 h-1 w-full max-w-36 -translate-x-1/2 rounded-b-full transition ${
          isActive
            ? `scale-x-100 ${activeColorClass}`
            : `scale-x-0 ${activeColorClass} group-hover:scale-x-100`
        }`}
      />

      <span>{label}</span>

      {external ? (
        <span
          aria-hidden="true"
          className="text-[16px] font-black leading-none opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
        >
          ➚
        </span>
      ) : null}
    </a>
  )
}

function MobileNavItem({
  href,
  label,
  icon,
  colorClass,
  activeColorClass,
  isActive,
  external = false,
}: NavItemProps & {
  icon: string
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={`relative flex min-h-12 flex-col items-center justify-center rounded-2xl border px-2 text-xs font-black no-underline transition ${
        isActive
          ? `border-transparent bg-[color-mix(in_srgb,var(--card2)_75%,transparent)] ${colorClass}`
          : "border-[var(--stroke2)] bg-[color-mix(in_srgb,var(--card2)_58%,transparent)] text-[var(--text)]"
      }`}
    >
      <span
        className={`absolute left-3 right-3 top-0 h-1 rounded-b-full ${
          isActive ? activeColorClass : "bg-transparent"
        }`}
      />
      <span className="text-base leading-none">{icon}</span>
      <span className="mt-1">{label}</span>
    </a>
  )
}

export default function Navbar({ activeStore, theme, setTheme }: NavbarProps) {
  const location = useLocation()

  const isLeaderboard = location.pathname === "/"
  const isTeam = location.pathname.startsWith("/team")
  const isLeague = location.pathname.startsWith("/league")

  return (
    <>
      <header className="w-full">
        <div className="grid min-h-[56px] w-full grid-cols-[minmax(220px,1fr)_auto_minmax(160px,1fr)] items-center gap-5 px-8 py-1 max-[760px]:flex max-[760px]:min-h-[58px] max-[760px]:items-center max-[760px]:justify-between max-[760px]:gap-3 max-[760px]:px-4 max-[760px]:py-2">
          <div className="flex min-w-0 items-center gap-2 justify-self-start">
            <div
              aria-hidden="true"
              className="flex h-[44px] w-[58px] shrink-0 items-center justify-center overflow-visible max-[760px]:hidden"
            />

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
            <DesktopNavItem
              href="/"
              label="Leaderboard"
              title="View leaderboard"
              isActive={isLeaderboard}
              colorClass="text-cyan-500"
              activeColorClass="bg-gradient-to-r from-cyan-400 to-sky-500"
            />

            <DesktopNavItem
              href={`https://www.daytadna.com/team/${activeStore}`}
              label="View Team"
              title={`Open Team ${activeStore}`}
              external
              isActive={isTeam}
              colorClass="text-emerald-500"
              activeColorClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
            />

            <DesktopNavItem
              href="https://www.daytadna.com/league"
              label="League Preview"
              title="League Preview is Live"
              external
              isActive={isLeague}
              colorClass="text-fuchsia-500"
              activeColorClass="bg-gradient-to-r from-fuchsia-500 to-pink-500"
            />
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
          <MobileNavItem
            href="/"
            label="Leaderboard"
            icon="🏆"
            isActive={isLeaderboard}
            colorClass="text-cyan-500"
            activeColorClass="bg-gradient-to-r from-cyan-400 to-sky-500"
          />

          <MobileNavItem
            href={`https://www.daytadna.com/team/${activeStore}`}
            label="Team"
            icon="👥"
            external
            isActive={isTeam}
            colorClass="text-emerald-500"
            activeColorClass="bg-gradient-to-r from-emerald-500 to-emerald-400"
          />

          <MobileNavItem
            href="https://www.daytadna.com/league"
            label="League"
            icon="⚔"
            external
            isActive={isLeague}
            colorClass="text-fuchsia-500"
            activeColorClass="bg-gradient-to-r from-fuchsia-500 to-pink-500"
          />
        </div>
      </nav>
    </>
  )
}