// src/lib/staffName.ts
//
// Staff records (staffUsers/{code}) keep two names:
//   name           "First L" exactly as it maps to the uploaded server
//                  scorecard — used ONLY for scorecard/BADA matching
//   preferredName  optional name a manager sets — shown everywhere public
//
// Use getStaffDisplayName() anywhere a name is shown to people.

export function getStaffDisplayName(
  data: { preferredName?: unknown; name?: unknown } | null | undefined,
  fallback = "Unnamed"
) {
  const preferred = typeof data?.preferredName === "string" ? data.preferredName.trim() : ""
  if (preferred) return preferred

  const name = typeof data?.name === "string" ? data.name.trim() : ""
  return name || fallback
}
