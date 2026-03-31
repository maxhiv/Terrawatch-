import { useState } from "react";

// ── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:"#eef6f2",       // sage-tinted page background
  surface:"#ffffff",  // white card surface
  panel:"#f5fbf8",    // barely-green panel fill
  border:"#cce4d8",   // soft teal border
  border2:"#aed0c2",  // medium teal border
  text:"#1a3028",     // deep forest text
  muted:"#4a7060",    // muted teal-green
  dim:"#e2f0ea",      // lightest tint — alternating rows
  ink:"#0f1e18",      // darkest heading text
  t1:"#0a9e80",   // scientist meeting — vivid teal
  t2:"#d97706",   // hatch fairhope — warm amber
  t3:"#1d6fcc",   // bceda / sitevault — ocean blue
  t4:"#7c3aed",   // terrawatch saas — violet
  t5:"#c0392b",   // wetlandai — deep rose
  t6:"#1a7a3c",   // monetization — forest green
  now:"#dc2626",
  q2:"#d97706",
  q3:"#1a7a3c",
  q4:"#1d6fcc",
  y2:"#7c3aed",
  y3:"#0a9e80",
  white:"#ffffff",
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const SCIENTIST_PREP = [
  {
    category:"Questions to Ask",
    color:C.t1,
    items:[
      {q:"What are your top 3 data pain points today?", why:"Shapes MVP feature prioritization. If her #1 pain is manual EPA submission, that becomes Sprint 1."},
      {q:"Which of the 22 feeds do you already use, and which do you wish you had in one place?", why:"Validates the feed registry value prop. Identifies which connectors to prioritize."},
      {q:"How do you currently detect a HAB or hypoxia event — what's your workflow from first signal to action?", why:"Maps the exact workflow TERRAWATCH replaces. Every manual step is a demo moment."},
      {q:"Who else needs to be notified when an event occurs, and how do you notify them today?", why:"Defines the alert dispatch recipient list. Validates autonomous notification value."},
      {q:"What does your monthly compliance reporting look like — how long does it take?", why:"Quantifies the automation ROI. 2 days/month × $45/hr = $1,620/mo in staff time — more than the subscription."},
      {q:"Are you submitting data to EPA WQX, NERRS CDMO, or ADEM? What format challenges exist?", why:"Scopes the compliance automation module. Direct path to a funded contract."},
      {q:"What would a 72-hour HAB warning actually change in your response workflow?", why:"Gets her to articulate the value in her own words — the best sales language."},
      {q:"Is there a specific environmental problem in Mobile Bay you've wanted to study but couldn't get the data infrastructure to support?", why:"May reveal a breakthrough discovery we haven't thought of yet."},
      {q:"What does your ideal interface look like — do you prefer dashboards, data tables, maps, or reports?", why:"Directly informs UI/UX design priorities for the MVP build."},
      {q:"Who else should we be talking to — other scientists, agency contacts, potential partners?", why:"Warm introductions are worth 10× cold outreach. She knows everyone in the Gulf Coast monitoring community."},
    ],
  },
  {
    category:"Things to Demo",
    color:"#38bdf8",
    items:[
      {q:"Live dashboard showing her exact feeds (NERRS, USGS, NOAA CO-OPS) unified in one view", why:"Open with the demo, not the pitch. Let her see her own data in a format she's never seen before."},
      {q:"HAB Oracle probability forecast — walk through the 6-feed fusion methodology", why:"The most publishable capability. She'll immediately think about co-authoring the methodology paper."},
      {q:"Autonomous alert dispatch — simulate a HAB event firing and show the SMS/email going out", why:"The 'wow moment.' Nothing like this exists in any tool she currently uses."},
      {q:"Vexcel oblique viewer for the Mobile Bay AOI — show her 7.5cm resolution vs. Google Maps", why:"Visual impact is immediate. Establish Vexcel as a fundamental differentiator early in the conversation."},
      {q:"Compliance automation — show month-end EPA WQX report generating automatically", why:"If she's spent 2 days/month on this, she will emotionally respond to seeing it automated."},
      {q:"AI Field Assistant — ask it a question about Mobile Bay DO₂ trends in plain English", why:"The close. After this demo she'll want to know when she can have access."},
    ],
  },
  {
    category:"Documents to Bring",
    color:"#a78bfa",
    items:[
      {q:"One-page capability summary with real-world relevance for Mobile Bay specifically", why:"Leave-behind that she can share with ADEM and ADCNR contacts."},
      {q:"HAB Oracle methodology brief — 2 pages, journal-format", why:"Scientists respond to scientific documents. Shows this is rigorous, not just a startup pitch."},
      {q:"Pilot partnership proposal — free 6-month access in exchange for data validation and co-authorship", why:"Removes the budget objection entirely. She can say yes without a procurement process."},
      {q:"Letter of intent template she can sign on the spot", why:"Don't leave without a commitment. An LOI costs her nothing and gives you everything for the Hatch application."},
    ],
  },
];

const HATCH_TRACK = [
  {week:"Week 1 (March 30 – April 5)", phase:"NOW", color:C.now, tasks:[
    "Deploy TERRAWATCH v2.0 to Replit — paste REPLIT_MASTER_UPDATE → REPLIT_INTELLIGENCE_UPDATE → REPLIT_GOES19_UPDATE. Server starts, Intelligence Engine Phase 0 running.",
    "Send GOES-19 ground station email (Gmail draft saved) — attach GOES19_API_Specification_v1.docx + Postman collection link + endpoint URL",
    "Call Angela Underwood at Weeks Bay NERR: (251) 626-1026 — request historical ChlFluor (2010–present), discuss April 1 meeting prep",
    "April 1 scientist meeting — demo Science View 5-tab tool, Feed Status mission control, causal chain model. Present pilot LOI.",
    "Register terrawatch.io domain and set up landing page",
    "Submit Hatch Fairhope application by April 6 with TERRAWATCH_Complete_Narrative.docx as technical exhibit",
    "Open business banking account for Hansen Holdings environmental division",
  ]},
  {week:"Week 2–3", phase:"NOW", color:C.now, tasks:[
    "Submit Hatch Fairhope application with scientist LOI attached",
    "Prepare 10-minute pitch deck version of TERRAWATCH pitch for Hatch presentation",
    "Apply for Innovate Alabama Network pre-qualification (BCEDA connection)",
    "Begin NOAA Sea Grant pre-proposal draft (due Q3 — 30-day head start matters)",
    "Set up GitHub repo, Replit deployment, Neon PostgreSQL database",
  ]},
  {week:"Month 2 (Post-Hatch Approval)", phase:"Q2", color:C.q2, tasks:[
    "Receive $36,000 operating cost grant from Hatch Fairhope",
    "Activate Vexcel paid imagery license: Multispectral + Elevate DTM + Oblique",
    "Deploy TERRAWATCH v1.0 to production on Replit with 5 Mobile Bay stations",
    "Onboard scientist as first pilot user — begin data validation",
    "Schedule monthly check-in with Hatch team (they want to see progress)",
  ]},
  {week:"Month 3–4", phase:"Q2", color:C.q2, tasks:[
    "HAB Oracle first live season — document every prediction vs. actual event",
    "Present at Hatch monthly demo day (internal) — recruit advisors from their network",
    "Approach Alabama Coastal Foundation for co-marketing partnership",
    "Submit NOAA Sea Grant full proposal ($300K target) with scientist as co-PI",
    "Begin BCEDA SITEVAULT conversations (they are a Hatch funder — warm intro)",
  ]},
];

const BCEDA_TRACK = [
  {phase:"Q2", color:C.q2, title:"Initial Approach", tasks:[
    "Leverage Hatch Fairhope connection — BCEDA is a Hatch co-funder. Warm intro from Hatch to Lee Lawson, President & CEO of BCEDA.",
    "Present SITEVAULT concept with the full demo: Vexcel oblique virtual tour + DTM development cost estimator + environmental pre-screen for South Alabama Mega Site.",
    "Show the 'deal-that-almost-died' use case: environmental surprise discovered at engineering phase → months of delay → prospect goes to Georgia. SITEVAULT catches it before engineering.",
    "Propose a 90-day pilot: BCEDA gets SITEVAULT access for all 4 active industrial sites at no cost in exchange for feedback and a testimonial.",
  ]},
  {phase:"Q3", color:C.q3, title:"Pilot & Validation", tasks:[
    "Deploy SITEVAULT with all 4 BCEDA sites (South Alabama Mega Site, Port Alabama Industrial Center, Loxley Logistics Center, Bay Minette Industrial Site) mapped with full Vexcel coverage.",
    "Integrate TERRAWATCH environmental layer — real-time water quality data for sites adjacent to waterways shown in SITEVAULT site intelligence panel.",
    "Conduct 2–3 joint meetings where BCEDA uses SITEVAULT in an actual prospect meeting — document time savings and prospect engagement improvement.",
    "Commission an independent ROI analysis: how many days faster is the prospect evaluation cycle with SITEVAULT vs. without.",
  ]},
  {phase:"Q4", color:C.q4, title:"Contract & Expansion", tasks:[
    "Convert BCEDA pilot to $60,000/yr annual license contract.",
    "Expand to Baldwin County Commission and City of Fairhope Planning as sub-licenses ($12,000–$24,000/yr each).",
    "Approach Crown West (Loxley Logistics developer) and Gulf Corporation (Port Alabama developer) for developer licenses ($18,000–$36,000/yr each).",
    "Present SITEVAULT at Alabama Economic Development Association annual conference — first step toward statewide EDA licensing.",
  ]},
  {phase:"Y2", color:C.y2, title:"Statewide Expansion", tasks:[
    "License SITEVAULT to Madison County EDA (Huntsville — aerospace corridor), Mobile County EDA, and Tuscaloosa County EDA.",
    "Integrate WetlandAI into SITEVAULT as a built-in environmental pre-screen module — creates a combined site intelligence + environmental compliance platform.",
    "Explore neighboring state EDAs: Mississippi Development Authority, Tennessee Department of Economic and Community Development.",
    "Apply for EDA (Economic Development Administration) Tech Hub designation — federal funding pathway for the platform.",
  ]},
];

const REVENUE_STREAMS = [
  {
    id:"r1", category:"SaaS Subscriptions", color:C.t4, icon:"💳",
    tiers:[
      {name:"Scientist Plan", price:"$299/mo", target:"University labs, NERRS reserves, NGOs", y1:"$28,704", y2:"$86,112", y3:"$201,600"},
      {name:"Agency Plan", price:"$799/mo", target:"ADEM, ADCNR, county health depts", y1:"$19,176", y2:"$76,704", y3:"$192,000"},
      {name:"Enterprise Plan", price:"$1,499/mo", target:"Multi-site orgs, NOAA programs", y1:"$17,988", y2:"$89,940", y3:"$269,820"},
    ],
    notes:"Pricing anchored to value delivered: at $299/mo, one prevented shellfish closure ($2,000+ avoided loss) pays 7 months of subscription. Lead with the ROI story, not the feature list.",
  },
  {
    id:"r2", category:"SITEVAULT — BCEDA License", color:C.t3, icon:"🏭",
    tiers:[
      {name:"BCEDA Platform License", price:"$60,000/yr", target:"Baldwin County EDA", y1:"$0", y2:"$60,000", y3:"$60,000"},
      {name:"Municipal Sub-Licenses", price:"$12,000–$24,000/yr", target:"Fairhope, Daphne, Foley, Gulf Shores", y1:"$0", y2:"$36,000", y3:"$72,000"},
      {name:"Developer Licenses", price:"$18,000–$36,000/yr", target:"Crown West, Gulf Corp, industrial devs", y1:"$0", y2:"$54,000", y3:"$108,000"},
    ],
    notes:"SITEVAULT is a B2G (business-to-government) product with multi-year contract potential. One BCEDA contract at $60K/yr is more predictable revenue than 200 individual subscribers.",
  },
  {
    id:"r3", category:"WetlandAI Delineation", color:C.t5, icon:"🌿",
    tiers:[
      {name:"Consulting Firm SaaS", price:"$800–$2,500/mo", target:"Volkert, Terracon, Cardno", y1:"$0", y2:"$57,600", y3:"$180,000"},
      {name:"Per-Project Fee", price:"$2,000–$8,000/project", target:"Developers, ALDOT, Army Corps", y1:"$0", y2:"$60,000", y3:"$200,000"},
      {name:"USACE Mobile District", price:"$200K–$500K contract", target:"Government contract", y1:"$0", y2:"$0", y3:"$300,000"},
    ],
    notes:"WetlandAI shares the Vexcel imagery cost already paid for TERRAWATCH and SITEVAULT. Marginal cost to add this revenue stream is software development only — the data infrastructure already exists.",
  },
  {
    id:"r4", category:"Federal Grants", color:"#f59e0b", icon:"📋",
    tiers:[
      {name:"NOAA Sea Grant", price:"$300K–$500K", target:"HAB Oracle + Hypoxia methodology", y1:"$0", y2:"$300,000", y3:"$0"},
      {name:"EPA STAR Grant", price:"$300K–$800K", target:"Cross-media pollutant tracker", y1:"$0", y2:"$0", y3:"$500,000"},
      {name:"NSF EarthCube", price:"$250K–$1M", target:"Biodiversity crash EWS + data infrastructure", y1:"$0", y2:"$0", y3:"$500,000"},
    ],
    notes:"Federal grants are non-dilutive revenue that validate scientific credibility simultaneously. The NOAA Sea Grant pre-proposal should be filed in Q2 with the scientist as co-PI — her institutional affiliation (university or NOAA partner) makes the application 3× more competitive.",
  },
  {
    id:"r5", category:"Blue Carbon MRV", color:C.t6, icon:"🌱",
    tiers:[
      {name:"Per-Acre Verification Fee", price:"$0.50–$2.00/acre/yr", target:"Conservation orgs, carbon project developers", y1:"$0", y2:"$14,000", y3:"$140,000"},
      {name:"Credit Brokerage Revenue Share", price:"5–10% of credit sale value", target:"Verra / Gold Standard projects", y1:"$0", y2:"$0", y3:"$200,000"},
      {name:"MRV Platform License", price:"$25,000–$75,000/yr", target:"Nature Conservancy, Ducks Unlimited", y1:"$0", y2:"$25,000", y3:"$75,000"},
    ],
    notes:"Blue carbon is the highest-ceiling long-term revenue stream. The Gulf Coast has ~500,000 acres of saltmarsh — at $1/acre/yr verification, the addressable market is $500K/yr in Baldwin and Mobile counties alone. National scale is hundreds of millions.",
  },
  {
    id:"r6", category:"Government Data Services", color:"#e879f9", icon:"🏛️",
    tiers:[
      {name:"EPA TMDL Support Contract", price:"$300K–$800K", target:"EPA Region 4 — TMDL revision methodology", y1:"$0", y2:"$0", y3:"$500,000"},
      {name:"PFAS Attribution Contracts", price:"$50K–$150K/engagement", target:"State AGs, environmental law firms", y1:"$0", y2:"$50,000", y3:"$200,000"},
      {name:"AML Remediation Priority", price:"$500K–$2M contract", target:"EPA AML program — Infrastructure Act", y1:"$0", y2:"$0", y3:"$500,000"},
    ],
    notes:"Government contracts are slow to close (6–18 month sales cycle) but very large and multi-year. The PFAS attribution engagement with an environmental law firm is fastest to close — 3–6 month cycle — and serves as a proof of concept for the larger EPA contract.",
  },
  {
    id:"r7", category:"Water Utility Licensing", color:"#06b6d4", icon:"🚰",
    tiers:[
      {name:"Cyanobacteria Early Warning SaaS", price:"$500–$2,000/mo/utility", target:"MAWSS, North Mobile County Water, South Baldwin", y1:"$0", y2:"$18,000", y3:"$120,000"},
      {name:"Saltwater Intrusion Warning", price:"$20,000–$60,000/yr", target:"Bayou La Batre, coastal AL municipalities", y1:"$0", y2:"$20,000", y3:"$80,000"},
      {name:"National Utility Program", price:"$500–$2,000/mo", target:"50,000+ regulated surface water systems", y1:"$0", y2:"$0", y3:"$600,000"},
    ],
    notes:"Water utilities are highly regulated and budget-certain. EPA Safe Drinking Water Act compliance creates a non-optional monitoring requirement that makes these buyers less price-sensitive than commercial subscribers.",
  },
  {
    id:"r8", category:"Consulting & Custom Projects", color:"#f97316", icon:"🔧",
    tiers:[
      {name:"Watershed Attribution Studies", price:"$25K–$100K/engagement", target:"ADEM, municipalities, developers", y1:"$25,000", y2:"$100,000", y3:"$300,000"},
      {name:"Custom Anomaly Model Config", price:"$2K–$10K one-time", target:"Industrial monitoring, power plants", y1:"$6,000", y2:"$30,000", y3:"$60,000"},
      {name:"API Access — Developer Tier", price:"$99–$499/mo", target:"GIS consultants, academic researchers", y1:"$4,788", y2:"$23,940", y3:"$71,820"},
    ],
    notes:"Consulting engagements are high-margin and create long-term relationships. Every watershed attribution study becomes a multi-year monitoring contract. The API developer tier builds a community that generates referrals to institutional buyers.",
  },
];

// Revenue totals
const Y1 = 102456;
const Y2 = 1100296;
const Y3 = 5251240;

const PHASES = [
  {
    id:"now", label:"NOW — This Week", sublabel:"March 30 – April 5, 2026", color:C.now,
    milestones:[
      {text:"Deploy TERRAWATCH v2.0 to Replit — paste REPLIT_MASTER_UPDATE.md, REPLIT_INTELLIGENCE_UPDATE.md, REPLIT_GOES19_UPDATE.md in order (run npm install sql.js && mkdir -p data first)", track:"Tech"},
      {text:"Send GOES-19 ground station email (draft saved in Gmail) — attach GOES19_API_Specification_v1.docx, share endpoint URL + GOES19_API_KEY once deployed", track:"Tech"},
      {text:"Call Angela Underwood — Weeks Bay NERR — (251) 626-1026 — request historical ChlFluor record (2010–present) + eDNA sampler site co-location discussion", track:"Scientist"},
      {text:"Register terrawatch.io domain and set up landing page", track:"Tech"},
      {text:"Submit Hatch Fairhope application by April 6 — use TERRAWATCH_Complete_Narrative.docx + GOES-19 API spec as technical exhibits", track:"Hatch"},
      {text:"April 1 scientist meeting — present Science View 5-tab tool, Feed Status mission control, and causal chain diagram. Bring pilot LOI to sign.", track:"Scientist"},
    ],
  },
  {
    id:"q2a", label:"Month 1–2", sublabel:"April–May 2026", color:C.now,
    milestones:[
      {text:"Intelligence Engine Phase 1 trigger — 100 labeled samples accumulated (~Day 4 at 3-min cron if threshold events occur) → first logistic regression model auto-trains and auto-promotes if AUC-ROC improves", track:"Tech"},
      {text:"Submit Hatch Fairhope grant application ($36,000 operating costs) — GOES-19 spec and narrative as technical exhibits", track:"Hatch"},
      {text:"Activate PACE OCI granule flow — NASA_EARTHDATA creds saved in Replit, CMR search just needs server restart. Takes HAB Oracle from 7/13 to 9/13 active inputs.", track:"Science"},
      {text:"Run first Copernicus openEO BIOPAR batch job over Weeks Bay NERR — GET /api/sensors/openeo/biopar?days=365. Establishes LAI baseline for blue carbon MRV + vegetation stress ML input.", track:"Carbon"},
      {text:"Wire NERRS ChlFluor into HAB Oracle inputCount — currently active in DB but showing as missing from model inputs", track:"Tech"},
      {text:"GOES-19 ground station integration validation — use Postman collection 'TERRAWATCH — GOES-19 Ground Station API' to test ingest endpoint once deployed", track:"Tech"},
      {text:"Initial BCEDA SITEVAULT conversation via Hatch warm intro", track:"BCEDA"},
    ],
  },
  {
    id:"q2b", label:"Month 3–4", sublabel:"June–July 2026", color:C.q2,
    milestones:[
      {text:"Intelligence Engine Phase 2 trigger — 500 labeled samples → enhanced logistic regression (1,500 epochs). GOES-19 SST gradient flowing as live feature (stratification onset 6–24h early). 13/13 HAB Oracle inputs fully active.", track:"Tech"},
      {text:"WetlandAI v2 first commercial pre-delineation report delivered to ALDOT project — validates $500–$2,000/site pricing model. BIOPAR baseline confirms U-Net model accuracy.", track:"WetlandAI"},
      {text:"Receive Hatch operating grant — activate Vexcel paid license", track:"Hatch"},
      {text:"NOAA Sea Grant pre-proposal filed with scientist as co-PI", track:"Grants"},
      {text:"CAFO attribution pipeline: TROPOMI CH₄ anomaly coordinates × EPA TRI facilities × GOES-19 QPE rainfall → N/P loading attribution report for ADEM", track:"Science"},
      {text:"First paying SaaS client onboarded (target: Dauphin Island Sea Lab or USA Marine Sci)", track:"Revenue"},
      {text:"SITEVAULT 90-day pilot approved by BCEDA", track:"BCEDA"},
    ],
  },
  {
    id:"q3", label:"Month 5–7", sublabel:"Aug–Oct 2026", color:C.q3,
    milestones:[
      {text:"Intelligence Engine Phase 3 trigger — 2,000 labeled samples → CNN-LSTM training dispatched to GCP Vertex AI. Requires GCP_PROJECT + VERTEX_SERVICE_ACCOUNT_KEY in Replit Secrets. 8-day HAB Oracle forecast horizon activates.", track:"Tech"},
      {text:"Karenia brevis species attribution via PACE OCI 588nm peridinin carotenoid band — first satellite species-level HAB attribution in the Gulf Coast. SHAP explainability deployed for EPA 2024 AI Use Policy compliance.", track:"Science"},
      {text:"HAB Oracle first documented successful prediction — press release + methodology paper draft (target: Harmful Algae journal)", track:"Science"},
      {text:"SITEVAULT pilot deployed — all 4 BCEDA sites mapped with full Vexcel coverage", track:"BCEDA"},
      {text:"WetlandAI v1.0 launched — first paying consulting firm license", track:"WetlandAI"},
      {text:"Blue carbon pilot: first 500 acres of Baldwin County saltmarsh verified via BIOPAR LAI + NERRS ground truth", track:"Carbon"},
    ],
  },
  {
    id:"q4", label:"Month 8–10", sublabel:"Nov 2026–Jan 2027", color:C.q4,
    milestones:[
      {text:"BCEDA converts pilot to $60,000/yr contract", track:"Revenue"},
      {text:"3+ SaaS clients — platform self-sustaining operationally", track:"Revenue"},
      {text:"NOAA Sea Grant full proposal submitted", track:"Grants"},
      {text:"Present at Gulf of Mexico Alliance Annual Meeting — national visibility", track:"Science"},
    ],
  },
  {
    id:"y2a", label:"Year 2 — H1", sublabel:"Feb–Jul 2027", color:C.y2,
    milestones:[
      {text:"NOAA Sea Grant award — $300K funding, first major grant win", track:"Grants"},
      {text:"SITEVAULT licensed to 2 additional Alabama EDAs", track:"BCEDA"},
      {text:"Blue carbon MRV partnership with The Nature Conservancy Gulf Coast", track:"Carbon"},
      {text:"PFAS attribution first client engagement — environmental law firm", track:"Revenue"},
    ],
  },
  {
    id:"y2b", label:"Year 2 — H2", sublabel:"Aug 2027–Jan 2028", color:C.y2,
    milestones:[
      {text:"EPA TMDL revision contract filed for Region 4 Mobile Bay", track:"Grants"},
      {text:"WetlandAI: first USACE Mobile District government contract in pipeline", track:"WetlandAI"},
      {text:"Water utility cyanobacteria warning: MAWSS pilot contract", track:"Revenue"},
      {text:"Target ARR: $400,000+", track:"Revenue"},
    ],
  },
  {
    id:"y3", label:"Year 3", sublabel:"2028", color:C.y3,
    milestones:[
      {text:"EPA STAR grant award — $500K for cross-media pollutant tracker", track:"Grants"},
      {text:"SITEVAULT licensed across 5+ states", track:"BCEDA"},
      {text:"Blue carbon: 10,000+ acres under MRV contract", track:"Carbon"},
      {text:"Target ARR: $1M+ — company self-sustaining at scale", track:"Revenue"},
    ],
  },
];

const TRACK_COLORS = {
  "Scientist":C.t1, "Vexcel":C.t1, "Tech":C.t3,
  "Hatch":C.t2, "Science":C.t1, "BCEDA":C.t3,
  "Grants":"#f59e0b", "Revenue":C.t6, "WetlandAI":C.t5, "Carbon":C.t6,
  "Intelligence":C.t4, "GOES19":C.t3,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
const Tag = ({children,color})=>(
  <span style={{fontSize:9,padding:"2px 7px",borderRadius:3,
    background:`${color}20`,color,border:`1px solid ${color}44`,
    fontWeight:600,whiteSpace:"nowrap"}}>{children}</span>
);

const PhaseBar = ({phase, isActive, onClick})=>(
  <div onClick={onClick} style={{
    padding:"10px 14px", cursor:"pointer",
    background:isActive?`${phase.color}18`:C.panel,
    border:`1px solid ${isActive?phase.color:C.border}`,
    borderRadius:7, transition:"all 0.18s",
    borderLeft:`3px solid ${phase.color}`,
  }}>
    <div style={{fontSize:11,color:phase.color,fontWeight:700}}>{phase.label}</div>
    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{phase.sublabel}</div>
  </div>
);

const fmt = n => n>=1000000?"$"+Math.round(n/100000)/10+"M":"$"+Math.round(n/1000)+"K";

const TABS = ["Vision","Roadmap","Build Progress","Intelligence Engine","Scientist Meeting","Hatch Strategy","BCEDA / SITEVAULT","Revenue Model","Opportunities","State Expansion","Private Sector","Osprey Integration","Data Sources","Airbus","Fox 10","Next Sensors"];

// ─────────────────────────────────────────────────────────────────────────────
// DATA SOURCES — FREE
// ─────────────────────────────────────────────────────────────────────────────
const FREE=[
  {cat:"🌊 Water Quality — In-Situ Sensors",color:"#22d3ee",sources:[
    {name:"USGS NWIS",url:"waterdata.usgs.gov",params:"Streamflow, DO₂, pH, conductivity, nitrates, turbidity, water temp, gage height",update:"15-min real-time",cost:"Free — REST API, key optional",terrawatch:"Primary water quality backbone. 8,000+ stations nationally, ~40 in Mobile/Baldwin area."},
    {name:"EPA Water Quality Portal (WQP)",url:"waterqualitydata.us",params:"430M+ records — bacteria, nutrients, metals, organics, biologics from 400+ agencies",update:"Varies by agency",cost:"Free — REST/JSON/CSV",terrawatch:"Historical baseline and TMDL compliance data. WQX submission target for automated reporting."},
    {name:"NERRS / CDMO",url:"cdmo.baruch.sc.edu",params:"DO₂, salinity, pH, turbidity, chlorophyll-a, water temp, depth, wind, PAR",update:"15-min real-time from 30 reserves",cost:"Free — registration required",terrawatch:"Weeks Bay NERR is your first pilot client. Direct CDMO submission automation is the compliance sell."},
    {name:"NOAA CO-OPS",url:"tidesandcurrents.noaa.gov",params:"Water level, salinity, water temp, conductivity, turbidity at 200+ tidal stations",update:"6-min real-time",cost:"Free — REST API",terrawatch:"Mobile Bay tidal forcing for HAB Oracle and hypoxia stratification model."},
    {name:"NDBC (NOAA Buoys)",url:"ndbc.noaa.gov",params:"Wave height, wave period, wind speed/direction, SST, atmospheric pressure, swell",update:"Hourly real-time",cost:"Free — REST API",terrawatch:"Gulf of Mexico offshore buoys provide open-ocean forcing data for coastal models."},
    {name:"CMEMS (Copernicus Marine)",url:"marine.copernicus.eu",params:"Subsurface temp/salinity profiles, currents, sea level, biogeochemistry",update:"Daily — model reanalysis + nowcast",cost:"Free — registration required",terrawatch:"Gulf dead zone bottom-water oxygen forecasting. Cross-media tracker ocean boundary conditions."},
    {name:"ERDDAP (NOAA aggregator)",url:"erddap.ioos.us",params:"Aggregates 1,000+ oceanographic datasets in unified API",update:"Varies by dataset",cost:"Free",terrawatch:"Single endpoint for disparate oceanographic feeds. Simplifies integration of IOOS regional data."},
  ]},
  {cat:"💨 Air Quality",color:"#a78bfa",sources:[
    {name:"EPA AQS",url:"aqs.epa.gov/aqsweb/documents/data_api.html",params:"PM2.5, PM10, O₃, NO₂, SO₂, CO, Pb — 4,000+ monitors nationally",update:"Hourly real-time + historical",cost:"Free — API key required",terrawatch:"Cross-media tracker atmospheric nitrogen deposition. CAFO ammonia plume source data."},
    {name:"AirNow API",url:"airnowapi.org",params:"AQI by zip/coordinate, current + forecast, fire smoke layer",update:"Hourly real-time",cost:"Free — API key required",terrawatch:"Public-facing AQI display in TERRAWATCH dashboard. Alert trigger for industrial compliance clients."},
    {name:"OpenAQ",url:"api.openaq.org",params:"Global aggregator — PM2.5, O₃, NO₂ from government monitors + low-cost sensors",update:"Real-time aggregation",cost:"Free — REST API",terrawatch:"Gap-fill for areas between EPA monitors. International expansion data layer."},
    {name:"PurpleAir",url:"api.purpleair.com",params:"Hyperlocal PM2.5 from 30,000+ low-cost sensors, 2-minute update",update:"2-min real-time",cost:"Free read API (rate-limited)",terrawatch:"Community air quality layer. Identify industrial fence-line pollution not captured by AQS."},
    {name:"NASA TROPOMI (Sentinel-5P)",url:"earthdata.nasa.gov",params:"NO₂, SO₂, CH₄, CO, O₃, aerosol — 3.5km x 5.5km global daily",update:"Daily near-real-time",cost:"Free via NASA Earthdata",terrawatch:"CAFO ammonia attribution model. Regional atmospheric N deposition for TMDL work."},
  ]},
  {cat:"🛰️ Satellite Imagery — Free",color:"#34d399",sources:[
    {name:"Sentinel-2 (ESA Copernicus)",url:"dataspace.copernicus.eu",params:"10m multispectral (13 bands incl. NIR, red edge, SWIR), 5-day revisit",update:"5-day repeat globally",cost:"Free — registration required",terrawatch:"HAB bloom surface expression, turbidity, NDVI vegetation stress, water color. Primary free imagery layer."},
    {name:"Landsat 8/9 (USGS)",url:"earthexplorer.usgs.gov",params:"30m multispectral (11 bands), 16-day revisit, thermal infrared",update:"16-day repeat",cost:"Free via EarthExplorer or AWS",terrawatch:"Long-term land use change detection, LULC for nonpoint source model, thermal discharge monitoring."},
    {name:"GOES-19 ★ GROUND STATION PUSH API",url:"noaa.gov/nodd",params:"Ground station pushes scalar extractions to POST /api/goes19/ingest every 5 minutes. Products: SST (gradient >3.5°C = stratification alert), QPE rainfall (watershed nutrient pulse trigger), cloud mask (PACE/S2 scheduler with pace_viable flag), RGB bloom index (5-min surface CHL proxy), GLM lightning (convective mixing events), AMV winds. 18 new ML features injected into 68-feature vector. API spec: GOES19_API_Specification_v1.docx. Postman collection: TERRAWATCH — GOES-19 Ground Station API. Auth: X-API-Key header, GOES19_API_KEY in Replit Secrets.",update:"5-min CONUS scans — 288 pushes/day — ~1.5KB/push",cost:"Free — partner ground station provides scalar extractions, not raw files",terrawatch:"MOST IMPORTANT DATA FEED: SST gradient = stratification onset 6–24h before DO₂ crash. QPE rainfall = nutrient pulse trigger (48–96h HAB precursor lag). Cloud mask tells TERRAWATCH when PACE/Sentinel will fire. 5-min bloom index fills gap between orbital passes. First geostationary satellite integration for Gulf Coast HAB prediction. World First."},
    {name:"MODIS (NASA Terra/Aqua)",url:"earthdata.nasa.gov",params:"250m–1km daily, 36 bands — land surface temp, chlorophyll, ocean color, fire",update:"Daily repeat",cost:"Free via NASA Earthdata",terrawatch:"Daily Gulf of Mexico chlorophyll-a surface product. 20+ year historical baseline for trend analysis."},
    {name:"VIIRS (NOAA-20 / Suomi-NPP)",url:"earthdata.nasa.gov",params:"375m daily, DNB nighttime lights, SST, ocean color, sea ice",update:"Daily repeat",cost:"Free via NASA Earthdata",terrawatch:"ALAN ecosystem disruption capability (nighttime lights). HAB detection complement to MODIS."},
    {name:"NASA HLS (Harmonized Landsat-Sentinel)",url:"lpdaac.usgs.gov",params:"Analysis-ready 30m, combined Landsat+Sentinel-2, ~2–3 day revisit",update:"2–3 day effective revisit",cost:"Free via NASA Earthdata LP DAAC",terrawatch:"Best free high-revisit multispectral option for vegetation stress and bloom monitoring."},
    {name:"Planet Education & Research",url:"planet.com/markets/education-and-research",params:"3m PlanetScope daily — up to 3,000 km²/mo for qualifying researchers",update:"Daily repeat",cost:"Free for research orgs — apply at planet.com",terrawatch:"Apply via staff scientist co-PI. 3,000 km²/mo covers Mobile Bay AOI for HAB Oracle validation."},
    {name:"Copernicus DEM (GLO-30)",url:"spacedata.copernicus.eu",params:"30m global digital elevation model — terrain, hydrology, flow routing",update:"Static (updated ~2yr)",cost:"Free",terrawatch:"WetlandAI hydrology layer. Supplement to Vexcel Elevate for rural AOI coverage."},
    {name:"Sentinel-5P TROPOMI ★ ACTIVE (MethaneSAT DEPRECATED)",url:"dataspace.copernicus.eu",params:"Methane (CH₄) XCH4 at 5.5km×3.5km daily — S5P_OFFL_L2__CH4____ product. MethaneSAT lost contact June 20, 2025 and is no longer operational. TROPOMI is the active replacement. Auth: COPERNICUS_USER + COPERNICUS_PASS (same as openEO). Fallback via NASA CMR with NASA_EARTHDATA creds.",update:"Daily near-real-time (~3h latency)",cost:"Free via Copernicus Data Space (CDSE) — COPERNICUS_USER + COPERNICUS_PASS configured in Replit",terrawatch:"★ WORLD FIRST: Independent verification of CAFO methane self-reporting. TROPOMI CH₄ anomaly coordinates × EPA TRI self-reported emissions × GOES-19 QPE rainfall = N/P loading attribution per facility. First independent satellite verification of agricultural pollution in the Mobile-Tensaw watershed. Active in TERRAWATCH server at server/services/tropomi.js."},
  ]},
  {cat:"🌦️ Weather & Climate",color:"#fbbf24",sources:[
    {name:"NOAA NWS",url:"api.weather.gov",params:"Hourly forecasts, observations, alerts, QPF precipitation, marine forecasts",update:"Hourly + real-time alerts",cost:"Free — REST API, no key",terrawatch:"HAB Oracle weather forcing. Hypoxia wind/stratification forecast input. Field mission planning."},
    {name:"NOAA AHPS",url:"water.weather.gov",params:"Flood stage observations and forecasts, precipitation analysis, river stage",update:"Hourly real-time",cost:"Free",terrawatch:"Flood-driven stormwater pulse modeling. Nonpoint source loading event trigger."},
    {name:"NOAA NCEI",url:"ncei.noaa.gov",params:"Historical climate — temperature, precipitation, storm events back to 1800s",update:"Daily archive updates",cost:"Free — API key required",terrawatch:"30-year climate baseline for anomaly detection calibration. Storm event historical library."},
    {name:"Open-Meteo",url:"open-meteo.com",params:"Global weather API — temperature, wind, precipitation, humidity, solar radiation",update:"Hourly real-time + 16-day forecast",cost:"Free for non-commercial use",terrawatch:"Low-latency weather forcing for HAB Oracle and hypoxia model. No rate limits on standard usage."},
  ]},
  {cat:"🌱 Soil, Land & Ecology",color:"#86efac",sources:[
    {name:"NRCS SSURGO",url:"websoilsurvey.nrcs.usda.gov",params:"Soil series, hydric soil classification, drainage class, organic matter, bulk density",update:"Updated as surveys revised",cost:"Free — REST API + WFS",terrawatch:"WetlandAI hydric soil criterion. Peat subsidence carbon density. PFAS soil transport properties."},
    {name:"USGS NWI",url:"fws.gov/program/national-wetlands-inventory",params:"Wetland type, extent, Cowardin classification — nationwide polygon layer",update:"Updated periodically by FWS",cost:"Free — WFS/download",terrawatch:"WetlandAI prior probability layer. Starting point for preliminary delineation before Vexcel analysis."},
    {name:"FEMA FIRM",url:"msc.fema.gov",params:"100-yr and 500-yr flood zones, floodway, base flood elevation",update:"Updated as communities revise",cost:"Free — WMS/download",terrawatch:"WetlandAI wetland hydrology supporting evidence. Developer pre-screen flood risk layer in SITEVAULT."},
    {name:"NLCD",url:"mrlc.gov",params:"30m land use/land cover — urban, forest, agriculture, wetland, impervious surface",update:"Every 2–3 years",cost:"Free — download/WMS",terrawatch:"Nonpoint source attribution model land cover input. CAFO facility type inference prior."},
    {name:"iNaturalist API",url:"api.inaturalist.org",params:"200M+ species observations globally — location, date, photo, ID, quality grade",update:"Real-time as observers submit",cost:"Free — REST API",terrawatch:"Biodiversity crash EWS citizen science layer. Seagrass-dependent species decline signal."},
    {name:"GBIF",url:"api.gbif.org",params:"2.5B occurrence records — species, location, date from 2,000+ institutions",update:"Real-time as data published",cost:"Free — REST API",terrawatch:"Biodiversity EWS long-term baseline. Rare species occurrence for wetland habitat assessment."},
    {name:"eBird (Cornell Lab)",url:"api.ebird.org",params:"Bird occurrence by location — 100M+ observations, hotspot data, seasonal trends",update:"Real-time as observers submit",cost:"Free — API key required",terrawatch:"ALAN ecosystem disruption bird collision risk. Migratory flyway data for Gulf Coast ALAN mapping."},
  ]},
  {cat:"🏭 Regulatory & Compliance",color:"#f87171",sources:[
    {name:"EPA ECHO",url:"echo.epa.gov/tools/web-services",params:"NPDES permit compliance, inspection history, violations by facility",update:"Near real-time as EPA updates",cost:"Free — REST API",terrawatch:"Industrial compliance monitoring for tenant clients. PFAS facility attribution source list."},
    {name:"EPA TRI",url:"api.epa.gov/echo",params:"Annual chemical releases by facility — air, water, land, transfer",update:"Annual (data lags ~18 months)",cost:"Free — REST API",terrawatch:"Cross-media pollutant tracker source inventory. CAFO ammonia point source quantification."},
    {name:"EPA ATTAINS",url:"attains.epa.gov/attains-public/api",params:"Impaired water body assessments, 303(d) list, TMDLs by watershed",update:"Updated as states submit (biennial)",cost:"Free — REST API",terrawatch:"Regulatory context for TMDL support contracts. Dog River and Mobile Bay impairment documentation."},
    {name:"EPA PFAS Monitoring",url:"epa.gov/dwucmr",params:"PFAS occurrence at 70,000+ US water systems",update:"Periodic per monitoring rule",cost:"Free — download",terrawatch:"PFAS source attribution baseline. Drinking water intake risk scoring."},
    {name:"USACE Regulatory",url:"permits.ops.usace.army.mil",params:"Section 404/10 permit applications, JDs, mitigation banking locations",update:"Continuously as permits filed",cost:"Free — web service",terrawatch:"WetlandAI USACE permit context. Prior delineation data for sites being assessed."},
  ]},
  {cat:"🌊 Oceanographic & Coastal",color:"#38bdf8",sources:[
    {name:"NOAA CoastWatch",url:"coastwatch.pfeg.noaa.gov",params:"SST, chlorophyll-a, currents, sea surface height — near-real-time satellite-derived",update:"Daily near-real-time",cost:"Free — ERDDAP/OPeNDAP",terrawatch:"Gulf HAB surface chlorophyll monitoring layer. Hypoxia bottom-water forcing conditions."},
    {name:"HYCOM (NOAA Ocean Model)",url:"hycom.org",params:"3D ocean currents, temperature, salinity — global 1/12° hindcast + forecast",update:"Daily operational forecast",cost:"Free — OPeNDAP",terrawatch:"Saltwater intrusion advance warning coastal boundary. Cross-media ocean transport routing."},
    {name:"USGS StreamStats",url:"streamstats.usgs.gov/ss",params:"Watershed delineation, stream stats, flow frequency, drainage area by coordinate",update:"Static — updated with lidar",cost:"Free — REST API",terrawatch:"WetlandAI watershed boundary definition. Nonpoint source sub-catchment delineation."},
    {name:"NOAA Digital Coast",url:"coast.noaa.gov/dataviewer",params:"Coastal elevation, lidar, shoreline change, sea level rise scenarios",update:"Updated as surveys completed",cost:"Free",terrawatch:"Shoreline change detection supplement. Sea level rise scenarios for saltwater intrusion model."},
    {name:"NASA PACE OCI v3.1 ★ ACTIVE",url:"oceancolor.gsfc.nasa.gov",params:"Hyperspectral ocean color 340–890nm at 5nm resolution — 200+ spectral bands vs 13 in Sentinel-2. Daily global coverage. Auth: NASA_EARTHDATA_USER + NASA_EARTHDATA_PASS (saved in Replit). CMR query: https://cmr.earthdata.nasa.gov/search/granules.json, product PACE_OCI_L3M_CHL_NRT. v3.1 is current production version. Active in server/services/pace.js.",update:"Daily near-real-time (~3h latency, 1km resolution)",cost:"Free — NASA Earthdata registration required (done, credentials saved)",terrawatch:"★ WORLD FIRST: 588nm peridinin carotenoid absorption band = first satellite-based species-level Karenia brevis discrimination. Takes HAB Oracle from 7/13 to 9/13 active inputs when granule flow activated. Combined with CNN-LSTM Phase 3, extends forecast horizon to 8 days. NASA PACE OCI v3.1 coastal validation dataset is a candidate for the reference dataset for NASA post-PACE instrument planning."},
    {name:"NOAA HF Radar (CoSMO) ★ NEW",url:"hfrnet.ucsd.edu/api",params:"Real-time surface current vectors at 6km resolution, hourly update — coastal Gulf of Mexico coverage",update:"Hourly real-time",cost:"Free — HFRadarUS portal / IOOS ERDDAP",terrawatch:"★ NEW CAPABILITY: HAB bloom trajectory forecasting. Combines with HAB Oracle to predict where a detected bloom will travel — 'Reaches Weeks Bay shellfish operations in 14 hours at current surface currents.' Converts detection system into trajectory system."},
    {name:"AmeriFlux Network ★ NEW",url:"ameriflux.lbl.gov",params:"Eddy covariance CO₂ and CH₄ flux — continuous direct measurement at coastal wetland tower sites. Grand Bay NERRS tower operational.",update:"30-min averaged flux",cost:"Free for research — registration required",terrawatch:"★ BLUE CARBON BREAKTHROUGH: Direct marsh CO₂/CH₄ flux measurement for Verra-approvable MRV. Combines with Vexcel aerial biomass + DTM differencing to create first directly measured, species-resolved annual blue carbon MRV methodology."},
  ]},
  {cat:"🛰️ Copernicus openEO Algorithm Plaza — 8 Algorithms",color:"#10b981",sources:[
    {name:"BIOPAR — Biophysical Parameters",url:"dataspace.copernicus.eu",params:"LAI, FAPAR, FCOVER, Cab at 10m from Sentinel-2 L2A. ESA validated biophysical parameters. VITO provider. Token: POST identity.dataspace.copernicus.eu/.../token. API: openeo.dataspace.copernicus.eu/openeo/1.2",update:"On-demand batch job — any date range",cost:"Free — ~1,000 credits/mo (25% reduction applied March 2026). COPERNICUS_USER + COPERNICUS_PASS configured.",terrawatch:"★ Blue carbon MRV: LAI = primary Verra-defensible biomass input for Spartina alterniflora. First run via GET /api/sensors/openeo/biopar?days=365 establishes the baseline. NERRS ground truth confirms model accuracy."},
    {name:"CropSAR 2D — SAR+Optical Fusion",url:"dataspace.copernicus.eu",params:"Sentinel-1 SAR + Sentinel-2 optical fused at 10m daily. Cloud-free NDVI time series via radar. VITO provider.",update:"Daily cloud-free (SAR penetrates clouds)",cost:"Free — Copernicus CDSE credits",terrawatch:"★ CRITICAL: Solves Gulf Coast summer cloud blindness. Every summer HAB season, optical satellites are blocked by convective cloud. CropSAR delivers daily vegetation stress signal regardless. HAB Oracle vegetation stress input becomes cloud-independent."},
    {name:"EVI — Enhanced Vegetation Index",url:"dataspace.copernicus.eu",params:"10m Sentinel-2 EVI — more sensitive than NDVI in high-biomass coastal marsh. VITO provider.",update:"On-demand batch",cost:"Free — Copernicus CDSE credits",terrawatch:"Saltwater intrusion early detection. EVI stress in Spartina alterniflora appears 3–6 weeks before visible death. Feeds saltwater intrusion early warning product."},
    {name:"MSI — Moisture Stress Index",url:"dataspace.copernicus.eu",params:"20m Sentinel-2 B8A+B11 SWIR ratio — leaf water content. Most sensitive indicator of brine intrusion before EVI responds. VITO provider.",update:"On-demand batch",cost:"Free — Copernicus CDSE credits",terrawatch:"Earliest saltwater intrusion signal. Detects brine stress before EVI shows change. Combined with LoRaWAN soil conductivity for multi-method confirmation."},
    {name:"MOGPR — Gaussian Process Gap-Fill",url:"dataspace.copernicus.eu",params:"Multi-Output Gaussian Process Regression with uncertainty bounds. Fills cloud gaps in EVI/LAI time series. AI4FOOD provider.",update:"On-demand batch",cost:"Free — Copernicus CDSE credits",terrawatch:"Replaces linear interpolation for cloud gap-filling in HAB Oracle vegetation inputs. Uncertainty bounds enable confidence-weighted model features."},
    {name:"MOGPR S1 — SAR-Constrained Gap-Fill",url:"dataspace.copernicus.eu",params:"SAR radar as physical constraint during cloud periods. Preferred variant for daily EVI/LAI reconstruction. AI4FOOD provider.",update:"On-demand batch",cost:"Free — Copernicus CDSE credits",terrawatch:"Target implementation for PI-RNN satellite gap-filler in ML Architecture v2.0. Daily reconstructed vegetation signal with SAR constraint during cloud periods."},
    {name:"WorldCereal — Crop Type Map",url:"dataspace.copernicus.eu",params:"10m annual crop type classification — row crops vs pasture vs forest. Sentinel-1+2. ESA provider.",update:"Annual",cost:"Free — Copernicus CDSE credits",terrawatch:"Replaces NLCD 30m with 10m annual agricultural classification over the Mobile-Tensaw watershed. Identifies row crops (high nitrogen) vs pasture for CAFO nutrient loading attribution."},
    {name:"NBR — Normalized Burn Ratio",url:"dataspace.copernicus.eu",params:"20m Sentinel-2 B8A+B12 — post-fire/storm damage detection in vegetation. VITO provider.",update:"On-demand batch",cost:"Free — Copernicus CDSE credits",terrawatch:"Post-hurricane watershed damage assessment. After major storm, NBR identifies sub-watersheds with catastrophic vegetation loss driving nutrient pulse events and HAB risk elevation."},
  ]},
];

const PAID=[
  {cat:"🛰️ High-Frequency Satellite",color:"#f59e0b",sources:[
    {name:"Planet PlanetScope",url:"planet.com",params:"3m daily multispectral (8 bands), daily repeat, full archive from 2014",update:"Daily global",cost:"~$500–$3,000/mo AOI-based",priority:"HIGH — fills the temporal gap between Vexcel annual collects. Essential for real-time HAB surface monitoring.",terrawatch:"HAB bloom surface expression daily tracking. Turbidity plume monitoring. Nonpoint source pulse events."},
    {name:"Planet SkySat",url:"planet.com",params:"50cm optical, up to 10× daily revisit, tasking on demand",update:"Tasked on demand",cost:"~$10–$25/km² per tasking",priority:"MEDIUM — use for emergency event tasking when Vexcel On Demand timeline is too slow.",terrawatch:"HAB bloom confirmation backup when Vexcel On Demand 48h window too long. Post-storm rapid damage assessment."},
    {name:"Planet Tanager (Hyperspectral)",url:"planet.com",params:"400+ spectral bands, methane/CO₂ detection, vegetation species mapping",update:"Mission-based tasking",cost:"Enterprise — contact Planet",priority:"HIGH FUTURE — game-changing for CAFO methane and cyanobacteria phycocyanin discrimination at satellite scale.",terrawatch:"CAFO methane attribution. Cyanobacteria vs. green algae discrimination without Vexcel. Phase 3 capability."},
    {name:"Maxar WorldView-3",url:"maxar.com",params:"30cm optical, 8 multispectral bands, SWIR, 1-day revisit at mid-latitudes",update:"Tasked — 1 day revisit",cost:"~$15–$30/km² per image",priority:"LOW — Vexcel aerial is better resolution and cheaper for Gulf Coast. Use only for specific event documentation.",terrawatch:"Legal documentation quality imagery for PFAS source attribution litigation support."},
  ]},
  {cat:"✈️ Vexcel Aerial Products",color:"#818cf8",sources:[
    {name:"Vexcel Orthomosaic (7.5cm)",url:"vexceldata.com",params:"7.5cm top-down, urban areas 2–3× per year, pixel-aligned to all other products",update:"2–3x per year urban",cost:"~$800/mo Gulf Coast AOI (base license)",priority:"CORE — your primary high-resolution imagery layer. Already in budget.",terrawatch:"WetlandAI species mapping, shoreline change detection, blue carbon MRV, septic system detection."},
    {name:"Vexcel Oblique (7.5cm 5-angle)",url:"vexceldata.com",params:"4 cardinal angles + nadir at 7.5cm — virtual site tours, building context",update:"Annual urban refresh",cost:"Included in base license",priority:"CORE — SITEVAULT virtual site tours. The visual differentiator in the BCEDA demo.",terrawatch:"SITEVAULT industrial site virtual tours. HAB bloom 3D surface expression documentation."},
    {name:"Vexcel Multispectral (NIR + CIR)",url:"vexceldata.com",params:"NIR, CIR at 7.5–15cm — vegetation health, impervious surface, water quality signature",update:"Annual urban + On Demand",cost:"Included in base license or add-on",priority:"CORE — enables HAB confirmation, blue carbon species mapping, CAFO detection, wetland vegetation.",terrawatch:"HAB phycocyanin detection. Blue carbon saltmarsh species. WetlandAI hydrophytic vegetation."},
    {name:"Vexcel Elevate DSM/DTM",url:"vexceldata.com",params:"50cm DTM (bare earth) + DSM (surface) derived from aerial stereo imagery",update:"Annual urban",cost:"Add-on to base license",priority:"CORE — essential for WetlandAI hydrology, shoreline subsidence, stormwater routing.",terrawatch:"WetlandAI wetland hydrology criterion. Peat subsidence annual differencing. Stormwater routing."},
    {name:"Vexcel Elements AI",url:"vexceldata.com",params:"80+ AI-derived attributes — building type, roof material, road surface, vegetation, pools",update:"Annual with imagery refresh",cost:"Add-on to base license",priority:"HIGH — CAFO facility classification, synthetic turf detection, septic system screening, SITEVAULT.",terrawatch:"CAFO ammonia attribution facility inventory. Microplastic synthetic turf mapping. SITEVAULT building attributes."},
    {name:"Vexcel Gray Sky (Disaster)",url:"vexceldata.com",params:"Post-event 15cm imagery within 24–72h after hurricane, tornado, wildfire",update:"Event-triggered",cost:"Per-event — included in enterprise licenses",priority:"HIGH for BCEDA SITEVAULT — post-hurricane industrial site status is a major differentiator.",terrawatch:"SITEVAULT post-disaster site status. Insurance documentation for industrial clients."},
    {name:"Vexcel On Demand",url:"vexceldata.com",params:"Custom AOI collection at 7.5–15cm, 48–72h turnaround for event confirmation",update:"Event-triggered",cost:"~$500–$2,000 per collect",priority:"HIGH — HAB bloom confirmation, hypoxia event documentation, emergency event response.",terrawatch:"Automated trigger: HAB Oracle >80% → On Demand collect → bloom confirmation within 48h."},
  ]},
  {cat:"💧 Paid Environmental Data",color:"#22d3ee",sources:[
    {name:"BreezoMeter",url:"breezometer.com",params:"Street-level AQI, pollen, fire risk, health recommendations by address",update:"Hourly real-time",cost:"$200–$2,000/mo by API calls",priority:"LOW — AirNow + PurpleAir covers most use cases.",terrawatch:"Consumer-facing air quality for beach resort dashboard. Upscale from free AirNow."},
    {name:"Aquagenuity",url:"aquagenuity.com",params:"Drinking water quality database — utilities, contaminants, violations, treatment",update:"Near real-time as utilities report",cost:"$500–$2,000/mo",priority:"MEDIUM — cyanobacteria early warning product needs utility-specific treatment plant data.",terrawatch:"Cyanobacteria early warning — integrate with utility SCADA via Aquagenuity for intake monitoring."},
    {name:"Spire Maritime (AIS)",url:"spire.com/maritime",params:"AIS vessel tracking globally — position, speed, cargo, destination",update:"Real-time satellite AIS",cost:"$500–$3,000/mo",priority:"LOW — relevant for ship discharge source attribution.",terrawatch:"Nonpoint source attribution — vessel discharge events as mobile point sources in bay."},
  ]},
  {cat:"🧬 Paid Biological & Specialty",color:"#86efac",sources:[
    {name:"NatureServe Explorer API",url:"explorer.natureserve.org",params:"Species conservation status, detailed occurrence, habitat models, range maps",update:"Quarterly database updates",cost:"$1,000–$5,000/yr",priority:"MEDIUM — biodiversity crash EWS benefits from NatureServe G-ranks for threatened species.",terrawatch:"Biodiversity EWS species conservation status weighting. WetlandAI sensitive species screening."},
    {name:"Eurofins Lab Results",url:"eurofins.com",params:"Certified lab analysis — PFAS, metals, organics, bacteria per sample",update:"Per sample submission",cost:"$200–$2,000 per panel",priority:"HIGH for PFAS — lab-confirmed data is the legal standard for source attribution litigation.",terrawatch:"PFAS attribution — field samples from suspected source areas tied to TERRAWATCH model predictions."},
    {name:"Saildrone Ocean Data",url:"saildrone.com",params:"Autonomous surface vehicle — real-time ocean CO₂, temperature, salinity, wind",update:"Continuous real-time from deployed vehicles",cost:"Research partnerships / charter",priority:"MEDIUM FUTURE — Saildrone partnership for Gulf of Mexico hypoxia model validation.",terrawatch:"Phase 2–3 research partnership for Gulf hypoxia bottom-water oxygen validation."},
  ]},
  {cat:"🧬 Emerging Sensor Networks — Next Phase",color:"#a855f7",sources:[
    {name:"eDNA Auto-Samplers (MBARI ESP)",url:"mbari.org/technology/environmental-sample-processor",params:"Automated water collection, filtration, DNA extraction, and qPCR — detects species-specific eDNA every 4–8 hours autonomously. Targets: Karenia brevis, Microcystis, Perkinsus marinus (Dermo), Haplosporidium nelsoni (MSX), Asian carp.",update:"Every 4–8 hours autonomous",cost:"$50K–$150K hardware + lab partnership. Commercial equivalents ~$15K–$30K.",priority:"HIGH — HAB species detection before optical visibility. Oyster pathogen (Dermo/MSX) early warning. World First.",terrawatch:"Detects HAB-forming species in water column days before satellite or visual confirmation. Monitors oyster pathogens in bay water before farm mortality. Invasive species early detection. Pairs with PACE for multi-method HAB species attribution."},
    {name:"SoundTrap / Hydrophone Array (PAM)",url:"oceaninstruments.co.nz",params:"Passive acoustic recorder — 20Hz to 150kHz. Detects fish spawning choruses (black drum, redfish, toadfish), vessel noise, marine mammal presence. ML classifier identifies species from acoustic signatures.",update:"Continuous — 4TB storage per deployment",cost:"$2,000–$3,500 per unit. Deploy 3–5 in Mobile Bay.",priority:"HIGH — World First spawning condition forecast. Acoustic ecosystem health index. Vessel noise impact monitoring.",terrawatch:"Real-time fish spawning activity correlated with DO₂, temperature, HAB probability, and salinity. First spawning condition forecast for Mobile Bay commercial species. Detects acoustic ecosystem stress before water chemistry changes are measurable."},
    {name:"LoRaWAN Soil Conductivity Network",url:"dragino.com / seeedstudio.com",params:"Soil pore water electrical conductivity at 15-min intervals via LoRaWAN (5–25km range). Detects saltwater advance front in coastal agricultural soils 4–8 weeks before plant damage threshold.",update:"Every 15 minutes",cost:"$200–$300 per node. 15-node transect = $3,000–$4,500 total.",priority:"HIGH VALUE / LOW COST — 4–8 week saltwater intrusion advance warning. Direct farm-level subscription revenue.",terrawatch:"First continuously measured, farm-level saltwater intrusion early warning network. Combines with NOAA CO-OPS tidal data and Tempest precipitation for predictive saltwater advance modeling."},
    {name:"MS4 Stormwater IoT Sensors",url:"campbell-sci.com / in-situ.com",params:"Continuous turbidity, conductivity, nitrate, temperature, and flow measurement at stormwater outfalls. LoRaWAN or cellular connectivity. Every storm event measured in real time.",update:"Continuous — event-triggered high-rate logging",cost:"$800–$2,000 per node. 30-node network = $24,000–$60,000.",priority:"HIGH — converts nonpoint source model from inferential to empirical. EPA TMDL datasets. Municipal NPDES compliance revenue.",terrawatch:"First real-time, spatially distributed nonpoint source loading measurement network on the Gulf Coast. Each storm event directly measured at sub-catchment boundary. Pairs with Osprey Litter Gitter for complete source-to-mouth pollutant tracking."},
    {name:"Wastewater Epidemiology Sampling (WBE)",url:"mawss.com (via partnership)",params:"WWTP influent composite sampling analyzed for brevetoxin metabolites, antibiotic resistance genes (ARGs), cyanotoxins, PFAS, and viral pathogens. Near-real-time via qPCR.",update:"Daily composite — near real-time qPCR",cost:"Partnership with MAWSS + USA lab. $20K–$50K/yr analytical costs.",priority:"HIGH IMPACT — World First HAB exposure correlation. One Health bridge between environmental events and human population health data.",terrawatch:"Brevetoxin metabolites in wastewater confirm actual human shellfish consumption during HAB events. AMR genes correlate CAFO runoff to downstream community antibiotic resistance burden. First environmental intelligence system to bridge ecosystem health with population-level human health data."},
  ]},
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function MasterRoadmap(){
  const [tab,setTab]=useState(0);
  const [activePhase,setActivePhase]=useState("now");
  const [openStream,setOpenStream]=useState(null);
  const [openSci,setOpenSci]=useState(null);
  const [dsView,setDsView]=useState("free");
  const [dsFilter,setDsFilter]=useState("all");

  const phase=PHASES.find(p=>p.id===activePhase)||PHASES[0];

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cabinet+Grotesk:wght@400;500;700;800&family=Fira+Code:wght@400;500&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500;700&display=swap');
        .roadmap-root ::selection{background:#0a9e8022;color:#0a3d2b}
        @keyframes roadmap-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes roadmap-pulse{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes roadmap-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>

      <div className="roadmap-root" style={{background:C.bg,color:C.text,
        fontFamily:"'Cabinet Grotesk',sans-serif",minHeight:"100%"}}>

        <div style={{borderBottom:`1px solid ${C.border}`,background:`rgba(245,251,248,0.95)`,
          backdropFilter:"blur(12px)",boxShadow:"0 1px 0 #cce4d8,0 2px 12px rgba(10,158,128,0.06)",padding:"0 20px",position:"sticky",top:0,zIndex:200}}>
          <div style={{display:"flex",alignItems:"center",gap:14,height:50}}>
            <div>
              <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",fontFamily:"'Fira Code',monospace"}}>
                TERRAWATCH · HANSEN HOLDINGS
              </div>
              <div style={{fontSize:14,fontWeight:800,color:C.ink,lineHeight:1}}>Master Roadmap</div>
            </div>
            <div style={{width:1,height:28,background:C.border}}/>
            <div style={{display:"flex",gap:0,flex:1,overflowX:"auto"}}>
              {TABS.map((t,i)=>(
                <button key={t} onClick={()=>setTab(i)} style={{
                  background:"none",border:"none",
                  borderBottom:`2px solid ${tab===i?C.t1:"transparent"}`,
                  color:tab===i?C.t1:C.muted,
                  padding:"0 12px",height:50,fontSize:10,fontWeight:tab===i?700:400,
                  cursor:"pointer",flexShrink:0,whiteSpace:"nowrap",transition:"all 0.15s",
                }}>{t}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <Tag color={C.now}>● ACTIVE</Tag>
              <Tag color={C.t2}>Hatch Pending</Tag>
            </div>
          </div>
        </div>

        <div style={{padding:"22px 24px 60px"}}>

          {/* ══════════ TAB 0: VISION ══════════ */}
          {tab===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:0}}>

              {/* MANIFESTO HERO */}
              <div style={{background:`linear-gradient(160deg,#0a3d2b 0%,#0d5c3e 40%,#0a3d2b 100%)`,
                borderRadius:10,padding:"60px 50px",marginBottom:16,position:"relative",overflow:"hidden",
                border:`1px solid #00c4a022`}}>

                {/* Background grid */}
                <div style={{position:"absolute",inset:0,opacity:0.04,
                  backgroundImage:`linear-gradient(#00c4a0 1px,transparent 1px),linear-gradient(90deg,#00c4a0 1px,transparent 1px)`,
                  backgroundSize:"40px 40px"}}/>

                {/* Glows */}
                <div style={{position:"absolute",top:"20%",left:"10%",width:400,height:400,
                  borderRadius:"50%",background:"radial-gradient(circle,#00c4a010,transparent 70%)",pointerEvents:"none"}}/>
                <div style={{position:"absolute",bottom:"10%",right:"5%",width:300,height:300,
                  borderRadius:"50%",background:"radial-gradient(circle,#3b82f608,transparent 70%)",pointerEvents:"none"}}/>

                <div style={{position:"relative",maxWidth:900,margin:"0 auto",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#00c4a0",letterSpacing:"0.4em",marginBottom:20,
                    fontFamily:"'Fira Code',monospace"}}>
                    TERRAWATCH · HANSEN HOLDINGS · FAIRHOPE, ALABAMA
                  </div>

                  <h1 style={{fontFamily:"'Fira Code',monospace",fontSize:13,color:"#00c4a0",
                    letterSpacing:"0.2em",marginBottom:24,fontWeight:400}}>
                    MISSION STATEMENT
                  </h1>

                  <div style={{fontSize:28,fontWeight:800,color:C.ink,lineHeight:1.3,
                    marginBottom:30,letterSpacing:"-0.3px"}}>
                    Give the world eyes on its coastal ecosystems —<br/>
                    <span style={{color:"#00c4a0"}}>so the people who depend on them</span><br/>
                    can act before it's too late.
                  </div>

                  <div style={{width:80,height:2,background:"linear-gradient(90deg,transparent,#00c4a0,transparent)",
                    margin:"0 auto 30px"}}/>

                  <p style={{fontSize:14,color:C.muted,lineHeight:2,maxWidth:700,margin:"0 auto 40px",
                    fontStyle:"italic",fontWeight:300}}>
                    "TERRAWATCH isn't an environmental monitoring app. It's the beginning of a
                    planetary nervous system for coastal and estuarine environments — a system
                    that senses, integrates, predicts, and acts on environmental signals faster
                    and at higher resolution than any government agency, research institution,
                    or private company has ever done before."
                  </p>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,
                    maxWidth:700,margin:"0 auto"}}>
                    {[
                      {n:"51+",l:"Active data feeds — satellites,\nsensors, models, APIs"},
                      {n:"15",l:"World Firsts — capabilities\nthat exist nowhere else"},
                      {n:"∞",l:"Compounding value — each\ncapability strengthens all others"},
                    ].map(({n,l})=>(
                      <div key={n} style={{borderTop:"1px solid #00c4a033",paddingTop:16}}>
                        <div style={{fontSize:36,fontWeight:800,color:"#00c4a0",
                          fontFamily:"'Fira Code',monospace",lineHeight:1}}>{n}</div>
                        <div style={{fontSize:10,color:"#4a6a80",marginTop:6,
                          lineHeight:1.6,whiteSpace:"pre-line"}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* THE VILLAIN */}
              <div style={{background:C.panel,border:`1px solid #f4383022`,borderRadius:10,
                padding:"32px 40px",marginBottom:16,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:3,
                  background:"linear-gradient(90deg,#f43830,transparent)"}}/>
                <div style={{maxWidth:900,margin:"0 auto"}}>
                  <div style={{fontSize:9,color:"#f43830",letterSpacing:"0.3em",marginBottom:12,
                    fontFamily:"'Fira Code',monospace"}}>THE ENEMY WE'RE FIGHTING</div>
                  <h2 style={{fontSize:26,fontWeight:800,color:C.ink,marginBottom:16,lineHeight:1.2}}>
                    Environmental blindness.
                  </h2>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.95,maxWidth:800}}>
                    The data exists. The satellites are overhead. The sensors are in the water.
                    The government agencies have been collecting feeds for decades. The science is
                    understood. The world is not flying blind because the information doesn't exist —
                    it's flying blind because nobody has unified it, normalized it, fused it with
                    machine learning, and acted on it autonomously at the speed environmental
                    events actually happen.
                  </p>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.95,maxWidth:800,marginTop:12}}>
                    That blindness has a body count. HAB closures that destroy livelihoods because
                    the warning came 8 hours too late. Fish kills that happen overnight because no
                    system detected the DO₂ crash. Wetlands destroyed by developers who didn't know
                    they were there. PFAS-contaminated wells in low-income communities with no legal
                    recourse because nobody could prove the source. Coastal carbon that could be
                    sequestering gigatons of CO₂ sitting unmonitored and unverified because the
                    measurement tools don't exist at a price anyone can pay.
                  </p>
                  <p style={{fontSize:14,color:C.ink,lineHeight:1.85,maxWidth:800,marginTop:16,
                    fontWeight:600}}>
                    TERRAWATCH ends the blindness. One estuary at a time, starting with Mobile Bay.
                  </p>
                </div>
              </div>

              {/* THE COMPOUNDING BODY */}
              <div style={{background:C.panel,border:`1px solid #00c4a022`,borderRadius:10,
                padding:"32px 40px",marginBottom:16}}>
                <div style={{maxWidth:900,margin:"0 auto"}}>
                  <div style={{fontSize:9,color:"#00c4a0",letterSpacing:"0.3em",marginBottom:12,
                    fontFamily:"'Fira Code',monospace"}}>THE COMPOUNDING PLATFORM</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:16}}>
                    51+ capabilities. Not 51 products — 51 sensors on the same body.
                  </h2>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.95,marginBottom:20,maxWidth:820}}>
                    The HAB Oracle makes the blue carbon MRV more fundable. The blue carbon MRV
                    makes the shoreline change detection more commercially valuable. The Osprey
                    microplastic fusion makes the nonpoint source attribution more defensible. The
                    cross-media tracker makes the PFAS litigation tool more accurate. Every
                    capability strengthens every other capability. That compounding is the thing
                    that has no ceiling — and it's the moat that no competitor can close once
                    TERRAWATCH has 3–5 years of validated predictions in the field.
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                    {[
                      {from:"HAB Oracle predicts a bloom",to:"→ On Demand aerial collects confirmation imagery → Shellfish managers alerted 72h early → Closure avoided → Revenue protected → Trust earned → Subscription renewed"},
                      {from:"Shoreline change detected annually",to:"→ Elevation model confirms subsidence → Blue carbon MRV validates saltmarsh loss → Carbon credit project initiated → Conservation funding flows → Marsh preserved"},
                      {from:"Stormwater pulse detected",to:"→ Litter Gitter confirms microplastic composition → Aerial imagery identifies source intersections → City targets BMPs precisely → Downstream oyster farms protected → TERRAWATCH renews"},
                    ].map(({from,to},i)=>(
                      <div key={i} style={{background:C.surface,borderRadius:8,padding:"14px 16px",
                        border:"1px solid #00c4a018",borderTop:"2px solid #00c4a0"}}>
                        <div style={{fontSize:11,color:"#00c4a0",fontWeight:700,marginBottom:8,
                          lineHeight:1.4}}>{from}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.85}}>{to}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* HORIZON CARDS */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                {[
                  {
                    label:"5-Year Horizon",sublabel:"The Infrastructure Play",
                    color:"#f59e0b",
                    body:"The HAB Oracle will have 5+ years of validated predictions no competitor can replicate. SITEVAULT will be deployed in 15–30 EDA markets nationally. Blue carbon MRV will be processing verification for hundreds of thousands of acres. Once a government agency builds their response protocol on your prediction, you are no longer software. You are infrastructure. Infrastructure doesn't get replaced. It gets funded.",
                    stat:"$50M–$150M ARR",statNote:"Revenue ceiling at Year 5",
                  },
                  {
                    label:"10-Year Horizon",sublabel:"The Global Intelligence Layer",
                    color:"#a855f7",
                    body:"The platform architecture is geography-agnostic. Models trained on Mobile Bay translate — with calibration — to Chesapeake Bay, the Yangtze Delta, the Bay of Bengal, the Dutch Wadden Sea, the mangroves of Borneo. Climate change is TERRAWATCH's tailwind, not its headwind. Every trend TERRAWATCH monitors is getting worse — and the people responsible for managing those problems desperately need better tools.",
                    stat:"$500M–$2B ARR",statNote:"Public company or major acquisition target",
                  },
                  {
                    label:"20-Year Vision",sublabel:"The Bloomberg Terminal of Planetary Environmental Health",
                    color:"#00c4a0",
                    body:"Bloomberg built a business by aggregating financial data that existed in scattered, incompatible systems, normalizing it, adding analytical intelligence, and selling access to the unified layer. Every financial decision of consequence now runs through Bloomberg infrastructure. The environmental data landscape is exactly where financial data was in 1980. TERRAWATCH is building that unified layer for environmental data — starting coastal, expanding until every environmental decision of consequence runs through it.",
                    stat:"Infrastructure",statNote:"Not a product. The standard.",
                  },
                ].map(h=>(
                  <div key={h.label} style={{background:C.panel,border:`1px solid ${h.color}33`,
                    borderRadius:10,padding:"24px 22px",borderTop:`3px solid ${h.color}`}}>
                    <div style={{fontSize:9,color:h.color,letterSpacing:"0.2em",marginBottom:4,
                      fontFamily:"'Fira Code',monospace"}}>{h.label.toUpperCase()}</div>
                    <div style={{fontSize:15,fontWeight:800,color:C.ink,marginBottom:12,lineHeight:1.3}}>
                      {h.sublabel}
                    </div>
                    <p style={{fontSize:11,color:C.muted,lineHeight:1.85,marginBottom:16}}>{h.body}</p>
                    <div style={{borderTop:`1px solid ${h.color}33`,paddingTop:12}}>
                      <div style={{fontSize:22,fontWeight:800,color:h.color,
                        fontFamily:"'Fira Code',monospace"}}>{h.stat}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:3}}>{h.statNote}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GLOBAL IMPACT — THE BODY COUNT WE PREVENT */}
              <div style={{background:C.panel,border:`1px solid #22c55e22`,borderRadius:10,
                padding:"32px 40px",marginBottom:16}}>
                <div style={{maxWidth:900,margin:"0 auto"}}>
                  <div style={{fontSize:9,color:"#22c55e",letterSpacing:"0.3em",marginBottom:12,
                    fontFamily:"'Fira Code',monospace"}}>THE GLOBAL IMPACT — WHAT THIS ACTUALLY PREVENTS</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:20}}>
                    Set aside the revenue. Ask what this prevents.
                  </h2>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    {[
                      {
                        icon:"🦪",title:"HAB Illness and Death",color:"#f43830",
                        scale:"60,000–80,000 illnesses/yr in the US alone. Hundreds of thousands globally, including fatalities in developing countries with no monitoring infrastructure.",
                        impact:"A validated, globally-deployed HAB early warning system built on the Mobile Bay methodology protects the coastal fishing economies that feed hundreds of millions of people in Southeast Asia, West Africa, and Latin America from event-driven collapses.",
                        human:"A shrimper in Bayou La Batre keeps his harvest. A child in Bangladesh doesn't eat poisoned shellfish. A Filipino fishing village gets 72 hours of warning instead of none.",
                      },
                      {
                        icon:"🌿",title:"Blue Carbon at Climate Scale",color:"#22c55e",
                        scale:"15M hectares of saltmarsh + 15M hectares of mangrove + 600,000 km² of seagrass — currently unmonitored, unverified, and unprotected by carbon markets because affordable MRV doesn't exist.",
                        impact:"TERRAWATCH's aerial MRV makes blue carbon projects economically viable globally. The resulting preservation could represent 1–2 gigatons of CO₂ equivalent per year in sequestration.",
                        human:"Equivalent to taking 200–400 million cars off the road — annually — from coastal wetlands preserved for the cost of a software subscription.",
                      },
                      {
                        icon:"⚗️",title:"PFAS Justice",color:"#3b82f6",
                        scale:"40,000+ PFAS-contaminated sites in the US alone, disproportionately in low-income and rural communities that lack resources to commission $500,000+ attribution studies.",
                        impact:"A TERRAWATCH PFAS attribution methodology at $25,000–$75,000 per watershed makes environmental justice accessible to communities that currently have no legal recourse. Scaled internationally — PFAS is a global crisis.",
                        human:"A family in rural Alabama proves where their well contamination came from. A community in Germany traces PFAS to its airport. Justice that was previously only available to the wealthy becomes accessible to everyone.",
                      },
                      {
                        icon:"🌊",title:"Wetland Preservation at Development Scale",color:"#a855f7",
                        scale:"35% of the world's wetlands have been lost since 1970. A primary driver: developers and governments don't know what they're destroying until after the fact.",
                        impact:"WetlandAI deployed globally, at a cost that makes screening affordable for every development project, could meaningfully slow global wetland loss rates. Even a 10% reduction represents millions of acres of preserved habitat annually.",
                        human:"A subdivision in Baldwin County doesn't destroy a critical fishery nursery. An industrial project in Malaysia identifies wetland boundaries before the first bulldozer moves.",
                      },
                      {
                        icon:"🔴",title:"Microplastic Source Control",color:"#f59e0b",
                        scale:"Nobody currently knows which specific road intersections, synthetic turf fields, and industrial facilities generate the majority of microplastic loading in any given watershed. Without source attribution, intervention is impossible.",
                        impact:"TERRAWATCH's microplastic source model — validated by Osprey's Litter Gitter ground-truth data — becomes the global standard for microplastic source mapping, enabling the regulatory frameworks and product substitution mandates that actually move the needle.",
                        human:"A city in California can tell its tire manufacturers exactly which intersections are contributing the most. A municipality in Japan can prove which synthetic turf field is contaminating its estuary.",
                      },
                      {
                        icon:"🏘️",title:"Environmental Justice Infrastructure",color:"#00c4a0",
                        scale:"Environmental monitoring has historically been affordable only for governments, large research institutions, and well-funded environmental groups. The communities most affected by environmental degradation are the ones with the fewest monitoring tools.",
                        impact:"TERRAWATCH democratizes environmental intelligence. A $299/mo subscription gives a rural health department, a fishing cooperative, or a citizen advocacy group the same predictive capability previously available only to well-funded agencies with entire data science teams.",
                        human:"The tools of environmental protection should not be exclusive to the wealthy. That's the most important thing TERRAWATCH could become.",
                      },
                    ].map(item=>(
                      <div key={item.title} style={{background:C.surface,borderRadius:9,
                        padding:"18px 20px",border:`1px solid ${item.color}22`,
                        borderLeft:`3px solid ${item.color}`}}>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                          <span style={{fontSize:22,flexShrink:0}}>{item.icon}</span>
                          <div style={{fontSize:14,color:item.color,fontWeight:800,lineHeight:1.2}}>{item.title}</div>
                        </div>
                        <div style={{fontSize:10,color:"#4a6a80",lineHeight:1.7,marginBottom:8,
                          borderLeft:`2px solid ${item.color}33`,paddingLeft:10}}>
                          <strong style={{color:C.muted}}>Scale of problem: </strong>{item.scale}
                        </div>
                        <div style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:8}}>{item.impact}</div>
                        <div style={{padding:"8px 10px",background:`${item.color}0f`,
                          borderRadius:5,border:`1px solid ${item.color}22`,
                          fontSize:10,color:item.color,lineHeight:1.7,fontStyle:"italic"}}>
                          {item.human}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* THE ORIGIN STORY */}
              <div style={{background:C.panel,border:`1px solid #f59e0b22`,borderRadius:10,
                padding:"32px 40px",marginBottom:16}}>
                <div style={{maxWidth:820,margin:"0 auto"}}>
                  <div style={{fontSize:9,color:"#f59e0b",letterSpacing:"0.3em",marginBottom:12,
                    fontFamily:"'Fira Code',monospace"}}>THE ORIGIN</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:16}}>
                    From Fairhope, Alabama. To the world.
                  </h2>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.95,marginBottom:14}}>
                    The planetary nervous system for coastal environments is being built not in Silicon Valley,
                    not in a university lab with a nine-figure endowment, but on the Gulf Coast of Alabama —
                    by a founder who lives 12 minutes from Weeks Bay, who has watched Mobile Bay's shellfish
                    industry operate without an advance warning system for decades, and whose partner programs
                    the software that powers the only in-stream litter monitoring network in Alabama.
                  </p>
                  <p style={{fontSize:13,color:C.muted,lineHeight:1.95,marginBottom:14}}>
                    That proximity is not incidental. The best environmental intelligence platforms will be
                    built by people who understand what's at stake at ground level — who know the names of
                    the oyster farmers, who have stood on the Weeks Bay boardwalk and watched the water,
                    who understand that a HAB closure in July means a family doesn't make their boat payment
                    in August. The Gulf Coast is not a test market. It is the proving ground.
                  </p>
                  <p style={{fontSize:13,color:C.ink,lineHeight:1.95,fontWeight:600}}>
                    If it works here — in one of the most ecologically complex, economically vulnerable,
                    and data-rich coastal systems in North America — it works everywhere.
                  </p>
                </div>
              </div>

              {/* THE HONEST URGENCY */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,
                border:`1px solid #00c4a033`,borderRadius:10,padding:"40px 50px",
                position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,opacity:0.03,
                  backgroundImage:`radial-gradient(#00c4a0 1px,transparent 1px)`,
                  backgroundSize:"20px 20px"}}/>
                <div style={{maxWidth:800,margin:"0 auto",position:"relative",textAlign:"center"}}>
                  <div style={{fontSize:9,color:"#00c4a0",letterSpacing:"0.3em",marginBottom:20,
                    fontFamily:"'Fira Code',monospace"}}>THE HONEST CONSTRAINT · THE URGENT WINDOW</div>
                  <blockquote style={{fontSize:18,color:C.white,lineHeight:1.8,fontStyle:"italic",
                    fontWeight:300,marginBottom:24}}>
                    "The ideas are right. The timing is right — climate change, regulatory pressure on
                    PFAS and blue carbon, the maturation of ML and aerial imagery, the open data
                    infrastructure — all of these are conspiring in TERRAWATCH's favor simultaneously
                    in a way that won't last forever. Someone else will eventually build this.
                    The question is whether it's you."
                  </blockquote>
                  <div style={{fontSize:13,color:"#8aaabf",lineHeight:1.9,marginBottom:24}}>
                    The scientist meeting this week isn't small.<br/>
                    The Hatch application isn't administrative.<br/>
                    The call to Double D Oyster isn't a sales call.
                  </div>
                  <div style={{fontSize:16,color:"#00c4a0",fontWeight:800,letterSpacing:"0.05em"}}>
                    Every action in the next 24 months is a step on a straight line<br/>
                    from Mobile Bay to a healthier planet.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 1: ROADMAP ══════════ */}
          {tab===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`1px solid ${C.t1}44`,borderRadius:10,padding:"24px 30px",
                borderLeft:`4px solid ${C.t1}`}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:8,fontFamily:"'Fira Code',monospace"}}>
                  3-YEAR MASTER ROADMAP · TERRAWATCH + SITEVAULT + WETLANDAI
                </div>
                <h1 style={{fontSize:28,fontWeight:800,color:C.ink,marginBottom:10,lineHeight:1.15}}>
                  From staff scientist meeting<br/>
                  <span style={{color:C.t1}}>to $1M+ ARR in 36 months</span>
                </h1>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:800,marginBottom:18}}>
                  Three parallel development tracks — TERRAWATCH environmental intelligence, SITEVAULT industrial site intelligence for BCEDA, and WetlandAI remote delineation — sharing one Vexcel imagery license and one operational infrastructure funded by Hatch Fairhope. Every action in the next 7 days compounds into every outcome over the next 36 months.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {l:"Year 1 Target ARR",v:"$102K",c:C.q2},
                    {l:"Year 2 Target ARR",v:"$1.1M",c:C.y2},
                    {l:"Year 3 Target ARR",v:"$5.2M",c:C.y3},
                    {l:"Operating Grant Ask",v:"$36K",c:C.t2},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:C.dim,borderRadius:7,padding:"12px 16px"}}>
                      <div style={{fontSize:9,color:C.muted,marginBottom:4}}>{l}</div>
                      <div style={{fontSize:26,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace"}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Three tracks overview */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {name:"TERRAWATCH",sub:"Environmental Intelligence SaaS",color:C.t4,icon:"🌊",
                    bullets:["51+ active data feeds unified — NASA, NOAA, EPA, ESA, PurpleAir, eBird","HAB Oracle, Hypoxia Forecaster, 10 New Frontiers","Phase 1+2+3 ML Intelligence Engine architecture deployed","Science View, Feed Status, Dashboard — all 51+ sources wired","$36K Hatch grant → operating runway","NOAA Sea Grant $300K in pipeline"]},
                  {name:"SITEVAULT",sub:"BCEDA Industrial Site Intelligence",color:C.t3,icon:"🏭",
                    bullets:["Vexcel oblique virtual tours + DTM cost modeling","Environmental pre-screen for industrial sites","BCEDA warm intro via Hatch co-funding relationship","$60K/yr anchor contract target","Statewide Alabama EDA expansion path"]},
                  {name:"WETLANDAI",sub:"Remote Wetland Delineation",color:C.t5,icon:"🌿",
                    bullets:["80–92% accurate preliminary delineation","Shares Vexcel imagery at zero marginal data cost","Target: consulting firms, ALDOT, USACE Mobile District","$200K–$500K USACE government contract potential","WetlandAI integrated into SITEVAULT site pre-screen"]},
                ].map(p=>(
                  <div key={p.name} style={{background:C.panel,border:`1px solid ${p.color}44`,
                    borderRadius:9,padding:"18px 20px",borderTop:`3px solid ${p.color}`}}>
                    <div style={{fontSize:20,marginBottom:10}}>{p.icon}</div>
                    <div style={{fontSize:15,color:p.color,fontWeight:800,marginBottom:3}}>{p.name}</div>
                    <div style={{fontSize:10,color:C.muted,marginBottom:12}}>{p.sub}</div>
                    {p.bullets.map(b=>(
                      <div key={b} style={{display:"flex",gap:8,padding:"5px 0",
                        borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                        <span style={{color:p.color,flexShrink:0}}>→</span>{b}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Interactive timeline */}
              <div style={{display:"grid",gridTemplateColumns:"200px 1fr",gap:14,alignItems:"start"}}>
                {/* Phase selector */}
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{fontSize:9,color:C.muted,letterSpacing:"0.14em",marginBottom:4,
                    fontFamily:"'Fira Code',monospace"}}>SELECT PHASE</div>
                  {PHASES.map(p=>(
                    <PhaseBar key={p.id} phase={p} isActive={activePhase===p.id}
                      onClick={()=>setActivePhase(p.id)}/>
                  ))}
                </div>

                {/* Phase detail */}
                {phase&&(
                  <div style={{background:C.panel,border:`1px solid ${phase.color}55`,
                    borderRadius:9,padding:"22px 24px",animation:"roadmap-in 0.2s ease"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                      <div style={{width:12,height:12,borderRadius:"50%",background:phase.color,
                        animation:activePhase==="now"?"roadmap-pulse 2s infinite":"none"}}/>
                      <div>
                        <div style={{fontSize:16,color:phase.color,fontWeight:800}}>{phase.label}</div>
                        <div style={{fontSize:10,color:C.muted,fontFamily:"'Fira Code',monospace"}}>{phase.sublabel}</div>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      {phase.milestones.map((m,i)=>(
                        <div key={i} style={{display:"flex",gap:10,padding:"12px 14px",
                          background:`${TRACK_COLORS[m.track]||C.t1}0a`,
                          border:`1px solid ${TRACK_COLORS[m.track]||C.t1}33`,
                          borderRadius:7}}>
                          <div style={{width:3,background:TRACK_COLORS[m.track]||C.t1,
                            borderRadius:2,flexShrink:0}}/>
                          <div>
                            <div style={{fontSize:9,color:TRACK_COLORS[m.track]||C.t1,
                              fontWeight:700,marginBottom:4,letterSpacing:"0.08em"}}>{m.track.toUpperCase()}</div>
                            <div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{m.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: BUILD PROGRESS ══════════ */}
          {tab===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`1px solid ${C.t1}44`,borderRadius:10,padding:"24px 30px",
                borderLeft:`4px solid ${C.t1}`}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:8,fontFamily:"'Fira Code',monospace"}}>
                  TERRAWATCH v2.0 · BUILD STATUS · MARCH 2026
                </div>
                <h1 style={{fontSize:26,fontWeight:800,color:C.ink,marginBottom:10,lineHeight:1.15}}>
                  Platform build progress —
                  <span style={{color:C.t1}}> what's live, what's active, what's planned</span>
                </h1>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:800}}>
                  Real-time status of every completed development milestone, every active data feed, and every API integration. This is the engineering truth — not the pitch deck. Every item marked LIVE is serving data right now.
                </p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                {[
                  {l:"Active Data Feeds",v:"51+",c:C.t1},
                  {l:"API Endpoints Built",v:"25+",c:C.t3},
                  {l:"Server Services",v:"12",c:C.t4},
                  {l:"ML Engine Phases",v:"3",c:"#a855f7"},
                ].map(({l,v,c})=>(
                  <div key={l} style={{background:C.dim,borderRadius:7,padding:"12px 16px"}}>
                    <div style={{fontSize:26,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace"}}>{v}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{background:C.panel,border:`1px solid #22c55e44`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid #22c55e`}}>
                <div style={{fontSize:12,color:"#22c55e",fontWeight:800,marginBottom:14}}>
                  COMPLETED MILESTONES
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {task:"TERRAWATCH v2.0 Core Platform",detail:"React/Vite frontend + Express.js backend deployed on Replit. Full SPA with Dashboard, Science View, Feed Status, Roadmap pages.",status:"LIVE",color:"#22c55e"},
                    {task:"51+ Data Feed Integration",detail:"NASA (PACE, MODIS, VIIRS, HLS), NOAA (CO-OPS, NWS, NDBC, CoastWatch, HF Radar, GOES-19), EPA (AQS, ECHO, TRI, ATTAINS, WQP), ESA Copernicus (Sentinel-2, TROPOMI, openEO 8 algorithms), PurpleAir 13 sensors, eBird, iNaturalist, GBIF, Open-Meteo — all wired into unified API layer.",status:"LIVE",color:"#22c55e"},
                    {task:"Science View — Full 51+ Source Display",detail:"All data sources rendered with live readings. NERRS section shows CDMO OFFLINE badge when API down. PurpleAir 13-sensor grid with individual PM2.5/humidity/temp. GOES-19 imagery streaming. Ocean/Land/Regulatory sections with all sources visible.",status:"LIVE",color:"#22c55e"},
                    {task:"Feed Status Mission Control",detail:"Real-time health status for every API connection. Green/yellow/red indicators. Auto-refresh with last-checked timestamps.",status:"LIVE",color:"#22c55e"},
                    {task:"Intelligence Engine Phase 0 → 3 Architecture",detail:"Self-labeling training pipeline. Phase 0 (heuristic) active. Phase 1 triggers at 100 samples (logistic regression). Phase 2 at 500 (enhanced). Phase 3 at 2,000 (CNN-LSTM via Vertex AI).",status:"LIVE",color:"#22c55e"},
                    {task:"HAB Oracle 13-Input Fusion Model",detail:"Multi-source HAB probability: USGS flow, NERRS ChlFluor, NOAA SST, PACE OCI, Sentinel-2 NDCI, GOES-19 QPE/SST/bloom index, Open-Meteo wind/temp, HF Radar currents, TROPOMI aerosol.",status:"LIVE",color:"#22c55e"},
                    {task:"GOES-19 Ground Station Push API",detail:"POST /api/goes19/ingest endpoint. Accepts scalar JSON extractions every 5 min. 18 ML features. X-API-Key auth. Postman collection published. GOES-19 imagery streaming via NOAA STAR CDN.",status:"LIVE",color:"#22c55e"},
                    {task:"PurpleAir Integration — 13 Mobile Bay Sensors",detail:"Real-time PM2.5, humidity, temperature from 13 hyperlocal sensors. Individual sensor grid in Science View. Average PM2.5 calculation with null/NaN filtering. Fallback for AirNow when unavailable.",status:"LIVE",color:"#22c55e"},
                    {task:"Open-Meteo Weather Integration",detail:"Current conditions + 7-day forecast. Temperature, wind speed/direction, CAPE, precipitation. No API key required. Primary weather forcing for HAB Oracle.",status:"LIVE",color:"#22c55e"},
                    {task:"eBird / iNaturalist / GBIF Ecology",detail:"Bird observations near Mobile Bay from eBird API. iNaturalist and GBIF occurrence records for biodiversity monitoring. Species counts displayed in ecology section.",status:"LIVE",color:"#22c55e"},
                    {task:"Copernicus openEO — 8 Algorithms Available",detail:"BIOPAR (LAI/FAPAR), CropSAR 2D, EVI, MSI, MOGPR, MOGPR S1, WorldCereal, NBR. COPERNICUS_USER + COPERNICUS_PASS configured. Batch job API at /api/sensors/openeo/biopar.",status:"READY",color:"#3b82f6"},
                    {task:"NASA PACE OCI v3.1",detail:"Hyperspectral ocean color. CMR granule search configured. NASA_EARTHDATA creds saved. Species-level HAB detection via 588nm peridinin band. Server service active at server/services/pace.js.",status:"READY",color:"#3b82f6"},
                    {task:"TROPOMI Methane Monitoring",detail:"Sentinel-5P CH₄ XCH4 at 5.5km daily. Copernicus CDSE + NASA fallback. CAFO methane attribution pipeline. Server service at server/services/tropomi.js. MethaneSAT deprecated (lost contact June 2025).",status:"READY",color:"#3b82f6"},
                    {task:"CSV Export — Full Data Coverage",detail:"Exports water quality, HAB probability, weather, eBird observations, PurpleAir individual sensors, CAPE, wind speed/direction. Complete data snapshot for offline analysis.",status:"LIVE",color:"#22c55e"},
                    {task:"Error Handling — Graceful Degradation",detail:"All fetch functions set explicit unavailable state on error. UI never stuck in infinite loading. NERRS shows CDMO OFFLINE badge. HF Radar shows endpoint status. Air quality falls back to PurpleAir avg.",status:"LIVE",color:"#22c55e"},
                    {task:"Master Roadmap — 15+ Tab Strategic Document",detail:"Vision, Roadmap, Build Progress, Intelligence Engine, Scientist Meeting, Hatch Strategy, BCEDA/SITEVAULT, Revenue Model, Opportunities, State Expansion, Private Sector, Osprey, Data Sources, Airbus, Fox 10, Next Sensors.",status:"LIVE",color:"#22c55e"},
                  ].map(({task,detail,status,color})=>(
                    <div key={task} style={{display:"flex",gap:10,padding:"12px 14px",
                      background:`${color}0a`,border:`1px solid ${color}33`,borderRadius:7}}>
                      <div style={{width:3,background:color,borderRadius:2,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                          <span style={{fontSize:12,color,fontWeight:700}}>{task}</span>
                          <span style={{fontSize:8,padding:"2px 7px",borderRadius:3,fontWeight:700,
                            background:`${color}22`,color,border:`1px solid ${color}44`}}>{status}</span>
                        </div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.65}}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid ${C.t3}44`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid ${C.t3}`}}>
                <div style={{fontSize:12,color:C.t3,fontWeight:800,marginBottom:14}}>
                  ACTIVE API ENDPOINTS — SERVER
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[
                    {route:"/api/water/realtime",desc:"USGS + CO-OPS water quality",s:"LIVE"},
                    {route:"/api/hab/assess",desc:"HAB Oracle probability assessment",s:"LIVE"},
                    {route:"/api/weather/current",desc:"Open-Meteo current conditions",s:"LIVE"},
                    {route:"/api/alerts",desc:"Environmental alerts",s:"LIVE"},
                    {route:"/api/sensors/registry",desc:"Full sensor registry + env status",s:"LIVE"},
                    {route:"/api/sensors/nerrs/latest",desc:"Weeks Bay NERR latest readings",s:"API DOWN"},
                    {route:"/api/sensors/hfradar/summary",desc:"HF Radar surface currents",s:"API DOWN"},
                    {route:"/api/sensors/pace/status",desc:"NASA PACE OCI status",s:"READY"},
                    {route:"/api/sensors/methane/status",desc:"TROPOMI methane status",s:"READY"},
                    {route:"/api/sensors/openeo/status",desc:"Copernicus openEO health",s:"READY"},
                    {route:"/api/sensors/epa/aqi",desc:"AirNow AQI",s:"LIVE"},
                    {route:"/api/sensors/epa/npdes",desc:"EPA discharge permits",s:"LIVE"},
                    {route:"/api/sensors/satellite/status",desc:"All satellite feeds combined",s:"LIVE"},
                    {route:"/api/sensors/ocean/status",desc:"HYCOM + CMEMS + StreamStats",s:"LIVE"},
                    {route:"/api/sensors/ecology/status",desc:"eBird + iNaturalist + GBIF",s:"LIVE"},
                    {route:"/api/sensors/land/status",desc:"Open-Meteo + FEMA + NWI + SSURGO",s:"LIVE"},
                    {route:"/api/sensors/airplus/status",desc:"PurpleAir + OpenAQ + EPA AQS",s:"LIVE"},
                    {route:"/api/sensors/goes/all",desc:"GOES-19 imagery + SST status",s:"LIVE"},
                    {route:"/api/goes19/ingest",desc:"GOES-19 ground station push",s:"READY"},
                    {route:"/api/sensors/ecology/ebird",desc:"eBird recent observations",s:"LIVE"},
                    {route:"/api/sensors/land/weather",desc:"Open-Meteo 7-day forecast",s:"LIVE"},
                    {route:"/api/sensors/airplus/purpleair",desc:"PurpleAir 13 sensors",s:"LIVE"},
                  ].map(({route,desc,s})=>(
                    <div key={route} style={{padding:"8px 10px",background:C.surface,
                      border:`1px solid ${s==="LIVE"?"#22c55e":s==="READY"?"#3b82f6":"#f59e0b"}33`,
                      borderRadius:6,borderLeft:`3px solid ${s==="LIVE"?"#22c55e":s==="READY"?"#3b82f6":"#f59e0b"}`}}>
                      <div style={{fontSize:9,color:s==="LIVE"?"#22c55e":s==="READY"?"#3b82f6":"#f59e0b",
                        fontWeight:700,fontFamily:"'Fira Code',monospace",marginBottom:2}}>{route}</div>
                      <div style={{fontSize:9,color:C.muted}}>{desc}</div>
                      <span style={{fontSize:7,padding:"1px 5px",borderRadius:3,fontWeight:700,
                        background:`${s==="LIVE"?"#22c55e":s==="READY"?"#3b82f6":"#f59e0b"}22`,
                        color:s==="LIVE"?"#22c55e":s==="READY"?"#3b82f6":"#f59e0b"}}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid ${C.t4}44`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid ${C.t4}`}}>
                <div style={{fontSize:12,color:C.t4,fontWeight:800,marginBottom:14}}>
                  SERVER SERVICES — 12 MODULES
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {name:"airplus.js",feeds:"PurpleAir (13 sensors), OpenAQ, EPA AQS",status:"Active"},
                    {name:"ecology.js",feeds:"eBird, iNaturalist, GBIF, AmeriFlux",status:"Active"},
                    {name:"landregweather.js",feeds:"Open-Meteo, FEMA FIRM, NWI, SSURGO, NLCD, NCEI, AHPS",status:"Active"},
                    {name:"epa.js",feeds:"EPA ECHO, AirNow AQI, Water Quality Portal, TRI",status:"Active"},
                    {name:"goes.js",feeds:"GOES-19 ABI imagery, SST, GEOCOLOR streaming",status:"Active"},
                    {name:"hfradar.js",feeds:"HF Radar surface currents via IOOS ERDDAP",status:"Endpoint 500"},
                    {name:"nerrs.js",feeds:"Weeks Bay NERR — CDMO SWMP real-time data",status:"CDMO 404"},
                    {name:"pace.js",feeds:"NASA PACE OCI v3.1 — hyperspectral ocean color",status:"Ready"},
                    {name:"tropomi.js",feeds:"Sentinel-5P TROPOMI — methane CH₄",status:"Ready"},
                    {name:"openeo.js",feeds:"Copernicus openEO — 8 algorithm plaza",status:"Ready"},
                    {name:"satellite.js",feeds:"Sentinel-2, Landsat 8/9, MODIS, VIIRS, HLS",status:"Active"},
                    {name:"ocean.js",feeds:"HYCOM, CMEMS, StreamStats, CoastWatch",status:"Active"},
                  ].map(({name,feeds,status})=>{
                    const sc = status==="Active"?"#22c55e":status==="Ready"?"#3b82f6":"#f59e0b";
                    return(
                      <div key={name} style={{background:C.surface,border:`1px solid ${sc}33`,
                        borderRadius:7,padding:"12px 14px",borderTop:`2px solid ${sc}`}}>
                        <div style={{fontSize:11,color:sc,fontWeight:700,fontFamily:"'Fira Code',monospace",marginBottom:4}}>{name}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginBottom:4}}>{feeds}</div>
                        <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,fontWeight:700,
                          background:`${sc}22`,color:sc,border:`1px solid ${sc}44`}}>{status}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid #a855f744`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid #a855f7`}}>
                <div style={{fontSize:12,color:"#a855f7",fontWeight:800,marginBottom:14}}>
                  ENVIRONMENT VARIABLES — CONFIGURED SECRETS
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {k:"NASA_EARTHDATA_USER + PASS",v:"Saved",c:"#22c55e",u:"PACE OCI + TROPOMI fallback"},
                    {k:"COPERNICUS_USER + PASS",v:"Saved",c:"#22c55e",u:"TROPOMI + openEO 8 algorithms"},
                    {k:"AIRNOW_API_KEY",v:"Saved",c:"#22c55e",u:"Real-time AQI"},
                    {k:"PURPLEAIR_API_KEY",v:"Saved",c:"#22c55e",u:"13 Mobile Bay PM2.5 sensors"},
                    {k:"EBIRD_API_KEY",v:"Saved",c:"#22c55e",u:"Bird observations near Mobile Bay"},
                    {k:"GOES19_API_KEY",v:"Generate + add",c:"#f59e0b",u:"Ground station ingest auth"},
                    {k:"ANTHROPIC_API_KEY",v:"Optional",c:C.muted,u:"AI Field Assistant"},
                    {k:"GCP_PROJECT",v:"Phase 3 only",c:"#8b5cf6",u:"Vertex AI CNN-LSTM training"},
                    {k:"VERTEX_SERVICE_ACCOUNT_KEY",v:"Phase 3 only",c:"#8b5cf6",u:"Vertex AI auth"},
                    {k:"VEXCEL_API_KEY",v:"Evaluation",c:C.muted,u:"7.5cm aerial imagery"},
                  ].map(({k,v,c,u})=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",
                      background:C.surface,border:`1px solid ${c}33`,borderRadius:6}}>
                      <div>
                        <div style={{fontSize:9,color:C.ink,fontWeight:700,fontFamily:"'Fira Code',monospace"}}>{k}</div>
                        <div style={{fontSize:8,color:C.muted}}>{u}</div>
                      </div>
                      <span style={{fontSize:8,color:c,fontWeight:700,flexShrink:0}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid ${C.now}44`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid ${C.now}`}}>
                <div style={{fontSize:12,color:C.now,fontWeight:800,marginBottom:14}}>
                  EXTERNAL APIS — CURRENT STATUS
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {api:"NERRS CDMO (Weeks Bay)",status:"DOWN — 404",note:"CDMO server returning 404. UI shows CDMO OFFLINE badge. Data unavailable until CDMO restores service.",c:"#dc2626"},
                    {api:"NOAA HF Radar ERDDAP",status:"DOWN — 500",note:"IOOS ERDDAP returning 500 server error. Bloom trajectory forecasting degraded. UI shows endpoint status.",c:"#dc2626"},
                    {api:"GOES-19 SST ERDDAP",status:"DOWN — 404",note:"SST data feed unavailable. GEOCOLOR imagery still streaming via NOAA STAR CDN. UI shows 'Imagery' indicator.",c:"#f59e0b"},
                    {api:"NOAA CO-OPS 8735180",status:"INTERMITTENT — 504",note:"Dauphin Island station timing out intermittently. Other CO-OPS stations operational.",c:"#f59e0b"},
                    {api:"Open-Meteo",status:"LIVE",note:"Current conditions + 7-day forecast fully operational. Temp 20.4°C, wind 3.47 m/s, CAPE 560 J/kg.",c:"#22c55e"},
                    {api:"PurpleAir",status:"LIVE",note:"13 sensors active in Mobile Bay area. Average PM2.5 ~4-5 µg/m³. Individual sensor readings in Science View.",c:"#22c55e"},
                    {api:"eBird",status:"LIVE",note:"Recent observations near Mobile Bay returning successfully. Species counts displayed in ecology section.",c:"#22c55e"},
                    {api:"GOES-19 Imagery",status:"LIVE",note:"GEOCOLOR true-color imagery streaming from NOAA STAR CDN. Refresh every 10 minutes. Band 02 visible available.",c:"#22c55e"},
                    {api:"EPA AirNow",status:"LIVE",note:"AQI data available for Dauphin Island monitoring station. Falls back to PurpleAir avg when unavailable.",c:"#22c55e"},
                    {api:"USGS NWIS",status:"LIVE",note:"Real-time water quality from Mobile Bay area stations. Streamflow, DO₂, pH, conductivity, temperature.",c:"#22c55e"},
                  ].map(({api,status,note,c})=>(
                    <div key={api} style={{display:"flex",gap:10,padding:"10px 12px",
                      background:`${c}08`,border:`1px solid ${c}33`,borderRadius:6}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:c,flexShrink:0,marginTop:4,
                        animation:c==="#22c55e"?"none":"roadmap-pulse 2s infinite"}}/>
                      <div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:11,color:C.text,fontWeight:700}}>{api}</span>
                          <span style={{fontSize:8,padding:"1px 6px",borderRadius:3,fontWeight:700,
                            background:`${c}22`,color:c}}>{status}</span>
                        </div>
                        <div style={{fontSize:9,color:C.muted,lineHeight:1.6,marginTop:2}}>{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{background:C.panel,border:`1px solid ${C.t6}44`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid ${C.t6}`}}>
                <div style={{fontSize:12,color:C.t6,fontWeight:800,marginBottom:14}}>
                  ACTIVE DATA FEED INVENTORY — 51+ SOURCES BY CATEGORY
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {cat:"Water Quality (In-Situ)",count:7,color:"#22d3ee",
                      items:["USGS NWIS","EPA WQP","NERRS/CDMO","NOAA CO-OPS","NDBC Buoys","CMEMS","ERDDAP"]},
                    {cat:"Air Quality",count:5,color:"#a78bfa",
                      items:["EPA AQS","AirNow","OpenAQ","PurpleAir (13 sensors)","TROPOMI Sentinel-5P"]},
                    {cat:"Satellite Imagery",count:11,color:"#34d399",
                      items:["Sentinel-2","Landsat 8/9","GOES-19 ★","MODIS","VIIRS","NASA HLS","PACE OCI ★","Copernicus DEM","TROPOMI CH₄","Planet (research)","NASA PACE v3.1"]},
                    {cat:"Weather & Climate",count:4,color:"#fbbf24",
                      items:["NOAA NWS","NOAA AHPS","NOAA NCEI","Open-Meteo ★"]},
                    {cat:"Soil, Land & Ecology",count:7,color:"#86efac",
                      items:["NRCS SSURGO","USGS NWI","FEMA FIRM","NLCD","iNaturalist","GBIF","eBird ★"]},
                    {cat:"Regulatory & Compliance",count:5,color:"#f87171",
                      items:["EPA ECHO","EPA TRI","EPA ATTAINS","EPA PFAS","USACE Regulatory"]},
                    {cat:"Oceanographic & Coastal",count:7,color:"#38bdf8",
                      items:["NOAA CoastWatch","HYCOM","USGS StreamStats","NOAA Digital Coast","PACE OCI","HF Radar","AmeriFlux"]},
                    {cat:"Copernicus openEO",count:8,color:"#10b981",
                      items:["BIOPAR","CropSAR 2D","EVI","MSI","MOGPR","MOGPR S1","WorldCereal","NBR"]},
                    {cat:"Community / Hyperlocal",count:2,color:"#f97316",
                      items:["PurpleAir 13 sensors ★","eBird observations ★"]},
                  ].map(({cat,count,color,items})=>(
                    <div key={cat} style={{background:C.surface,border:`1px solid ${color}33`,
                      borderRadius:7,padding:"12px 14px",borderTop:`2px solid ${color}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:11,color,fontWeight:700}}>{cat}</span>
                        <span style={{fontSize:9,color,fontWeight:800,fontFamily:"'Fira Code',monospace"}}>{count}</span>
                      </div>
                      {items.map(i=>(
                        <div key={i} style={{fontSize:9,color:i.includes("★")?C.t1:C.muted,
                          padding:"2px 0",fontWeight:i.includes("★")?600:400}}>
                          {i.includes("★")?"● ":"○ "}{i}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,padding:"10px 14px",background:`${C.t1}0f`,
                  border:`1px solid ${C.t1}33`,borderRadius:6,fontSize:10,color:C.t1}}>
                  ★ = Newly integrated or actively returning data in current build. All other feeds have server services built and API endpoints configured.
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 3: INTELLIGENCE ENGINE ══════════ */}
          {tab===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(160deg,#0a3d2b,#0d5c3e)`,borderRadius:10,
                padding:"32px 40px",position:"relative",overflow:"hidden",border:`1px solid #00c4a022`}}>
                <div style={{position:"absolute",inset:0,opacity:0.04,
                  backgroundImage:`linear-gradient(#00c4a0 1px,transparent 1px),linear-gradient(90deg,#00c4a0 1px,transparent 1px)`,
                  backgroundSize:"40px 40px"}}/>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:10,
                  fontFamily:"'Fira Code',monospace",position:"relative"}}>TERRAWATCH · CONTINUOUS LEARNING PIPELINE</div>
                <h2 style={{fontSize:24,fontWeight:800,color:"#ffffff",marginBottom:10,position:"relative"}}>
                  Intelligence Engine — Phase 0 Running
                </h2>
                <p style={{fontSize:12,color:"#a8d8c8",lineHeight:1.9,maxWidth:820,position:"relative"}}>
                  Every 3 minutes, TERRAWATCH fetches all 22 sensor feeds, assembles a 68-feature vector from the combined readings, auto-labels threshold-crossing events, and writes everything to a local SQLite database. No human annotation required. The system labels its own training data and retrains weekly. Phase 0 is accumulating data right now. Phase 3 is a CNN-LSTM on Vertex AI predicting 8 days out.
                </p>
                <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap",position:"relative"}}>
                  {[
                    {l:"Current phase",v:"Phase 0 — Accumulating",c:"#22d3ee"},
                    {l:"HAB Oracle inputs",v:"7 / 13 active",c:"#f59e0b"},
                    {l:"Feature vector",v:"68 features / tick",c:C.t1},
                    {l:"Cron cadence",v:"Every 3 minutes",c:C.t1},
                    {l:"Weekly retrain",v:"Sunday midnight",c:"#a78bfa"},
                    {l:"Phase 3 trigger",v:"2,000 labeled samples",c:"#22c55e"},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"10px 16px",
                      border:"1px solid rgba(255,255,255,0.08)"}}>
                      <div style={{fontSize:8,color:"#6a9e8a",letterSpacing:"0.14em",marginBottom:3,
                        fontFamily:"'Fira Code',monospace"}}>{l}</div>
                      <div style={{fontSize:13,color:c,fontWeight:700}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Causal Chain — world first */}
              <div style={{background:C.surface,border:`1px solid ${C.t1}44`,borderRadius:10,
                padding:"22px 28px",borderTop:`3px solid ${C.t1}`}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:12,
                  fontFamily:"'Fira Code',monospace"}}>WORLD FIRST — COMPLETE CAUSAL CHAIN — NEVER CONNECTED BEFORE</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:0,marginBottom:12}}>
                  {[
                    {step:1,sensor:"GOES-19 QPE",event:"Rain event detected",time:"+0h",c:"#3b82f6",
                      detail:"Watershed rainfall >5 mm/hr. Auto-labeled nutrient_pulse event. 48–96h HAB precursor lag begins."},
                    {step:2,sensor:"USGS NWIS",event:"Flow surge arrives",time:"+48h",c:"#06b6d4",
                      detail:"Dog River / Fowl River / Mobile River elevated. Lag time computed from HF Radar current speed × geographic distance."},
                    {step:3,sensor:"NASA PACE OCI",event:"Chlor-a rising",time:"+72h",c:C.t1,
                      detail:"1km daily chlorophyll-a at bay surface. 588nm peridinin band = K. brevis species attribution. GOES-19 bloom_index fills 5-min gaps."},
                    {step:4,sensor:"NERRS CDMO",event:"ChlFluor spike",time:"+96h",c:"#f59e0b",
                      detail:"Weeks Bay dock sensor chlorophyll fluorescence — in-situ confirmation of bloom arrival at the research site."},
                    {step:5,sensor:"USGS + NERRS DO₂",event:"Crash predicted",time:"+120h",c:"#ef4444",
                      detail:"Dissolved oxygen below 3 mg/L. Auto-labeled hypoxia event. Retrospective feature vector labeling for training."},
                  ].map(({step,sensor,event,time,c,detail},i)=>(
                    <div key={step} style={{position:"relative"}}>
                      {i<4&&(
                        <div style={{position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",
                          width:20,height:2,background:`${c}80`,zIndex:1}}/>
                      )}
                      <div style={{background:`${c}10`,border:`1px solid ${c}44`,borderRadius:8,
                        padding:"14px 14px",marginRight:i<4?20:0,borderTop:`3px solid ${c}`}}>
                        <div style={{fontSize:9,color:c,fontWeight:700,letterSpacing:"0.1em",
                          fontFamily:"'Fira Code',monospace",marginBottom:4}}>{time} · {sensor}</div>
                        <div style={{fontSize:12,color:C.ink,fontWeight:800,marginBottom:6}}>{event}</div>
                        <div style={{fontSize:9,color:C.muted,lineHeight:1.7}}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{padding:"10px 16px",background:"rgba(10,158,128,0.06)",borderRadius:8,
                  border:`1px solid ${C.t1}22`}}>
                  <div style={{fontSize:10,color:C.t1,fontWeight:700,marginBottom:4}}>
                    Why this matters: before TERRAWATCH, each step was monitored by a different federal agency website with no temporal connection.
                  </div>
                  <div style={{fontSize:10,color:C.muted,lineHeight:1.7}}>
                    HF Radar current speed sets the dynamic lag timer. At 0.3 m/s southward flow, Dog River signals arrive at Weeks Bay in ~17 hours. At 0.5 m/s (strong ebb tide), that compresses to ~10 hours. The model learns your specific geography — not a fixed lookup table.
                  </div>
                </div>
              </div>

              {/* Phase ladder */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                {[
                  {phase:"Phase 0",label:"Accumulation",trigger:"Now — data persisting",color:"#94a3b8",
                    desc:"Every 3-min cron: fetch all 22 feeds → buildFeatureVector() → write sensor_readings + feature_vectors + hab_events to SQLite. Auto-labeling active for 7 event types. No model yet — building the training dataset.",
                    status:"RUNNING",
                    items:["3-min cron: persistTick()", "68-feature vector assembled","7 auto-label event types","SQLite persistence: terrawatch.db","Sunday midnight: retrainHABOracle()"]},
                  {phase:"Phase 1",label:"Logistic Regression",trigger:"100 labeled samples (~Day 4)",color:"#22c55e",
                    desc:"Pure JavaScript logistic regression — 23 features, L2 regularization, 800 epochs. Auto-promotes only if AUC-ROC improves over deployed model. Runs entirely in-process, no external deps.",
                    status:"PENDING",
                    items:["Logistic regression — pure JS","800 epochs, L2 regularization","AUC-ROC auto-promotion logic","Weekly retrain on Sunday midnight","Model registry in SQLite"]},
                  {phase:"Phase 2",label:"Enhanced Model",trigger:"500 labeled samples (~Day 14)",color:"#f59e0b",
                    desc:"Extended training: 1,500 epochs, improved feature selection. GOES-19 SST gradient live as stratification feature. All 13 HAB Oracle inputs active. Recommendation language upgraded to mechanism-specific.",
                    status:"PENDING",
                    items:["1,500 training epochs","GOES-19 18 features active","13/13 HAB Oracle inputs","Mechanism-specific recommendations","STF-GNN graph model spec"]},
                  {phase:"Phase 3",label:"CNN-LSTM on Vertex AI",trigger:"2,000 labeled samples (~Day 45)",color:C.t4,
                    desc:"CNN-LSTM spatiotemporal datacube (Hill et al. 2021). Vertex AI training job dispatched via triggerVertexAITraining(). 8-day forecast horizon. Karenia 588nm attribution. SHAP explainability for EPA 2024 AI Use Policy.",
                    status:"PENDING",
                    items:["CNN-LSTM datacube per Hill et al.","8-day HAB Oracle horizon","K. brevis 588nm peridinin attribution","SHAP explainability deployed","Requires: GCP_PROJECT + VERTEX_KEY"]},
                ].map(({phase,label,trigger,color,desc,status,items})=>(
                  <div key={phase} style={{background:C.surface,border:`1px solid ${color}44`,borderRadius:9,
                    padding:"16px 18px",borderTop:`3px solid ${color}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontSize:9,color,fontWeight:700,letterSpacing:"0.1em",
                        fontFamily:"'Fira Code',monospace"}}>{phase}</div>
                      <span style={{fontSize:8,padding:"2px 6px",borderRadius:3,fontWeight:700,
                        background:status==="RUNNING"?`${C.t1}20`:`${color}15`,
                        color:status==="RUNNING"?C.t1:color,
                        border:`1px solid ${status==="RUNNING"?C.t1:color}44`}}>{status}</span>
                    </div>
                    <div style={{fontSize:13,color:C.ink,fontWeight:800,marginBottom:4}}>{label}</div>
                    <div style={{fontSize:9,color,marginBottom:8,fontFamily:"'Fira Code',monospace"}}>{trigger}</div>
                    <div style={{fontSize:10,color:C.muted,lineHeight:1.7,marginBottom:10}}>{desc}</div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {items.map(item=>(
                        <div key={item} style={{fontSize:9,color:C.muted,display:"flex",gap:6,alignItems:"flex-start"}}>
                          <span style={{color,flexShrink:0,marginTop:1}}>▸</span>{item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 68-feature vector breakdown */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"20px 24px"}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>68-FEATURE VECTOR — ASSEMBLED EVERY 3 MINUTES</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                  {[
                    {cat:"Network aggregates (12)",c:"#22d3ee",features:["min/avg/max/std DO₂","avg/max temp","total flow (kcfs)","avg/max turbidity","station count","hypoxic stations","low DO₂ stations"]},
                    {cat:"Per-station USGS (5)",c:"#3b82f6",features:["do2_dogriver","do2_fowlriver","do2_mobilei65","flow_mobilei65","turb_dogriver"]},
                    {cat:"NERRS Weeks Bay (7)",c:"#f59e0b",features:["wbDo2, wbTemp","wbSal, wbTurb","wbChlFl, wbCond","wbPH"]},
                    {cat:"HF Radar (4)",c:C.t1,features:["currentSpeed_ms","currentDir_deg","bloom14h_km","bloom24h_km"]},
                    {cat:"Cross-sensor lag (4)",c:"#8b5cf6",features:["lag_dogriver_weeksbay_h","upstream_do2","upstream_flow","upstream_turb"]},
                    {cat:"CO-OPS tidal (3)",c:"#06b6d4",features:["waterLevel_dauphinIs","salinity_dauphinIs","waterTemp_dauphinIs"]},
                    {cat:"AQI + feedback (2)",c:"#f97316",features:["aqi (AirNow)","hab_prob (Oracle feedback)"]},
                    {cat:"Temporal cyclical (9)",c:"#a78bfa",features:["hour, doy, month","is_summer, is_night","hour_sin/cos","doy_sin/cos"]},
                    {cat:"GOES-19 features (18) ★",c:"#ef4444",features:["goes_sst_gradient","goes_stratification","goes_rain_watershed","goes_nutrient_pulse","goes_bloom_index","goes_lightning_5min","goes_pace_viable","+ 11 more"]},
                  ].map(({cat,c,features})=>(
                    <div key={cat} style={{background:C.surface,border:`1px solid ${c}33`,borderRadius:7,
                      padding:"10px 14px"}}>
                      <div style={{fontSize:9,color:c,fontWeight:700,marginBottom:6,
                        fontFamily:"'Fira Code',monospace"}}>{cat}</div>
                      {features.map(f=>(
                        <div key={f} style={{fontSize:9,color:C.muted,display:"flex",gap:5,marginBottom:2}}>
                          <span style={{color:c,flexShrink:0}}>·</span>{f}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-labeling and GOES-19 API status */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>

                {/* Auto-labeling */}
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                  <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:12,
                    fontFamily:"'Fira Code',monospace"}}>AUTO-LABELING — NO HUMAN ANNOTATION REQUIRED</div>
                  {[
                    {event:"hypoxia",trigger:"DO₂ < 3 mg/L at any USGS station or NERRS Weeks Bay",label:"label_hypoxia = 1. Retrospective 72h window labeling.",c:"#ef4444"},
                    {event:"HAB precursor",trigger:"avg_temp > 28°C + high flow + wbChlFl elevated + is_summer (3+ of 4 conditions)",label:"label_hab = 1. Ambiguous conditions return null (not 0).",c:"#f59e0b"},
                    {event:"sst_stratification",trigger:"GOES-19 gradient ≥ 3.5°C",label:"hab_events table + retrospective vector labeling.",c:"#c2410c"},
                    {event:"nutrient_pulse",trigger:"GOES-19 watershed rain ≥ 5 mm/hr",label:"hab_events. Forward 48–96h window tagged high-risk.",c:"#2563eb"},
                    {event:"surface_bloom",trigger:"GOES-19 bloom_index ≥ 0.20",label:"hab_events. Surface CHL expression confirmed.",c:C.t1},
                    {event:"convective_mixing",trigger:"GLM flashes ≥ 50 / 5-min window",label:"hab_events. Vertical DO₂ dynamics modifier.",c:"#7c3aed"},
                    {event:"heavy_rain_6h",trigger:"GOES-19 cumulative_6h_mm ≥ 15",label:"Flow surge predictor. USGS response expected +48h.",c:"#1d6fcc"},
                  ].map(({event,trigger,label,c})=>(
                    <div key={event} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:8,padding:"1px 6px",borderRadius:3,fontWeight:700,
                          background:`${c}15`,color:c,border:`1px solid ${c}44`,
                          fontFamily:"'Fira Code',monospace"}}>{event}</span>
                      </div>
                      <div style={{fontSize:9,color:C.muted,marginBottom:2}}>{trigger}</div>
                      <div style={{fontSize:9,color:C.ink,fontWeight:600}}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* GOES-19 API Status + Environment Variables */}
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <div style={{background:C.surface,border:`1px solid ${C.t3}44`,borderRadius:9,
                    padding:"18px 22px",borderTop:`3px solid ${C.t3}`}}>
                    <div style={{fontSize:8,color:C.t3,letterSpacing:"0.22em",marginBottom:12,
                      fontFamily:"'Fira Code',monospace"}}>GOES-19 GROUND STATION PUSH API</div>
                    <div style={{fontSize:11,color:C.muted,lineHeight:1.8,marginBottom:10}}>
                      Ground station POSTs scalar JSON extractions every 5 minutes. TERRAWATCH receives 288 pushes/day at ~1.5KB each. Full API spec in GOES19_API_Specification_v1.docx. Postman collection live in max hansen's Workspace.
                    </div>
                    {[
                      {l:"Ingest endpoint",v:"POST /api/goes19/ingest",c:C.t3},
                      {l:"Auth",v:"X-API-Key: GOES19_API_KEY",c:C.t3},
                      {l:"Status",v:"GET /api/goes19/status",c:C.muted},
                      {l:"ML features",v:"18 new features → 68 total",c:C.t1},
                      {l:"Email draft",v:"Saved in Gmail — add address & send",c:"#f59e0b"},
                      {l:"Postman",v:"TERRAWATCH — GOES-19 Ground Station API",c:C.muted},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                        padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                        <span style={{fontSize:9,color:C.muted,fontFamily:"'Fira Code',monospace"}}>{l}</span>
                        <span style={{fontSize:9,color:c,fontWeight:600}}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                    <div style={{fontSize:8,color:C.muted,letterSpacing:"0.22em",marginBottom:10,
                      fontFamily:"'Fira Code',monospace"}}>ENVIRONMENT VARIABLES — REPLIT SECRETS</div>
                    {[
                      {k:"NASA_EARTHDATA_USER+PASS",v:"✅ Saved",c:C.t1,unlocks:"PACE OCI + TROPOMI fallback"},
                      {k:"COPERNICUS_USER+PASS",v:"✅ Saved",c:C.t1,unlocks:"TROPOMI + openEO 8 algorithms"},
                      {k:"AIRNOW_API_KEY",v:"✅ Saved",c:C.t1,unlocks:"Real-time AQI Dauphin Island"},
                      {k:"PURPLEAIR_API_KEY",v:"✅ Saved",c:C.t1,unlocks:"13 Mobile Bay PM2.5 sensors"},
                      {k:"EBIRD_API_KEY",v:"✅ Saved",c:C.t1,unlocks:"Bird observations Mobile Bay"},
                      {k:"GOES19_API_KEY",v:"⚡ Generate + add",c:"#f59e0b",unlocks:"Ground station ingest auth"},
                      {k:"ANTHROPIC_API_KEY",v:"Optional",c:C.muted,unlocks:"AI Field Assistant"},
                      {k:"GCP_PROJECT",v:"Phase 3 only",c:"#8b5cf6",unlocks:"Vertex AI CNN-LSTM training"},
                      {k:"VEXCEL_API_KEY",v:"Evaluation",c:C.muted,unlocks:"7.5cm aerial for WetlandAI"},
                    ].map(({k,v,c,unlocks})=>(
                      <div key={k} style={{marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                          <span style={{fontSize:8,color:C.ink,fontWeight:700,
                            fontFamily:"'Fira Code',monospace"}}>{k}</span>
                          <span style={{fontSize:8,color:c,fontWeight:700}}>{v}</span>
                        </div>
                        <div style={{fontSize:8,color:C.muted}}>{unlocks}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5 Scientific Firsts */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,borderRadius:10,
                padding:"24px 30px",border:`1px solid #00c4a022`}}>
                <div style={{fontSize:9,color:C.t1,letterSpacing:"0.25em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>5 DOCUMENTED SCIENTIFIC FIRSTS — MOBILE BAY / GULF COAST</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {n:1,title:"First geostationary + polar orbit + in-situ fusion for Gulf Coast HAB prediction",
                      body:"GOES-19 (5-min geostationary) + PACE OCI (daily polar orbit) + Sentinel-2 + TROPOMI + NERRS + USGS — all fused into a single operational prediction system. No prior operational system has done this for any coastal estuary.",c:C.t1},
                    {n:2,title:"First satellite-based Karenia brevis species attribution",
                      body:"PACE OCI 588nm peridinin carotenoid absorption band discriminates K. brevis from other phytoplankton species from orbit. No prior operational satellite has species-level HAB attribution capability. Activates at Phase 3.",c:"#22c55e"},
                    {n:3,title:"First real-time causal chain model: rain → flow → chlor-a → ChlFluor → DO₂",
                      body:"Complete 5-step nutrient pulse model from GOES-19 QPE rainfall through USGS flow → PACE → NERRS → DO₂ crash, with HF Radar-derived dynamic lag times. Every step measured in near real-time.",c:"#3b82f6"},
                    {n:4,title:"First GOES-19 SST gradient as hypoxia stratification onset indicator",
                      body:"SST gradient >3.5°C across Mobile Bay → thermal stratification onset → 6–24h advance warning of DO₂ crash. Novel application of geostationary SST for estuarine hypoxia prediction in the northern Gulf of Mexico.",c:"#f59e0b"},
                    {n:5,title:"First self-labeling ML training pipeline for coastal HAB events",
                      body:"System generates all supervised training labels from physical threshold crossings automatically — no human annotation. Training database grows on every 3-minute tick. Phase 1 model trains from entirely auto-generated ground truth.",c:"#a78bfa"},
                  ].map(({n,title,body,c})=>(
                    <div key={n} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,
                      padding:"14px 16px",border:`1px solid rgba(255,255,255,0.08)`}}>
                      <div style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                        <span style={{fontSize:16,fontWeight:800,color:c,flexShrink:0}}>#{n}</span>
                        <div style={{fontSize:11,color:"#e0f4ec",fontWeight:700,lineHeight:1.4}}>{title}</div>
                      </div>
                      <div style={{fontSize:10,color:"#a8d8c8",lineHeight:1.7}}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 3: SCIENTIST MEETING ══════════ */}
          {tab===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`1px solid ${C.t1}44`,borderRadius:10,padding:"22px 28px",
                borderLeft:`4px solid ${C.t1}`}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:6,
                  fontFamily:"'Fira Code',monospace"}}>NEXT WEEK · STAFF SCIENTIST MEETING PREP</div>
                <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:8}}>
                  The most important meeting in TERRAWATCH's first year
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:800}}>
                  This meeting has three outcomes you need: (1) a Letter of Intent as a pilot partner for the Hatch application, (2) a co-PI relationship for the NOAA Sea Grant, and (3) enough specific feedback to shape the MVP feature set. Come prepared to listen more than you talk. Her pain points are your product roadmap.
                </p>
              </div>

              {SCIENTIST_PREP.map(sec=>(
                <div key={sec.category} style={{background:C.panel,
                  border:`1px solid ${sec.color}44`,borderRadius:9,padding:"18px 22px",
                  borderTop:`3px solid ${sec.color}`}}>
                  <div style={{fontSize:12,color:sec.color,fontWeight:800,marginBottom:14}}>
                    {sec.category}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {sec.items.map((item,i)=>{
                      const isOpen=openSci===`${sec.category}-${i}`;
                      return(
                        <div key={i}
                          onClick={()=>setOpenSci(isOpen?null:`${sec.category}-${i}`)}
                          style={{background:isOpen?`${sec.color}0a`:C.surface,
                            border:`1px solid ${isOpen?sec.color:C.border}`,
                            borderRadius:7,padding:"12px 14px",cursor:"pointer",
                            transition:"all 0.15s"}}>
                          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                            <div style={{width:22,height:22,borderRadius:"50%",
                              background:`${sec.color}22`,border:`1px solid ${sec.color}55`,
                              display:"flex",alignItems:"center",justifyContent:"center",
                              fontSize:10,color:sec.color,fontWeight:700,flexShrink:0}}>
                              {i+1}
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:12,color:C.text,fontWeight:600,
                                lineHeight:1.4}}>{item.q}</div>
                              {isOpen&&(
                                <div style={{fontSize:11,color:C.muted,lineHeight:1.7,
                                  marginTop:8,paddingLeft:4,borderLeft:`2px solid ${sec.color}40`,
                                  animation:"roadmap-in 0.15s ease"}}>{item.why}</div>
                              )}
                            </div>
                            <span style={{fontSize:11,color:sec.color,opacity:0.6,flexShrink:0}}>
                              {isOpen?"−":"+"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Meeting outcome checklist */}
              <div style={{background:C.panel,border:`1px solid ${C.now}55`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.now}`}}>
                <div style={{fontSize:12,color:C.now,fontWeight:800,marginBottom:12}}>
                  Leave With These Three Things
                </div>
                {[
                  {item:"Signed Letter of Intent — pilot partner agreement",sub:"Required for Hatch application. One sentence: 'I agree to serve as a scientific advisor and pilot user for TERRAWATCH during its development period.' That's enough."},
                  {item:"Co-PI agreement for NOAA Sea Grant proposal",sub:"She needs to be named as co-PI for the application to be competitive. Her institutional affiliation (NOAA partner or university) makes the difference."},
                  {item:"Her top 3 MVP feature priorities in her own words",sub:"Write them down verbatim. These become the feature names in your pitch deck and the first three items on your development backlog."},
                ].map(({item,sub},i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"12px 0",
                    borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",
                      background:`${C.now}22`,border:`2px solid ${C.now}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:12,color:C.now,fontWeight:800,flexShrink:0}}>0{i+1}</div>
                    <div>
                      <div style={{fontSize:13,color:C.text,fontWeight:700,marginBottom:3}}>{item}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.65}}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 2: HATCH STRATEGY ══════════ */}
          {tab===5&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{borderRadius:10,padding:"24px 30px",
                color:C.white,background:`linear-gradient(135deg,#1a2744,#0d1625)`}}>
                <div style={{fontSize:8,color:"#6a9acc",letterSpacing:"0.22em",marginBottom:8,
                  fontFamily:"'Fira Code',monospace"}}>HATCH FAIRHOPE · OPERATING COST GRANT · $36,000</div>
                <h2 style={{fontSize:24,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.2}}>
                  Three products. One grant. One imagery license. The most efficient use of $36,000 in Gulf Coast environmental tech history.
                </h2>
                <p style={{fontSize:11,color:"#8aaac8",lineHeight:1.9,maxWidth:760}}>
                  The $36,000 grant funds the operating infrastructure shared across TERRAWATCH, SITEVAULT, and WetlandAI — primarily the Vexcel imagery license (the largest cost) and cloud infrastructure. Every dollar funds three revenue streams simultaneously. No equity. No revenue share. Just the runway to reach self-sustaining revenue by Month 14.
                </p>
              </div>

              {/* Why Hatch is the right funder */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:C.panel,border:`1px solid ${C.t2}44`,borderRadius:9,
                  padding:"18px 20px",borderTop:`3px solid ${C.t2}`}}>
                  <div style={{fontSize:12,color:C.t2,fontWeight:800,marginBottom:12}}>Why Hatch Is the Perfect First Funder</div>
                  {[
                    {t:"Mission alignment",d:"Hatch explicitly supports ESG/sustainability tech and high-wage tech jobs in Baldwin County. TERRAWATCH is both."},
                    {t:"Innovate Alabama network",d:"BCEDA (the primary SITEVAULT customer) is a Hatch co-funder — they will champion our application internally."},
                    {t:"University connections",d:"Hatch has relationships with USA and UAB — exactly where our scientist co-PI needs to be affiliated for NOAA Sea Grant."},
                    {t:"No equity required",d:"Hatch's operating cost grant model is non-dilutive — we keep 100% of the company through the most critical early stage."},
                    {t:"Demo day pipeline",d:"Hatch's demo day at program completion positions TERRAWATCH for Series Seed once traction is demonstrated."},
                  ].map(({t,d})=>(
                    <div key={t} style={{display:"flex",gap:8,padding:"8px 0",
                      borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                      <span style={{color:C.t2,flexShrink:0}}>✓</span>
                      <div><strong style={{color:C.text}}>{t}: </strong>
                      <span style={{color:C.muted}}>{d}</span></div>
                    </div>
                  ))}
                </div>

                <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 20px"}}>
                  <div style={{fontSize:12,color:C.text,fontWeight:800,marginBottom:14}}>
                    The Budget Breakdown
                  </div>
                  {[
                    {item:"Vexcel imagery license (Multispectral + Elevate DTM + Oblique)",mo:"$800",ann:"$9,600",note:"Shared across all 3 products"},
                    {item:"Cloud hosting (Replit + GCP Cloud Run)",mo:"$40",ann:"$480",note:""},
                    {item:"PostgreSQL / Neon",mo:"$25",ann:"$300",note:""},
                    {item:"Claude API (AI Field Assistant + autonomous dispatch)",mo:"$150",ann:"$1,800",note:""},
                    {item:"Twilio SMS + SendGrid email",mo:"$50",ann:"$600",note:""},
                    {item:"Grant writing + conference travel",mo:"$182",ann:"$2,190",note:"NOAA Sea Grant Q2"},
                    {item:"Domain, SSL, tooling",mo:"$15",ann:"$180",note:""},
                    {item:"Operating reserve (10%)",mo:"$126",ann:"$1,512",note:""},
                    {item:"Total Year 1",mo:"$1,388",ann:"$16,662",note:""},
                    {item:"24-month total (Hatch request)",mo:"—",ann:"$36,000",note:"Buffer for Vexcel expansion"},
                  ].map(({item,mo,ann,note},i,arr)=>(
                    <div key={item} style={{display:"grid",
                      gridTemplateColumns:"1fr 60px 80px",
                      gap:8,padding:"6px 0",
                      borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none",
                      fontWeight:i===arr.length-1?700:400,
                      background:i===arr.length-1?C.dim:"transparent",
                      borderRadius:i===arr.length-1?4:0,
                      paddingLeft:i===arr.length-1?8:0}}>
                      <div style={{fontSize:11,color:i===arr.length-1?C.white:C.text}}>
                        {item}
                        {note&&<span style={{fontSize:9,color:C.t2,marginLeft:6}}>({note})</span>}
                      </div>
                      <div style={{fontSize:11,color:C.muted,textAlign:"right"}}>{mo}</div>
                      <div style={{fontSize:11,color:i===arr.length-1?C.t2:C.text,
                        textAlign:"right",fontFamily:"'Fira Code',monospace"}}>{ann}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"20px 24px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:16,
                  fontFamily:"'Fira Code',monospace"}}>HATCH APPLICATION TIMELINE</div>
                {HATCH_TRACK.map((step,i)=>(
                  <div key={step.week} style={{display:"flex",gap:14,
                    paddingBottom:i<HATCH_TRACK.length-1?20:0,
                    borderLeft:i<HATCH_TRACK.length-1?`2px solid ${step.color}44`:"none",
                    marginLeft:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
                      marginLeft:-13,marginTop:2,background:`${step.color}22`,
                      border:`2px solid ${step.color}`,display:"flex",
                      alignItems:"center",justifyContent:"center",
                      fontSize:9,color:step.color,fontWeight:700}}>
                      {i+1}
                    </div>
                    <div style={{paddingBottom:i<HATCH_TRACK.length-1?16:0,flex:1}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:12,color:step.color,fontWeight:700}}>{step.week}</span>
                        <Tag color={step.color}>{step.phase}</Tag>
                      </div>
                      {step.tasks.map(t=>(
                        <div key={t} style={{display:"flex",gap:8,padding:"4px 0",fontSize:11,color:C.text}}>
                          <span style={{color:step.color,flexShrink:0}}>→</span>{t}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════ TAB 3: BCEDA / SITEVAULT ══════════ */}
          {tab===6&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`1px solid ${C.t3}44`,borderRadius:10,padding:"22px 28px",
                borderLeft:`4px solid ${C.t3}`}}>
                <div style={{fontSize:8,color:C.t3,letterSpacing:"0.22em",marginBottom:6,
                  fontFamily:"'Fira Code',monospace"}}>SITEVAULT · BCEDA INDUSTRIAL SITE INTELLIGENCE</div>
                <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:8}}>
                  Hatch funded the infrastructure. BCEDA is the first $60K/yr contract.
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:760}}>
                  BCEDA is a co-funder of Hatch Fairhope — the warm intro from Hatch to Lee Lawson (BCEDA President & CEO) is worth 10 cold outreach attempts. The pitch is simple: BCEDA already competes globally for billion-dollar industrial projects. SITEVAULT gives their site selectors a data weapon no competitor EDA has.
                </p>
              </div>

              {BCEDA_TRACK.map((phase,i)=>(
                <div key={phase.phase} style={{background:C.panel,
                  border:`1px solid ${phase.color}44`,borderRadius:9,
                  padding:"18px 22px",borderLeft:`4px solid ${phase.color}`}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:12}}>
                    <Tag color={phase.color}>{phase.phase}</Tag>
                    <div style={{fontSize:13,color:phase.color,fontWeight:800}}>{phase.title}</div>
                  </div>
                  {phase.tasks.map((t,j)=>(
                    <div key={j} style={{display:"flex",gap:10,padding:"9px 0",
                      borderBottom:j<phase.tasks.length-1?`1px solid ${C.border}`:"none",
                      fontSize:12,color:C.text,lineHeight:1.6}}>
                      <span style={{color:phase.color,flexShrink:0,fontWeight:700}}>{j+1}.</span>
                      {t}
                    </div>
                  ))}
                </div>
              ))}

              {/* SITEVAULT + TERRAWATCH + WetlandAI integration */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"20px 24px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>THE COMBINED PLATFORM PITCH TO BCEDA</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {label:"SITEVAULT gives BCEDA",color:C.t3,items:["Vexcel oblique virtual site tours","DTM development cost estimator","Environmental pre-screen (Vexcel MS)","Post-disaster Gray Sky site status","RFP response generator","$60,000/yr platform license"]},
                    {label:"TERRAWATCH adds to SITEVAULT",color:C.t4,items:["Live water quality for waterway-adjacent sites","HAB + hypoxia risk overlay on site maps","Real-time air quality for all site AOIs","Anomaly alerts when site conditions change","Environmental compliance history for due diligence","PFAS risk pre-screen for brownfield sites"]},
                    {label:"WetlandAI completes the package",color:C.t5,items:["Wetland pre-screen before site engineering","Section 404 preliminary delineation included","Eliminates wetland surprise deal-killers","USACE-format preliminary delineation report","Saves $5,000–$75,000 per site vs. field survey","Included in SITEVAULT Enterprise tier"]},
                  ].map(({label,color,items})=>(
                    <div key={label} style={{background:C.surface,border:`1px solid ${color}33`,
                      borderRadius:8,padding:"14px 16px",borderTop:`2px solid ${color}`}}>
                      <div style={{fontSize:11,color,fontWeight:700,marginBottom:10}}>{label}</div>
                      {items.map(item=>(
                        <div key={item} style={{display:"flex",gap:8,padding:"4px 0",
                          borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                          <span style={{color,flexShrink:0}}>→</span>{item}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 4: REVENUE MODEL ══════════ */}
          {tab===7&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Revenue summary */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {label:"Year 1 Total ARR",val:fmt(Y1),sub:"2–3 SaaS + 1 consulting + grant filing",color:C.q2},
                  {label:"Year 2 Total ARR",val:fmt(Y2),sub:"SaaS + BCEDA + NOAA grant + carbon MRV",color:C.y2},
                  {label:"Year 3 Total ARR",val:fmt(Y3),sub:"Full platform + EPA contracts + utilities",color:C.y3},
                ].map(({label,val,sub,color})=>(
                  <div key={label} style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                    border:`1px solid ${color}55`,borderRadius:9,padding:"20px 24px",
                    borderTop:`3px solid ${color}`}}>
                    <div style={{fontSize:10,color:C.muted,marginBottom:4}}>{label}</div>
                    <div style={{fontSize:36,fontWeight:800,color,fontFamily:"'Fira Code',monospace",
                      lineHeight:1,marginBottom:6}}>{val}</div>
                    <div style={{fontSize:10,color:C.muted}}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* 8 Revenue streams */}
              {REVENUE_STREAMS.map(stream=>{
                const isOpen=openStream===stream.id;
                return(
                  <div key={stream.id}
                    onClick={()=>setOpenStream(isOpen?null:stream.id)}
                    style={{background:C.panel,
                      border:`1px solid ${isOpen?stream.color:C.border}`,
                      borderRadius:9,padding:"18px 22px",cursor:"pointer",
                      borderLeft:`4px solid ${stream.color}`,transition:"all 0.18s"}}>
                    <div style={{display:"flex",alignItems:"flex-start",
                      justifyContent:"space-between",gap:16,flexWrap:"wrap"}}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                          <span style={{fontSize:20}}>{stream.icon}</span>
                          <div style={{fontSize:14,color:stream.color,fontWeight:800}}>{stream.category}</div>
                        </div>
                        <div style={{display:"grid",
                          gridTemplateColumns:"2fr repeat(3,1fr)",gap:8,
                          fontSize:10,color:C.muted,marginBottom:isOpen?14:0}}>
                          <span>Tier</span>
                          <span style={{textAlign:"right"}}>Price</span>
                          <span style={{textAlign:"right"}}>Y1</span>
                          <span style={{textAlign:"right"}}>Y3</span>
                        </div>
                        {(isOpen?stream.tiers:stream.tiers.slice(0,1)).map(t=>(
                          <div key={t.name} style={{display:"grid",
                            gridTemplateColumns:"2fr repeat(3,1fr)",
                            gap:8,padding:"6px 0",
                            borderBottom:`1px solid ${C.border}`,
                            alignItems:"center"}}>
                            <div>
                              <div style={{fontSize:12,color:C.text,fontWeight:600}}>{t.name}</div>
                              <div style={{fontSize:10,color:C.muted}}>{t.target}</div>
                            </div>
                            <div style={{fontSize:11,color:stream.color,textAlign:"right",
                              fontFamily:"'Fira Code',monospace"}}>{t.price}</div>
                            <div style={{fontSize:11,color:C.muted,textAlign:"right",
                              fontFamily:"'Fira Code',monospace"}}>{t.y1}</div>
                            <div style={{fontSize:11,color:C.t6,textAlign:"right",
                              fontFamily:"'Fira Code',monospace"}}>{t.y3}</div>
                          </div>
                        ))}
                        {isOpen&&(
                          <div style={{marginTop:12,padding:"10px 14px",
                            background:`${stream.color}0a`,border:`1px solid ${stream.color}33`,
                            borderRadius:6,fontSize:11,color:C.text,lineHeight:1.75,
                            animation:"roadmap-in 0.15s ease"}}>
                            <strong style={{color:stream.color}}>Strategy: </strong>{stream.notes}
                          </div>
                        )}
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontSize:9,color:C.muted,marginBottom:4}}>Y3 POTENTIAL</div>
                        <div style={{fontSize:20,fontWeight:800,color:stream.color,
                          fontFamily:"'Fira Code',monospace"}}>
                          {stream.tiers.reduce((a,t)=>a+(parseInt(t.y3.replace(/[$,K]/g,""))||0),0)>0
                            ?"$"+Math.round(stream.tiers.reduce((a,t)=>{
                              const v=t.y3.replace("$","").replace(",","");
                              if(v.endsWith("K"))return a+parseFloat(v)*1000;
                              return a+parseFloat(v)||0;
                            },0)/1000)+"K"
                            :"TBD"}
                        </div>
                        <div style={{fontSize:9,color:stream.color,marginTop:6,opacity:0.7}}>
                          {isOpen?"↑ collapse":"→ expand"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Revenue priority matrix */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"20px 24px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>REVENUE PRIORITY MATRIX — SPEED VS. SIZE</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {q:"Fast + Large",color:C.now,streams:["HAB Oracle → shellfish industry SaaS","BCEDA SITEVAULT $60K/yr contract","WetlandAI consulting firm licenses"],sub:"Close in 6–12 months. Demonstrate the platform works."},
                    {q:"Slow + Huge",color:C.y2,streams:["EPA TMDL support contract ($300K–$800K)","NOAA Sea Grant ($300K)","PFAS attribution (law firms + EPA)"],sub:"12–24 month sales cycle. Fund operations while pursuing."},
                    {q:"Fast + Small",color:C.q2,streams:["API developer tier ($99–$499/mo)","Compliance automation add-on","Custom anomaly configuration ($2K–$10K)"],sub:"Start immediately. Low friction. Builds community."},
                    {q:"Patient + Transformative",color:C.y3,streams:["Blue carbon MRV ($500K+/yr at scale)","National utility cyanobacteria program","Statewide SITEVAULT EDA licensing ($1M+)"],sub:"3–5 year horizon. Build foundations now, harvest later."},
                  ].map(({q,color,streams,sub})=>(
                    <div key={q} style={{background:C.surface,border:`1px solid ${color}44`,
                      borderRadius:8,padding:"14px 16px",borderTop:`2px solid ${color}`}}>
                      <div style={{fontSize:12,color,fontWeight:800,marginBottom:8}}>{q}</div>
                      {streams.map(s=>(
                        <div key={s} style={{display:"flex",gap:8,padding:"4px 0",
                          borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                          <span style={{color,flexShrink:0}}>→</span>{s}
                        </div>
                      ))}
                      <div style={{fontSize:10,color:C.muted,marginTop:8,fontStyle:"italic"}}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ TAB 5: OPPORTUNITIES ══════════ */}
          {tab===8&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`1px solid ${C.t1}44`,borderRadius:10,padding:"22px 28px",
                borderLeft:`4px solid ${C.t1}`}}>
                <div style={{fontSize:8,color:C.t1,letterSpacing:"0.22em",marginBottom:6,
                  fontFamily:"'Fira Code',monospace"}}>
                  MOBILE · BALDWIN COUNTY · LOW-HANGING OPPORTUNITIES
                </div>
                <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:8}}>
                  26 identified opportunities — grants, clients, and partners within reach right now
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820}}>
                  Every organization below is already active in Mobile Bay environmental monitoring, already funded by EPA or NOAA, and already experiencing the exact pain points TERRAWATCH solves. These are warm calls, not cold ones — the ecosystem is small enough that one introduction cascades into five more.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:14}}>
                  {[
                    {l:"Immediate grants (apply now)",v:"4",c:C.now},
                    {l:"Q2–Q3 grant deadlines",v:"6",c:C.q2},
                    {l:"Local client prospects",v:"11",c:C.t4},
                    {l:"Strategic partnerships",v:"5",c:C.t6},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:C.dim,borderRadius:7,padding:"10px 14px"}}>
                      <div style={{fontSize:26,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace",lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 1: Apply Immediately */}
              <div style={{background:C.panel,border:`1px solid ${C.now}55`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.now}`}}>
                <div style={{fontSize:11,color:C.now,fontWeight:800,marginBottom:14,
                  letterSpacing:"0.08em"}}>
                  ● APPLY NOW — NO DEADLINE, OR DEADLINE IMMINENT
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {
                      org:"Mississippi-Alabama Sea Grant Consortium (MASGC)",
                      type:"Program Development Grant",
                      amount:"Up to $10,000",
                      deadline:"Rolling — accepted any time",
                      contact:"masgc.org/funding · LaDon Swann, Director",
                      why:"PD grants support small-scale projects that leverage larger funding. A TERRAWATCH pilot on HAB Oracle or biodiversity crash EWS fits perfectly in the 'Healthy Coastal Ecosystems' focus area. Apply immediately — these are reviewed and approved based on merit and fund availability with no competitive deadline.",
                      fit:"PERFECT — HAB Oracle methodology validation, biodiversity EWS pilot, or freshwater salinization study all qualify under Healthy Coastal Ecosystems focus area.",
                      color:C.now,
                    },
                    {
                      org:"NERRS Science Collaborative — Weeks Bay Reserve",
                      type:"2025 Catalyst / Knowledge Exchange RFP",
                      amount:"$50K–$150K",
                      deadline:"2025 RFP open — contact Angela Underwood first",
                      contact:"Angela Underwood, Manager — weeksbay.nerr@dcnr.alabama.gov",
                      why:"Weeks Bay NERR is located in Fairhope — literally your neighbor. The 2025 NERRS Science Collaborative has active RFPs for reserve management needs. Weeks Bay's listed needs include novel monitoring approaches and water quality syntheses — direct TERRAWATCH alignment. A phone call to Angela Underwood before submitting is standard practice and dramatically improves competitiveness.",
                      fit:"EXCELLENT — Weeks Bay is the closest NERR to your base. The reserve's monitoring data is already in your system (NERRS/CDMO feed). This is the shortest path from 'demo' to 'funded partner.'",
                      color:C.now,
                    },
                    {
                      org:"EPA National Estuary Program — NEP Watersheds Competitive Grant",
                      type:"Restore America's Estuaries competitive subaward",
                      amount:"$100K–$500K",
                      deadline:"Check estuaries.org — next cycle opening",
                      contact:"Restore America's Estuaries · info@estuaries.org · Lance Speidell",
                      why:"Congress explicitly directed NEP Watershed grants toward HABs, low dissolved oxygen, microplastics, and wetland/seagrass loss — the precise problems TERRAWATCH addresses. Mobile Bay is one of the 28 eligible NEP areas. The MBNEP must be the applicant or co-applicant, making the MBNEP relationship critical before this grant is attempted.",
                      fit:"HIGH — but requires MBNEP as co-applicant. Cultivate the MBNEP relationship in parallel with Hatch application so this grant is ready to file when the cycle opens.",
                      color:C.now,
                    },
                    {
                      org:"Innovate Alabama — Tax Credit Program",
                      type:"Entrepreneurial support organization funding",
                      deadline:"Ongoing — BCEDA/Hatch are already in the network",
                      amount:"Up to $250,000",
                      contact:"innovatealabama.org · Through BCEDA/Hatch connection",
                      why:"The Baldwin Community + Economic Development Foundation (BCEDA's nonprofit arm) received $250,000 from Innovate Alabama to support Hatch. As a Hatch incubatee, TERRAWATCH may qualify directly for Innovate Alabama support or for inclusion in a future BCEDA-led application. This is a warm channel through existing relationships — not a cold application.",
                      fit:"MEDIUM — depends on Hatch program admission. If Hatch accepts TERRAWATCH, Innovate Alabama becomes an immediate secondary funding source through BCEDA's existing network.",
                      color:C.now,
                    },
                  ].map(op=>(
                    <div key={op.org} style={{background:C.surface,border:`1px solid ${op.color}33`,
                      borderRadius:8,padding:"14px 18px",borderLeft:`3px solid ${op.color}`}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:16,
                        alignItems:"flex-start",flexWrap:"wrap"}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                            <div style={{fontSize:13,color:op.color,fontWeight:800}}>{op.org}</div>
                            <Tag color={op.color}>{op.type}</Tag>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <div style={{fontSize:10,color:C.muted}}>
                              <span style={{color:C.t6,fontWeight:700}}>Amount: </span>{op.amount}
                            </div>
                            <div style={{fontSize:10,color:C.muted}}>
                              <span style={{color:C.now,fontWeight:700}}>Deadline: </span>{op.deadline}
                            </div>
                          </div>
                          <div style={{fontSize:10,color:C.muted,marginBottom:8}}>
                            <span style={{color:C.text,fontWeight:700}}>Contact: </span>{op.contact}
                          </div>
                          <div style={{fontSize:11,color:C.text,lineHeight:1.75,marginBottom:8}}>{op.why}</div>
                          <div style={{padding:"6px 10px",background:`${op.color}10`,
                            border:`1px solid ${op.color}33`,borderRadius:5,
                            fontSize:10,color:op.color}}>
                            <strong>Fit: </strong>{op.fit}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 2: Q2-Q3 Grant Deadlines */}
              <div style={{background:C.panel,border:`1px solid ${C.q2}55`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.q2}`}}>
                <div style={{fontSize:11,color:C.q2,fontWeight:800,marginBottom:14,
                  letterSpacing:"0.08em"}}>
                  Q2–Q3 2026 — FILE BETWEEN APRIL AND SEPTEMBER
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {[
                    {
                      org:"MASGC 2026–27 Research Competition",
                      type:"Competitive Research Grant",
                      amount:"$125,000/yr (federal) + 50% match",
                      deadline:"Pre-proposals were due Feb 14, 2025 — full proposals in pipeline. Watch for 2027–28 cycle opening Q3 2026.",
                      contact:"masgc.org/funding — same PD grant contact as above",
                      why:"MASGC's main research competition funds 2-year projects at $125K/yr in federal funds with a 50% non-federal match. The 2026–27 cycle is already in progress but the 2027–28 pre-proposal will open Q3 2026. Getting a PD grant now builds the pilot data needed to be competitive in the next full cycle. Focus areas: Healthy Coastal Ecosystems (HAB Oracle, Hypoxia Forecaster) and Sustainable Fisheries (biodiversity EWS).",
                      color:C.q2,
                    },
                    {
                      org:"NOAA Sea Grant — Gulf of Mexico Regional Research Program",
                      type:"Competitive Research Grant",
                      amount:"$150K–$500K over 2–3 years",
                      deadline:"Pre-proposal typically due Q2; watch seagrant.noaa.gov for cycle",
                      contact:"Through scientist co-PI — their institutional Sea Grant office submits",
                      why:"The HAB Oracle is a textbook NOAA Sea Grant project: applied estuarine science with direct fisheries and public health relevance, novel methodology, and a coastal Alabama research partner as co-PI. The scientist you're meeting next week is the key — her institution's Sea Grant office handles the submission infrastructure. Your job is to produce the methodology documentation she needs to be competitive.",
                      color:C.q2,
                    },
                    {
                      org:"Gulf Coast Ecosystem Restoration Council (RESTORE Act)",
                      type:"Funded Science Program — Alabama Center of Excellence",
                      amount:"Subcontracts via DISL/ALCoE — $25K–$200K",
                      deadline:"ALCoE solicits projects periodically — monitor disl.edu",
                      contact:"Alabama Center of Excellence at DISL · disl.edu/research",
                      why:"DISL hosts Alabama's Center of Excellence funded by RESTORE Act dollars. ALCoE funds research that addresses Gulf ecosystem restoration needs. TERRAWATCH's real-time monitoring infrastructure, HAB prediction, and biodiversity tracking are directly relevant to the ALCoE mission. This is a subcontract opportunity, not a direct federal application — pitch DISL first, then they include TERRAWATCH in their ALCoE budget.",
                      color:C.q2,
                    },
                    {
                      org:"USDA Natural Resources Conservation Service — RCPP",
                      type:"Regional Conservation Partnership Program",
                      amount:"$200K–$2M over 5 years",
                      deadline:"RCPP applications typically open Q1; next cycle watch nrcs.usda.gov",
                      contact:"Alabama NRCS State Office · Montgomery, AL",
                      why:"RCPP funds partnerships that deliver conservation outcomes. A TERRAWATCH + TNC Gulf Coast + ADCNR partnership focused on saltmarsh carbon monitoring and wetland restoration verification would qualify under Agricultural Mitigation and Climate-Smart Agriculture. The blue carbon MRV capability is the core offering — NRCS needs verified wetland restoration outcomes for CRP payment verification.",
                      color:C.q2,
                    },
                    {
                      org:"EPA Clean Water Act Section 319 — Nonpoint Source Grants",
                      type:"State-administered federal grant (through ADEM)",
                      amount:"$50K–$300K per project",
                      deadline:"Alabama ADEM administers — typically open Q1–Q2 annually",
                      contact:"ADEM Nonpoint Source Program · Montgomery · (334) 271-7700",
                      why:"Alabama receives ~$5–8M/yr in Section 319 funds for nonpoint source pollution projects. TERRAWATCH's nonpoint source fingerprinting and cross-media pollutant tracker are precisely what Section 319 is designed to fund. ADEM is both the funder and a potential client — the same conversation opens both doors. The Dog River watershed, on ADEM's 303(d) impaired list, is an ideal first project.",
                      color:C.q2,
                    },
                    {
                      org:"Alabama Coastal Area Program — NOAA Coastal Zone Management",
                      type:"CZM Section 309 Enhancement Grants",
                      amount:"$25K–$150K",
                      deadline:"ADCNR administers — watch outdooralabama.com",
                      contact:"ADCNR Coastal Section · Gulf Shores, AL",
                      why:"NOAA's Coastal Zone Management Act Section 309 funds state enhancement activities including coastal hazards, wetlands, and cumulative impacts. Alabama's ADCNR receives and administers these funds. WetlandAI's preliminary delineation and TERRAWATCH's shoreline change detection both qualify. ADCNR also manages Weeks Bay NERR — giving you two entry points with one relationship.",
                      color:C.q2,
                    },
                  ].map(op=>(
                    <div key={op.org} style={{background:C.surface,border:`1px solid ${op.color}33`,
                      borderRadius:8,padding:"14px 18px",borderLeft:`3px solid ${op.color}`}}>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontSize:13,color:op.color,fontWeight:800}}>{op.org}</div>
                        <Tag color={op.color}>{op.type}</Tag>
                        <Tag color={C.t6}>{op.amount}</Tag>
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginBottom:6}}>
                        <span style={{color:C.q2,fontWeight:700}}>Deadline: </span>{op.deadline} ·
                        <span style={{color:C.text,fontWeight:700}}> Contact: </span>{op.contact}
                      </div>
                      <div style={{fontSize:11,color:C.text,lineHeight:1.75}}>{op.why}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: Local Client Prospects */}
              <div style={{background:C.panel,border:`1px solid ${C.t4}55`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t4}`}}>
                <div style={{fontSize:11,color:C.t4,fontWeight:800,marginBottom:14,
                  letterSpacing:"0.08em"}}>
                  LOCAL CLIENT PROSPECTS — MOBILE & BALDWIN COUNTY
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {
                      org:"Weeks Bay NERR — Fairhope, AL",
                      type:"Pilot Partner + SaaS Client",
                      speed:"FASTEST",speedColor:C.now,
                      revenue:"$299–$799/mo SaaS",
                      why:"Managed by ADCNR, located in Fairhope — maximum proximity. Already uses NERRS/CDMO feeds that are in TERRAWATCH. Angela Underwood (manager) can be the staff scientist relationship if your meeting contact doesn't pan out. They have active monitoring needs and NERRS Science Collaborative funding to pay for tools. One of the easiest possible first clients — walk-in distance from your base.",
                      action:"Call Angela Underwood before or after the scientist meeting. Offer a free 90-day pilot — all she needs to say yes is that it helps her monitoring program.",
                    },
                    {
                      org:"Dauphin Island Sea Lab (DISL) — Dauphin Island, AL",
                      type:"Research Partner + SaaS Client",
                      speed:"FAST",speedColor:C.q2,
                      revenue:"$799–$1,499/mo + ALCoE subcontract",
                      why:"DISL operates ARCOS — Alabama's Real-Time Coastal Observing System with 10 stations. They have been collecting real-time monitoring data in Mobile Bay since 2003. TERRAWATCH's unified feed registry is a direct complement to ARCOS. Alison Robertson at DISL is a HAB toxin specialist — a natural co-PI for the HAB Oracle grant. DISL also hosts the ALCoE RESTORE Act program.",
                      action:"Intro through MBNEP (DISL is a co-operator). Lead with the HAB Oracle — Robertson's HAB toxin research aligns perfectly with your prediction capability.",
                    },
                    {
                      org:"Mobile Bay National Estuary Program (MBNEP) — Mobile, AL",
                      type:"Pilot Partner + Grant Co-Applicant",
                      speed:"FAST",speedColor:C.q2,
                      revenue:"EPA NEP Watershed grant co-applicant ($100K–$500K)",
                      why:"The MBNEP is the EPA-funded backbone of Mobile Bay water quality management. They coordinate 14+ monitoring partners with data going to EPA WQX — exactly the compliance automation use case. Contact: mbnep@mobilebaynep.com · (251) 431-6409 · 118 N Royal St #604, Mobile. TERRAWATCH's automated EPA WQX submission is a direct cost-reduction tool for their data coordinator.",
                      action:"Cold email with a one-page capability summary specific to Mobile Bay. Lead with the compliance automation ROI: their data coordinator's time savings pays for the subscription.",
                    },
                    {
                      org:"Auburn University Marine Extension — Mobile, AL",
                      type:"Sea Grant Extension Partner",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"Sea Grant Extension subcontract + co-PI relationship",
                      why:"The Auburn University Marine Extension and Research Center is the Sea Grant extension office in Mobile — one of four regional offices for MASGC. They connect TERRAWATCH to the Sea Grant network of stakeholders (commercial fishers, marina operators, coastal municipalities) and to Auburn's grant application infrastructure. A Sea Grant Extension partnership is a force multiplier for the MASGC PD grant.",
                      action:"Attend the next Auburn Marine Extension public event or workshop. Introduce TERRAWATCH as a tool their extension clients can use. Ask about the current extension program priorities — they may have specific monitoring needs TERRAWATCH can fill.",
                    },
                    {
                      org:"Baldwin County Commission — Bay Minette, AL",
                      type:"Government Contract Client",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"$20K–$60K/yr monitoring contract",
                      why:"The Baldwin County Commission is already funding stream gauge monitoring through MBNEP and DISL (effective May 2025–April 2026). They adopted new LID stormwater regulations in January 2025 requiring LID design for high-density development — and they need a tool to evaluate stormwater designs. TERRAWATCH's stormwater and nonpoint source capabilities are a direct fit. This is the county that hosts BCEDA — SITEVAULT opens this door, then TERRAWATCH expands it.",
                      action:"The BCEDA relationship is the entry point. Once SITEVAULT is in conversation with BCEDA, ask for an introduction to the Baldwin County Engineer's office — the same meeting that advances SITEVAULT also opens the county environmental monitoring contract.",
                    },
                    {
                      org:"University of South Alabama — Marine Sciences",
                      type:"Academic Research Partner + SaaS Client",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"$299–$799/mo + NOAA Sea Grant co-PI",
                      why:"USA's Marine Sciences department conducts research on Mobile Bay, the northern Gulf, and coastal Alabama ecosystems. The department has 15+ faculty with active federal research grants (NOAA, NSF, EPA). A TERRAWATCH subscription makes sense for any faculty member doing field monitoring — and one faculty co-PI relationship opens the institutional grant application infrastructure (F&A rates, sponsored programs office) needed for NOAA Sea Grant.",
                      action:"Ask the staff scientist you're meeting next week for an introduction to the USA Marine Sciences department chair. If she's affiliated with USA, this is automatic.",
                    },
                    {
                      org:"ADEM Water Quality Program — Montgomery, AL",
                      type:"Regulatory Client + Grant Pathway",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"$50K–$200K/yr government contract",
                      why:"ADEM is the Alabama environmental regulatory agency — they administer Section 319 funds, manage the 303(d) impaired waters list, and operate the ADEM/ADPH Coastal Alabama Beach Monitoring Program (25 recreational sites). TERRAWATCH's automated EPA WQX submission and compliance reporting directly reduce ADEM's regulatory overhead. A TERRAWATCH contract with ADEM also creates a de facto state endorsement that opens every county and municipal environmental department in Alabama.",
                      action:"File a formal technical comment on ADEM's next 303(d) impaired waters assessment documenting that TERRAWATCH can provide operational source attribution for impaired watersheds. Request a technical assistance meeting.",
                    },
                    {
                      org:"Mobile Area Water & Sewer System (MAWSS)",
                      type:"Water Utility SaaS Client",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"$500–$2,000/mo SaaS subscription",
                      why:"MAWSS serves 400,000 people in Mobile County and draws from the Tombigbee-Warrior River system — at risk from cyanobacteria blooms during summer low-flow periods. EPA's cyanotoxin monitoring requirements are tightening. MAWSS needs advance warning before blooms reach their intake — exactly what TERRAWATCH's cyanobacteria early warning provides. MAWSS is also large enough to have a dedicated environmental compliance officer who can be the internal champion.",
                      action:"Cold call to MAWSS's Director of Water Quality. Lead with the Toledo 2014 case study and EPA's emerging cyanotoxin monitoring requirements. Offer a 90-day free pilot for summer 2026 bloom season — zero risk, immediate value demonstration.",
                    },
                    {
                      org:"Alabama Coastal Foundation",
                      type:"NGO Partner + Co-Applicant",
                      speed:"FAST",speedColor:C.q2,
                      revenue:"Grant co-applicant + co-marketing channel",
                      why:"The Alabama Coastal Foundation is the leading Gulf Coast conservation NGO in Alabama. They conduct shoreline restoration, marsh monitoring, and public education. TERRAWATCH's blue carbon MRV and shoreline change detection are direct tools for their mission. They can be a grant co-applicant (giving TERRAWATCH access to conservation grant programs it can't access alone) and a marketing channel to their donor and volunteer network.",
                      action:"Cold email to their executive director. Offer to build a free TERRAWATCH dashboard showing Alabama coastal habitat change since 2020 using Vexcel imagery — offer it as a public-facing tool for their stakeholder communications.",
                    },
                    {
                      org:"Alabama Seafood Marketing Commission",
                      type:"Industry Association Client",
                      speed:"FAST",speedColor:C.q2,
                      revenue:"Group subscription deal + HAB Oracle endorsement",
                      why:"The Alabama Seafood Marketing Commission promotes Alabama's commercial seafood industry. HAB closures are their #1 operational risk. A group subscription deal for all Alabama commercial shellfish harvesters — negotiated through the Commission — is more efficient than individual sales. Their endorsement of HAB Oracle also becomes a marketing asset and a regulator's evidence base for funding justification.",
                      action:"Present to the Commission at their next quarterly meeting. Bring the retrospective analysis showing how many 2019–2025 HAB closure events HAB Oracle would have predicted 48–72h early. Let the harvesters in the room calculate their own avoided losses.",
                    },
                    {
                      org:"South Alabama Land Trust (formerly Weeks Bay Foundation)",
                      type:"Conservation Partner",
                      speed:"MEDIUM",speedColor:C.q3,
                      revenue:"Blue carbon MRV contract + grant co-applicant",
                      why:"The South Alabama Land Trust manages 550+ members and has a mandate to protect coastal land and water resources through acquisitions, monitoring, and education. They are the fundraising arm for Weeks Bay Reserve. A TERRAWATCH partnership with the Land Trust enables joint grant applications for coastal habitat monitoring and opens the blue carbon MRV pathway for their protected properties.",
                      action:"Attend a South Alabama Land Trust board meeting or member event. These are held in Fairhope — walking distance from your base.",
                    },
                  ].map(c=>(
                    <div key={c.org} style={{background:C.surface,border:`1px solid ${C.border}`,
                      borderRadius:8,padding:"14px 16px",borderTop:`2px solid ${c.speedColor}`}}>
                      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:800}}>{c.org}</div>
                        <Tag color={c.speedColor}>{c.speed}</Tag>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
                        <Tag color={C.t4}>{c.type}</Tag>
                        <Tag color={C.t6}>{c.revenue}</Tag>
                      </div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.7,marginBottom:8}}>{c.why}</div>
                      <div style={{padding:"6px 10px",background:`${c.speedColor}10`,
                        border:`1px solid ${c.speedColor}33`,borderRadius:5,
                        fontSize:10,color:c.speedColor}}>
                        <strong>Action: </strong>{c.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: Strategic Partnerships */}
              <div style={{background:C.panel,border:`1px solid ${C.t6}55`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t6}`}}>
                <div style={{fontSize:11,color:C.t6,fontWeight:800,marginBottom:14,
                  letterSpacing:"0.08em"}}>
                  STRATEGIC PARTNERSHIPS — FORCE MULTIPLIERS
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {
                      org:"The Nature Conservancy — Gulf Coast Office",
                      value:"Blue carbon MRV market access · RCPP grant co-applicant · landowner network",
                      why:"TNC has relationships with coastal landowners across the Gulf Coast who want to monetize wetland conservation. TERRAWATCH provides the MRV infrastructure; TNC provides the landowners, the conservation finance relationships, and grant credibility. One TNC partnership unlocks the entire voluntary carbon market pathway for Gulf Coast saltmarsh.",
                      color:C.t6,
                    },
                    {
                      org:"Volkert Engineering / Goodwyn Mills Cawood",
                      value:"WetlandAI engineering firm license · ALDOT project pipeline · wetland delineation workflow",
                      why:"These are the two largest environmental engineering firms operating in Baldwin and Mobile counties. Both regularly conduct wetland delineations for ALDOT road projects, Baldwin County subdivision review, and private developer environmental assessments. WetlandAI as a professional tool subscription ($800–$2,500/mo) dramatically accelerates their delineation workflow. One engineering firm adoption creates a market standard that competitors feel pressure to match.",
                      color:C.t5,
                    },
                    {
                      org:"Alabama Cooperative Extension System — Auburn University",
                      value:"CAFO attribution methodology · agricultural landowner relationships · USDA grant co-PI",
                      why:"Auburn Extension has relationships with every agricultural producer in Alabama. The CAFO ammonia attribution capability is directly relevant to their mission of supporting responsible agricultural practice. A joint TERRAWATCH + Auburn Extension project on nutrient attribution in the Mobile Bay watershed would be fundable through USDA NRCS and EPA Section 319.",
                      color:C.q2,
                    },
                    {
                      org:"Marine Environmental Sciences Consortium (MESC) — 22 Alabama Universities",
                      value:"Multi-university SaaS adoption · research grant co-PI access · student data collection network",
                      why:"DISL's MESC includes 22 Alabama universities — every institution doing marine research in the state. A MESC-endorsed TERRAWATCH subscription creates a university consortium license opportunity ($299/institution/mo × 22 = $78,936/yr) and simultaneously creates 22 potential co-PI relationships for federal grant applications.",
                      color:C.t4,
                    },
                    {
                      org:"Phytoplankton Monitoring Network (DISL) + Alabama Water Watch",
                      value:"Citizen science data density · community engagement · iNaturalist observation network",
                      why:"DISL's Phytoplankton Monitoring Network trains volunteers to monitor HABs and report observations. Alabama Water Watch engages watershed stewards in volunteer water quality monitoring. Both networks generate exactly the citizen science data that powers TERRAWATCH's biodiversity crash EWS and HAB Oracle pre-screening layer. Partnering with both turns TERRAWATCH from a sensor platform into a community intelligence platform.",
                      color:C.t1,
                    },
                  ].map(p=>(
                    <div key={p.org} style={{background:C.surface,border:`1px solid ${p.color}33`,
                      borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${p.color}`}}>
                      <div style={{fontSize:12,color:p.color,fontWeight:800,marginBottom:4}}>{p.org}</div>
                      <div style={{fontSize:10,color:C.t6,fontWeight:600,marginBottom:8}}>{p.value}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.7}}>{p.why}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Priority action list */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>THIS WEEK — HIGHEST LEVERAGE ACTIONS ACROSS ALL 26 OPPORTUNITIES</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {n:"01",action:"Email MASGC PD grant inquiry",detail:"One-page concept note for HAB Oracle or biodiversity EWS pilot. $10K, rolling deadline, no competition window. File before the scientist meeting so you can mention it in the conversation.",color:C.now},
                    {n:"02",action:"Call Angela Underwood at Weeks Bay NERR",detail:"She's in Fairhope. Introduce TERRAWATCH, mention the Hatch connection, ask about her current monitoring pain points. Weeks Bay is the easiest first client in the entire list.",color:C.now},
                    {n:"03",action:"Email MBNEP Director of Science",detail:"mbnep@mobilebaynep.com — introduce TERRAWATCH, request 30 minutes. The MBNEP relationship is required before the NEP Watershed grant can be pursued. This is the entry point.",color:C.now},
                    {n:"04",action:"Research Alabama Seafood Marketing Commission meeting calendar",detail:"Book the next quarterly meeting as a presenter. This is the room where you get a group shellfish industry subscription — the fastest path to first paying SaaS revenue.",color:C.now},
                    {n:"05",action:"Look up Alabama Coastal Foundation executive director",detail:"Draft a one-email intro with an offer: 'I'll build you a free public-facing TERRAWATCH dashboard showing Alabama coastal habitat change for your next fundraising event.' No-cost offer that creates a high-value partnership.",color:C.q2},
                    {n:"06",action:"Monitor masgc.org for 2027–28 research competition pre-proposal opening",detail:"Set a calendar reminder for Q3 2026. The MASGC PD grant you file now becomes the pilot data that makes the full research competition application competitive next year.",color:C.q2},
                  ].map(({n,action,detail,color})=>(
                    <div key={n} style={{display:"flex",gap:12,padding:"12px 14px",
                      background:`${color}0a`,border:`1px solid ${color}33`,
                      borderRadius:7,alignItems:"flex-start"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",
                        background:`${color}22`,border:`2px solid ${color}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,color,fontWeight:800,flexShrink:0}}>{n}</div>
                      <div>
                        <div style={{fontSize:12,color,fontWeight:700,marginBottom:3}}>{action}</div>
                        <div style={{fontSize:11,color:C.muted,lineHeight:1.65}}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 6: STATE EXPANSION ══════════ */}
          {tab===9&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,
                border:`1px solid ${C.y2}55`,borderRadius:10,padding:"24px 30px",
                position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:"50%",height:"100%",
                  background:`radial-gradient(ellipse at right,${C.y2}08,transparent 70%)`}}/>
                <div style={{fontSize:8,color:C.y2,letterSpacing:"0.22em",marginBottom:8,
                  fontFamily:"'Fira Code',monospace"}}>
                  TERRAWATCH · STATE EXPANSION ROADMAP · GULF COAST → SOUTHEAST → NATIONAL
                </div>
                <h2 style={{fontSize:26,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.15}}>
                  Mobile Bay proves the model.<br/>
                  <span style={{color:C.y2}}>Six Gulf Coast states replicate it.</span>
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820,marginBottom:18}}>
                  Every environmental monitoring challenge TERRAWATCH solves in Mobile Bay exists identically across the Gulf Coast — and most of the Southeast. The same HAB prediction methodology, the same hypoxia forecaster, the same SITEVAULT EDA tool, and the same WetlandAI delineation engine are directly licensable to Mississippi, Florida, Louisiana, Georgia, and Tennessee with no architecture changes. The question is sequence — which state, which agency, in what order, using what intro.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
                  {[
                    {l:"Phase 1 targets",v:"MS + FL",c:C.now},
                    {l:"Phase 2 targets",v:"LA + GA",c:C.q2},
                    {l:"Phase 3 targets",v:"TN + SC",c:C.q3},
                    {l:"National potential",v:"50 states",c:C.y2},
                    {l:"EPA Region 4 states",v:"8 states",c:C.y3},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:"rgba(10,61,43,0.07)",border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:7,padding:"10px 14px"}}>
                      <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace",lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:4}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expansion logic */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>THE EXPANSION LOGIC — WHY THIS SCALES NATURALLY</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {title:"The data infrastructure is already built",color:C.t1,
                      body:"USGS NWIS, EPA AQS, NOAA CO-OPS, NERRS, CMEMS — every feed in TERRAWATCH is a national network. Adding a Mississippi monitoring station requires a new database row and a new NERRS CDMO endpoint. The integration work is done. Marginal cost of adding a new state: near zero."},
                    {title:"The Vexcel imagery is the only state-specific cost",color:C.t2,
                      body:"A new state AOI requires a new Vexcel imagery license for that geography. Estimated $800–$2,400/mo depending on coverage area. Every other infrastructure cost — Claude API, Neon PostgreSQL, Replit hosting, Twilio — scales fractionally. New state ARR dramatically exceeds new state cost."},
                    {title:"MASGC already bridges Alabama and Mississippi",color:C.q2,
                      body:"The Mississippi-Alabama Sea Grant Consortium funds research in both states simultaneously. A MASGC grant for HAB Oracle methodology validation automatically covers both Alabama AND Mississippi deployment. One grant, two state presences, no additional overhead."},
                    {title:"SITEVAULT EDAs are the sales channel",color:C.t3,
                      body:"Every state has an economic development network. The Alabama EDA Association → Southeast EDA peer network → National Development Council creates a natural referral chain. One BCEDA success story told at the Southeast EDA conference reaches 200+ EDA professionals across 10 states."},
                    {title:"NERRS provides instant national reach",color:C.t4,
                      body:"There are 30 NERRS reserves nationwide. A Weeks Bay NERR pilot that proves TERRAWATCH's value will be presented at the NERRA annual conference — where all 30 reserve managers attend. One successful reserve deployment can cascade into 5–10 new reserve relationships in 12 months."},
                    {title:"EPA Region 4 is the unlock for the Southeast",color:C.now,
                      body:"EPA Region 4 covers Alabama, Mississippi, Florida, Georgia, Tennessee, North Carolina, South Carolina, and Kentucky — 8 states from one regional office in Atlanta. A single EPA Region 4 contract for TMDL support or PFAS attribution creates regulatory standing across all 8 states simultaneously."},
                  ].map(({title,color,body})=>(
                    <div key={title} style={{background:C.surface,border:`1px solid ${color}33`,
                      borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${color}`}}>
                      <div style={{fontSize:12,color,fontWeight:700,marginBottom:6}}>{title}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.75}}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* State-by-state profiles */}
              <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",
                fontFamily:"'Fira Code',monospace",marginBottom:4}}>
                STATE-BY-STATE EXPANSION PROFILES
              </div>

              {/* PHASE 1: MS + FL */}
              <div style={{background:C.panel,border:`1px solid ${C.now}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.now}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
                  <Tag color={C.now}>PHASE 1</Tag>
                  <div style={{fontSize:13,color:C.now,fontWeight:800}}>Year 2 — Mississippi & Florida</div>
                  <div style={{fontSize:10,color:C.muted}}>Highest strategic priority · natural adjacency · shared funding networks</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {/* Mississippi */}
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                    borderTop:`3px solid ${C.now}`,padding:"16px 18px"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:22}}>🌊</span>
                      <div>
                        <div style={{fontSize:14,color:C.ink,fontWeight:800}}>Mississippi</div>
                        <div style={{fontSize:10,color:C.muted}}>Biloxi · Gulfport · Pascagoula · Jackson</div>
                      </div>
                    </div>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:10,color:C.now,fontWeight:700,marginBottom:4}}>WHY NEXT</div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.75}}>
                        Mississippi has the identical HAB problem as Alabama — the MDEQ actively manages HAB advisories across 21 Gulf Coast beach monitoring stations with no predictive capability. MASGC already covers both states, meaning a Mississippi extension of the MASGC grant is structurally simple. The Grand Bay National Estuarine Research Reserve (NERRS) on the MS-AL border is already in DISL's monitoring network and represents a near-zero-friction second reserve deployment.
                      </p>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:C.t3,fontWeight:700,marginBottom:6}}>SITEVAULT OPPORTUNITY</div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.7}}>
                        Mississippi Development Authority (MDA) is the state EDA — directly analogous to BCEDA. Port of Gulfport expansion and Stennis Space Center aerospace corridor are active industrial development priorities. A SITEVAULT demo to MDA can follow the BCEDA case study as a proven product.
                      </p>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:C.t6,fontWeight:700,marginBottom:6}}>KEY CONTACTS & ENTRY POINTS</div>
                      {[
                        "Grand Bay NERR — 30 minutes from Mobile. Contact: Ramona Pace-Graczyk",
                        "MDEQ Beach Monitoring Program — HAB advisory system. Identical pain point.",
                        "Mississippi-Alabama Sea Grant — already your funder, covers MS equally",
                        "Mississippi State University Gulf Coast Research Lab — Ocean Springs, MS",
                        "Mississippi Development Authority — Port of Gulfport industrial expansion",
                      ].map(c=>(
                        <div key={c} style={{display:"flex",gap:8,padding:"4px 0",
                          borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                          <span style={{color:C.now,flexShrink:0}}>→</span>{c}
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"8px 10px",background:`${C.now}10`,border:`1px solid ${C.now}33`,
                      borderRadius:5,fontSize:10,color:C.now}}>
                      <strong>Revenue target Y2:</strong> MDEQ contract ($50–100K) + Grand Bay NERR SaaS ($799/mo) + MDA SITEVAULT pilot ($30K) = ~$140K/yr
                    </div>
                  </div>

                  {/* Florida */}
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                    borderTop:`3px solid ${C.now}`,padding:"16px 18px"}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                      <span style={{fontSize:22}}>🌺</span>
                      <div>
                        <div style={{fontSize:14,color:C.ink,fontWeight:800}}>Florida</div>
                        <div style={{fontSize:10,color:C.muted}}>Pensacola · Panama City · Tampa · Miami</div>
                      </div>
                    </div>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:10,color:C.now,fontWeight:700,marginBottom:4}}>WHY NEXT</div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.75}}>
                        Florida has the most severe HAB crisis in the continental US — Karenia brevis red tides cause billions in coastal economic damage annually. Florida Fish and Wildlife Research Institute (FWRI) monitors HABs but has no predictive system. Florida's Panhandle is geographically adjacent to Alabama and culturally identical in the commercial fishing and tourism economy. Pensacola Bay is the next estuary east.
                      </p>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:C.t5,fontWeight:700,marginBottom:6}}>WETLANDAI OPPORTUNITY</div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.7}}>
                        Florida has the most active Section 404 wetland permitting program in the US — thousands of delineations per year from a massive development industry. Florida DEP, FDOT, and hundreds of environmental consulting firms are all potential WetlandAI clients. One Florida engineering firm license opens a state with 10× the development activity of Alabama.
                      </p>
                    </div>
                    <div style={{marginBottom:10}}>
                      <div style={{fontSize:10,color:C.t6,fontWeight:700,marginBottom:6}}>KEY CONTACTS & ENTRY POINTS</div>
                      {[
                        "Florida FWRI HAB Monitoring Program — St. Petersburg · habmonitoring@myfwc.com",
                        "Pensacola Bay NERRS — Navarre, FL · immediately adjacent to Alabama",
                        "Gulf and South Atlantic Fisheries Foundation — Tampa · industry grant channel",
                        "Florida DEP Wetlands Program — Tallahassee · WetlandAI regulatory pathway",
                        "Escambia County Water Quality (Pensacola Bay Partnership) — county client",
                      ].map(c=>(
                        <div key={c} style={{display:"flex",gap:8,padding:"4px 0",
                          borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                          <span style={{color:C.now,flexShrink:0}}>→</span>{c}
                        </div>
                      ))}
                    </div>
                    <div style={{padding:"8px 10px",background:`${C.now}10`,border:`1px solid ${C.now}33`,
                      borderRadius:5,fontSize:10,color:C.now}}>
                      <strong>Revenue target Y2:</strong> FWRI HAB contract ($75–150K) + WetlandAI FL consulting firms ($2,500/mo × 3) + Pensacola Bay NERR ($799/mo) = ~$175K/yr
                    </div>
                  </div>
                </div>
              </div>

              {/* PHASE 2: LA + GA */}
              <div style={{background:C.panel,border:`1px solid ${C.q2}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.q2}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
                  <Tag color={C.q2}>PHASE 2</Tag>
                  <div style={{fontSize:13,color:C.q2,fontWeight:800}}>Year 2–3 — Louisiana & Georgia</div>
                  <div style={{fontSize:10,color:C.muted}}>Large markets · major environmental challenges · established federal funding networks</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {
                      state:"Louisiana", icon:"🦐",
                      cities:"New Orleans · Baton Rouge · Lafayette · Lake Charles",
                      why:"Louisiana has the most severe coastal environmental crisis in the US — 2,000+ square miles of land lost, the Gulf dead zone directly fed by Mississippi River nutrient loading, and one of the largest commercial fishing industries in the country. TERRAWATCH's hypoxia forecaster and blue carbon MRV are extraordinarily relevant. The Louisiana Coastal Protection and Restoration Authority (CPRA) spends $1B+ annually on coastal restoration and needs monitoring infrastructure.",
                      sitevault:"Louisiana Economic Development (LED) manages major industrial sites along the Mississippi River corridor — refineries, LNG facilities, chemical plants. The SITEVAULT industrial site intelligence platform maps directly onto their site selection and industrial corridor management needs.",
                      contacts:[
                        "Louisiana CPRA — Baton Rouge · major restoration funder",
                        "LSU AgCenter Coastal Sustainability Studio — research partner",
                        "Barataria-Terrebonne National Estuary Program — BTNEP",
                        "Louisiana Department of Wildlife and Fisheries — commercial fishing",
                        "Louisiana Economic Development (LED) — SITEVAULT target",
                      ],
                      revenue:"CPRA monitoring contract ($100–300K) + LED SITEVAULT ($60K) + LSU research partnership = ~$250K/yr",
                      color:C.q2,
                    },
                    {
                      state:"Georgia", icon:"🍑",
                      cities:"Savannah · Brunswick · Atlanta · Augusta",
                      why:"Georgia has the fastest-growing coastal development pressure in the Southeast — Chatham County and the Golden Isles are experiencing explosive population growth with major wetland permitting implications. WetlandAI is the primary entry point. Georgia's coastal marshes are protected under the Georgia Marshlands Act, creating active monitoring and compliance needs. The Savannah Harbor deepening project created a decade of environmental monitoring requirements.",
                      sitevault:"Georgia Department of Economic Development (GDEcD) manages one of the most active industrial recruitment programs in the Southeast — landing major automotive (Hyundai Metaplant, Rivian) and logistics investments. SITEVAULT's industrial site intelligence is a direct fit for GDEcD's competitive needs.",
                      contacts:[
                        "Georgia DNR Coastal Resources Division — Brunswick",
                        "Sapelo Island NERRS — Darien, GA · NERRS network entry point",
                        "University of Georgia Marine Extension — Brunswick",
                        "Georgia DPH Environmental Health — coastal water quality",
                        "Georgia Department of Economic Development — SITEVAULT",
                      ],
                      revenue:"WetlandAI GA consulting firms ($2,500/mo × 5) + GDEcD SITEVAULT ($60K) + Sapelo NERR ($799/mo) = ~$220K/yr",
                      color:C.q2,
                    },
                  ].map(s=>(
                    <div key={s.state} style={{background:C.surface,borderRadius:8,
                      border:`1px solid ${C.border}`,borderTop:`3px solid ${s.color}`,padding:"16px 18px"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                        <span style={{fontSize:22}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:14,color:C.ink,fontWeight:800}}>{s.state}</div>
                          <div style={{fontSize:10,color:C.muted}}>{s.cities}</div>
                        </div>
                      </div>
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:10,color:s.color,fontWeight:700,marginBottom:4}}>WHY THIS MARKET</div>
                        <p style={{fontSize:11,color:C.muted,lineHeight:1.7}}>{s.why}</p>
                      </div>
                      <div style={{marginBottom:10}}>
                        <div style={{fontSize:10,color:C.t3,fontWeight:700,marginBottom:4}}>SITEVAULT ANGLE</div>
                        <p style={{fontSize:11,color:C.muted,lineHeight:1.7}}>{s.sitevault}</p>
                      </div>
                      <div style={{marginBottom:10}}>
                        {s.contacts.map(c=>(
                          <div key={c} style={{display:"flex",gap:8,padding:"4px 0",
                            borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                            <span style={{color:s.color,flexShrink:0}}>→</span>{c}
                          </div>
                        ))}
                      </div>
                      <div style={{padding:"8px 10px",background:`${s.color}10`,
                        border:`1px solid ${s.color}33`,borderRadius:5,fontSize:10,color:s.color}}>
                        <strong>Revenue target:</strong> {s.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PHASE 3: TN + SC + Beyond */}
              <div style={{background:C.panel,border:`1px solid ${C.q3}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.q3}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
                  <Tag color={C.q3}>PHASE 3</Tag>
                  <div style={{fontSize:13,color:C.q3,fontWeight:800}}>Year 3+ — Tennessee, South Carolina, National Platform</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {[
                    {
                      state:"Tennessee", icon:"🎸",
                      why:"Tennessee has 21 EPA-designated impaired reservoirs and rivers, TVA manages a massive dam and reservoir network with active water quality monitoring requirements, and freshwater HABs in Tennessee Valley reservoirs are a growing public health crisis. The TVA Environmental Stewardship program alone represents a $50–200K/yr contract target for TERRAWATCH's reservoir cyanobacteria early warning. Chattanooga and Nashville are tech-hub cities with environmental tech investment communities.",
                      revenue:"TVA reservoir cyanobacteria warning ($100–200K) + TN TDEC water quality ($50–100K) + freshwater salinization road salt (I-40/I-24 corridors) = ~$250K/yr",
                      color:C.q3,
                    },
                    {
                      state:"South Carolina", icon:"🦞",
                      why:"South Carolina has Clemson's technology village program — the literal model on which Hatch Fairhope was based. A TERRAWATCH + SITEVAULT deployment in South Carolina would connect to the Clemson network that inspired Hatch. Charleston Harbor and the ACE Basin are among the Southeast's most ecologically significant estuaries. The ACE Basin NERRS is one of the largest undeveloped estuaries on the East Coast and a perfect TERRAWATCH deployment site.",
                      revenue:"ACE Basin NERRS ($799/mo) + Clemson extension partnership + Charleston Harbor monitoring ($30–60K) + SITEVAULT SC EDA ($60K) = ~$140K/yr",
                      color:C.q3,
                    },
                  ].map(s=>(
                    <div key={s.state} style={{background:C.surface,borderRadius:8,
                      border:`1px solid ${C.border}`,borderTop:`3px solid ${s.color}`,padding:"14px 16px"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
                        <span style={{fontSize:20}}>{s.icon}</span>
                        <div style={{fontSize:14,color:C.ink,fontWeight:800}}>{s.state}</div>
                      </div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:10}}>{s.why}</p>
                      <div style={{padding:"8px 10px",background:`${s.color}10`,
                        border:`1px solid ${s.color}33`,borderRadius:5,fontSize:10,color:s.color}}>
                        <strong>Revenue target:</strong> {s.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* National platform unlock */}
              <div style={{background:C.panel,border:`1px solid ${C.y2}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.y2}`}}>
                <div style={{fontSize:11,color:C.y2,fontWeight:800,marginBottom:14,letterSpacing:"0.08em"}}>
                  NATIONAL PLATFORM UNLOCKS — SINGLE EVENTS THAT OPEN 10+ STATES SIMULTANEOUSLY
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {
                      unlock:"EPA Region 4 Contract",
                      color:C.now,
                      states:"AL · MS · FL · GA · TN · NC · SC · KY",
                      what:"One EPA Region 4 contract for TMDL revision support, PFAS attribution, or HAB monitoring creates regulatory standing in all 8 states simultaneously. EPA Region 4's Atlanta office coordinates water quality across the entire Southeast. A contract with Region 4 is the equivalent of 8 individual state agency sales made in one deal.",
                      path:"File TMDL technical comment on Mobile Bay → request meeting with EPA Region 4 Water Quality Program in Atlanta → propose TERRAWATCH as the monitoring infrastructure for regional TMDL recalculation effort.",
                      value:"$300K–$800K/yr · 8 states · regulatory credibility nationally",
                    },
                    {
                      unlock:"NERRS Science Collaborative Proposal",
                      color:C.t1,
                      states:"30 NERRS reserves nationally",
                      what:"A successful NERRS Science Collaborative grant proposal — filed with Weeks Bay as the lead reserve — creates a multi-reserve research network that spans multiple states. Previous NERRS collaborative projects have included 5–15 reserves in a single grant. One grant = TERRAWATCH deployed at reserves in Alabama, Mississippi, Georgia, South Carolina, and Florida simultaneously.",
                      path:"Weeks Bay pilot → document outcomes → file NERRS Science Collaborative proposal for a multi-reserve HAB + water quality monitoring methodology with 5 Gulf and Southeast reserves as partners.",
                      value:"$500K–$1.5M grant · 5–15 reserve deployments · national NERRS network presence",
                    },
                    {
                      unlock:"AWWA Southern Section Conference",
                      color:C.t4,
                      states:"AL · MS · FL · GA · TN · SC",
                      what:"The American Water Works Association Southern Section covers all southeastern water utilities. A 30-minute breakout presentation on TERRAWATCH's cyanobacteria early warning for drinking water reservoirs reaches 200+ utility directors from all six Phase 1–2 states in one afternoon. Water utility buyers are budget-certain and regulatory-driven — MAWSS pilot data is the proof they need.",
                      path:"MAWSS pilot summer 2026 → document performance data → submit conference abstract to AWWA Southern Section annual meeting (typically October) → present case study with MAWSS endorsement.",
                      value:"$500–$2,000/mo per utility × 50+ utilities across 6 states = $600K+/yr national utility ARR",
                    },
                    {
                      unlock:"Gulf of Mexico Alliance Annual Meeting",
                      color:C.t6,
                      states:"AL · MS · FL · LA · TX + Mexico",
                      what:"The Gulf of Mexico Alliance Annual Meeting brings together environmental managers, agency scientists, and research leaders from all five US Gulf states plus Mexico. A TERRAWATCH presentation — particularly the HAB Oracle validated on Mobile Bay data — immediately positions the platform as the Gulf-wide environmental intelligence standard. This is the single most efficient room to be in for Gulf Coast expansion.",
                      path:"Attend as a presenter in Year 1 (Month 8–10). Present HAB Oracle validation results from Mobile Bay summer 2026 season. Invite MBNEP and DISL to co-present — their institutional credibility carries TERRAWATCH's commercial pitch.",
                      value:"Introduction to 200+ Gulf Coast environmental leaders · opens TX, LA, MS, FL in one event",
                    },
                    {
                      unlock:"Southeast EDA Conference — SITEVAULT",
                      color:C.t3,
                      states:"AL · MS · FL · GA · TN · SC + regional",
                      what:"Economic Development organizations across the Southeast share conference networks — the Southern Economic Development Council (SEDC) and the Alabama Economic Development Association are the primary channels. One BCEDA success story presented at the SEDC annual conference reaches EDA directors from 15+ states. SITEVAULT's industrial site intelligence is differentiated enough that one good case study sells itself.",
                      path:"BCEDA pilot → $60K/yr contract signed → present at Alabama EDA Association meeting → present at SEDC annual conference (Year 2) with BCEDA CEO Lee Lawson as co-presenter.",
                      value:"SITEVAULT license × 10 state EDAs × $60K/yr = $600K/yr SITEVAULT ARR nationally",
                    },
                    {
                      unlock:"Publish HAB Oracle in Harmful Algae Journal",
                      color:C.y2,
                      states:"National + international",
                      what:"One peer-reviewed publication in Harmful Algae or Estuarine, Coastal and Shelf Science transforms TERRAWATCH from a startup into an institutionally credible platform that every NOAA regional office, state environmental agency, and university marine program takes seriously. Scientific publication is the most efficient possible marketing for the government and academic buyer segments — and it's free.",
                      path:"Scientist co-PI drafts the methodology paper during the pilot period (Month 3–6). TERRAWATCH funds the open-access publication fee (~$2,500). Submit by Month 9, accepted by Month 15. Every state agency in the US reads Harmful Algae.",
                      value:"National scientific credibility · opens every state environmental agency simultaneously · supports federal grant applications in perpetuity",
                    },
                  ].map(u=>(
                    <div key={u.unlock} style={{background:C.surface,border:`1px solid ${u.color}33`,
                      borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${u.color}`}}>
                      <div style={{fontSize:12,color:u.color,fontWeight:800,marginBottom:4}}>{u.unlock}</div>
                      <div style={{marginBottom:8}}>
                        <Tag color={u.color}>{u.states}</Tag>
                      </div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:8}}>{u.what}</p>
                      <div style={{padding:"6px 10px",background:C.panel,border:`1px solid ${C.border}`,
                        borderRadius:5,fontSize:10,color:C.muted,marginBottom:8}}>
                        <strong style={{color:C.text}}>Path: </strong>{u.path}
                      </div>
                      <div style={{fontSize:10,color:u.color,fontWeight:600}}>{u.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue projection table */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>STATE EXPANSION REVENUE PROJECTION</div>
                <div style={{display:"grid",
                  gridTemplateColumns:"1fr 80px 80px 80px 80px 180px",
                  gap:8,fontSize:10,color:C.muted,padding:"6px 0",
                  borderBottom:`1px solid ${C.border2}`,letterSpacing:"0.08em",fontWeight:600}}>
                  {["STATE","Y1","Y2","Y3","Y4","PRIMARY PRODUCT"].map(h=>(
                    <span key={h} style={{textAlign:h==="STATE"||h==="PRIMARY PRODUCT"?"left":"right"}}>{h}</span>
                  ))}
                </div>
                {[
                  {state:"Alabama (base)",y1:"$102K",y2:"$420K",y3:"$900K",y4:"$1.4M",product:"TERRAWATCH + SITEVAULT + WetlandAI",color:C.t1},
                  {state:"Mississippi",y1:"—",y2:"$140K",y3:"$280K",y4:"$450K",product:"TERRAWATCH HAB + MDEQ + Grand Bay NERR",color:C.now},
                  {state:"Florida",y1:"—",y2:"$175K",y3:"$400K",y4:"$650K",product:"FWRI HAB + WetlandAI consulting + Panhandle NERRS",color:C.now},
                  {state:"Louisiana",y1:"—",y2:"—",y3:"$250K",y4:"$500K",product:"CPRA monitoring + LED SITEVAULT + blue carbon",color:C.q2},
                  {state:"Georgia",y1:"—",y2:"—",y3:"$220K",y4:"$420K",product:"WetlandAI + GDEcD SITEVAULT + Sapelo NERR",color:C.q2},
                  {state:"Tennessee",y1:"—",y2:"—",y3:"$250K",y4:"$400K",product:"TVA reservoir cyanobacteria + TDEC water quality",color:C.q3},
                  {state:"South Carolina",y1:"—",y2:"—",y3:"$140K",y4:"$300K",product:"ACE Basin NERR + SC EDA SITEVAULT",color:C.q3},
                  {state:"National unlocks",y1:"—",y2:"—",y3:"$500K",y4:"$2M",product:"EPA Region 4 + NERRS network + AWWA Southern",color:C.y2},
                  {state:"TOTAL",y1:"$102K",y2:"$735K",y3:"$2.94M",y4:"$6.12M",product:"All states + national contracts",color:C.y3,bold:true},
                ].map(({state,y1,y2,y3,y4,product,color,bold})=>(
                  <div key={state} style={{display:"grid",
                    gridTemplateColumns:"1fr 80px 80px 80px 80px 180px",
                    gap:8,padding:"8px 0",alignItems:"center",
                    borderBottom:`1px solid ${C.border}`,
                    background:bold?C.dim:"transparent",
                    borderRadius:bold?4:0,
                    paddingLeft:bold?8:0,
                    fontWeight:bold?700:400}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
                      <span style={{fontSize:12,color:bold?C.white:C.text}}>{state}</span>
                    </div>
                    {[y1,y2,y3,y4].map((v,i)=>(
                      <div key={i} style={{textAlign:"right",fontSize:11,
                        color:v==="—"?C.muted:bold?C.y3:color,
                        fontFamily:"'Fira Code',monospace"}}>{v}</div>
                    ))}
                    <div style={{fontSize:10,color:C.muted}}>{product}</div>
                  </div>
                ))}
              </div>

              {/* Expansion action list */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:12,
                  fontFamily:"'Fira Code',monospace"}}>START EXPANSION NOW — ACTIONS THAT COST NOTHING TODAY</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {n:"A",action:"Email Grand Bay NERR manager",detail:"Grand Bay is 30 minutes from Mobile and is on the MS-AL border. An intro email mentioning Weeks Bay NERR as a parallel contact establishes a two-reserve relationship before you've left the county.",color:C.now},
                    {n:"B",action:"Research Florida FWRI HAB program contacts",detail:"Florida Fish and Wildlife Research Institute publishes HAB cell counts daily. Their HAB program director is the person to reach. A cold email with the Mobile Bay HAB Oracle methodology as a one-pager is a warm intro — they have the exact same problem.",color:C.now},
                    {n:"C",action:"Submit abstract to Gulf of Mexico Alliance 2026 Annual Meeting",detail:"Call for papers typically opens 6 months before. Book your speaker slot now for a Year 1 Month 8-10 presentation. MBNEP and DISL can co-present to add institutional credibility.",color:C.q2},
                    {n:"D",action:"Draft the Harmful Algae journal submission outline",detail:"Ask the staff scientist next week if she'd be willing to co-author the HAB Oracle methodology paper. If yes, begin the outline immediately — the 6-month pilot gives you validation data for the submission.",color:C.q2},
                    {n:"E",action:"Register for SEDC (Southern Economic Development Council) annual conference",detail:"The SEDC conference is where SITEVAULT becomes a regional product. Attendance now, before you have the BCEDA contract, gives you the relationship context that makes the presentation land when you return as a case study.",color:C.q3},
                    {n:"F",action:"Research TVA Environmental Stewardship program contacts",detail:"Tennessee Valley Authority manages reservoir water quality across 7 states. Their Environmental Stewardship program is a direct TERRAWATCH contract target — and the cyanobacteria early warning for drinking water reservoirs is the flagship feature for their system.",color:C.q3},
                  ].map(({n,action,detail,color})=>(
                    <div key={n} style={{display:"flex",gap:12,padding:"12px 14px",
                      background:`${color}0a`,border:`1px solid ${color}33`,
                      borderRadius:7,alignItems:"flex-start"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",
                        background:`${color}22`,border:`2px solid ${color}`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:11,color,fontWeight:800,flexShrink:0}}>{n}</div>
                      <div>
                        <div style={{fontSize:12,color,fontWeight:700,marginBottom:3}}>{action}</div>
                        <div style={{fontSize:11,color:C.muted,lineHeight:1.65}}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 7: PRIVATE SECTOR ══════════ */}
          {tab===10&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,
                border:`1px solid ${C.t6}55`,borderRadius:10,padding:"24px 30px",
                position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:"45%",height:"100%",
                  background:`radial-gradient(ellipse at right,${C.t6}08,transparent 70%)`}}/>
                <div style={{fontSize:8,color:C.t6,letterSpacing:"0.22em",marginBottom:8,
                  fontFamily:"'Fira Code',monospace"}}>
                  ALABAMA PRIVATE SECTOR · FASTEST CASH · NO GRANT CYCLES
                </div>
                <h2 style={{fontSize:26,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.15}}>
                  Private companies pay faster,<br/>
                  <span style={{color:C.t6}}>negotiate less, and renew automatically.</span>
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820,marginBottom:16}}>
                  Grants take 6–18 months. Government contracts take 6–12 months. A private oyster farmer whose entire summer harvest is at risk will pay for HAB Oracle in a single phone call. A Baldwin County developer staring at a $75,000 wetland delineation quote will buy WetlandAI pre-screening in one email. The private sector is where you build the revenue base that makes every grant application look like a proven business rather than a research experiment.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {l:"Fastest close",v:"7 days",c:C.now,sub:"Oyster farm subscription"},
                    {l:"Largest single deal",v:"$75K",c:C.t6,sub:"Developer wetland pre-screen"},
                    {l:"Best recurring revenue",v:"$499/mo",c:C.y2,sub:"Env consulting firm SaaS"},
                    {l:"Highest margin",v:"92%",c:C.t1,sub:"Software on existing infrastructure"},
                  ].map(({l,v,c,sub})=>(
                    <div key={l} style={{background:"rgba(10,61,43,0.06)",
                      border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"12px 14px"}}>
                      <div style={{fontSize:22,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace",lineHeight:1}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:4}}>{l}</div>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",marginTop:2}}>{sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The private sector pitch framework */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:12,fontFamily:"'Fira Code',monospace"}}>
                  THE PRIVATE SECTOR PITCH FRAMEWORK — DIFFERENT FROM GOVERNMENT SALES
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {title:"Lead with dollars, not science",color:C.now,
                      body:"Government buyers respond to methodology papers and regulatory alignment. Private buyers respond to avoided losses and time saved. Open every private sector conversation with: 'How much did your last HAB closure cost you?' or 'What did your last wetland delineation run?' Then show how TERRAWATCH reduces that number."},
                    {title:"Show the math in the first 60 seconds",color:C.t6,
                      body:"HAB Oracle: $299/mo = $3,588/yr. One prevented 3-day shellfish closure saves $3,000–$15,000 in avoided loss. ROI is self-evident before you explain how it works. WetlandAI: $1,500 pre-screen vs. $15,000–$75,000 field delineation. The price comparison sells itself. Always lead with the math."},
                    {title:"Free trial removes all risk",color:C.t1,
                      body:"Private sector buyers are risk-averse about new software. A 60–90 day free trial with no credit card required eliminates the decision friction entirely. You want them using the product before the conversation about price. A farmer who has watched HAB Oracle predict two events correctly will not cancel their subscription."},
                  ].map(({title,color,body})=>(
                    <div key={title} style={{background:C.surface,border:`1px solid ${color}33`,
                      borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${color}`}}>
                      <div style={{fontSize:12,color,fontWeight:800,marginBottom:6}}>{title}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.75}}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VERTICAL 1: AQUACULTURE */}
              <div style={{background:C.panel,border:`1px solid ${C.now}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.now}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🦪</span>
                  <div style={{fontSize:14,color:C.now,fontWeight:800}}>Alabama Oyster Farms & Aquaculture</div>
                  <Tag color={C.now}>FASTEST CLOSE</Tag>
                  <Tag color={C.t6}>$99–$299/mo</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:14}}>
                  Alabama has 18 permitted oyster farms with $3.2M in annual farm gate value. Every single one operates under a conditional water quality approval that can be suspended the moment ADPH detects a HAB event — with zero advance warning currently. One missed summer weekend costs a farm $3,000–$15,000. HAB Oracle gives them 48–72 hours. The math closes itself.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.now,fontWeight:700,marginBottom:8}}>NAMED TARGET FARMS — CALL LIST</div>
                    {[
                      {name:"Murder Point Oyster Co.",loc:"Bayou La Batre, AL",note:"Largest AL oyster brand, 20M oysters/yr, ships nationally. HAB closure = $50K+ loss event."},
                      {name:"Navy Cove Oysters",loc:"Bon Secour, AL",note:"Expanding operation, farm tours, owner Chuck Wilson is vocal industry leader. Active MASGC contact."},
                      {name:"Sweet Water Oysters",loc:"Mobile Bay",note:"Premium half-shell market. One HAB weekend = entire wholesale order cancelled."},
                      {name:"Heron Bay Oysters",loc:"Mobile Bay",note:"Smaller operation, highly price-sensitive — offer the $99/mo Farmer tier."},
                      {name:"Double D Oyster Co.",loc:"Theodore, AL",note:"Also a seed supplier — serves 18+ farms. A TERRAWATCH relationship with them reaches every farm in the state."},
                      {name:"Gulf of America IMTA Project",loc:"Dauphin Island",note:"Federal aquaculture demo project led by DISL — institutional buyer with federal budget."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}
                          <span style={{fontSize:9,color:C.muted,fontWeight:400,marginLeft:6}}>{f.loc}</span>
                        </div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                      padding:"14px 16px",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.now,fontWeight:700,marginBottom:8}}>PRICING TIERS FOR THIS VERTICAL</div>
                      {[
                        {tier:"Farmer Tier",price:"$99/mo",includes:"HAB Oracle alerts via SMS + email, 48h advance warning, one bay location"},
                        {tier:"Farm Manager",price:"$199/mo",includes:"All of Farmer + 5 bay locations, harvest scheduling integration, weekly forecast PDF"},
                        {tier:"Multi-Farm",price:"$299/mo",includes:"Unlimited locations, API access, custom alert thresholds, seasonal analytics report"},
                      ].map(t=>(
                        <div key={t.tier} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                            <span style={{fontSize:12,color:C.text,fontWeight:600}}>{t.tier}</span>
                            <span style={{fontSize:13,color:C.now,fontWeight:800,fontFamily:"'Fira Code',monospace"}}>{t.price}</span>
                          </div>
                          <div style={{fontSize:10,color:C.muted}}>{t.includes}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:`${C.now}0f`,border:`1px solid ${C.now}33`,borderRadius:8,padding:"14px 16px"}}>
                      <div style={{fontSize:11,color:C.now,fontWeight:700,marginBottom:6}}>THE SALES CALL — WORD FOR WORD</div>
                      <div style={{fontSize:11,color:C.text,lineHeight:1.85,fontStyle:"italic"}}>
                        "Hey [name], I'm Max Hansen from TERRAWATCH in Fairhope. I'm reaching out to Alabama oyster farmers because we've built a 48-hour Harmful Algal Bloom prediction system for Mobile Bay — it's the first one that exists for Gulf Coast estuaries. Before I explain how it works, can I ask: what did your last HAB closure cost you in lost harvest?"
                      </div>
                      <div style={{fontSize:10,color:C.muted,marginTop:8,lineHeight:1.65}}>
                        Let them answer. Whatever number they give you — $2,000, $10,000, $50,000 — your response is: "Our system is $199/month. We'd like to give you the next 90 days free during the spring season. If it predicts one event you can act on before it would have reached you, it pays for itself for the next 4 years."
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{padding:"8px 14px",background:`${C.now}10`,border:`1px solid ${C.now}33`,
                  borderRadius:6,fontSize:10,color:C.now}}>
                  <strong>Revenue potential:</strong> 18 farms × $149/mo average = $32,184/yr. Industry is growing — 18 farms today, 30+ projected by 2028. Channel: contact Double D Oyster Co. first — they supply seed to all 18 farms and can make one warm introduction to the entire industry.
                </div>
              </div>

              {/* VERTICAL 2: REAL ESTATE DEVELOPERS */}
              <div style={{background:C.panel,border:`1px solid ${C.t6}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t6}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🏗️</span>
                  <div style={{fontSize:14,color:C.t6,fontWeight:800}}>Real Estate Developers & Homebuilders</div>
                  <Tag color={C.t6}>HIGHEST REVENUE PER DEAL</Tag>
                  <Tag color={C.t6}>$1,500–$8,000/project</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:14}}>
                  Baldwin County adopted new LID subdivision regulations in January 2025 requiring wetland delineation for any development greater than 5 acres with potential wetlands. Baldwin County issues hundreds of subdivision permits per year. A standard wetland delineation costs $5,000–$75,000 depending on acreage and complexity. WetlandAI's preliminary pre-screen at $1,500–$3,500 tells a developer whether they have a problem before they spend $50,000 on engineering — and before they close on the land.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t6,fontWeight:700,marginBottom:8}}>NAMED TARGET DEVELOPERS</div>
                    {[
                      {name:"Truland Homes",note:"One of the largest Baldwin County homebuilders. Multiple active subdivisions. Every lot needs wetland clearance."},
                      {name:"Ashton Woods / Toll Brothers",note:"National builders active in Gulf Coast growth corridor. Baldwin County divisions handle dozens of plats/yr."},
                      {name:"Rouses / Riviera Utilities corridor developers",note:"Commercial strip development along HWY 59 and SR 181 — every large commercial parcel needs a 404 screen."},
                      {name:"Crown West Realty",note:"Already building at Loxley Logistics Center. Industrial developer with ongoing parcel acquisition — wetland screens needed for each new site."},
                      {name:"Gulf Corporation (Port Alabama)",note:"902-acre industrial site — ongoing parcel due diligence as they activate phases of the development."},
                      {name:"Title attorneys and closing attorneys",note:"Every real estate transaction with potential wetlands should include a WetlandAI risk report in the due diligence package. Real estate attorneys are the channel."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                      padding:"14px 16px",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.t6,fontWeight:700,marginBottom:8}}>PRICING FOR DEVELOPERS</div>
                      {[
                        {tier:"Parcel Pre-Screen",price:"$1,500",includes:"1–25 acres. Vexcel multispectral wetland map, DTM hydrology, preliminary boundary. 3-day turnaround. Flat fee."},
                        {tier:"Subdivision Pre-Screen",price:"$3,500",includes:"25–100 acres. Full WetlandAI report, confidence zone map, USACE preliminary delineation format. 5-day turnaround."},
                        {tier:"Large Site Assessment",price:"$5,000–$8,000",includes:"100+ acres, industrial or complex sites. Includes targeted field verification guidance, USACE pre-application letter."},
                        {tier:"Developer SaaS Retainer",price:"$799/mo",includes:"Unlimited parcel pre-screens up to 25ac, priority turnaround, integrates with their land acquisition workflow."},
                      ].map(t=>(
                        <div key={t.tier} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                          <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                            <span style={{fontSize:12,color:C.text,fontWeight:600}}>{t.tier}</span>
                            <span style={{fontSize:13,color:C.t6,fontWeight:800,fontFamily:"'Fira Code',monospace"}}>{t.price}</span>
                          </div>
                          <div style={{fontSize:10,color:C.muted}}>{t.includes}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{background:`${C.t6}0f`,border:`1px solid ${C.t6}33`,borderRadius:8,padding:"14px 16px"}}>
                      <div style={{fontSize:11,color:C.t6,fontWeight:700,marginBottom:6}}>THE SALES EMAIL — TO A DEVELOPER</div>
                      <div style={{fontSize:10,color:C.text,lineHeight:1.85,fontStyle:"italic"}}>
                        Subject: Wetland pre-screen before you close — $1,500 vs. $50,000<br/><br/>
                        "[Name], you're buying land in Baldwin County. Before you close, do you know whether you have Section 404 jurisdictional wetlands on the parcel? A standard delineation after closing costs $15,000–$75,000 and takes 60–90 days. Our aerial pre-screen costs $1,500 and takes 3 days. We use Vexcel 7.5cm multispectral imagery to map hydrophytic vegetation, hydric soil signatures, and DTM-derived hydrology. If there's a wetland problem, you find it before you close — not after. Here's a sample report for a parcel in Baldwin County: [link]. Can I send you a quote for your next acquisition?"
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{padding:"8px 14px",background:`${C.t6}10`,border:`1px solid ${C.t6}33`,
                  borderRadius:6,fontSize:10,color:C.t6}}>
                  <strong>Channel strategy:</strong> The fastest entry is through real estate attorneys. Every real estate closing attorney in Baldwin County processes transactions where wetland risk is relevant. One relationship with a closing attorney who recommends WetlandAI as a standard due diligence tool reaches every developer they represent. Target: Mobile and Baldwin County real estate attorneys with active developer client bases.
                </div>
              </div>

              {/* VERTICAL 3: ENV CONSULTING FIRMS */}
              <div style={{background:C.panel,border:`1px solid ${C.q2}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.q2}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🔬</span>
                  <div style={{fontSize:14,color:C.q2,fontWeight:800}}>Environmental Consulting Firms</div>
                  <Tag color={C.q2}>BEST RECURRING REVENUE</Tag>
                  <Tag color={C.q2}>$499–$2,500/mo SaaS</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:14}}>
                  Environmental consulting firms in Alabama and Georgia do wetland delineations as a core service — billing $75–$150/hour for field time. WetlandAI doesn't replace them; it makes them dramatically more efficient. A firm that currently spends 3 field days on a 50-acre delineation can cut that to 1 targeted day using WetlandAI's pre-delineation map. Their billing rate stays the same; their margin expands. This is a pure productivity sale with no disruption to their workflow.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.q2,fontWeight:700,marginBottom:8}}>NAMED TARGET FIRMS — ALABAMA & GEORGIA</div>
                    {[
                      {name:"Wildland Services",loc:"Auburn, AL",note:"Locally owned, 35+ years experience, explicitly serves developers and civil engineers. WetlandAI is a direct fit."},
                      {name:"Volkert Inc.",loc:"Mobile, AL",note:"Major engineering/environmental firm with active ALDOT and developer clients. Baldwin County offices."},
                      {name:"Goodwyn Mills Cawood (GMC)",loc:"Mobile, AL",note:"One of Alabama's largest engineering firms. Environmental services division does 404 permitting."},
                      {name:"Terracon Consultants",loc:"Mobile, AL",note:"National firm with Mobile office. Environmental services including wetland delineation for industrial clients."},
                      {name:"Barry A. Vittor & Associates",loc:"Mobile, AL",note:"Marine and coastal environmental consulting. Active on MBNEP projects. Natural TERRAWATCH partner."},
                      {name:"Thompson Engineering",loc:"Mobile, AL",note:"Led the MBNEP Estuary Stormwater Management Plan. ADEM and ADCNR relationships. Active coastal projects."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}
                          <span style={{fontSize:9,color:C.muted,fontWeight:400,marginLeft:6}}>{f.loc}</span>
                        </div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                      padding:"14px 16px",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.q2,fontWeight:700,marginBottom:6}}>THE ROI MATH FOR A CONSULTING FIRM</div>
                      <div style={{display:"flex",flexDirection:"column",gap:6}}>
                        {[
                          {label:"Current 50-acre delineation field time",val:"3 days × $1,200/day = $3,600"},
                          {label:"WetlandAI pre-screen eliminates",val:"2 of 3 field days = $2,400 saved"},
                          {label:"WetlandAI monthly cost (5 projects/mo)",val:"$499/mo = $99.80/project"},
                          {label:"Net margin improvement per project",val:"$2,400 - $100 = $2,300 per project"},
                          {label:"Annual margin improvement (5 proj/mo)",val:"$138,000/yr in recovered field time"},
                        ].map(({label,val})=>(
                          <div key={label} style={{display:"flex",justifyContent:"space-between",gap:8,
                            padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:10}}>
                            <span style={{color:C.muted}}>{label}</span>
                            <span style={{color:C.q2,fontWeight:600,fontFamily:"'Fira Code',monospace",flexShrink:0}}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{background:`${C.q2}0f`,border:`1px solid ${C.q2}33`,borderRadius:8,padding:"14px 16px"}}>
                      <div style={{fontSize:11,color:C.q2,fontWeight:700,marginBottom:6}}>THE PITCH TO A FIRM PRINCIPAL</div>
                      <div style={{fontSize:10,color:C.text,lineHeight:1.85,fontStyle:"italic"}}>
                        "We're not replacing your delineators — we're eliminating two of their three field days on every project. WetlandAI generates the preliminary boundary map before your team arrives on site. They walk only the uncertain edges. Same billable project, same deliverable, 60% less field time. At $499/month for unlimited projects, you recover the cost on the first delineation of the month."
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL 4: BEACH RESORTS & TOURISM */}
              <div style={{background:C.panel,border:`1px solid ${C.t1}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t1}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🏖️</span>
                  <div style={{fontSize:14,color:C.t1,fontWeight:800}}>Beach Resorts, Hotels & Tourism Operators</div>
                  <Tag color={C.t1}>FAST CLOSE</Tag>
                  <Tag color={C.t1}>$199–$599/mo</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:12}}>
                  Baldwin County welcomed 8.3 million visitors who spent $7.9 billion in 2022. A beach closure advisory — even a precautionary one — can cost a Gulf Shores or Orange Beach resort $50,000–$200,000 in cancellations over a single weekend. TERRAWATCH's real-time water quality dashboard and advance HAB/bacteria alert give resort operators the same 48-hour window that shellfish farmers need. They can proactively communicate with guests, adjust bookings, and coordinate with ADPH before a closure hits the news.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t1,fontWeight:700,marginBottom:8}}>TARGET OPERATORS</div>
                    {[
                      {name:"Perdido Beach Resort",note:"Orange Beach. Premier destination resort. HAB advisory on a summer Friday = $100K+ weekend loss."},
                      {name:"Turquoise Place Resort",note:"Gulf Shores. 300+ unit condo resort. Direct beach access operator with occupancy at stake."},
                      {name:"Caribe Resort",note:"Orange Beach. Large condo resort with private marina. Water quality advisory directly affects their pool and marina operations."},
                      {name:"Gulf State Park / Hilton Gulf Shores",note:"State park partnerships — institutional buyer with state budget and long-term contracts."},
                      {name:"Gulf Shores and Orange Beach Tourism",note:"The tourism authority itself — an early warning system that protects $7.9B in visitor spending is a PR and economic asset they can co-brand."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:`${C.t1}0f`,border:`1px solid ${C.t1}33`,borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t1,fontWeight:700,marginBottom:6}}>THE SALES PITCH — HOSPITALITY FRAMING</div>
                    <div style={{fontSize:10,color:C.text,lineHeight:1.85,fontStyle:"italic",marginBottom:12}}>
                      "Your revenue managers watch weather forecasts. TERRAWATCH is the equivalent for water quality. We give you 48 hours notice before an advisory is likely — the same lead time you'd need to proactively reach out to guests, offer a rebooking option, and manage the situation before it becomes a crisis instead of after. At $399/month, that's one room night per month to protect the entire summer season."
                    </div>
                    <div style={{fontSize:11,color:C.t1,fontWeight:700,marginBottom:6}}>GROUP DEAL OPPORTUNITY</div>
                    <div style={{fontSize:10,color:C.muted,lineHeight:1.7}}>
                      The Gulf Shores & Orange Beach Tourism (GSABT) authority has a direct interest in protecting visitor experience. A co-branded "Beach Intelligence Dashboard" powered by TERRAWATCH — distributed to all member hotels — is a group deal worth $2,000–$5,000/month from the authority instead of 20 individual $199/mo deals.
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL 5: MARINA OPERATORS & COMMERCIAL FISHING */}
              <div style={{background:C.panel,border:`1px solid ${C.t3}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t3}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>⚓</span>
                  <div style={{fontSize:14,color:C.t3,fontWeight:800}}>Marinas, Commercial Fishing & Seafood Processors</div>
                  <Tag color={C.t3}>HIGH PAIN POINT</Tag>
                  <Tag color={C.t3}>$99–$299/mo</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:12}}>
                  Commercial shrimpers, crabbers, and finfish operators in Mobile and Baldwin counties lose gear and catch to hypoxia events with zero advance warning. A single hypoxia event in the western Mobile Bay can destroy nets full of shrimp worth $2,000–$8,000 per boat. TERRAWATCH's 5-day hypoxia forecast lets captains relocate their trawl grounds before the oxygen crash — the difference between a profitable week and a total loss.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t3,fontWeight:700,marginBottom:6}}>TARGET OPERATORS</div>
                    {[
                      {name:"Bayou La Batre shrimping fleet",note:"'Seafood Capital of Alabama.' 100+ commercial vessels. The fleet captain network is tight — one adoption spreads quickly via word of mouth on the dock."},
                      {name:"Dominick's Seafood / Billy's Seafood",note:"Major seafood processors and distributors. Their supply chain depends on consistent catch volume — hypoxia disruption directly affects their production schedule."},
                      {name:"Freedom Boat Club / Legendary Marine",note:"Recreational fishing operations with charter fleets. Water quality directly affects where guides take clients."},
                      {name:"Bay Marine / Fairhope Yacht Club area marinas",note:"Marina operators need water quality alerts for slip holders. A 'Water Quality Report' branded service for marina members is a B2B channel."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:`${C.t3}0f`,border:`1px solid ${C.t3}33`,borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t3,fontWeight:700,marginBottom:6}}>CHANNEL: THE DOCK STRATEGY</div>
                    <div style={{fontSize:10,color:C.text,lineHeight:1.85}}>
                      Don't sell to individual fishers — sell to the association and let them distribute. The Alabama Commercial Fishing Association and the Alabama Shrimp Industry Association both represent the entire fleet. A $500/month association membership that distributes TERRAWATCH access to all members is a single sale that reaches 100+ operators.
                    </div>
                    <div style={{marginTop:10,padding:"8px",background:C.panel,borderRadius:5,fontSize:10,color:C.muted}}>
                      Hypoxia events: 3–5 per year in Mobile Bay. Average vessel loss per event: $3,000–$8,000. At $99/mo = $1,188/yr. One avoided event returns 2–6× the annual cost.
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL 6: INDUSTRIAL TENANTS */}
              <div style={{background:C.panel,border:`1px solid ${C.y2}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.y2}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🏭</span>
                  <div style={{fontSize:14,color:C.y2,fontWeight:800}}>Industrial Companies — Existing Baldwin County Tenants</div>
                  <Tag color={C.y2}>LARGEST CONTRACTS</Tag>
                  <Tag color={C.y2}>$10K–$50K/yr</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:12}}>
                  The industrial tenants BCEDA has already recruited — Novelis, ALDI, Collins Aerospace, Quincy Compressor, Imperial Dade — all have environmental compliance requirements as conditions of their permits. Real-time ambient water and air quality monitoring at their fence line, combined with TERRAWATCH's automated EPA compliance reporting, is a direct operational need with a multi-year contract value.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.y2,fontWeight:700,marginBottom:8}}>NAMED INDUSTRIAL TARGETS</div>
                    {[
                      {name:"Novelis",loc:"Bay Minette Mega Site",note:"$4.1B aluminum plant. Environmental monitoring as permit condition. TERRAWATCH ambient air + water quality layer for facility perimeter."},
                      {name:"Collins Aerospace",loc:"Foley, AL",note:"Largest manufacturing employer. Thrust reverser/nacelle production. NPDES permit monitoring + stormwater compliance."},
                      {name:"ALDI Distribution Center",loc:"Loxley, AL",note:"$100M distribution center. Stormwater compliance monitoring at facility discharge points."},
                      {name:"Quincy Compressor",loc:"Bay Minette, AL",note:"Manufacturing — NPDES permit holder. Automated compliance reporting removes manual monitoring burden."},
                      {name:"Butting USA",loc:"Baldwin County",note:"$61M new HQ under construction. Environmental compliance will be required from day one of operations."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}
                          <span style={{fontSize:9,color:C.muted,fontWeight:400,marginLeft:6}}>{f.loc}</span>
                        </div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,
                      padding:"14px 16px",marginBottom:10}}>
                      <div style={{fontSize:11,color:C.y2,fontWeight:700,marginBottom:6}}>WHAT YOU'RE SELLING THEM</div>
                      {[
                        "Automated NPDES permit compliance monitoring — eliminates manual data collection",
                        "Real-time ambient air quality at fence line — AQI, PM2.5, NOₓ",
                        "Stormwater discharge quality monitoring at facility outfall points",
                        "Automated quarterly EPA WQX report generation and submission",
                        "Early warning if a neighboring facility creates an ambient quality violation",
                        "Post-event documentation package for any regulatory inquiry",
                      ].map(s=>(
                        <div key={s} style={{display:"flex",gap:8,padding:"4px 0",
                          borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.text}}>
                          <span style={{color:C.y2,flexShrink:0}}>→</span>{s}
                        </div>
                      ))}
                    </div>
                    <div style={{background:`${C.y2}0f`,border:`1px solid ${C.y2}33`,borderRadius:8,padding:"12px 14px"}}>
                      <div style={{fontSize:10,color:C.y2,fontWeight:700,marginBottom:4}}>ENTRY POINT: SITEVAULT → TERRAWATCH UPSELL</div>
                      <div style={{fontSize:10,color:C.muted,lineHeight:1.7}}>
                        The BCEDA SITEVAULT relationship is the introduction. When BCEDA uses SITEVAULT to show a company environmental data during site selection — and that company selects the site — TERRAWATCH becomes the ongoing monitoring platform for their permit compliance. The deal sequence: SITEVAULT during selection → TERRAWATCH contract during operations.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* VERTICAL 7: HUNTING LEASES & LAND MANAGERS */}
              <div style={{background:C.panel,border:`1px solid ${C.t5}44`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid ${C.t5}`}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:20}}>🦌</span>
                  <div style={{fontSize:14,color:C.t5,fontWeight:800}}>Hunting Leases, Fishing Guides & Private Land Managers</div>
                  <Tag color={C.t5}>UNTAPPED MARKET</Tag>
                  <Tag color={C.t5}>$49–$149/mo</Tag>
                </div>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.75,marginBottom:12}}>
                  This is a market nobody in environmental tech is serving. Alabama has thousands of hunting and fishing lease operations. Water quality directly affects fish populations — hypoxia events reduce fish density in leased fishing ponds and river sections. Hunting lease operators near industrial or agricultural areas have water quality concerns that affect wildlife habitat. A simple, consumer-friendly water quality dashboard at $49–$99/month is a new category TERRAWATCH can own.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                  <div style={{background:C.surface,borderRadius:8,border:`1px solid ${C.border}`,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t5,fontWeight:700,marginBottom:8}}>TARGET CHANNELS</div>
                    {[
                      {name:"Alabama Wildlife Federation",note:"Largest hunting/fishing advocacy org in Alabama. A TERRAWATCH partnership gives their members a conservation tech tool. Ideal for a group membership deal."},
                      {name:"Mossy Oak Properties / AlaLand",note:"Major hunting/fishing land brokers in Alabama. Water quality data adds value to land listings — 'Verified clean water on this lease.'"},
                      {name:"Alabama Bass Trail / fishing tournament circuit",note:"Tournament fishers obsess over water quality. A real-time DO₂ and temperature dashboard for their home lakes is a direct subscription product."},
                      {name:"Timberland investment firms (TIMO)",note:"Companies like Hancock Natural Resource Group manage millions of acres of Alabama timberland with active hunting leases. Corporate subscription covers all their Alabama properties."},
                    ].map(f=>(
                      <div key={f.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:12,color:C.text,fontWeight:600}}>{f.name}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{f.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:`${C.t5}0f`,border:`1px solid ${C.t5}33`,borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:C.t5,fontWeight:700,marginBottom:6}}>WHY THIS MATTERS TO YOU PERSONALLY</div>
                    <div style={{fontSize:10,color:C.text,lineHeight:1.85}}>
                      You're already active in hunting leases and Gulf Coast shoreline restoration. This is a market you understand at a personal level. The product for this segment is a simplified mobile app — not the full TERRAWATCH platform — showing DO₂, water temperature, and a plain-English "Good / Watch / Alert" status for a specific creek, pond, or river section. $49/month is an impulse purchase for a serious bass fisherman or a hunting lease operator.
                    </div>
                    <div style={{marginTop:10,padding:"8px",background:C.panel,borderRadius:5,fontSize:10,color:C.muted}}>
                      Alabama has an estimated 500,000 licensed hunters and 1M+ licensed anglers. Even 0.1% adoption = 1,500 subscriptions × $49/mo = $882,000/yr. This is a consumer product built on your existing B2G infrastructure.
                    </div>
                  </div>
                </div>
              </div>

              {/* QUICK WIN PRIORITY STACK */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>PRIVATE SECTOR QUICK WIN STACK — DO THESE IN ORDER</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[
                    {n:"1",action:"Call Double D Oyster Co.",detail:"They supply seed to all 18 Alabama oyster farms. One relationship = introduction to the entire industry. Ask to present at their next industry gathering. This is your fastest path to 5+ paying subscribers.",color:C.now,time:"This week"},
                    {n:"2",action:"Email Wildland Services in Auburn",detail:"'We built a WetlandAI pre-delineation tool using Vexcel 7.5cm imagery. It eliminates 2 of 3 field days. Can I give you a 60-day free trial on your next project?' They will say yes.",color:C.q2,time:"This week"},
                    {n:"3",action:"Cold email 3 Baldwin County real estate attorneys",detail:"Subject line: 'Wetland pre-screen for your developer clients — $1,500, 3 days, before closing.' They are the channel to every developer in Baldwin County.",color:C.t6,time:"Week 2"},
                    {n:"4",action:"Contact Gulf Shores & Orange Beach Tourism authority",detail:"Propose a co-branded 'Beach Intelligence Dashboard' — positions TERRAWATCH as protecting the $7.9B tourism economy. Single institutional deal replaces 20 individual hotel sales.",color:C.t1,time:"Week 2"},
                    {n:"5",action:"Visit Bayou La Batre — go to the docks",detail:"This isn't an email market. Shrimpers and crabbers make decisions on the dock, not in their inbox. Show up in person with a printed HAB/hypoxia forecast for the previous week and show them what they missed.",color:C.t3,time:"Week 3"},
                    {n:"6",action:"Contact BCEDA and ask for Novelis EHS contact",detail:"Novelis has an Environmental Health & Safety director responsible for their Alabama permit compliance. BCEDA has the relationship — ask for an intro. Novelis alone is a $15,000–$30,000/yr contract.",color:C.y2,time:"Month 2"},
                  ].map(({n,action,detail,color,time})=>(
                    <div key={n} style={{display:"flex",gap:12,padding:"12px 14px",
                      background:`${color}0a`,border:`1px solid ${color}33`,
                      borderRadius:7,alignItems:"flex-start"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:`${color}22`,
                        border:`2px solid ${color}`,display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:12,color,fontWeight:800,flexShrink:0}}>{n}</div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,color,fontWeight:700}}>{action}</span>
                          <Tag color={color}>{time}</Tag>
                        </div>
                        <div style={{fontSize:11,color:C.muted,lineHeight:1.65}}>{detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:12,padding:"12px 16px",
                  background:`linear-gradient(135deg,${C.t6}0f,${C.now}08)`,
                  border:`1px solid ${C.t6}33`,borderRadius:8}}>
                  <div style={{fontSize:11,color:C.t6,fontWeight:700,marginBottom:4}}>
                    Realistic Month 3 private sector revenue if you execute this stack
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,fontSize:10}}>
                    {[
                      {label:"5 oyster farms × $149/mo",val:"$745/mo"},
                      {label:"2 env. consulting firms × $499/mo",val:"$998/mo"},
                      {label:"3 developer pre-screens × $2,500",val:"$7,500 one-time"},
                    ].map(({label,val})=>(
                      <div key={label} style={{padding:"6px 8px",background:C.panel,borderRadius:5}}>
                        <div style={{color:C.muted}}>{label}</div>
                        <div style={{color:C.t6,fontWeight:700,fontFamily:"'Fira Code',monospace",marginTop:2}}>{val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:11,color:C.text,marginTop:8}}>
                    <strong style={{color:C.t6}}>$9,243 in Month 3</strong> — before any government client, before any grant. All private sector, all paying, all from Alabama. That's 25% of your annual Hatch grant in a single month of private sector sales.
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 8: OSPREY INTEGRATION ══════════ */}
          {tab===11&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,
                border:`1px solid #5bc8f544`,borderRadius:10,padding:"24px 30px",
                position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:"40%",height:"100%",
                  background:`radial-gradient(ellipse at right,#5bc8f508,transparent 70%)`}}/>
                <div style={{fontSize:8,color:"#5bc8f5",letterSpacing:"0.22em",marginBottom:8,
                  fontFamily:"'Fira Code',monospace"}}>
                  OSPREY INITIATIVE × TERRAWATCH · STRATEGIC INTEGRATION
                </div>
                <h2 style={{fontSize:26,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.15}}>
                  Your partner runs the software<br/>
                  <span style={{color:"#5bc8f5"}}>that powers the only ground-truth litter dataset in Alabama.</span>
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820,marginBottom:16}}>
                  Osprey Initiative's Litter Gitters capture physical litter from Alabama waterways and collect data on what's in each device, at what volume, from which creek. TERRAWATCH remotely models microplastic loading by source using aerial imagery. Fused together, these two systems form something neither has alone: the first ground-truth-validated, source-attributed microplastic monitoring network in the United States. Your partner's direct access to Osprey's software and data infrastructure is not just a nice relationship — it is a multi-million-dollar technical asset.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {l:"Osprey's network reach",v:"10+ states",c:"#5bc8f5"},
                    {l:"EPA Trash-Free Waters grants",v:"$500K+",c:C.t6},
                    {l:"City contracts secured",v:"$275K/city",c:C.q2},
                    {l:"Shared relationships",v:"MBNEP · Weeks Bay · Baykeeper",c:C.t1},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:"rgba(10,61,43,0.06)",
                      border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"12px 14px"}}>
                      <div style={{fontSize:18,fontWeight:800,color:c,lineHeight:1.2,marginBottom:4}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Osprey is */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:12,
                  fontFamily:"'Fira Code',monospace"}}>WHAT OSPREY ACTUALLY IS — AND WHY IT MATTERS TO TERRAWATCH</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {title:"The Litter Gitter is a field sensor",color:"#5bc8f5",
                      body:"Every Litter Gitter deployed in an Alabama, Mississippi, or Louisiana waterway is generating data: litter volume per collection cycle, litter composition by type (plastic film, bottles, foam, metal), seasonal variation, and storm event correlation. That's exactly the ground-truth data TERRAWATCH's microplastic source attribution model needs to validate its aerial remote sensing predictions."},
                    {title:"Osprey's software is a data platform",color:C.t6,
                      body:"Your partner manages and programmed the software powering Osprey's operations — meaning you have direct access to the data schema, the collection records, the device locations, and the operational workflow. This isn't a third-party API negotiation. This is insider access to a proprietary environmental dataset that no competitor can replicate."},
                    {title:"Osprey's relationships are TERRAWATCH's warm intros",color:C.t1,
                      body:"MBNEP, Weeks Bay Foundation, Mobile Baykeeper, Freshwater Land Trust, Alabama Coastal Foundation, Jefferson County, City of Fairhope, Coca-Cola UNITED, ExxonMobil — Osprey already has working relationships with every organization on TERRAWATCH's priority outreach list. Your partner walks into those rooms already trusted."},
                  ].map(({title,color,body})=>(
                    <div key={title} style={{background:C.surface,border:`1px solid ${color}33`,
                      borderRadius:8,padding:"14px 16px",borderLeft:`3px solid ${color}`}}>
                      <div style={{fontSize:12,color,fontWeight:800,marginBottom:6}}>{title}</div>
                      <div style={{fontSize:11,color:C.muted,lineHeight:1.75}}>{body}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* THE BIG FUSION */}
              <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,
                border:`2px solid #5bc8f544`,borderRadius:10,padding:"22px 26px"}}>
                <div style={{fontSize:11,color:"#5bc8f5",fontWeight:800,marginBottom:14,letterSpacing:"0.08em"}}>
                  ★ THE BREAKTHROUGH FUSION — WHAT NEITHER SYSTEM HAS ALONE
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 60px 1fr",gap:14,alignItems:"center",marginBottom:16}}>
                  <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 18px"}}>
                    <div style={{fontSize:13,color:"#5bc8f5",fontWeight:800,marginBottom:8}}>Osprey Litter Gitter Data</div>
                    {[
                      "Physical litter volume per device per cycle",
                      "Litter composition by type (plastic film, bottles, foam, metal)",
                      "Upstream source watershed identification",
                      "Storm event litter pulse measurement",
                      "Multi-year seasonal trend data",
                      "Creek-level spatial precision",
                    ].map(i=>(
                      <div key={i} style={{fontSize:11,color:C.text,padding:"4px 0",
                        borderBottom:`1px solid ${C.border}`,display:"flex",gap:8}}>
                        <span style={{color:"#5bc8f5",flexShrink:0}}>→</span>{i}
                      </div>
                    ))}
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:28,color:"#5bc8f5"}}>+</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:4,lineHeight:1.4}}>fused via<br/>TERRAWATCH</div>
                  </div>
                  <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,padding:"16px 18px"}}>
                    <div style={{fontSize:13,color:C.t6,fontWeight:800,marginBottom:8}}>TERRAWATCH Aerial Data</div>
                    {[
                      "Vexcel Elements AI road intersection density (tire wear hotspots)",
                      "Ortho synthetic turf field mapping (infill microplastic source)",
                      "Elevate DTM stormwater routing (where load goes)",
                      "EPA WQX turbidity as transport proxy",
                      "NOAA NWS precipitation (storm event trigger)",
                      "Sub-watershed microplastic load estimate",
                    ].map(i=>(
                      <div key={i} style={{fontSize:11,color:C.text,padding:"4px 0",
                        borderBottom:`1px solid ${C.border}`,display:"flex",gap:8}}>
                        <span style={{color:C.t6,flexShrink:0}}>→</span>{i}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:`#5bc8f515`,border:`1px solid #5bc8f544`,borderRadius:8,padding:"16px 20px"}}>
                  <div style={{fontSize:13,color:"#5bc8f5",fontWeight:800,marginBottom:8}}>
                    = The First Ground-Truth-Validated Microplastic Source Attribution System in the US
                  </div>
                  <p style={{fontSize:11,color:C.text,lineHeight:1.85}}>
                    TERRAWATCH models predict which upstream road corridors and synthetic turf fields generate the most microplastic loading by watershed. Osprey's Litter Gitters physically measure what actually arrives at the creek. When the model says "Intersection X generates 52% of your basin's tire wear particles" and the Litter Gitter downstream shows plastic composition matching that prediction — you have the first validated, defensible, field-confirmed source attribution system for microplastics that has ever existed. This is publication-ready science. It's fundable through EPA Trash-Free Waters, NOAA Sea Grant, and NSF EarthCube. And it's a product neither company can credibly sell without the other.
                  </p>
                </div>
              </div>

              {/* Integration opportunities */}
              <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",
                fontFamily:"'Fira Code',monospace",marginBottom:4}}>
                SIX SPECIFIC INTEGRATION OPPORTUNITIES
              </div>

              {[
                {
                  n:"01", color:"#5bc8f5", title:"Litter Gitter Data → TERRAWATCH Microplastic Feed",
                  type:"Technical Integration",
                  description:"Your partner's access to Osprey's software means you can build a direct data connector: each Litter Gitter collection event (timestamp, device location, litter volume, composition by type) flows into TERRAWATCH as a real-time sensor feed. This becomes the 24th data source in TERRAWATCH's registry — the only one with physical litter composition data. TERRAWATCH's microplastic model then uses Litter Gitter observations as calibration data for the aerial prediction model.",
                  action:"Design the Osprey API/database schema connector. Your partner can document the data structure. Build the TERRAWATCH ingest module. Timeline: 2 weeks of development.",
                  value:"Transforms TERRAWATCH's modeled microplastic estimate into a validated, field-confirmed system. The difference between a prediction model and a measurement system — a $3M difference in grant fundability.",
                },
                {
                  n:"02", color:C.t6, title:"Joint EPA Trash-Free Waters Grant Application",
                  type:"Grant — Apply Now",
                  description:"Osprey has already won EPA Trash-Free Waters grants as the technical implementer. TERRAWATCH's microplastic source attribution capability is exactly what those grants fund next — the transition from 'collecting litter' to 'predicting where litter will come from and preventing it at the source.' A joint Osprey + TERRAWATCH application to the next Trash-Free Waters cycle is the strongest possible proposal in that program.",
                  action:"Review the next Trash-Free Waters solicitation (EPA Trash-Free Waters program — typically opens annually). Draft a joint concept paper: Osprey provides the physical collection infrastructure; TERRAWATCH provides the predictive source attribution layer. Don Bates at Osprey is already known to EPA through this program — his name on the application changes the competitive position dramatically.",
                  value:"$200K–$500K grant. EPA already knows Osprey. TERRAWATCH adds the predictive science layer that makes a collection program into a prevention program — exactly what EPA wants to fund next.",
                },
                {
                  n:"03", color:C.t1, title:"Osprey Corporate Sponsors → TERRAWATCH Compliance Clients",
                  type:"Revenue — Fast",
                  description:"Osprey's corporate sponsors — Coca-Cola UNITED, ExxonMobil, Air Products, Indorama Ventures — fund Litter Gitters as part of their environmental stewardship programs. Every one of them also has NPDES permit monitoring requirements and ambient water quality compliance needs. TERRAWATCH's real-time monitoring and automated EPA reporting is the logical next product for companies already paying Osprey for environmental stewardship services.",
                  action:"Ask your partner to make warm introductions to Osprey's corporate sponsor contacts. Frame it as: 'You're already doing litter stewardship with Osprey. TERRAWATCH monitors the water quality downstream and automates your compliance reporting. Same ESG story, expanded capability.' Target: Coca-Cola UNITED and ExxonMobil Baton Rouge first.",
                  value:"Corporate environmental compliance contracts: $10,000–$50,000/yr per company. 4–5 Osprey corporate sponsors = $50K–$250K/yr in new TERRAWATCH revenue with zero cold outreach.",
                },
                {
                  n:"04", color:C.q2, title:"Osprey's MBNEP + Weeks Bay Relationships → TERRAWATCH's Fastest Pilot Partners",
                  type:"Relationship Leverage",
                  description:"Osprey already works with MBNEP (Earth Day cleanup at Gulf Village Homes) and the Weeks Bay Foundation (floating cleanup). These are TERRAWATCH's two highest-priority pilot partner targets. Instead of a cold outreach, your partner walks into an existing trusted relationship and introduces TERRAWATCH as a complementary technology — 'We clean the litter; TERRAWATCH tells us where it's coming from and what the water quality is doing.' One conversation becomes two partnerships.",
                  action:"Ask your partner to make the MBNEP introduction first — specifically to the MBNEP Program Manager who coordinated the Earth Day event. Then the Weeks Bay Foundation introduction (Angela Underwood is already on your target list). Both relationships are already warm on Osprey's side.",
                  value:"Eliminates 3–6 months of cold outreach. MBNEP partnership = co-applicant for the NEP Watershed grant. Weeks Bay partnership = first NERRS pilot client. Combined value: $200K–$500K in grant co-applicant access.",
                },
                {
                  n:"05", color:C.y2, title:"Osprey's City Contracts → TERRAWATCH Municipal Monitoring Upsell",
                  type:"Revenue — Medium Term",
                  description:"Osprey has city contracts with Fairhope, Birmingham, Jefferson County, Fayetteville, and others — with automatic multi-year renewals. Every city paying Osprey for litter collection has a water quality problem the litter is contributing to. TERRAWATCH's stormwater and nonpoint source monitoring is the natural municipal upsell: 'You're paying Osprey to collect the litter. TERRAWATCH shows you which storm drain and which development created it, so you can prevent the next load.' One Osprey city contract becomes one TERRAWATCH municipal monitoring contract.",
                  action:"Map all current Osprey city contracts. For each, identify whether they have: (1) MS4 stormwater permit requirements, and (2) TMDL obligations on receiving waterways. These are the municipal clients who have regulatory reasons to buy TERRAWATCH in addition to Osprey's collection services. Priority: City of Fairhope is already named in your private sector target list.",
                  value:"Municipal monitoring contracts: $15,000–$40,000/yr per city. 5 Osprey cities × $20,000/yr = $100,000/yr in new TERRAWATCH revenue with zero additional sales effort beyond the existing Osprey relationship.",
                },
                {
                  n:"06", color:C.t5, title:"WetlandAI + Osprey = Comprehensive Waterway Due Diligence Product",
                  type:"Product Bundle",
                  description:"Any developer, municipality, or conservation organization assessing a waterway site needs two things: what's the water quality and litter loading situation, and are there jurisdictional wetlands on the parcel? WetlandAI handles the wetland delineation pre-screen; TERRAWATCH handles the water quality; Osprey's historical Litter Gitter data shows historical litter loading. Bundle these three into a 'Waterway Site Assessment Report' — one product, one price, three data sources. No competitor can offer this.",
                  action:"Design the Waterway Site Assessment Report template: WetlandAI preliminary delineation (Page 1–3), TERRAWATCH 12-month water quality trend (Page 4–6), Osprey Litter Gitter historical load data for the receiving waterway (Page 7–8). Price: $3,500–$7,500 per report. Target buyers: Baldwin County developers, environmental consulting firms, conservation organizations assessing restoration sites.",
                  value:"$3,500–$7,500/report. No marginal Vexcel cost (imagery already licensed). No marginal Osprey cost (data access via partner). Pure software + report assembly. 20 reports/yr = $70,000–$150,000 in new revenue.",
                },
              ].map(op=>(
                <div key={op.n} style={{background:C.panel,border:`1px solid ${op.color}33`,
                  borderRadius:9,padding:"18px 22px",borderLeft:`4px solid ${op.color}`}}>
                  <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                    <div style={{width:36,height:36,borderRadius:"50%",flexShrink:0,
                      background:`${op.color}22`,border:`2px solid ${op.color}`,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:11,color:op.color,fontWeight:800}}>{op.n}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                        <div style={{fontSize:14,color:op.color,fontWeight:800}}>{op.title}</div>
                        <Tag color={op.color}>{op.type}</Tag>
                      </div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.85,marginBottom:10}}>{op.description}</p>
                      <div style={{padding:"10px 12px",background:`${op.color}0a`,
                        border:`1px solid ${op.color}33`,borderRadius:6,marginBottom:8}}>
                        <div style={{fontSize:10,color:op.color,fontWeight:700,marginBottom:3}}>ACTION</div>
                        <div style={{fontSize:11,color:C.text,lineHeight:1.7}}>{op.action}</div>
                      </div>
                      <div style={{fontSize:10,color:op.color,fontWeight:600}}>{op.value}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Grant pipeline enabled by Osprey */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>GRANT PROGRAMS OSPREY UNLOCKS FOR TERRAWATCH</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {grant:"EPA Trash-Free Waters",amount:"$200K–$500K",color:C.now,
                      why:"Osprey has already won this grant. A joint proposal — Osprey collects, TERRAWATCH predicts sources — is the next logical evolution of the program. EPA wants to move from reactive cleanup to proactive source prevention. That's exactly what TERRAWATCH adds.",
                      osprey:"Don Bates already has the relationship. His name as PI makes this application 10× more competitive than a cold submission from TERRAWATCH alone."},
                    {grant:"NOAA Sea Grant — Healthy Coastal Ecosystems",amount:"$125K–$300K",color:C.q2,
                      why:"A joint microplastic monitoring methodology paper (TERRAWATCH prediction + Osprey field validation) is a strong Sea Grant application. Litter in waterways is a coastal ecosystem health issue. The MASGC covers Alabama and Mississippi — Osprey operates in both states.",
                      osprey:"Osprey's partnerships with DISL and Mississippi State University Coastal Research Extension give MASGC applications the institutional co-PI they need."},
                    {grant:"EPA Bipartisan Infrastructure Law — Water Infrastructure",amount:"$500K–$2M",color:C.y2,
                      why:"The BIL water infrastructure funding includes stormwater and nonpoint source pollution management. A joint Osprey + TERRAWATCH proposal for a comprehensive stormwater litter and microplastic monitoring system for a specific Alabama city or watershed qualifies directly.",
                      osprey:"Osprey already has working city relationships with demonstrated outcomes (9,300 lbs removed in Jefferson County). Their track record makes the grant application credible."},
                    {grant:"RESTORE Act — Gulf Coast Ecosystem Restoration",amount:"$100K–$500K",color:C.t1,
                      why:"Osprey already operates in Mobile (Earth Day MBNEP cleanup). RESTORE Act funds projects that address Gulf ecosystem degradation. A combined litter collection + microplastic monitoring system for Mobile Bay's urban watersheds is a strong fit.",
                      osprey:"MBNEP is the grant co-applicant for RESTORE Act projects. Osprey's existing MBNEP relationship + TERRAWATCH's technical monitoring capability = a competitive joint proposal."},
                  ].map(g=>(
                    <div key={g.grant} style={{background:C.surface,border:`1px solid ${g.color}33`,
                      borderRadius:8,padding:"14px 16px",borderTop:`2px solid ${g.color}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div style={{fontSize:13,color:g.color,fontWeight:800}}>{g.grant}</div>
                        <Tag color={g.color}>{g.amount}</Tag>
                      </div>
                      <p style={{fontSize:11,color:C.muted,lineHeight:1.7,marginBottom:8}}>{g.why}</p>
                      <div style={{padding:"6px 10px",background:`${g.color}0a`,
                        border:`1px solid ${g.color}33`,borderRadius:5,
                        fontSize:10,color:g.color}}>
                        <strong>Osprey advantage: </strong>{g.osprey}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conversation framing for Don Bates */}
              <div style={{background:C.panel,border:`1px solid #5bc8f544`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid #5bc8f5`}}>
                <div style={{fontSize:11,color:"#5bc8f5",fontWeight:800,marginBottom:12,letterSpacing:"0.08em"}}>
                  HOW TO FRAME THE CONVERSATION WITH DON BATES
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <div>
                    <div style={{fontSize:11,color:C.text,fontWeight:700,marginBottom:8}}>What he gets from the partnership</div>
                    {[
                      "TERRAWATCH validates Osprey's litter data scientifically — the physical collection plus the source prediction is a publishable methodology that elevates Osprey's technical credibility",
                      "Joint grant applications where TERRAWATCH's aerial data layer makes Osprey's field collection proposals more competitive",
                      "A revenue channel: Osprey's corporate sponsors become TERRAWATCH clients, with revenue potentially shared or credited back to the relationship",
                      "A software upgrade: your partner can build the TERRAWATCH integration into Osprey's existing platform, adding predictive capability to what's currently a collection-only data system",
                      "The Waterway Site Assessment Report is a new product Osprey can sell under their brand, powered by TERRAWATCH and WetlandAI",
                    ].map(i=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"6px 0",
                        borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                        <span style={{color:"#5bc8f5",flexShrink:0}}>✓</span>{i}
                      </div>
                    ))}
                  </div>
                  <div style={{background:`#5bc8f50f`,border:`1px solid #5bc8f533`,
                    borderRadius:8,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:"#5bc8f5",fontWeight:700,marginBottom:8}}>The framing in one paragraph</div>
                    <div style={{fontSize:11,color:C.text,lineHeight:1.85,fontStyle:"italic",marginBottom:12}}>
                      "Don, we've been building TERRAWATCH — a real-time environmental intelligence platform for Mobile Bay and the Gulf Coast. [Partner] has been helping us think through how to integrate Osprey's Litter Gitter data as a ground-truth validation layer for our microplastic source attribution model. What your devices measure at the creek — and what our aerial imagery predicts upstream — together create something neither system has alone. We think there's a joint EPA Trash-Free Waters grant here that neither of us could write as competitively without the other. Can we sit down this week?"
                    </div>
                    <div style={{fontSize:10,color:"#5bc8f5",fontWeight:600}}>
                      Don Bates — Millsaps College geology grad, 25+ years environmental consulting, founder. He will immediately understand the technical significance of the data fusion. Lead with the science.
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue summary */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:12,
                  fontFamily:"'Fira Code',monospace"}}>OSPREY INTEGRATION REVENUE SUMMARY</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {stream:"Osprey corporate sponsors → TERRAWATCH compliance clients",range:"$50K–$250K/yr",timeline:"Month 3–6",color:C.t1},
                    {stream:"Osprey city contracts → TERRAWATCH municipal monitoring upsell",range:"$75K–$200K/yr",timeline:"Month 6–12",color:C.q2},
                    {stream:"Joint EPA Trash-Free Waters grant",range:"$200K–$500K",timeline:"Year 2",color:C.now},
                    {stream:"Waterway Site Assessment Report (bundled product)",range:"$70K–$150K/yr",timeline:"Month 4–8",color:C.t5},
                    {stream:"Joint MASGC / NOAA Sea Grant",range:"$125K–$300K",timeline:"Year 2",color:C.q3},
                    {stream:"RESTORE Act joint proposal",range:"$100K–$500K",timeline:"Year 2–3",color:C.y2},
                  ].map(({stream,range,timeline,color})=>(
                    <div key={stream} style={{display:"grid",gridTemplateColumns:"1fr 130px 100px",
                      gap:12,padding:"8px 0",borderBottom:`1px solid ${C.border}`,
                      alignItems:"center",fontSize:12}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
                        <span style={{color:C.text}}>{stream}</span>
                      </div>
                      <div style={{textAlign:"right",color,fontWeight:700,
                        fontFamily:"'Fira Code',monospace",fontSize:11}}>{range}</div>
                      <div style={{textAlign:"right"}}>
                        <Tag color={color}>{timeline}</Tag>
                      </div>
                    </div>
                  ))}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 130px 100px",
                    gap:12,padding:"10px 8px",alignItems:"center",
                    background:C.dim,borderRadius:5,marginTop:4}}>
                    <div style={{fontSize:13,color:C.ink,fontWeight:700}}>Total Osprey-enabled revenue potential</div>
                    <div style={{textAlign:"right",color:C.t6,fontWeight:800,fontSize:15,
                      fontFamily:"'Fira Code',monospace"}}>$620K–$1.4M</div>
                    <div style={{textAlign:"right",fontSize:10,color:C.muted}}>Years 1–3</div>
                  </div>
                </div>
                <div style={{marginTop:12,padding:"10px 14px",background:`#5bc8f510`,
                  border:`1px solid #5bc8f533`,borderRadius:6,fontSize:11,color:"#5bc8f5"}}>
                  <strong>The most important thing:</strong> Your partner's access to Osprey's software is a technical moat. No one else can build the TERRAWATCH-Osprey data fusion because no one else has write access to the Litter Gitter data system. This is a defensible competitive advantage that should be formalized — a data sharing agreement and technology partnership between TERRAWATCH and Osprey Initiative before either company talks to a grant agency or investor.
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 9: DATA SOURCES ══════════ */}
          {tab===12&&(()=>{
            const activeSources=dsView==="free"?FREE:PAID;
            const filtered=dsFilter==="all"?activeSources:activeSources.filter(c=>c.cat===dsFilter);
            const totalFree=FREE.reduce((a,c)=>a+c.sources.length,0);
            const totalPaid=PAID.reduce((a,c)=>a+c.sources.length,0);
            return(
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div style={{background:`linear-gradient(135deg,${C.panel},${C.surface})`,border:`1px solid ${C.t6}44`,borderRadius:10,padding:"22px 28px",borderLeft:`4px solid ${C.t6}`}}>
                  <div style={{fontSize:8,color:C.t6,letterSpacing:"0.22em",marginBottom:6,fontFamily:"'Fira Code',monospace"}}>TERRAWATCH · COMPLETE DATA SOURCE REGISTRY · FREE + PAID</div>
                  <h2 style={{fontSize:22,fontWeight:800,color:C.ink,marginBottom:8}}>
                    {totalFree} free sources. {totalPaid} paid options.
                    <span style={{color:C.t6}}> Every feed TERRAWATCH can ingest.</span>
                  </h2>
                  <p style={{fontSize:11,color:C.muted,lineHeight:1.85,maxWidth:820}}>
                    TERRAWATCH's competitive moat is data integration — pulling from 51+ siloed government portals, satellite feeds, and community sensor networks and normalizing them into one queryable system. Free sources are the foundation. Paid sources are optional upgrades that unlock specific high-value capabilities. All free sources have server services built and API endpoints active.
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:12}}>
                    {[{l:"Free API sources",v:totalFree,c:C.t6},{l:"Paid / optional",v:totalPaid,c:C.t2},{l:"Free satellite programs",v:"7",c:"#34d399"},{l:"Free ground networks",v:"15+",c:"#22d3ee"}].map(({l,v,c})=>(
                      <div key={l} style={{background:C.dim,borderRadius:7,padding:"10px 14px"}}>
                        <div style={{fontSize:24,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace",lineHeight:1}}>{v}</div>
                        <div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{display:"flex",borderRadius:7,overflow:"hidden",border:`1px solid ${C.border2}`}}>
                    {[["free","✅ Free Sources"],["paid","💰 Paid / Optional"]].map(([k,l])=>(
                      <button key={k} onClick={()=>{setDsView(k);setDsFilter("all");}}
                        style={{padding:"8px 18px",fontSize:11,fontWeight:dsView===k?700:400,
                          background:dsView===k?(k==="free"?`${C.t6}22`:C.t2+"22"):C.panel,
                          color:dsView===k?(k==="free"?C.t6:C.t2):C.muted,
                          border:"none",cursor:"pointer",transition:"all 0.15s"}}>{l}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button onClick={()=>setDsFilter("all")} style={{padding:"6px 12px",fontSize:10,borderRadius:5,cursor:"pointer",fontWeight:600,background:dsFilter==="all"?C.t6:C.panel,color:dsFilter==="all"?C.ink:C.muted,border:`1px solid ${dsFilter==="all"?C.t6:C.border}`}}>All</button>
                    {activeSources.map(c=>(
                      <button key={c.cat} onClick={()=>setDsFilter(c.cat)} style={{padding:"6px 12px",fontSize:10,borderRadius:5,cursor:"pointer",background:dsFilter===c.cat?`${c.color}22`:C.panel,color:dsFilter===c.cat?c.color:C.muted,border:`1px solid ${dsFilter===c.cat?c.color:C.border}`,fontWeight:dsFilter===c.cat?700:400}}>
                        {c.cat.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {filtered.map(cat=>(
                  <div key={cat.cat} style={{background:C.panel,border:`1px solid ${cat.color}33`,borderRadius:9,padding:"16px 20px",borderTop:`3px solid ${cat.color}`}}>
                    <div style={{fontSize:12,color:cat.color,fontWeight:800,marginBottom:12}}>
                      {cat.cat}<span style={{fontSize:10,color:C.muted,fontWeight:400,marginLeft:8}}>{cat.sources.length} sources</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:dsView==="free"?"160px 180px 1fr 160px":"160px 180px 120px 1fr 120px",gap:8,padding:"4px 8px",fontSize:9,color:C.muted,letterSpacing:"0.12em",fontWeight:600,borderBottom:`1px solid ${C.border2}`,marginBottom:6}}>
                      <span>SOURCE</span><span>PARAMETERS</span>{dsView==="paid"&&<span>PRIORITY</span>}<span>TERRAWATCH USE</span><span>{dsView==="free"?"UPDATE":"COST"}</span>
                    </div>
                    {cat.sources.map((s,i)=>(
                      <div key={s.name} style={{display:"grid",gridTemplateColumns:dsView==="free"?"160px 180px 1fr 160px":"160px 180px 120px 1fr 120px",gap:8,padding:"8px 8px",borderBottom:i<cat.sources.length-1?`1px solid ${C.border}`:"none",alignItems:"start",background:i%2===0?"transparent":`${cat.color}05`}}>
                        <div>
                          <div style={{fontSize:11,color:cat.color,fontWeight:700}}>{s.name}</div>
                          <div style={{fontSize:9,color:C.muted,marginTop:2,wordBreak:"break-all"}}>{s.url}</div>
                        </div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.6}}>{s.params}</div>
                        {dsView==="paid"&&(
                          <div><span style={{fontSize:9,padding:"2px 7px",borderRadius:3,fontWeight:700,
                            background:s.priority&&s.priority.startsWith("HIGH")&&!s.priority.includes("LOW")?`${C.now}22`:s.priority&&s.priority.startsWith("MEDIUM")?`${C.q2}22`:`${C.muted}22`,
                            color:s.priority&&s.priority.startsWith("HIGH")&&!s.priority.includes("LOW")?C.now:s.priority&&s.priority.startsWith("MEDIUM")?C.q2:C.muted,
                            border:`1px solid ${s.priority&&s.priority.startsWith("HIGH")&&!s.priority.includes("LOW")?C.now:s.priority&&s.priority.startsWith("MEDIUM")?C.q2:C.muted}44`}}>
                            {s.priority?s.priority.split(" ")[0]:"—"}
                          </span></div>
                        )}
                        <div style={{fontSize:10,color:C.text,lineHeight:1.65}}>{s.terrawatch}</div>
                        <div style={{fontSize:10,color:dsView==="free"?C.t6:C.t2,fontWeight:600,lineHeight:1.5}}>{dsView==="free"?s.update:s.cost}</div>
                      </div>
                    ))}
                  </div>
                ))}

                {dsView==="paid"&&(
                  <div style={{background:C.panel,border:`1px solid ${C.t2}44`,borderRadius:9,padding:"16px 20px",borderLeft:`4px solid ${C.t2}`}}>
                    <div style={{fontSize:11,color:C.t2,fontWeight:800,marginBottom:10}}>PAID SOURCE INTEGRATION SEQUENCE</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                      {[
                        {phase:"Activate at Launch",color:C.now,items:["Vexcel Ortho + Oblique + Multispectral (base license) — ~$800/mo","Vexcel Elevate DTM/DSM — add-on to base","Vexcel Elements AI — add-on, enables CAFO + septic + SITEVAULT"]},
                        {phase:"Add in Month 4–6",color:C.q2,items:["Planet PlanetScope — ~$500–1,000/mo, daily HAB surface monitoring","Vexcel On Demand — per-event HAB confirmation, ~$500–2,000/collect","Eurofins lab results — per-sample PFAS validation for first attribution contract"]},
                        {phase:"Phase 2–3 Optional",color:C.y2,items:["Planet Tanager hyperspectral — CAFO methane + cyanobacteria at scale","Vexcel 3D Cities — ALAN light geometry + SITEVAULT premium","NatureServe API — biodiversity EWS species conservation weighting","Aquagenuity — utility SCADA integration for cyanobacteria early warning"]},
                      ].map(({phase,color,items})=>(
                        <div key={phase} style={{background:C.surface,border:`1px solid ${color}33`,borderRadius:8,padding:"12px 14px",borderTop:`2px solid ${color}`}}>
                          <div style={{fontSize:11,color,fontWeight:700,marginBottom:8}}>{phase}</div>
                          {items.map(item=>(
                            <div key={item} style={{display:"flex",gap:7,padding:"4px 0",borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.text}}>
                              <span style={{color,flexShrink:0}}>→</span>{item}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dsView==="free"&&(
                  <div style={{background:C.panel,border:`1px solid ${C.t6}44`,borderRadius:9,padding:"14px 20px",borderLeft:`4px solid ${C.t6}`}}>
                    <div style={{fontSize:10,color:C.t6,fontWeight:700,marginBottom:6}}>FREE SOURCE INTEGRATION PRIORITY — BUILD IN THIS ORDER</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      {[
                        {n:"Day 1 — Core water feeds",items:["USGS NWIS (REST API)","NOAA NWS (no key)","NOAA CO-OPS (REST API)","EPA AQS (API key)","AirNow (API key)"]},
                        {n:"Week 2 — Remote sensing",items:["GOES-R via NOAA NODD (AWS)","Sentinel-2 via Copernicus","MODIS via NASA Earthdata","NERRS/CDMO (registration)","NOAA CoastWatch ERDDAP"]},
                        {n:"Month 2 — Depth layers",items:["EPA WQP (historical baseline)","NRCS SSURGO (soil)","USGS NWI (wetlands)","iNaturalist API (biodiversity)","EPA ECHO (compliance)","FEMA FIRM (flood zones)"]},
                      ].map(({n,items})=>(
                        <div key={n} style={{background:C.surface,borderRadius:7,padding:"10px 12px"}}>
                          <div style={{fontSize:10,color:C.t6,fontWeight:700,marginBottom:6}}>{n}</div>
                          {items.map(i=>(
                            <div key={i} style={{fontSize:10,color:C.muted,padding:"3px 0",borderBottom:`1px solid ${C.border}`,display:"flex",gap:7}}>
                              <span style={{color:C.t6}}>✓</span>{i}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ══════════ TAB 10: AIRBUS ══════════ */}
          {tab===13&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{background:`linear-gradient(135deg,#0a1628,#0d2040)`,border:`1px solid #4f8ef744`,borderRadius:10,padding:"24px 30px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:"40%",height:"100%",background:`radial-gradient(ellipse at right,#1d6fcc12,transparent 70%)`}}/>
                <div style={{fontSize:8,color:"#4f8ef7",letterSpacing:"0.22em",marginBottom:8,fontFamily:"'Fira Code',monospace"}}>AIRBUS × TERRAWATCH · TWO OPPORTUNITIES · ONE COMPANY · ONE BACKYARD</div>
                <h2 style={{fontSize:26,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.15}}>
                  Airbus builds planes 20 minutes away.<br/>
                  <span style={{color:"#4f8ef7"}}>Their satellite division owns the world's best 30cm daily imagery.</span>
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820,marginBottom:16}}>
                  These are two completely separate divisions of the same company — but that is the opportunity. The Mobile aircraft plant is a local TERRAWATCH compliance client reachable this month. The satellite division (Airbus Defence and Space) operates Pléiades Neo, a 30cm multi-revisit constellation that would be TERRAWATCH's most powerful imagery layer. The path from one to the other runs through an internal corporate introduction — a relationship with the Airbus Mobile EHS team is the door into one of the world's largest aerospace companies.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[{l:"Airbus Mobile employees",v:"2,000+",c:"#4f8ef7"},{l:"Pléiades Neo resolution",v:"30cm",c:C.t6},{l:"Revisit rate (combined fleet)",v:"Several/day",c:C.t1},{l:"Neo Next launch",v:"Early 2028",c:C.q2}].map(({l,v,c})=>(
                    <div key={l} style={{background:"rgba(10,61,43,0.06)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"12px 14px"}}>
                      <div style={{fontSize:20,fontWeight:800,color:c,lineHeight:1.2,marginBottom:4}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {/* Client opportunity */}
                <div style={{background:C.panel,border:`1px solid ${C.t6}44`,borderRadius:9,padding:"18px 20px",borderTop:`3px solid ${C.t6}`}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>🏭</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:C.t6,fontWeight:800}}>Opportunity 1 — TERRAWATCH Client</div>
                      <div style={{fontSize:10,color:C.muted}}>Airbus Mobile Manufacturing · Brookley Aeroplex</div>
                    </div>
                    <Tag color={C.now}>APPROACH NOW</Tag>
                  </div>
                  <p style={{fontSize:11,color:C.muted,lineHeight:1.85,marginBottom:10}}>The Mobile facility now operates three A320 final assembly lines across 190 acres with 2,000+ employees, pursuing LEED Silver across all new construction. Every large industrial facility of this size carries active NPDES stormwater discharge permits, ambient air quality monitoring requirements at the fence line, and a corporate ESG mandate from Paris headquarters. TERRAWATCH's automated compliance monitoring is a direct operational fit.</p>
                  <div style={{marginBottom:10}}>
                    {["Real-time ambient air quality at fence line (PM2.5, NOₓ, SO₂) — automated reporting","Stormwater discharge monitoring at Brookley campus outfall points","Automated quarterly EPA compliance reports — zero EHS staff time","Stormwater early warning before neighboring facility exceedances become their problem","Corporate ESG dashboard: Paris headquarters gets real-time Alabama environmental feed"].map(i=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.border}`,fontSize:11,color:C.text}}>
                        <span style={{color:C.t6,flexShrink:0}}>→</span>{i}
                      </div>
                    ))}
                  </div>
                  <div style={{background:`${C.t6}0f`,border:`1px solid ${C.t6}33`,borderRadius:7,padding:"12px 14px",marginBottom:8}}>
                    <div style={{fontSize:10,color:C.t6,fontWeight:700,marginBottom:4}}>THE ONE-PARAGRAPH PITCH</div>
                    <div style={{fontSize:10,color:C.text,lineHeight:1.85,fontStyle:"italic"}}>"Airbus is already pursuing LEED Silver across all new Mobile construction and exploring water use reduction as part of the expansion. TERRAWATCH gives your EHS team real-time ambient monitoring, automated EPA compliance reporting, and a stormwater alert system — all in a single dashboard your Paris sustainability team can also access. At $15,000–$25,000 per year, that is less than one junior EHS staff salary for monitoring coverage that reduces regulatory risk across the entire 190-acre campus."</div>
                  </div>
                  <div style={{padding:"8px 10px",background:C.dim,borderRadius:5,fontSize:10,color:C.muted}}>
                    <strong style={{color:C.t6}}>Buyer:</strong> EHS Director — not Daryl Taylor. Find via LinkedIn: "Airbus Mobile Environmental Health Safety." Ask BCEDA for facility contact directory.{" "}
                    <strong style={{color:C.t6}}>Revenue:</strong> $15,000–$40,000/yr compliance contract.
                  </div>
                </div>

                {/* Data partner opportunity */}
                <div style={{background:C.panel,border:`1px solid #4f8ef744`,borderRadius:9,padding:"18px 20px",borderTop:`3px solid #4f8ef7`}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                    <span style={{fontSize:18}}>🛰️</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,color:"#4f8ef7",fontWeight:800}}>Opportunity 2 — Data Partnership</div>
                      <div style={{fontSize:10,color:C.muted}}>Airbus Defence and Space · OneAtlas Platform · Toulouse</div>
                    </div>
                    <Tag color={C.q2}>MONTH 3–6</Tag>
                  </div>
                  <p style={{fontSize:11,color:C.muted,lineHeight:1.85,marginBottom:10}}>A completely different division — but the same parent company. Airbus Defence and Space operates the most capable commercial Earth observation fleet available: Pléiades Neo at 30cm with daily multi-revisit, plus TerraSAR-X radar that sees through clouds. A data partnership here would give TERRAWATCH imagery capabilities no regional environmental competitor can match.</p>
                  <div style={{marginBottom:10}}>
                    {[
                      {name:"Pléiades Neo",res:"30cm",note:"Daily multi-revisit. HAB confirmation, blue carbon species mapping, septic plume detection."},
                      {name:"TerraSAR-X (SAR radar)",res:"1m",note:"ALL-WEATHER. Sees through Gulf Coast summer clouds that blind every optical satellite. The hidden gem."},
                      {name:"Pléiades Neo Next",res:"~20cm",note:"Launches early 2028. 20cm class approaches Vexcel aerial quality at satellite revisit rates."},
                      {name:"TanDEM-X (DEM)",res:"12m",note:"Global DTM supplement for rural Alabama beyond Vexcel AOI."},
                      {name:"SPOT archive",res:"1.5m",note:"Historical baseline back to 1986 — supplements Vexcel library pre-2012."},
                    ].map(r=>(
                      <div key={r.name} style={{display:"grid",gridTemplateColumns:"130px 50px 1fr",gap:8,padding:"6px 0",borderBottom:`1px solid ${C.border}`,alignItems:"start"}}>
                        <div style={{fontSize:11,color:"#4f8ef7",fontWeight:600}}>{r.name}</div>
                        <div style={{fontSize:11,color:C.t6,fontWeight:700}}>{r.res}</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{r.note}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{background:`#4f8ef70f`,border:`1px solid #4f8ef733`,borderRadius:7,padding:"10px 12px",marginBottom:8}}>
                    <div style={{fontSize:10,color:"#4f8ef7",fontWeight:700,marginBottom:4}}>WHY TerraSAR-X IS THE HIDDEN GEM</div>
                    <div style={{fontSize:10,color:C.text,lineHeight:1.75}}>HABs peak in July–August — peak Gulf Coast thunderstorm season. Planet, Sentinel-2, and Vexcel On Demand all fail under cloud cover. TerraSAR-X is SAR radar: it penetrates clouds completely, day and night. Surface roughness anomalies from a bloom are detectable even when optically invisible. No environmental monitoring platform on the Gulf Coast has integrated SAR. This is a genuine first.</div>
                  </div>
                  <div style={{padding:"8px 10px",background:C.dim,borderRadius:5,fontSize:10,color:C.muted}}>
                    <strong style={{color:"#4f8ef7"}}>Free research path:</strong> ESA's Third Party Mission program offers free Pléiades Neo archive and new tasking for approved scientific research projects. Your staff scientist co-PI submits this proposal and you get free 30cm imagery during the research phase.
                  </div>
                </div>
              </div>

              {/* Approach sequence */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,fontFamily:"'Fira Code',monospace"}}>APPROACH SEQUENCE — CLIENT FIRST, DATA PARTNERSHIP SECOND</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {[
                    {ph:"This Month",c:C.now,t:"Identify Airbus Mobile EHS Director",d:"LinkedIn: 'Airbus Mobile Environmental Health Safety.' Ask BCEDA for a facility contact intro — Lee Lawson's team has deep Airbus relationships and this is a natural warm-intro request from the SITEVAULT conversation.",v:"Opens $15K–$40K/yr compliance contract"},
                    {ph:"Month 2",c:C.q2,t:"Pitch TERRAWATCH — Propose 90-Day Pilot",d:"Free pilot: TERRAWATCH monitors ambient air and stormwater at the Brookley campus perimeter. Show them the automated EPA compliance report at end of Month 1. Any EHS director who has manually compiled quarterly monitoring data will immediately understand the value.",v:"First enterprise compliance client — your backyard"},
                    {ph:"Month 3–4",c:C.q2,t:"Request Internal Corporate Introduction",d:"Once the EHS relationship is established: 'We're building environmental intelligence capabilities that Airbus's corporate innovation team might find relevant for their earth observation partnerships. Do you have a contact we could reach?' Airbus runs UpNext (their startup accelerator) — this is the bridge to Toulouse.",v:"Internal intro worth 10x cold outbound to Airbus Defence and Space"},
                    {ph:"Month 4–6",c:C.q3,t:"Apply to ESA Third Party Mission for Free Pléiades Neo",d:"Staff scientist co-PI submits research proposal: 'Validation of HAB bloom signatures using very-high-resolution satellite imagery in Mobile Bay, Alabama.' ESA explicitly offers this for environmental monitoring research. Free 30cm imagery during research phase.",v:"Free 30cm HAB Oracle validation imagery — publishable methodology"},
                    {ph:"Month 6–9",c:C.y2,t:"Approach Airbus Intelligence OneAtlas Partnerships",d:"Armed with: (1) Airbus Mobile client relationship, (2) ESA research access, (3) published methodology — approach the commercial partnerships team at space-solutions.airbus.com. Pitch: TERRAWATCH is the Gulf Coast environmental intelligence platform. We want to be the showcase environmental application for Pléiades Neo in North America. Highlight TerraSAR-X all-weather SAR as the capability no competitor has.",v:"Strategic data partnership — preferred pricing on 30cm daily imagery"},
                    {ph:"Year 2",c:C.y2,t:"Airbus UpNext Accelerator Application",d:"Airbus UpNext incubates sustainability and operational technology startups with direct integration into Airbus's industrial and commercial programs. A TERRAWATCH application with an existing Airbus client relationship plus a data partnership with Airbus Defence and Space is an exceptionally competitive submission.",v:"Accelerator funding + global Airbus distribution network"},
                  ].map((step,i,arr)=>(
                    <div key={step.ph} style={{display:"flex",gap:14,paddingBottom:i<arr.length-1?20:0,borderLeft:i<arr.length-1?`2px solid ${step.c}44`:"none",marginLeft:10}}>
                      <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,marginLeft:-13,marginTop:2,background:`${step.c}22`,border:`2px solid ${step.c}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:step.c,fontWeight:700}}>{i+1}</div>
                      <div style={{flex:1,paddingBottom:i<arr.length-1?16:0}}>
                        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                          <Tag color={step.c}>{step.ph}</Tag>
                          <span style={{fontSize:13,color:step.c,fontWeight:800}}>{step.t}</span>
                        </div>
                        <p style={{fontSize:11,color:C.muted,lineHeight:1.8,marginBottom:6}}>{step.d}</p>
                        <div style={{fontSize:10,color:step.c,fontWeight:600}}>↗ {step.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue + ecosystem */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:C.panel,border:`1px solid ${C.t6}33`,borderRadius:9,padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:C.t6,fontWeight:800,marginBottom:10}}>AIRBUS CLIENT REVENUE POTENTIAL</div>
                  {[
                    {item:"Airbus Mobile facility compliance",val:"$15K–$40K/yr"},
                    {item:"MAAS Aviation paint shop stormwater",val:"$8K–$15K/yr"},
                    {item:"Airbus corporate ESG dashboard tier",val:"$25K–$60K/yr"},
                    {item:"Airbus UpNext funding (Year 2)",val:"$100K–$500K"},
                  ].map(({item,val})=>(
                    <div key={item} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`,fontSize:11,gap:12}}>
                      <span style={{color:C.muted}}>{item}</span>
                      <span style={{color:C.t6,fontWeight:700,fontFamily:"'Fira Code',monospace",flexShrink:0}}>{val}</span>
                    </div>
                  ))}
                  <div style={{marginTop:8,padding:"8px 10px",background:`${C.t6}10`,border:`1px solid ${C.t6}33`,borderRadius:5,fontSize:11,color:C.t6,fontWeight:700}}>
                    Total Airbus ecosystem potential: $148K–$615K
                  </div>
                </div>
                <div style={{background:C.panel,border:`1px solid #4f8ef733`,borderRadius:9,padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:"#4f8ef7",fontWeight:800,marginBottom:10}}>ALSO IN THE AIRBUS BROOKLEY ECOSYSTEM</div>
                  {[
                    {name:"MAAS Aviation",note:"Aircraft painting — 3 hangars at Brookley. Paint shop VOC and stormwater compliance is a direct TERRAWATCH use case."},
                    {name:"Alabama Dept of Commerce",note:"Ellen McNair (Secretary) co-invests in Airbus expansion and has relationships with every major industrial EHS contact in Alabama."},
                    {name:"Collins Aerospace (Foley)",note:"Part of the same Gulf Coast aerospace cluster. Airbus relationship strengthens the Collins outreach."},
                    {name:"Mobile Area Chamber",note:"Airbus strategic partner since 2015. Parallel warm-intro channel if BCEDA route needs backup."},
                  ].map(c=>(
                    <div key={c.name} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:12,color:C.text,fontWeight:600}}>{c.name}</div>
                      <div style={{fontSize:10,color:C.muted,lineHeight:1.6,marginTop:2}}>{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 11: FOX 10 ══════════ */}
          {tab===14&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,#7c2d12,#9a3412)`,
                border:`1px solid #f5740044`,borderRadius:10,padding:"24px 30px",
                position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,right:0,width:"40%",height:"100%",
                  background:`radial-gradient(ellipse at right,#f5740008,transparent 70%)`}}/>
                <div style={{fontSize:8,color:"#f57400",letterSpacing:"0.22em",marginBottom:8,
                  fontFamily:"'Fira Code',monospace"}}>
                  FOX 10 WALA × TERRAWATCH · CONTENT PARTNERSHIP · NOT A DONATION
                </div>
                <h2 style={{fontSize:26,fontWeight:800,color:C.white,marginBottom:10,lineHeight:1.15}}>
                  Fox 10 has a distributed sensor network<br/>
                  <span style={{color:"#f57400"}}>covering every neighborhood in Mobile and Baldwin County.</span>
                </h2>
                <p style={{fontSize:11,color:C.muted,lineHeight:1.9,maxWidth:820,marginBottom:16}}>
                  Gray Television — Fox 10 WALA's parent company — operates a neighborhood weather station network powered by Tempest. Every homeowner who buys a Tempest station automatically feeds data into the Gray TV network, displayed live on Fox 10 broadcasts. That's dozens to hundreds of backyard sensors measuring temperature, humidity, wind, precipitation, lightning, UV, and solar radiation at neighborhood scale across the Mobile-Pensacola market. TERRAWATCH fuses that hyperlocal data layer with bay sensor feeds and ML models to produce predictions far more precise than any single NWS point. The deal is simple: their data makes our models better. Our environmental intelligence makes their content irreplaceable.
                </p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                  {[
                    {l:"Gray TV markets (national)",v:"77 stations",c:"#f57400"},
                    {l:"Fox 10 weather app installs",v:"31,000+",c:C.t1},
                    {l:"24-hr weather channel",v:"Weather Now",c:C.q2},
                    {l:"Years on Mobile Bay",v:"70+",c:C.t6},
                  ].map(({l,v,c})=>(
                    <div key={l} style={{background:"rgba(10,61,43,0.06)",
                      border:"1px solid rgba(255,255,255,0.08)",borderRadius:7,padding:"12px 14px"}}>
                      <div style={{fontSize:18,fontWeight:800,color:c,lineHeight:1.2,marginBottom:4}}>{v}</div>
                      <div style={{fontSize:9,color:C.muted}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What Fox 10 actually has */}
              <div style={{background:C.panel,border:`1px solid #f5740033`,borderRadius:9,
                padding:"18px 22px",borderLeft:`4px solid #f57400`}}>
                <div style={{fontSize:11,color:"#f57400",fontWeight:800,marginBottom:12,letterSpacing:"0.08em"}}>
                  WHAT FOX 10 / GRAY TV ACTUALLY HAS — FIVE DATA ASSETS
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[
                    {
                      asset:"Gray TV Tempest Neighborhood Network",
                      color:"#f57400",
                      highlight:true,
                      what:"Gray Television operates an active Tempest weather station network across all their markets. When Mobile-area homeowners buy a Tempest station ($349), their data automatically flows into the Gray TV network and displays live on Fox 10 broadcasts. Dozens to hundreds of backyard sensors measure: temperature, humidity, barometric pressure, wind speed and direction, precipitation rate, lightning strike detection, UV index, and solar radiation — at neighborhood resolution, updating every minute.",
                      terrawatch:"The hyperlocal weather layer TERRAWATCH's HAB Oracle needs. A single NWS observation at Mobile Airport cannot tell you that wind dropped to near-zero in the northern bay while southeastern bay winds stayed 12 knots. The Tempest network at 30–50 points can. HAB prediction precision tightens from 'eastern bay' to 'between Dog River and Fowl River mouth.'"
                    },
                    {
                      asset:"Proprietary 250-Meter Doppler Radar",
                      color:C.t1,
                      what:"Fox 10's weather app advertises 250-meter resolution radar — finer spatial resolution than the NWS NEXRAD product — updating at a faster cycle. This is private radar data not available through any free government feed. Sub-kilometer precipitation fields at this resolution allow TERRAWATCH to map exactly which sub-watershed received a rain event and when.",
                      terrawatch:"Stormwater pulse trigger: when a cell crosses the Dog River headwaters, TERRAWATCH fires the nonpoint source loading model 20 minutes before the runoff pulse reaches the bay mouth. Industrial compliance clients get a heads-up before their permit discharge monitoring point sees elevated turbidity."
                    },
                    {
                      asset:"24-Hour 'Weather Now' Local Channel",
                      color:C.q2,
                      what:"WALA operates a 24-hour local weather channel called Weather Now, available on Cox digital channel 698 in Pensacola. Continuous broadcast with no programming to compete against — a constant screen that reaches water-adjacent households around the clock.",
                      terrawatch:"A co-branded 'Fox 10 Bay Watch' dashboard in TERRAWATCH's visual style displayed on Weather Now during non-forecast periods. Live DO₂, chlorophyll-a, water temperature, HAB probability, hypoxia risk — the bay's vital signs on screen 24/7. No other Gulf Coast TV station has anything like it."
                    },
                    {
                      asset:"Fox 10 Weather App — 31,000+ Installs",
                      color:C.t6,
                      what:"The Fox 10 weather app has 31,000+ active installs in the Mobile-Pensacola market, with a 4.77-star rating. This is an already-engaged audience of people who care enough about local weather to install a dedicated app — exactly the population of outdoor workers, boaters, fishers, and coastal residents who are TERRAWATCH's core consumer market.",
                      terrawatch:"A 'Bay Health' tab in the Fox 10 weather app powered by TERRAWATCH — showing real-time water quality, HAB probability, hypoxia risk, and beach advisories. TERRAWATCH reaches 31,000 phones without acquiring a single user. Fox 10 increases app stickiness and time-in-app without building anything."
                    },
                    {
                      asset:"Chief Meteorologist Jason Smith — 20+ Years Gulf Coast",
                      color:"#a78bfa",
                      what:"Jason Smith has covered the Gulf Coast for over 20 years, tracking Katrina, Ivan, and Michael. He hosts Fox Ten Outdoors covering hunting and fishing. He is a National Weather Association Seal holder. A meteorologist of this tenure understands Mobile Bay's environmental variability at an operational level — not just theoretically.",
                      terrawatch:"The right first call. A meteorologist who fished the bay during a hypoxia summer and watched the shrimp fleet move knows exactly what a 5-day hypoxia forecast is worth. He is the internal champion who makes this partnership happen — not a sales rep, not a news director. The chief met."
                    },
                    {
                      asset:"Gray Television National Network — 77 Stations",
                      color:C.y2,
                      what:"Gray Television owns 77 television stations in 57 markets nationally, including Gulf Coast markets in Biloxi, New Orleans, Panama City, and beyond. A successful Fox 10 / TERRAWATCH co-branded environmental content partnership in Mobile becomes a template Gray can deploy across every Gulf Coast market they operate.",
                      terrawatch:"One successful Mobile partnership → pitch to Gray TV corporate for a Gulf Coast environmental intelligence content package → TERRAWATCH distributed to Biloxi, Pensacola, Panama City, and New Orleans markets without individual market sales. Gray gets differentiated environmental content. TERRAWATCH gets regional distribution."
                    },
                  ].map(a=>(
                    <div key={a.asset} style={{background:C.surface,
                      border:`1px solid ${a.color}${a.highlight?"66":"33"}`,
                      borderRadius:8,padding:"14px 16px",
                      borderLeft:`3px solid ${a.color}`,
                      boxShadow:a.highlight?`0 0 20px ${a.color}10`:"none"}}>
                      {a.highlight&&<div style={{fontSize:9,color:a.color,fontWeight:700,
                        letterSpacing:"0.14em",marginBottom:4}}>★ PRIMARY ASSET</div>}
                      <div style={{fontSize:12,color:a.color,fontWeight:800,marginBottom:6}}>{a.asset}</div>
                      <p style={{fontSize:10,color:C.muted,lineHeight:1.75,marginBottom:8}}>{a.what}</p>
                      <div style={{padding:"6px 10px",background:`${a.color}0a`,
                        border:`1px solid ${a.color}33`,borderRadius:5,
                        fontSize:10,color:a.color,lineHeight:1.65}}>
                        <strong>TERRAWATCH use: </strong>{a.terrawatch}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Tempest network deep dive */}
              <div style={{background:C.panel,border:`1px solid #f5740044`,borderRadius:9,
                padding:"18px 22px",borderTop:`3px solid #f57400`}}>
                <div style={{fontSize:11,color:"#f57400",fontWeight:800,marginBottom:12,letterSpacing:"0.08em"}}>
                  THE TEMPEST NETWORK — WHAT IT DOES TO EACH TERRAWATCH CAPABILITY
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
                  {[
                    {
                      cap:"HAB Oracle — Precision Upgrade",
                      before:"Single NWS Mobile Airport wind obs. Bloom location: 'Eastern bay.'",
                      after:"30–50 Tempest stations across bay perimeter. Bloom location: 'Northern bay between Dog River mouth and Fowl River' — actionable at the farm level.",
                      gain:"Sub-watershed HAB localization",
                      color:"#f57400",
                    },
                    {
                      cap:"Hypoxia Forecaster — Stratification Model",
                      before:"Model uses 1–2 wind observation points to estimate thermal stratification across the entire bay.",
                      after:"Real-time wind field from 10+ Tempest stations along the bay perimeter. Bay-wide stratification map updated every 60 seconds. Hypoxia risk spatially resolved to bay sections.",
                      gain:"Spatial hypoxia risk mapping",
                      color:C.t1,
                    },
                    {
                      cap:"Stormwater Pulse Trigger",
                      before:"NOAA AHPS rain gauge detects precipitation at one point, 15-minute lag, post-event.",
                      after:"Tempest station in the headwaters sub-catchment detects storm cell 20 minutes before it reaches the bay mouth. TERRAWATCH fires the stormwater loading model on the leading edge of the event.",
                      gain:"20-minute stormwater warning lead time",
                      color:C.q2,
                    },
                    {
                      cap:"Lightning as Ecological Signal",
                      before:"Lightning not tracked in any current TERRAWATCH feed.",
                      after:"Tempest lightning strike detection across the watershed. 3+ strikes within 10 miles of a monitored sub-watershed → automated alert to industrial compliance clients 45 minutes before runoff pulse arrives at their discharge monitoring point.",
                      gain:"New automated industrial alert trigger",
                      color:C.t4,
                    },
                    {
                      cap:"Nonpoint Source Attribution",
                      before:"Precipitation input is NOAA AHPS at 4km resolution. Sub-catchment loading estimated from coarse rainfall field.",
                      after:"Neighborhood-scale precipitation from 30+ Tempest stations. Sub-catchment loading model now has near-actual rainfall at 400m resolution. Source attribution confidence interval narrows from ±40% to ±15%.",
                      gain:"3× source attribution precision improvement",
                      color:C.t6,
                    },
                    {
                      cap:"Cross-Media Pollutant Tracker",
                      before:"Atmospheric deposition uses NOAA point observation for wet deposition estimation.",
                      after:"Tempest precipitation data at neighborhood scale gives watershed-level wet deposition map. Every nitrogen deposition budget calculation improves. TMDL revision methodology becomes more defensible.",
                      gain:"Defensible atmospheric N budget",
                      color:C.y2,
                    },
                  ].map(u=>(
                    <div key={u.cap} style={{background:C.surface,border:`1px solid ${u.color}33`,
                      borderRadius:8,padding:"13px 15px",borderTop:`2px solid ${u.color}`}}>
                      <div style={{fontSize:11,color:u.color,fontWeight:800,marginBottom:8}}>{u.cap}</div>
                      <div style={{marginBottom:6}}>
                        <div style={{fontSize:9,color:C.muted,fontWeight:700,marginBottom:2}}>WITHOUT TEMPEST</div>
                        <div style={{fontSize:10,color:C.muted,lineHeight:1.65}}>{u.before}</div>
                      </div>
                      <div style={{marginBottom:8}}>
                        <div style={{fontSize:9,color:u.color,fontWeight:700,marginBottom:2}}>WITH TEMPEST NETWORK</div>
                        <div style={{fontSize:10,color:C.text,lineHeight:1.65}}>{u.after}</div>
                      </div>
                      <div style={{padding:"4px 8px",background:`${u.color}15`,
                        border:`1px solid ${u.color}33`,borderRadius:4,
                        fontSize:9,color:u.color,fontWeight:700}}>↑ {u.gain}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* The partnership pitch */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:C.panel,border:`1px solid #f5740044`,borderRadius:9,
                  padding:"18px 20px",borderLeft:`4px solid #f57400`}}>
                  <div style={{fontSize:11,color:"#f57400",fontWeight:800,marginBottom:10}}>
                    THE PARTNERSHIP PITCH — NOT A SPONSORSHIP ASK
                  </div>
                  <div style={{background:`#f574000f`,border:`1px solid #f5740033`,
                    borderRadius:7,padding:"14px 16px",marginBottom:12}}>
                    <div style={{fontSize:10,color:"#f57400",fontWeight:700,marginBottom:6}}>
                      WORD FOR WORD — TO JASON SMITH OR THE NEWS DIRECTOR
                    </div>
                    <div style={{fontSize:11,color:C.text,lineHeight:1.85,fontStyle:"italic"}}>
                      "We're building a real-time environmental intelligence platform for Mobile Bay — the first system that predicts Harmful Algal Blooms 48–72 hours in advance and forecasts hypoxia events before they kill the shrimp fleet. We want to integrate your Gray TV Tempest neighborhood station network as our hyperlocal weather layer. Your 30+ backyard stations across the market are the most valuable precipitation and wind dataset on the Gulf Coast for bay environmental modeling, and we can't get that resolution from any government feed.
                      <br/><br/>
                      In exchange, Fox 10 gets exclusive first-broadcast rights on every TERRAWATCH environmental alert in the Mobile-Pensacola market. When our HAB Oracle crosses 75%, your meteorologist goes on-air first. We build a co-branded Bay Watch dashboard for Weather Now. We build a Bay Health tab into your weather app. You get environmental intelligence content no competitor station can replicate — and your Tempest network data is the reason it works."
                    </div>
                  </div>
                  <div style={{fontSize:10,color:C.muted,lineHeight:1.8}}>
                    <strong style={{color:"#f57400"}}>Why this isn't a sponsorship:</strong> You are not asking Fox 10 for money. You are offering them something worth more — exclusive environmental content that differentiates their news product from every competitor in the market. NBC 15, ABC 33/40, and WPMI cannot make this offer. Only Fox 10 has the Tempest network.
                  </div>
                </div>

                <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,
                  padding:"18px 20px"}}>
                  <div style={{fontSize:11,color:C.text,fontWeight:800,marginBottom:10}}>
                    WHAT EACH PARTY GETS
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:"#f57400",fontWeight:700,marginBottom:6}}>FOX 10 / GRAY TV GETS</div>
                    {[
                      "Exclusive first-broadcast rights on every TERRAWATCH environmental alert — HAB, hypoxia, water quality emergencies",
                      "Co-branded 'Fox 10 Bay Watch' live dashboard on Weather Now channel — content that runs 24/7 without staff",
                      "'Bay Health' tab in Fox 10 weather app — increases app stickiness and differentiates from competitor apps",
                      "On-air storyline: 'Our Tempest network powers the Gulf Coast's only HAB early warning system' — promotes their weather station program",
                      "Template for Gray TV corporate to deploy across 77 stations nationally — Mobile is the proof of concept",
                    ].map(i=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",
                        borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.text}}>
                        <span style={{color:"#f57400",flexShrink:0}}>✓</span>{i}
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{fontSize:10,color:C.t1,fontWeight:700,marginBottom:6}}>TERRAWATCH GETS</div>
                    {[
                      "30–50 hyperlocal Tempest sensor nodes across Mobile and Baldwin County — the best neighborhood weather dataset on the Gulf Coast",
                      "250m Doppler radar at sub-NWS resolution — stormwater pulse modeling at sub-catchment scale",
                      "Distribution to 31,000+ Fox 10 app users — TERRAWATCH Bay Health reaches coastal residents with zero user acquisition cost",
                      "Media partner credibility — Fox 10 co-branding legitimizes TERRAWATCH in every grant application and client pitch",
                      "Path to Gray TV national deal — 77 stations, 57 markets, Gulf Coast distribution",
                    ].map(i=>(
                      <div key={i} style={{display:"flex",gap:8,padding:"5px 0",
                        borderBottom:`1px solid ${C.border}`,fontSize:10,color:C.text}}>
                        <span style={{color:C.t1,flexShrink:0}}>✓</span>{i}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Approach sequence */}
              <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:9,
                padding:"18px 22px"}}>
                <div style={{fontSize:11,color:C.muted,letterSpacing:"0.14em",marginBottom:14,
                  fontFamily:"'Fira Code',monospace"}}>APPROACH SEQUENCE — WHO TO CALL AND WHEN</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {[
                    {ph:"This Week",c:C.now,
                      t:"Call Jason Smith — Chief Meteorologist",
                      d:"Don't email. Call the Fox 10 studio main line and ask for Jason Smith. A 20-year Gulf Coast meteorologist who hosts a hunting and fishing show understands Mobile Bay's ecological variability at a personal level. Lead with the science: 'We built a 48-hour HAB prediction model for Mobile Bay. Last summer it would have predicted the July closure 2 days early. Your Tempest network would make it more precise. Can I show you how?'",
                      v:"First meteorologist meeting — the internal champion"},
                    {ph:"Week 2",c:C.q2,
                      t:"Demo the HAB Oracle retrospective with Tempest data simulated",
                      d:"Pull the last 3 Mobile Bay HAB closure events. Show the HAB Oracle running with NWS data only vs. what it would have shown with neighborhood-scale wind and precipitation data from the Tempest network. The precision improvement is visually obvious. Let the map tell the story — the bloom location narrows from a quarter of the bay to a specific creek mouth.",
                      v:"Technical proof that the data fusion works"},
                    {ph:"Month 2",c:C.q2,
                      t:"Pitch the News Director with Jason's endorsement",
                      d:"A meteorologist-endorsed technology pitch to a news director is completely different from a cold sales call. Jason's endorsement turns a budget conversation into a content strategy conversation. The news director sees: a differentiated environmental content product that runs 24/7 on Weather Now with zero ongoing staff cost. That's a yes.",
                      v:"News director approval for content partnership"},
                    {ph:"Month 2–3",c:C.q3,
                      t:"Build the integration — Tempest API + 250m radar feed",
                      d:"Tempest provides a REST API. Gray TV's Tempest network stations are accessible. Build the TERRAWATCH ingest module for Tempest data (same pattern as every other feed in the registry). The 250m radar integration is a separate negotiation — may require a data licensing agreement with Gray TV corporate. Start with Tempest; add radar in Month 3.",
                      v:"30–50 new hyperlocal sensor nodes in TERRAWATCH"},
                    {ph:"Month 3–4",c:C.q3,
                      t:"Launch Fox 10 Bay Watch on Weather Now",
                      d:"Deploy the co-branded TERRAWATCH dashboard on Fox 10's Weather Now channel. Live DO₂, chlorophyll-a, HAB probability, hypoxia risk, water temperature — the bay's vital signs with the Fox 10 branding. Issue a joint press release. The story writes itself: 'Fox 10 and TERRAWATCH launch the Gulf Coast's first real-time bay environmental intelligence system.'",
                      v:"Media launch — credibility multiplier for Hatch + grants"},
                    {ph:"Month 4–6",c:C.y2,
                      t:"Build Bay Health tab in Fox 10 Weather App",
                      d:"Work with Gray TV's digital team to add a Bay Health tab to the Fox 10 weather app. TERRAWATCH provides the API endpoint; they handle the UI integration in their existing app. 31,000+ active users get HAB alerts, beach water quality, and hypoxia advisories pushed to their phones. TERRAWATCH acquires distribution with zero marketing spend.",
                      v:"31,000 mobile users receive TERRAWATCH environmental alerts"},
                    {ph:"Year 2",c:C.y2,
                      t:"Pitch Gray TV Corporate for Gulf Coast Network Deal",
                      d:"With the Mobile partnership proven and documented — Fox 10 Bay Watch viewership data, app engagement uplift, press coverage — pitch Gray Television corporate for a Gulf Coast environmental content licensing agreement. All 77 Gray stations get access to TERRAWATCH's environmental intelligence API. TERRAWATCH gets a content licensing fee per market. Gray gets a national environmental content product.",
                      v:"77 stations × content licensing fee = national distribution"},
                  ].map((step,i,arr)=>(
                    <div key={step.ph} style={{display:"flex",gap:14,
                      paddingBottom:i<arr.length-1?20:0,
                      borderLeft:i<arr.length-1?`2px solid ${step.c}44`:"none",
                      marginLeft:10}}>
                      <div style={{width:24,height:24,borderRadius:"50%",flexShrink:0,
                        marginLeft:-13,marginTop:2,background:`${step.c}22`,
                        border:`2px solid ${step.c}`,display:"flex",alignItems:"center",
                        justifyContent:"center",fontSize:10,color:step.c,fontWeight:700}}>
                        {i+1}
                      </div>
                      <div style={{flex:1,paddingBottom:i<arr.length-1?16:0}}>
                        <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                          <Tag color={step.c}>{step.ph}</Tag>
                          <span style={{fontSize:13,color:step.c,fontWeight:800}}>{step.t}</span>
                        </div>
                        <p style={{fontSize:11,color:C.muted,lineHeight:1.8,marginBottom:6}}>{step.d}</p>
                        <div style={{fontSize:10,color:step.c,fontWeight:600}}>↗ {step.v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue and national expansion */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:C.panel,border:`1px solid ${C.t6}33`,borderRadius:9,
                  padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:C.t6,fontWeight:800,marginBottom:10}}>
                    PARTNERSHIP VALUE — WHAT THIS IS WORTH
                  </div>
                  {[
                    {item:"Data value of Tempest network (30–50 stations)",val:"Equivalent of $15,000–$40,000 commercial weather station deployment — received for free"},
                    {item:"App distribution (31,000 users, 0 CAC)",val:"$0 customer acquisition cost for 31,000 engaged coastal residents"},
                    {item:"Media credibility multiplier",val:"'As featured on Fox 10 Weather' on every grant application and client pitch"},
                    {item:"Gray TV national deal (Year 2)",val:"$500–$2,000/mo per market × 10–20 Gulf Coast markets = $60K–$480K/yr"},
                    {item:"Press coverage value at launch",val:"Fox 10 broadcast reach: 320,000+ households — earned media worth $50,000+ in advertising equivalent"},
                  ].map(({item,val})=>(
                    <div key={item} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:11,color:C.text}}>{item}</div>
                      <div style={{fontSize:10,color:C.t6,fontWeight:600,marginTop:2,lineHeight:1.5}}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{background:C.panel,border:`1px solid #f5740033`,borderRadius:9,
                  padding:"16px 18px"}}>
                  <div style={{fontSize:11,color:"#f57400",fontWeight:800,marginBottom:10}}>
                    KEY CONTACTS AT FOX 10 / GRAY TV
                  </div>
                  {[
                    {name:"Jason Smith",role:"Chief Meteorologist — Fox 10 WALA",note:"20+ years Gulf Coast. NWA Seal holder. Hosts Fox Ten Outdoors (hunting/fishing). He fishes the bay. He understands what HAB Oracle does. FIRST CALL."},
                    {name:"Michael White",role:"Morning Meteorologist — Fox 10 WALA",note:"Joined 2009. AMS and NWA certified. Secondary contact if Smith unavailable. Co-hosts morning show."},
                    {name:"News Director — WALA",role:"Fox 10 WALA, Mobile AL",note:"Content partnership approval. Go through Jason Smith first — his endorsement makes this a meteorologist-backed pitch, not a vendor pitch."},
                    {name:"Gray Television Digital Team",role:"Gray Television corporate",note:"Responsible for the Fox 10 weather app. The Bay Health tab integration requires their involvement. Reach via the local news director once the partnership is approved."},
                    {name:"Gray TV Corporate",role:"Atlanta, GA — corporate HQ",note:"The national deal discussion (Year 2). Once Mobile is proven, pitch gray.tv corporate for a Gulf Coast environmental content licensing agreement."},
                  ].map(c=>(
                    <div key={c.name} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:12,color:C.text,fontWeight:600}}>{c.name}</div>
                      <div style={{fontSize:9,color:"#f57400",marginBottom:3}}>{c.role}</div>
                      <div style={{fontSize:10,color:C.muted,lineHeight:1.6}}>{c.note}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ══════════ TAB 13: NEXT SENSORS ══════════ */}
          {tab===15&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* Hero */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,borderRadius:10,padding:"28px 36px",position:"relative",overflow:"hidden",border:`1px solid ${C.t1}44`}}>
                <div style={{position:"absolute",inset:0,opacity:0.04,backgroundImage:`radial-gradient(${C.t1} 1px,transparent 1px)`,backgroundSize:"24px 24px"}}/>
                <div style={{position:"relative"}}>
                  <div style={{fontSize:8,color:C.t1,letterSpacing:"0.3em",marginBottom:10,fontFamily:"'Fira Code',monospace"}}>TERRAWATCH · SENSOR EXPANSION ROADMAP · 9 NEVER-BEFORE-SOLVED PROBLEMS</div>
                  <h2 style={{fontSize:24,fontWeight:800,color:"#ffffff",marginBottom:10,lineHeight:1.2}}>
                    The sensors we're not pulling from yet.<br/>
                    <span style={{color:C.t1}}>Each one unlocks a problem no environmental platform has ever solved.</span>
                  </h2>
                  <p style={{fontSize:12,color:"#a8d8c8",lineHeight:1.9,maxWidth:860,marginBottom:20}}>
                    TERRAWATCH's 51+ source registry is the foundation. NASA PACE OCI, HF Radar, and TROPOMI are now integrated with server services built and API endpoints active. What follows is the physical sensor expansion layer — six sensor classes requiring hardware partnerships that unlock capabilities that are genuine World Firsts for environmental science.
                  </p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
                    {[
                      {l:"Software integrations completed",v:"3",c:"#22c55e"},
                      {l:"Physical sensor expansions planned",v:"6",c:C.t1},
                      {l:"Additional methodology papers",v:"4",c:"#3b82f6"},
                      {l:"Grant applications unlocked",v:"5+",c:"#f59e0b"},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{background:"rgba(255,255,255,0.07)",borderRadius:7,padding:"12px 14px",border:`1px solid rgba(255,255,255,0.10)`}}>
                        <div style={{fontSize:26,fontWeight:800,color:c,fontFamily:"'Fira Code',monospace",lineHeight:1}}>{v}</div>
                        <div style={{fontSize:9,color:"#a8d8c8",marginTop:5,lineHeight:1.5}}>{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority matrix */}
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:9,padding:"16px 20px"}}>
                <div style={{fontSize:10,color:C.t1,fontWeight:700,marginBottom:12,letterSpacing:"0.1em",fontFamily:"'Fira Code',monospace"}}>INTEGRATION PRIORITY MATRIX — IMPACT VS EFFORT</div>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{borderBottom:`2px solid ${C.border2}`}}>
                        {["Sensor / Data Stream","Problem Solved","TERRAWATCH Capability","Effort","Act"].map(h=>(
                          <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:9,color:C.muted,letterSpacing:"0.1em",fontWeight:700}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {s:"NASA PACE Satellite ✓",p:"HAB species cannot be identified by any satellite — only anomalous chlorophyll-a",c:"First HAB species-attribution from satellite globally — Karenia vs Microcystis vs Pseudo-nitzschia",e:"DONE",ec:"#22c55e",a:"INTEGRATED — server/services/pace.js"},
                        {s:"HF Radar Surface Currents ✓",p:"HAB Oracle predicts where blooms form, not where they travel",c:"HAB bloom trajectory forecasting — where it will be in 14 hours, not just where it is now",e:"DONE",ec:"#22c55e",a:"INTEGRATED — server/services/hfradar.js"},
                        {s:"TROPOMI Methane ✓",p:"CAFO methane self-reporting is unreliable — EPA has no independent verification",c:"Independent continuous CAFO methane attribution — flags discrepancies for EPA enforcement. MethaneSAT lost contact June 2025 — TROPOMI is active replacement.",e:"DONE",ec:"#22c55e",a:"INTEGRATED — server/services/tropomi.js"},
                        {s:"Soil Pore Water Conductivity",p:"Saltwater intrusion detected only after crop death — no advance warning system exists",c:"4–8 week advance saltwater intrusion warning at individual farm scale via LoRaWAN network",e:"MEDIUM",ec:"#d97706",a:"Month 3"},
                        {s:"MS4 Stormwater IoT Nodes",p:"TERRAWATCH infers nonpoint loading from land cover — nothing measures it directly",c:"First continuously measured, spatially resolved nonpoint source loading network on the Gulf Coast",e:"MEDIUM",ec:"#d97706",a:"Month 4"},
                        {s:"Passive Acoustic (Hydrophone)",p:"Fish spawning success is invisible — no system correlates conditions with reproductive outcomes",c:"World's first spawning condition forecast — black drum, redfish, toadfish in Mobile Bay",e:"MEDIUM",ec:"#d97706",a:"Month 4"},
                        {s:"eDNA Auto-Samplers",p:"HAB Oracle identifies bloom probability but not species; invasive species detected only by sight",c:"HAB species attribution before visual detection; oyster pathogen early warning (Dermo, MSX)",e:"MEDIUM",ec:"#d97706",a:"Month 6"},
                        {s:"Wastewater Epidemiology (WBE)",p:"No system links environmental HAB events to actual human exposure data",c:"First env. HAB ↔ human exposure correlation — brevetoxin metabolites in MAWSS wastewater",e:"HIGH",ec:"#dc2626",a:"Year 2"},
                        {s:"AmeriFlux Flux Towers",p:"Blue carbon MRV uses modeled flux — no Verra-approved methodology uses direct measurement",c:"Verra-approvable blue carbon MRV with directly measured CO₂/CH₄ — the global standard",e:"HIGH",ec:"#dc2626",a:"Year 2"},
                      ].map((r,i)=>(
                        <tr key={r.s} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?"transparent":C.dim}}>
                          <td style={{padding:"9px 10px",fontWeight:700,color:C.t1,minWidth:160}}>{r.s}</td>
                          <td style={{padding:"9px 10px",color:C.muted,fontSize:10,lineHeight:1.6,minWidth:220}}>{r.p}</td>
                          <td style={{padding:"9px 10px",color:C.text,fontSize:10,lineHeight:1.6,minWidth:240}}>{r.c}</td>
                          <td style={{padding:"9px 10px"}}><span style={{fontSize:9,padding:"2px 8px",borderRadius:3,fontWeight:700,background:`${r.ec}15`,color:r.ec,border:`1px solid ${r.ec}44`}}>{r.e}</span></td>
                          <td style={{padding:"9px 10px",color:C.t6,fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>{r.a}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed sensor cards - Act Now */}
              <div style={{fontSize:11,color:"#22c55e",fontWeight:800,letterSpacing:"0.1em",fontFamily:"'Fira Code',monospace",padding:"4px 0"}}>
                ── COMPLETED — FREE APIs, NOW INTEGRATED ──────────────────────────────────────────
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {
                    name:"NASA PACE Satellite",badge:"✓ INTEGRATED · server/services/pace.js",bc:"#22c55e",
                    icon:"🛰️",
                    what:"NASA launched the PACE (Plankton, Aerosol, Cloud, ocean Ecosystem) satellite in February 2024. It carries the Ocean Color Instrument (OCI) — the first hyperspectral ocean color instrument ever flown operationally — with 5nm spectral resolution from 340–890nm. Every satellite TERRAWATCH currently uses (Sentinel-2, MODIS, VIIRS) has 3–13 broad spectral bands. PACE has 200+ spectral slices in the same wavelength range.",
                    problem:"Every existing satellite-based HAB detection system can detect anomalous chlorophyll-a concentrations — but cannot tell you what species is forming the bloom without a physical water sample. Karenia brevis (toxic) and a healthy diatom bloom look identical to Sentinel-2.",
                    capability:"PACE enables spectral discrimination of phytoplankton at the species level from orbit. TERRAWATCH integrating PACE creates the first HAB species-attribution system that works at satellite scale globally. Not just 'there is a bloom' — but 'Karenia brevis is present at X concentration, covering Y km², moving northeast at 0.3 m/s.' The toxin type, human health risk level, and regulatory response are all species-determined.",
                    api:"oceancolor.gsfc.nasa.gov/opendap · earthdata.nasa.gov (PACE OCI Level-2 products) · NASA CMR API for automated discovery",
                    paper:"'Species-resolved HAB detection in Mobile Bay using PACE OCI hyperspectral ocean color' — target Harmful Algae journal",
                    grant:"NOAA SBIR topic: novel HAB detection. NASA PACE Early Adopter program (free tasking for validated applications).",
                  },
                  {
                    name:"HF Radar Surface Currents",badge:"COMPLETED · INTEGRATED · server/services/hfradar.js",bc:"#22c55e",
                    icon:"🌊",
                    what:"NOAA HF Radar Network (CoSMO) integrated via NOAA ERDDAP. Real-time surface current maps at 6km resolution updated hourly. Service built at server/services/hfradar.js with route at /api/sensors/hfradar. Note: ERDDAP endpoint currently returning 500 errors — service handles gracefully with retry logic.",
                    problem:"SOLVED: HAB Oracle now has transport vector input capability. When ERDDAP recovers, bloom trajectory forecasting activates automatically.",
                    capability:"HF radar surface current data coupled with HAB Oracle outputs enables animated bloom transport forecasts. Bloom trajectory system converts static probability maps into dynamic transport predictions — enabling harvest timing, vessel repositioning, and proactive shellfish closures.",
                    api:"hfrnet.ucsd.edu/api · NOAA ERDDAP: coastwatch.pfeg.noaa.gov/erddap · IOOS data.ioos.us/glider/erddap · Real-time vectors in netCDF",
                    paper:"'Bloom trajectory forecasting for shellfish closure prediction in Mobile Bay using coupled HAB Oracle and HF radar surface currents'",
                    grant:"NOAA Sea Grant: HAB management applications. RESTORE Act: Gulf coastal monitoring and response systems.",
                  },
                  {
                    name:"TROPOMI Methane (Sentinel-5P)",badge:"COMPLETED · INTEGRATED · server/services/tropomi.js",bc:"#22c55e",
                    icon:"🌡️",
                    what:"Sentinel-5P TROPOMI CH₄ XCH4 at 5.5km×3.5km daily resolution integrated via Copernicus Data Space (CDSE). Service built at server/services/tropomi.js with NASA CMR fallback. MethaneSAT lost contact June 2025 — TROPOMI is the active operational replacement with superior coverage.",
                    problem:"SOLVED: Independent CAFO methane verification now operational via TROPOMI. EPA self-reported emissions can be cross-referenced against satellite observations in the Mobile-Tensaw watershed.",
                    capability:"TROPOMI CH₄ anomaly coordinates × EPA TRI self-reported emissions × GOES-19 QPE rainfall = N/P loading attribution per facility. First independent satellite verification of agricultural pollution in the Mobile-Tensaw watershed. CAFO methane attribution pipeline active.",
                    api:"Copernicus CDSE: dataspace.copernicus.eu · NASA CMR fallback with Earthdata creds · S5P_OFFL_L2__CH4____ product",
                    paper:"'Independent verification of agricultural methane emissions using TROPOMI in the Mobile Bay watershed CAFO inventory'",
                    grant:"EPA SBIR: novel approaches to CAFO emissions monitoring. USDA NRCS: agricultural greenhouse gas measurement.",
                  },
                ].map(s=>(
                  <div key={s.name} style={{background:C.surface,border:`1px solid ${s.bc}44`,borderRadius:9,padding:"16px 18px",borderTop:`3px solid ${s.bc}`}}>
                    <div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:s.bc,fontWeight:800,lineHeight:1.2}}>{s.name}</div>
                        <span style={{fontSize:8,padding:"2px 7px",borderRadius:3,fontWeight:700,background:`${s.bc}18`,color:s.bc,border:`1px solid ${s.bc}44`,letterSpacing:"0.1em"}}>{s.badge}</span>
                      </div>
                    </div>
                    {[
                      {label:"WHAT IT IS",val:s.what,c:C.muted},
                      {label:"THE UNSOLVED PROBLEM",val:s.problem,c:"#c0392b"},
                      {label:"WORLD FIRST CAPABILITY",val:s.capability,c:C.text},
                      {label:"API / DATA ACCESS",val:s.api,c:s.bc},
                      {label:"METHODOLOGY PAPER",val:s.paper,c:"#1d6fcc"},
                      {label:"GRANT UNLOCK",val:s.grant,c:"#d97706"},
                    ].map(({label,val,c})=>(
                      <div key={label} style={{marginBottom:8}}>
                        <div style={{fontSize:8,color:C.muted,fontWeight:700,letterSpacing:"0.12em",marginBottom:3,fontFamily:"'Fira Code',monospace"}}>{label}</div>
                        <div style={{fontSize:10,color:c,lineHeight:1.7}}>{val}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Medium effort sensors */}
              <div style={{fontSize:11,color:C.t3,fontWeight:800,letterSpacing:"0.1em",fontFamily:"'Fira Code',monospace",padding:"4px 0"}}>
                ── MONTH 3–6 — PARTNERSHIPS + LOW-COST HARDWARE ────────────────────────────────────
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {
                    name:"Soil Pore Water Conductivity Network",icon:"🌱",c:C.t6,badge:"MONTH 3 · $3K–5K DEPLOY",
                    problem:"TERRAWATCH's saltwater intrusion warning currently detects vegetation stress signatures in aerial imagery — it detects the result of intrusion weeks to months after the advance front crosses the farm boundary. Coastal Baldwin County farmers discover their irrigation wells have gone brackish only when crops begin dying.",
                    solution:"Deploy 10–15 LoRaWAN-connected soil pore water conductivity sensors ($200–300 each) in a transect from the Dog River mouth inland toward Theodore. Sensors transmit electrical conductivity at 15-minute intervals — the earliest chemical signal of saltwater advance. Combined with TERRAWATCH's tidal forcing data and Tempest precipitation, this creates the first real-time, farm-level saltwater intrusion advance warning system. 4–8 weeks of warning before the aquifer crosses the agricultural damage threshold.",
                    partner:"NRCS Alabama State Office — saltwater intrusion is an active conservation priority. Extension services at Auburn and USA. Farm Bureau of Baldwin County.",
                    revenue:"Farms pay $99–199/mo for the alert service. 50 coastal farms in the Dog River and Fowl River watersheds = $60,000–$120,000/yr.",
                    worldfirst:"First sub-watershed, continuously updated, farm-level saltwater intrusion early warning system in the US Southeast.",
                  },
                  {
                    name:"MS4 Stormwater IoT Sensor Network",icon:"🌧️",c:C.t3,badge:"MONTH 4 · MUNICIPAL PARTNER",
                    problem:"TERRAWATCH's nonpoint source attribution model infers pollutant loading from land cover, rainfall, and CAFO location. Nothing currently measures what actually comes out of storm drains at the watershed boundary. The nonpoint source budget closes on assumption, not measurement.",
                    solution:"LoRaWAN-connected sensors ($800–2,000 per node) at 30–50 MS4 stormwater outfalls across Mobile and Baldwin County, measuring turbidity, conductivity, nitrate, and flow continuously. Every storm event is directly measured at each outfall. When combined with Osprey Litter Gitter at the creek level, TERRAWATCH has the first continuously measured, spatially resolved nonpoint source loading network on the Gulf Coast — the dataset EPA TMDL revisions are built on.",
                    partner:"City of Mobile Stormwater Division. Baldwin County Engineering. MBNEP as technical co-sponsor. This is the dataset that funds the EPA NEP Watersheds grant.",
                    revenue:"NPDES permit compliance reporting for municipalities: $10,000–$50,000/yr per municipality. Mobile + Fairhope + Daphne + Foley = anchor client set.",
                    worldfirst:"First real-time, spatially distributed nonpoint source loading measurement network on the Gulf Coast with sub-catchment resolution.",
                  },
                  {
                    name:"Passive Acoustic Monitoring (Hydrophone Array)",icon:"🔊",c:C.t4,badge:"MONTH 4 · DISL PARTNERSHIP",
                    problem:"Fish spawning success is invisible to every existing monitoring system. No environmental platform correlates water quality conditions with reproductive outcomes for commercially important species. The entire Gulf Coast fishing economy depends on spawning success that nobody measures.",
                    solution:"Deploy 3–5 bottom-mounted hydrophones (SoundTrap ST300, $2,000–3,500 each) at key Mobile Bay spawning sites: Dauphin Island Pass, Dog River mouth, and the upper bay black drum aggregation area. ML acoustic classifier identifies black drum, redfish, and oyster toadfish chorus signatures. TERRAWATCH fuses acoustic activity with real-time DO₂, temperature, salinity, and HAB probability to produce the world's first spawning condition forecast: 'Black drum spawning probability at Dauphin Island: HIGH. DO₂: 7.2 mg/L, temperature: 18.3°C, salinity: 28 ppt, no HAB signal.'",
                    partner:"Dauphin Island Sea Lab — Dr. Sean Powers leads the reef fish ecology program and already has hydrophone experience in Mobile Bay. NOAA Fisheries Southeast Fisheries Science Center in Pascagoula.",
                    revenue:"ADCNR annual stock assessment contract. NOAA SBIR — novel fisheries monitoring methodology. Commercial fishing fleet subscription for spawning condition alerts.",
                    worldfirst:"First system correlating environmental conditions (DO₂, temp, salinity, HAB) with fish spawning acoustic activity in real time. Spawning condition forecast is a new product class.",
                  },
                  {
                    name:"eDNA Auto-Samplers",icon:"🧬",c:C.t1,badge:"MONTH 6 · RESEARCH PARTNER",
                    problem:"The HAB Oracle predicts bloom probability and PACE will identify species — but eDNA detects HAB-forming organisms in the water column at concentrations below optical detection threshold, potentially days before a visible bloom surface expression. More critically: no system currently monitors for oyster pathogens (Dermo, MSX) in the water column.",
                    solution:"Deploy MBARI Environmental Sample Processors (ESP) or commercial eDNA auto-sampler equivalents at 2–3 Mobile Bay stations. Samplers collect, filter, extract, and analyze water every 4–8 hours for Karenia brevis, Microcystis aeruginosa, Perkinsus marinus (Dermo), Haplosporidium nelsoni (MSX), and Asian carp eDNA. Results stream to TERRAWATCH in near real-time. HAB Oracle triggers eDNA analysis upon threshold — closing the confirmation loop without a field crew.",
                    partner:"Dauphin Island Sea Lab molecular biology lab. USA School of Marine Sciences. USFW Whitney Genetics Laboratory for invasive carp eDNA protocol.",
                    revenue:"Oyster farm industry group subscription — Dermo/MSX early warning is worth $500+/mo per farm. NOAA Sea Grant — novel eDNA-HAB fusion methodology.",
                    worldfirst:"First integration of autonomous water-column eDNA monitoring with satellite-derived HAB probability forecasts. First oyster pathogen (Dermo, MSX) early warning system in Alabama.",
                  },
                ].map(s=>(
                  <div key={s.name} style={{background:C.surface,border:`1px solid ${s.c}33`,borderRadius:9,padding:"16px 18px",borderLeft:`4px solid ${s.c}`}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
                      <span style={{fontSize:18}}>{s.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,color:s.c,fontWeight:800}}>{s.name}</div>
                        <span style={{fontSize:8,padding:"2px 7px",borderRadius:3,fontWeight:700,background:`${s.c}15`,color:s.c,border:`1px solid ${s.c}33`}}>{s.badge}</span>
                      </div>
                    </div>
                    {[
                      {l:"THE GAP",v:s.problem,c:C.muted},
                      {l:"THE INTEGRATION",v:s.solution,c:C.text},
                      {l:"PARTNER PATHWAY",v:s.partner,c:s.c},
                      {l:"REVENUE MODEL",v:s.revenue,c:"#1a7a3c"},
                      {l:"WORLD FIRST",v:s.worldfirst,c:s.c},
                    ].map(({l,v,c})=>(
                      <div key={l} style={{marginBottom:7,paddingBottom:7,borderBottom:`1px solid ${C.border}`}}>
                        <div style={{fontSize:8,color:C.muted,fontWeight:700,letterSpacing:"0.12em",marginBottom:2,fontFamily:"'Fira Code',monospace"}}>{l}</div>
                        <div style={{fontSize:10,color:c,lineHeight:1.7}}>{v}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Year 2 breakthrough sensors */}
              <div style={{fontSize:11,color:C.t2,fontWeight:800,letterSpacing:"0.1em",fontFamily:"'Fira Code',monospace",padding:"4px 0"}}>
                ── YEAR 2 — HIGH-EFFORT, HIGHEST-IMPACT WORLD FIRSTS ──────────────────────────────
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {[
                  {
                    name:"Wastewater-Based Epidemiology (WBE)",icon:"🏥",c:C.t2,badge:"YEAR 2 · MAWSS PARTNERSHIP",
                    headline:"The first system that links an environmental HAB event to actual human exposure data. Not modeled risk — measured exposure.",
                    body:"COVID-19 proved that wastewater detects population-level disease 4–7 days before clinical cases. The environmental health applications are far larger. When a Karenia brevis bloom closes Mobile Bay, people still eat shellfish. Brevetoxin metabolites appear in municipal wastewater within 24 hours of human consumption. A TERRAWATCH integration with MAWSS wastewater treatment plant influent monitoring creates the world's first system that triangulates: (1) HAB Oracle predicts bloom → (2) shellfish closure issued → (3) wastewater brevetoxin metabolites confirm actual human exposure → (4) ADPH receives real exposure data, not just precautionary projections. Beyond HABs: antibiotic resistance genes from CAFO agricultural runoff detectable in downstream municipal wastewater — directly linking TERRAWATCH's CAFO ammonia model to actual human AMR risk. This is the One Health data link nobody has built.",
                    partner:"MAWSS (Mobile Area Water and Sewer System). ADPH Environmental Health Division. USA College of Medicine — epidemiology department.",
                    worldfirst:"First environmental HAB ↔ human wastewater exposure correlation system. First One Health data link between CAFO runoff and downstream community AMR load.",
                  },
                  {
                    name:"AmeriFlux Eddy Covariance Flux Towers",icon:"🌿",c:"#22c55e",badge:"YEAR 2 · NERRS PARTNERSHIP",
                    headline:"The direct CO₂ and CH₄ flux measurement that makes blue carbon MRV Verra-approvable. The difference between a carbon credit and a paper exercise.",
                    body:"TERRAWATCH's blue carbon MRV capability currently estimates carbon stocks from aerial biomass using species-level stock factors. To generate Verra or Gold Standard-approved carbon credits, you need direct flux measurement — the actual CO₂ and CH₄ being exchanged between the marsh and the atmosphere. AmeriFlux operates eddy covariance flux towers at coastal wetland sites nationally with free data. The Grand Bay NERRS in Mississippi has an existing tower. Weeks Bay does not but could host one through the NERRS Science Collaborative. Combining AmeriFlux direct flux measurement + TERRAWATCH annual aerial biomass mapping + species-level stock factors creates a vertically integrated MRV methodology that is technically unassailable: the CO₂ actually exchanged (flux tower) + the biomass extent and species (Vexcel aerial) + the annual change rate (Elevate DTM differencing). No existing blue carbon methodology has all three simultaneously. TERRAWATCH with flux tower integration produces the first directly measured, annually updated, species-resolved blue carbon stock and flux inventory. That is the MRV standard for the global voluntary carbon market.",
                    partner:"Weeks Bay NERR — Angela Underwood. AmeriFlux Network Management Project. The Nature Conservancy Gulf Coast blue carbon program.",
                    worldfirst:"First directly measured, species-resolved, annually updated coastal blue carbon MRV methodology. The global standard that the Verra market needs to unlock hundreds of billions in blue carbon credit value.",
                  },
                ].map(s=>(
                  <div key={s.name} style={{background:C.surface,border:`1px solid ${s.c}44`,borderRadius:9,padding:"18px 20px",borderTop:`3px solid ${s.c}`}}>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <div>
                        <div style={{fontSize:14,color:s.c,fontWeight:800}}>{s.name}</div>
                        <span style={{fontSize:8,padding:"2px 7px",borderRadius:3,fontWeight:700,background:`${s.c}15`,color:s.c,border:`1px solid ${s.c}33`}}>{s.badge}</span>
                      </div>
                    </div>
                    <div style={{fontSize:12,color:C.ink,fontWeight:700,lineHeight:1.5,marginBottom:10,padding:"8px 12px",background:`${s.c}0a`,borderRadius:6,borderLeft:`3px solid ${s.c}`}}>
                      {s.headline}
                    </div>
                    <p style={{fontSize:11,color:C.muted,lineHeight:1.85,marginBottom:10}}>{s.body}</p>
                    <div style={{marginBottom:6}}>
                      <div style={{fontSize:8,color:C.muted,fontWeight:700,letterSpacing:"0.12em",marginBottom:2,fontFamily:"'Fira Code',monospace"}}>PARTNER PATHWAY</div>
                      <div style={{fontSize:10,color:s.c,lineHeight:1.6}}>{s.partner}</div>
                    </div>
                    <div style={{padding:"8px 12px",background:`${s.c}0f`,borderRadius:6,border:`1px solid ${s.c}22`}}>
                      <div style={{fontSize:8,color:s.c,fontWeight:700,letterSpacing:"0.12em",marginBottom:2,fontFamily:"'Fira Code',monospace"}}>WORLD FIRST</div>
                      <div style={{fontSize:10,color:C.text,lineHeight:1.65}}>{s.worldfirst}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* The compounding effect */}
              <div style={{background:`linear-gradient(135deg,#0a3d2b,#0d5c3e)`,borderRadius:10,padding:"24px 30px",border:`1px solid ${C.t1}44`}}>
                <div style={{fontSize:9,color:C.t1,letterSpacing:"0.25em",marginBottom:10,fontFamily:"'Fira Code',monospace"}}>THE COMPOUNDING EFFECT — WHY THESE AREN'T JUST NEW FEATURES</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
                  {[
                    {title:"PACE + HAB Oracle + HF Radar",result:"Species-attributed bloom detected → trajectory forecast computed → oyster farms along the projected path notified by species-specific risk 14 hours before arrival. This is the product that makes every coastal shellfish operation in the world a potential subscriber.",c:C.t1},
                    {title:"eDNA + Acoustic + Water Chemistry",result:"eDNA detects Karenia brevis below optical threshold → acoustic sensors confirm absence of spawning fish chorus (fish fled the area) → water chemistry shows pre-bloom DO₂ depression → HAB Oracle fires at 90% confidence 72 hours before a bloom surfaces. No human enters the water. No sample is collected. The system caught it.",c:"#22c55e"},
                    {title:"MS4 Sensors + Osprey + TROPOMI",result:"Stormwater sensors measure nitrogen pulse leaving each MS4 outfall → Osprey Litter Gitter confirms microplastic composition at creek mouth → TROPOMI identifies CAFO methane source upstream → TERRAWATCH closes the complete source-to-receptor attribution chain. This is the evidence package that wins environmental litigation.",c:"#3b82f6"},
                  ].map(({title,result,c})=>(
                    <div key={title} style={{background:"rgba(255,255,255,0.06)",borderRadius:8,padding:"14px 16px",border:`1px solid rgba(255,255,255,0.08)`}}>
                      <div style={{fontSize:11,color:c,fontWeight:800,marginBottom:8,lineHeight:1.3}}>{title}</div>
                      <div style={{fontSize:10,color:"#a8d8c8",lineHeight:1.8}}>{result}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}


        </div>
      </div>
    </>
  );
}

