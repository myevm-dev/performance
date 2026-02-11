export type ServerStats = {
  id: string
  name: string

  // trailing 21-day metrics
  sales: number
  badaPercent: number
  reviews: number
  rewards: number
  promoDollars: number
}

export const mockServers: ServerStats[] = [
  {
    id: "srv-001",
    name: "Edna",
    sales: 3980,
    badaPercent: 119.9,
    reviews: 0,
    rewards: 0,
    promoDollars: 15,
  },
  {
    id: "srv-002",
    name: "Angelica",
    sales: 2169,
    badaPercent: 105.8,
    reviews: 0,
    rewards: 0,
    promoDollars: 0,
  },
  {
    id: "srv-003",
    name: "Jazmin",
    sales: 8616,
    badaPercent: 119.3,
    reviews: 0,
    rewards: 0,
    promoDollars: 5.8,
  },
  {
    id: "srv-004",
    name: "Damian",
    sales: 2431,
    badaPercent: 132.1,
    reviews: 0,
    rewards: 0,
    promoDollars: 7.4,
  },
  {
    id: "srv-005",
    name: "Kianna",
    sales: 2177,
    badaPercent: 150.4,
    reviews: 0,
    rewards: 0,
    promoDollars: 4.4,
  },
  {
    id: "srv-006",
    name: "Lizbeth",
    sales: 1407,
    badaPercent: 126.1,
    reviews: 0,
    rewards: 0,
    promoDollars: 15,
  },
  {
    id: "srv-007",
    name: "Natalie",
    sales: 1488,
    badaPercent: 147.6,
    reviews: 0,
    rewards: 0,
    promoDollars: 15,
  },
    {
    id: "srv-008",
    name: "Brandi",
    sales: 1999,
    badaPercent: 135.4,
    reviews: 0,
    rewards: 0,
    promoDollars: 43,
  },
    {
    id: "srv-009",
    name: "James",
    sales: 11206,
    badaPercent: 142.7,
    reviews: 0,
    rewards: 0,
    promoDollars: 39,
  },
    {
    id: "srv-010",
    name: "Brisa",
    sales: 1563,
    badaPercent: 130.8,
    reviews: 0,
    rewards: 0,
    promoDollars: 27,
  },
  {
    id: "srv-011",
    name: "Naylah",
    sales: 11902,
    badaPercent: 133.7,
    reviews: 0,
    rewards: 0,
    promoDollars: 33,
  },
  {
    id: "srv-012",
    name: "Yesenia",
    sales: 1442,
    badaPercent: 160.5,
    reviews: 0,
    rewards: 0,
    promoDollars: 15,
  },
  {
    id: "srv-013",
    name: "Yvonne",
    sales: 8206,
    badaPercent: 149.8,
    reviews: 0,
    rewards: 0,
    promoDollars: 7,
  },

]
