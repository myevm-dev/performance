const salesCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Use the same sales and action counts as the leaderboard score.
export function formatSalesPerAction(
  sales: number,
  count: number,
  action: "review" | "reward",
): string {
  if (!Number.isFinite(sales) || sales <= 0) return "Sales unavailable"
  if (!Number.isFinite(count) || count < 0) return `${action === "review" ? "Review" : "Reward"} count unavailable`
  if (count === 0) return `No ${action}s`
  return `1 ${action} per ${salesCurrency.format(sales / count)} in sales`
}
