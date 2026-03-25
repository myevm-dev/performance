// src/data/stores.ts

export type RegionId = "1" | "3"

export type DistrictId =
  | "1A"
  | "1B"
  | "1C"
  | "1D"
  | "1E"
  | "1F"
  | "1L"
  | "3A"
  | "3C"
  | "3D"
  | "3E"
  | "3F"
  | "3G"
  | "3H"

export type Store = {
  storeNumber: string
  name: string
  email: string
  districtId: DistrictId
  regionId: RegionId
  placeId?: string
}

const regionFromDistrict = (districtId: DistrictId): RegionId =>
  districtId.startsWith("1") ? "1" : "3"

export const stores: Store[] = [
  // 1F
  {
    storeNumber: "6001",
    name: "Fontana - Valley",
    email: "dennys6001@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),

  },
  {
    storeNumber: "6816",
    name: "Lake Elsinore - Grape",
    email: "dennys6816@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
  },
  {
    storeNumber: "7531",
    name: "Perris - 4th",
    email: "dennys7531@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
  },
  {
    storeNumber: "7569",
    name: "Los Angeles - Figueroa",
    email: "dennys7569@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
  },
  {
    storeNumber: "7757",
    name: "Los Angeles - Crenshaw",
    email: "dennys7757@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
    placeId: "ChIJFUuRDDq4woAR51P9mYX8Mjc",
  },
  {
    storeNumber: "7811",
    name: "Claremont - Indian Hill",
    email: "dennys7811@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
    placeId: "ChIJK12C3fMxw4ARgMCkH4yi5_s",
  },
  {
    storeNumber: "8722",
    name: "Culver City - Jefferson",
    email: "dennys8722@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
    placeId: "ChIJlR_h8B26woARoMcgzsDvC6I",
  },
  {
    storeNumber: "9261",
    name: "Palm Springs - 20th",
    email: "dennys9261@wksusa.com",
    districtId: "1F",
    regionId: regionFromDistrict("1F"),
    placeId: "ChIJdxYOCdgY24AR0eXeN950ss8",
  },

  // 1A
  {
    storeNumber: "6177",
    name: "Corpus Christi - I-37",
    email: "dennys6177@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJGXXJTrpgaIYRpEL0Eob9uHU",
  },
  {
    storeNumber: "6179",
    name: "Corpus Christi - S Padre Island",
    email: "dennys6179@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJfZRZWpD1aIYRuRtox5D4NRM",
  },
  {
    storeNumber: "6224",
    name: "Victoria - Navarro",
    email: "dennys6224@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJCRmLDfhdQoYRtB-7XN72eN8",
  },
  {
    storeNumber: "6226",
    name: "San Antonio - Loop 410",
    email: "dennys6226@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJc7JpH-VcXIYRjFe-8MxWYfY",
  },
  {
    storeNumber: "6759",
    name: "Corpus Christi - Hwy 77",
    email: "dennys6759@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJZ9dfcMV6aIYRFiYBrVHP8vc",
  },
  {
    storeNumber: "8633",
    name: "Edinburg - Monte Cristo",
    email: "dennys8633@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJ4UaK_oWiZYYR3jgNdYkin6M",
  },
  {
    storeNumber: "9334",
    name: "Portland - Hwy 181",
    email: "dennys9334@wksusa.com",
    districtId: "1A",
    regionId: regionFromDistrict("1A"),
    placeId: "ChIJX_2GFBxbaIYRc1Vg_2rjmmQ",
  },

  // 1B
  {
    storeNumber: "6649",
    name: "Gallup - Historical Hwy 66",
    email: "dennys6649@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
  },
  {
    storeNumber: "7117",
    name: "Raton - Clayton",
    email: "dennys7117@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
    placeId: "ChIJT_jOI1LwEIcRTMwwUvk2Z4g",
  },
  {
    storeNumber: "7170",
    name: "Cortez - Main",
    email: "dennys7170@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
    placeId: "ChIJXSOluHFvOYcRmAilsGW9zp0",
  },
  {
    storeNumber: "7171",
    name: "Farmington - Scott",
    email: "dennys7171@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
    placeId: "ChIJEYVr-3-PO4cRZYiRbphqhV4",
  },
  {
    storeNumber: "7434",
    name: "Grants - Sidney",
    email: "dennys7434@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
  },
  {
    storeNumber: "7437",
    name: "Gallup - US 491",
    email: "dennys7437@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
    placeId: "ChIJtUSWk9jeJIcRf1iaiMEBF6A",
  },
  {
    storeNumber: "7884",
    name: "Albuquerque - San Antonio",
    email: "dennys7884@wksusa.com",
    districtId: "1B",
    regionId: regionFromDistrict("1B"),
    placeId: "ChIJV8tStVN0IocRjv1yGUpr-Go",
  },
  

  // 1C
  {
    storeNumber: "6234",
    name: "Roswell - Main",
    email: "dennys6234@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
    placeId: "ChIJzc-bQfxu4oYRiEzEFLNb3vQ",
  },
  {
    storeNumber: "6909",
    name: "El Paso - Dyer",
    email: "dennys6909@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
    placeId: "ChIJOWUBTT5R54YRiCgS4uhy_PU",
  },
    {
    storeNumber: "0000",
    name: "TestStore",
    email: "stackablenft@gmail.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
    placeId: "ChIJOWUBTT5R54YRiCgS4uhy_PU",
  },
  {
    storeNumber: "7143",
    name: "El Paso - Woodrow Bean",
    email: "dennys7143@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
  },
  {
    storeNumber: "7256",
    name: "Ruidoso Downs - Hwy 70",
    email: "dennys7256@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
  },
  {
    storeNumber: "7972",
    name: "Alamogordo - White Sands",
    email: "dennys7972@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
    placeId: "ChIJo74bW5pQ4IYRkCjttdrB7SU",
  },
  {
    storeNumber: "8674",
    name: "Ft. Bliss - Pleasonton",
    email: "dennys8674@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
    placeId: "ChIJP86Z2Qda54YRWp5sebv-hQw",
  },
  {
    storeNumber: "8877",
    name: "Las Cruces - Battan",
    email: "dennys8877@wksusa.com",
    districtId: "1C",
    regionId: regionFromDistrict("1C"),
  },

  // 1D
  {
    storeNumber: "6910",
    name: "El Paso - Gateway East",
    email: "dennys6910@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
  },
  {
    storeNumber: "6912",
    name: "El Paso - Gateway West",
    email: "dennys6912@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
    placeId: "ChIJYUzotadE54YRIZZO0d0z3AY",
  },
  {
    storeNumber: "6944",
    name: "El Paso - Montwood",
    email: "dennys6944@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
    placeId: "ChIJYaWOK_VE54YRLdlzupCIZoM",
  },
  {
    storeNumber: "7157",
    name: "El Paso - Montana",
    email: "dennys7157@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
  },
  {
    storeNumber: "7603",
    name: "El Paso - Zaragosa",
    email: "dennys7603@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
  },
  {
    storeNumber: "8677",
    name: "El Paso - Horizon",
    email: "dennys8677@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
    placeId: "ChIJXz8EMwlq54YRRfEWL1VNOtw",
  },
  {
    storeNumber: "9313",
    name: "Silver City - Silver Hts",
    email: "dennys9313@wksusa.com",
    districtId: "1D",
    regionId: regionFromDistrict("1D"),
    placeId: "ChIJRZuhkY7H2IYROWpmrNIY7Co",
  },

  // 1E
  {
    storeNumber: "6236",
    name: "Carlsbad - Pierce",
    email: "dennys6236@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
  },
  {
    storeNumber: "7723",
    name: "Bernalillo - US 550",
    email: "dennys7723@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJfxQHynB4IocRubOdAO6fmZ8",
  },
  {
    storeNumber: "7885",
    name: "Los Lunas - Emilio Lopez",
    email: "dennys7885@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJ69ziTJAcIocRgQ7M8KW2rJo",
  },
  {
    storeNumber: "8561",
    name: "Albuquerque - Avalon",
    email: "dennys8561@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJ3eHRyLcSIocRo-rg05-3ItM",
  },
  {
    storeNumber: "8610",
    name: "Tucumari - Mountain",
    email: "dennys8610@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJrWT7g75XG4cRgsHKXQlj8Ug",
  },
  {
    storeNumber: "8741",
    name: "Hobbs - Lovington",
    email: "dennys8741@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJD3pN7h7A_IYRckl7nZ-jHWE",
  },
  {
    storeNumber: "9208",
    name: "Clovis - Prince",
    email: "dennys9208@wksusa.com",
    districtId: "1E",
    regionId: regionFromDistrict("1E"),
    placeId: "ChIJe8Q8fDjeAocREX9qlxk58jw",
  },

  // 1L
  {
    storeNumber: "6291",
    name: "Salem - Holiday",
    email: "dennys6291@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
  },
  {
    storeNumber: "7220",
    name: "Glen Carbon - Junction",
    email: "dennys7220@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJ7QIWpQf5dYgR7K3ZfuCgpn4",
  },
  {
    storeNumber: "7246",
    name: "Troy - Merlin",
    email: "dennys7246@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJ_UhUjvaV3ocRdulOIiK71B8",
  },
  {
    storeNumber: "7247",
    name: "Litchfield - Hudson",
    email: "dennys7247@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
  },
  {
    storeNumber: "7395",
    name: "Waterloo - Illinois Rt 3",
    email: "dennys7395@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJvRnITD-92IcRSnXJGExERf4",
  },
  {
    storeNumber: "7522",
    name: "O'Fallon - Hwy 50",
    email: "dennys7522@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJq13xwEoBdogRtdivZ__887w",
  },
  {
    storeNumber: "7567",
    name: "North Pekin - Radio City",
    email: "dennys7567@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJI81zwsT1CogR7Zpirwn2sU4",
  },
  {
    storeNumber: "7596",
    name: "Kingdom City - Gold",
    email: "dennys7596@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJ2arZn-WM3IcRp9P0zGXxEo8",
  },
  {
    storeNumber: "7701",
    name: "Collinsville - Ramada",
    email: "dennys7701@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJlZpe1mhV34cRizEaxRLA2-o",
  },
  {
    storeNumber: "9210",
    name: "Lake Saint Louis - Lake Saint Louis",
    email: "dennys9210@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
    placeId: "ChIJo0a-GuzP3ocRcDyZpEfkuBs",
  },
  {
    storeNumber: "9513",
    name: "Bloomington - Eldorado",
    email: "dennys9513@wksusa.com",
    districtId: "1L",
    regionId: regionFromDistrict("1L"),
  },

  // 3A
  {
    storeNumber: "6800",
    name: "Portland - Hassalo",
    email: "dennys6800@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJ4_B5nbKglVQRqw7LknfbuuM",
  },
  {
    storeNumber: "6801",
    name: "Portland - Center",
    email: "dennys6801@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJHYJWSCemlVQRk-k6gDVNLVs",
  },
  {
    storeNumber: "6804",
    name: "Happy Valley - 82nd",
    email: "dennys6804@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJi4cYqXd1lVQRLV4oPhlKFEg",
  },
  {
    storeNumber: "6806",
    name: "Portland - Stark",
    email: "dennys6806@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
  },
  {
    storeNumber: "6807",
    name: "The Dalles - 6th",
    email: "dennys6807@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJA_Gk3yocllQRRRVeY41WuPw",
  },
  {
    storeNumber: "6811",
    name: "Salem - Market",
    email: "dennys6811@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJn8zB6Ov-v1QRLGGS2U-btnA",
  },
  {
    storeNumber: "8113",
    name: "Jamestown - Giant Crossing",
    email: "dennys8113@wksusa.com",
    districtId: "3A",
    regionId: regionFromDistrict("3A"),
    placeId: "ChIJHYJWSCemlVQRk-k6gDVNLVs",
  },

  // 3C
  {
    storeNumber: "6545",
    name: "Camp Verde - Hwy 260",
    email: "dennys6545@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
  },
  {
    storeNumber: "6624",
    name: "Show Low - White Mountain",
    email: "dennys6624@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJYw7vdmvLKIcRrURu2Mk7Cns",
  },
  {
    storeNumber: "6688",
    name: "Payson - Beeline",
    email: "dennys6688@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJTfKHVuYQLIcRnGfM1H-zarM",
  },
  {
    storeNumber: "6755",
    name: "Cottonwood - Route 89A",
    email: "dennys6755@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJVZ0qkXgFLYcReU4XekQGZSY",
  },
  {
    storeNumber: "6769",
    name: "Fountain Hills - Shea",
    email: "dennys6769@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
  },
  {
    storeNumber: "7974",
    name: "Prescott - Gail Gardner",
    email: "dennys7974@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJm9MUx9ouLYcRnje5W5tx5Nc",
  },
  {
    storeNumber: "8000",
    name: "Glendale - Camelback",
    email: "dennys8000@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJpZ8lzmhAK4cRnT6OU-IbwUI",
  },
  {
    storeNumber: "8589",
    name: "Winslow - Transcon",
    email: "dennys8589@wksusa.com",
    districtId: "3C",
    regionId: regionFromDistrict("3C"),
    placeId: "ChIJ32iZEldCLocRQPdhPJDfkqM",
  },

  // 3D
  {
    storeNumber: "6869",
    name: "Page - Scenic View",
    email: "dennys6869@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
  },
  {
    storeNumber: "7971",
    name: "Kingman - Andy Devine",
    email: "dennys7971@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJpyPs81vczYARD1QGBGGOQpE",
  },
  {
    storeNumber: "7975",
    name: "Flagstaff - Milton",
    email: "dennys7975@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJTac3lHyPLYcRu4ugADamUDM",
  },
  {
    storeNumber: "8574",
    name: "Phoenix - W Latham",
    email: "dennys8574@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJHYLYz6cVK4cRLOA52SwfK6Y",
  },
  {
    storeNumber: "8644",
    name: "Kingman - Andy Devine",
    email: "dennys8644@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJF_u-B1zczYARO3m6G6HJKes",
  },
  {
    storeNumber: "8688",
    name: "Buckeye - S Watson",
    email: "dennys8688@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJpzw2MnFKK4cRPRAq4xWocg4",
  },
  {
    storeNumber: "8695",
    name: "Tuba City - Legacy",
    email: "dennys8695@wksusa.com",
    districtId: "3D",
    regionId: regionFromDistrict("3D"),
    placeId: "ChIJeVM2-9DTM4cRD5Y5hd--T9U",
  },

  // 3E
  {
    storeNumber: "7478",
    name: "Murray - 4500 S",
    email: "dennys7478@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJ1eamwEqKUocR43t8PDns1eA",
  },
  {
    storeNumber: "7480",
    name: "Salt Lake City - N Temple",
    email: "dennys7480@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJl6DFSmX0UocRNl4jA6iSsmo",
  },
  {
    storeNumber: "7481",
    name: "Midvale - 7200 S",
    email: "dennys7481@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJQSfPfqmJUocROubCBO-A4gM",
  },
  {
    storeNumber: "7677",
    name: "Orem - State",
    email: "dennys7677@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJmabu1TKFTYcRmLQEH7y5CAc",
  },
  {
    storeNumber: "8568",
    name: "West Haven - 2100 S",
    email: "dennys8568@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJZb_hx10OU4cRFbJvq8cogeU",
  },
  {
    storeNumber: "8597",
    name: "Caldwell - Franklin",
    email: "dennys8597@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJq3_wPZKzr1QREMPa0GKjZq8",
  },
  {
    storeNumber: "8604",
    name: "Great Falls - 31st",
    email: "dennys8604@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJOU3xPVZIQlMRuUEsNnFmrzY",
  },
  {
    storeNumber: "8676",
    name: "Salt Lake City - 900 W",
    email: "dennys8676@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJP1xemzKLUocRUUPkJceYEx4",
  },
  {
    storeNumber: "9281",
    name: "Riverdale - Riverdale",
    email: "dennys9281@wksusa.com",
    districtId: "3E",
    regionId: regionFromDistrict("3E"),
    placeId: "ChIJgYe9RWkPU4cRFs9P4t2U1yo",
  },

  // 3F
  {
    storeNumber: "6742",
    name: "Green Valley - Frontage",
    email: "dennys6742@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJoXjM9BqE1oYRCTLENkoQW_I",
  },
  {
    storeNumber: "6913",
    name: "Tucson - Freeway",
    email: "dennys6913@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJZVg_2CRx1oYRaevIu77I-rM",
  },
  {
    storeNumber: "6914",
    name: "Tucson - Broadway",
    email: "dennys6914@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJNyLYAXRv1oYRm4V8SZKHmyM",
  },
  {
    storeNumber: "6915",
    name: "Tucson - Oracle",
    email: "dennys6915@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJ_bnSfJdz1oYR6I-QVpQkFA0",
  },
  {
    storeNumber: "7482",
    name: "Provo - Freedom",
    email: "dennys7482@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJl9shUKCmTYcRfH4oDTNV95E",
  },
  {
    storeNumber: "8675",
    name: "Nephi - Main",
    email: "dennys8675@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJqbZ7xMtXTIcR8iCDye-rgAA",
  },
  {
    storeNumber: "9275",
    name: "Spanish Fork - Kirby",
    email: "dennys9275@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
    placeId: "ChIJWT9ztCG9TYcRv1lwCM7CJsU",
  },
  {
    storeNumber: "9282",
    name: "Saratoga Springs - Redwood",
    email: "dennys9282@wksusa.com",
    districtId: "3F",
    regionId: regionFromDistrict("3F"),
  },

  // 3G
  {
    storeNumber: "6635",
    name: "Omaha - 84th",
    email: "dennys6635@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJDZqAvuuMk4cR4t9LzHHNSNA",
  },
  {
    storeNumber: "8573",
    name: "Sioux Falls - Granite",
    email: "dennys8573@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJA1w55EA1iYcRFRqMmIG80fo",
  },
  {
    storeNumber: "8595",
    name: "Gretna - Nebraska",
    email: "dennys8595@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJncJTiukHlIcRjfu7TRbkQn8",
  },
  {
    storeNumber: "9303",
    name: "Jackson - Sand Pebble",
    email: "dennys9303@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
  },
  {
    storeNumber: "9304",
    name: "Fairview - Hwy 96 N",
    email: "dennys9304@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJ-zqhkLqZZIgRq4LAH7RESdU",
  },
  {
    storeNumber: "9305",
    name: "Franklin - S Nashville",
    email: "dennys9305@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJt8-7DJHJZYgRnNgJJtfuv4E",
  },
  {
    storeNumber: "9343",
    name: "Mauston - Gateway",
    email: "dennys9343@wksusa.com",
    districtId: "3G",
    regionId: regionFromDistrict("3G"),
    placeId: "ChIJW5UODaQA_ocRQjlkfJK2QCc",
  },

  // 3H
  {
    storeNumber: "7843",
    name: "Mira Loma - Pats Ranch",
    email: "dennys7843@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
  },
  {
    storeNumber: "7984",
    name: "Barstow - E Main",
    email: "dennys7984@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJYQeODJ98xIARN1rG5TNnt8c",
  },
  {
    storeNumber: "8748",
    name: "Riverside - University",
    email: "dennys8748@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJ5aOUUj-u3IARQfTWx3uMjQ8",
  },
  {
    storeNumber: "8805",
    name: "Barstow - Fisher",
    email: "dennys8805@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJ08Q73Jx-xIARDhuWl4Hj0Lk",
  },
  {
    storeNumber: "9358",
    name: "La Habra - S Beach",
    email: "dennys9358@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJK3qTC9kq3YARHiO3hrb7JMw",
  },
  {
    storeNumber: "9537",
    name: "Moreno Valley - Sunnymead",
    email: "dennys9537@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJvdOavS6m3IARjbVY9HMov5s",
  },
  {
    storeNumber: "9538",
    name: "Ontario - N Vineyard",
    email: "dennys9538@wksusa.com",
    districtId: "3H",
    regionId: regionFromDistrict("3H"),
    placeId: "ChIJ84Ry3Vo0w4ARdAGIMUQiCe0",
  },
]

// -----------------------------
// Helpers
// -----------------------------

export function getStoreByNumber(storeNumber: string): Store | undefined {
  return stores.find((s) => s.storeNumber === storeNumber)
}

export function getStoresByDistrict(districtId: DistrictId): Store[] {
  return stores.filter((s) => s.districtId === districtId)
}

export function getStoresByRegion(regionId: RegionId): Store[] {
  return stores.filter((s) => s.regionId === regionId)
}

export function parseStoreNumberFromEmail(emailRaw: string): string | null {
  const email = (emailRaw || "").trim().toLowerCase()
  const m = email.match(/^dennys(\d{4})@wksusa\.com$/)
  if (!m) return null
  return m[1]
}