export const PROMO_WEIGHT = 0.18

export function calculateScore({
  badaPercent,
  reviews,
  rewards,
  promoDollars,
  sales,
}: {
  badaPercent: number
  reviews: number
  rewards: number
  promoDollars: number
  sales: number
}) {
  const badaPoints = 460 * (badaPercent / 140)
  const reviewPoints = sales > 0 ? 390 * (reviews / (sales / 500)) : 0
  const rewardPoints = sales > 0 ? 150 * (rewards / (sales / 800)) : 0

  const promoRate = sales > 0 ? promoDollars / sales : 0

  let promoPenalty = 0
  if (promoRate > 0.75 / 100) promoPenalty = 250
  else if (promoRate > 0.5 / 100) promoPenalty = 175
  else if (promoRate > 0.3 / 100) promoPenalty = 100
  else if (promoRate > 0.2 / 100) promoPenalty = 50

  const weightedPromoPenalty = promoPenalty * PROMO_WEIGHT

  return Math.round(badaPoints + reviewPoints + rewardPoints - weightedPromoPenalty)
}
