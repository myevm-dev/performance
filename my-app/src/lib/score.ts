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
  // BADA stays the same (already sales-relative because it's a %)
  const badaPoints = 460 * (badaPercent / 135)

  // Normalize reviews/rewards to opportunity using sales
  // Targets:
  // - 1 review per $500 sales
  // - 1 reward signup per $800 sales
  //
  // So over any period:
  // expectedReviews = sales / 500
  // expectedRewards = sales / 800
  const expectedReviews = sales > 0 ? sales / 500 : 0
  const expectedRewards = sales > 0 ? sales / 800 : 0

  // If someone has 0 sales, they should not get infinite points.
  // Also avoids dividing by 0.
  const reviewPerformance = expectedReviews > 0 ? reviews / expectedReviews : 0
  const rewardPerformance = expectedRewards > 0 ? rewards / expectedRewards : 0

  const reviewPoints = 390 * reviewPerformance
  const rewardPoints = 150 * rewardPerformance

  const promoRate = sales > 0 ? promoDollars / sales : 0

  let promoPenalty = 0
  if (promoRate > 0.75 / 100) promoPenalty = 250
  else if (promoRate > 0.5 / 100) promoPenalty = 175
  else if (promoRate > 0.3 / 100) promoPenalty = 100
  else if (promoRate > 0.2 / 100) promoPenalty = 50

  return Math.round(badaPoints + reviewPoints + rewardPoints - promoPenalty)
}
