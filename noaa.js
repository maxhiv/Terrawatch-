import { PrismaClient, Role, StationType, FeedCat, Plan } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TERRAWATCH database...");

  const org = await prisma.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: { name: "Demo Research Organization", slug: "demo-org", plan: Plan.SCIENTIST },
  });

  const hash = await bcrypt.hash("Demo1234!", 12);
  await prisma.user.upsert({
    where: { email: "scientist@terrawatch.io" },
    update: {},
    create: { email: "scientist@terrawatch.io", passwordHash: hash, name: "Dr. Sarah Chen", role: Role.ADMIN, orgId: org.id },
  });

  const stations = [
    { name: "North Shore Buoy", code: "S-01", type: StationType.WATER, lat: 30.52, lng: -87.91 },
    { name: "Fairhope Pier",    code: "S-02", type: StationType.AIR,   lat: 30.51, lng: -87.88 },
    { name: "Mobile Bay South", code: "S-03", type: StationType.MULTI, lat: 30.45, lng: -87.93 },
    { name: "Dog River Mouth",  code: "S-05", type: StationType.WATER, lat: 30.58, lng: -88.05 },
  ];
  for (const s of stations) {
    await prisma.station.upsert({ where: { code: s.code }, update: {}, create: { ...s, orgId: org.id } });
  }

  const feeds = [
    { code: "USGS-NWIS", name: "USGS National Water Info System", category: FeedCat.WATER,   endpoint: "https://waterservices.usgs.gov/nwis/iv/",   pollInterval: 3600 },
    { code: "EPA-AQS",   name: "EPA Air Quality System",          category: FeedCat.AIR,     endpoint: "https://aqs.epa.gov/data/api/",             pollInterval: 3600 },
    { code: "NOAA-COOP", name: "NOAA CO-OPS Tides & Currents",   category: FeedCat.WATER,   endpoint: "https://api.tidesandcurrents.noaa.gov/",    pollInterval: 600  },
    { code: "NOAA-NWS",  name: "NOAA National Weather Service",   category: FeedCat.WEATHER, endpoint: "https://api.weather.gov/",                  pollInterval: 3600 },
    { code: "OPENAQ",    name: "OpenAQ Global Platform",          category: FeedCat.AIR,     endpoint: "https://api.openaq.org/v3/",                pollInterval: 3600 },
    { code: "NDBC",      name: "NOAA National Data Buoy Center",  category: FeedCat.WATER,   endpoint: "https://www.ndbc.noaa.gov/data/",           pollInterval: 3600 },
    { code: "ERDDAP",    name: "NOAA ERDDAP Oceanographic",       category: FeedCat.WATER,   endpoint: "https://coastwatch.pfeg.noaa.gov/erddap/",  pollInterval: 3600 },
    { code: "CMEMS",     name: "Copernicus Marine Service",        category: FeedCat.WATER,   endpoint: "https://marine.copernicus.eu/",             pollInterval: 3600 },
    { code: "GOES-R",    name: "NOAA GOES-R Satellite",           category: FeedCat.IMAGERY, endpoint: "https://cdn.star.nesdis.noaa.gov/",         pollInterval: 600  },
    { code: "SENTINEL",  name: "ESA Copernicus Sentinel-2",       category: FeedCat.IMAGERY, endpoint: "https://scihub.copernicus.eu/dhus/",        pollInterval: 86400 },
    { code: "NASA-ED",   name: "NASA EarthData MODIS/VIIRS",      category: FeedCat.IMAGERY, endpoint: "https://earthdata.nasa.gov/",               pollInterval: 86400 },
    { code: "VEXCEL",    name: "Vexcel UltraCam Aerial",          category: FeedCat.IMAGERY, endpoint: "https://api.vexcelgroup.com/v1/",           pollInterval: 0     },
    { code: "NRCS",      name: "USDA NRCS SNOTEL/SCAN",           category: FeedCat.SOIL,    endpoint: "https://wcc.sc.egov.usda.gov/awdbRestApi/", pollInterval: 3600 },
    { code: "EPA-WQX",   name: "EPA Water Quality Exchange",      category: FeedCat.WATER,   endpoint: "https://www.waterqualitydata.us/",          pollInterval: 3600 },
    { code: "INAT",      name: "iNaturalist Observations API",    category: FeedCat.BIO,     endpoint: "https://api.inaturalist.org/v1/",           pollInterval: 3600 },
    { code: "GBIF",      name: "GBIF Biodiversity Data",          category: FeedCat.BIO,     endpoint: "https://api.gbif.org/v1/",                  pollInterval: 3600 },
    { code: "NERRS",     name: "NERRS / CDMO Estuarine Data",     category: FeedCat.WATER,   endpoint: "https://cdmo.baruch.sc.edu/",               pollInterval: 3600 },
    { code: "OWM",       name: "OpenWeatherMap One Call",         category: FeedCat.WEATHER, endpoint: "https://api.openweathermap.org/data/3.0/",  pollInterval: 3600 },
    { code: "AIRNOW",    name: "AirNow / NWS Air Quality",       category: FeedCat.AIR,     endpoint: "https://www.airnowapi.org/",                pollInterval: 3600 },
    { code: "PURPLEAIR", name: "PurpleAir Community Network",     category: FeedCat.AIR,     endpoint: "https://api.purpleair.com/",                pollInterval: 3600 },
    { code: "MODIS-LST", name: "MODIS Land Surface Temperature",  category: FeedCat.IMAGERY, endpoint: "https://modis.gsfc.nasa.gov/data/",         pollInterval: 86400 },
    { code: "NOAA-AHPS", name: "NOAA Hydrologic Prediction",     category: FeedCat.WEATHER, endpoint: "https://water.weather.gov/ahps/",           pollInterval: 3600 },
  ];
  for (const f of feeds) {
    await prisma.feed.upsert({ where: { code: f.code }, update: {}, create: f });
  }

  console.log("Seed complete — login: scientist@terrawatch.io / Demo1234!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
