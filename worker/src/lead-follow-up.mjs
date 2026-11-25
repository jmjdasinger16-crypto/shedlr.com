import { categoryLabels } from "./category-programs.mjs";

// Prompts are questions to verify, not claims about the individual lead.
export const followUpTopics = {
  hvac: ["For weak cooling, confirm thermostat setting and which rooms are affected", "For a noisy unit, ask when the sound occurs and for the unit model", "For replacement, ask about system age and whether it serves one or multiple zones"],
  "garage-door-services": ["For a stuck door, ask whether it is stuck open or closed", "For opener trouble, confirm brand and whether the wall switch responds", "For replacement, ask about opening dimensions and insulation"],
  handyman: ["For patching, ask which surfaces are damaged and how large the area is", "For assembly, ask for the product model and hardware list", "For a punch list, ask for photos and the order of priorities"],
  "house-cleaning": ["For routine cleaning, ask about square footage and frequency", "For move-out cleaning, ask whether the home will be empty and when keys are due", "For a deep clean, ask about ovens, baseboards and any rooms to skip"],
  "junk-removal": ["For shed debris, ask whether it is already dismantled and whether the pile includes roofing", "For furniture haul-off, ask for item count and stairs", "For an estate cleanout, ask about volume, access and items to keep"],
  "pest-control": ["For ants, ask where the trails appear and when they started", "For rodents, ask where signs were found and whether there are pets", "For preventive service, ask about property size and service frequency"],
  moving: ["For a local move, ask about stairs and truck parking at both ends", "For a long-distance move, confirm destination and delivery window", "For packing help, ask about fragile items and whether boxes are needed"],
  roofing: ["For a leak, ask where the stain appears after rain", "For storm damage, ask when it happened and what changed visibly", "For replacement, ask about existing roof material and number of stories"],
  landscaping: ["For mowing, confirm lot size and preferred schedule", "For a landscape refresh, ask what plants or beds should stay", "For sod, ask about square footage, sun exposure and irrigation"],
  "home-remodeling": ["For a multi-room renovation, ask which rooms and what order", "For a layout change, ask which walls or utilities might move", "For a phased project, ask whether the family will stay in the home"],
  "auto-hail-damage": ["For hail dents, ask for vehicle year, make and affected panels", "For paint damage, ask for photos of chipped areas", "For insurance work, confirm whether an estimate or claim already exists"],
  "auto-mechanic": ["For a warning light, ask for vehicle year, make, model and any code already recorded", "For a brake noise, ask when it occurs and if it changes at speed", "For a no-start, ask whether the engine cranks"],
  "auto-detailing": ["For interior detailing, ask about stains or pet hair", "For paint correction, ask about scratches and vehicle color", "For a maintenance wash, ask whether mobile service and water access are available"],
  "auto-commercial-detailing": ["For fleet washing, confirm vehicle count and turnaround needs", "For commercial interiors, ask about cab condition and service interval", "For on-site service, ask about parking, water and access hours"],
  "car-sales": ["For a vehicle search, ask about body style and must-have features", "For a trade-in, ask for year, model, mileage and condition", "For a test drive, confirm preferred date and vehicle availability"],
  airbnb: ["For a guest booking, confirm check-in and checkout dates", "For family stays, ask about guest count, beds and accessibility needs", "For extended stays, confirm work-space, parking and pet needs"],
  insurance: ["For a new policy, ask which coverage type and effective date", "For renewal, confirm renewal timing and coverage priorities", "For bundling, ask which policies should be compared"],
  solar: ["For rooftop solar, ask about roofing material and shading", "For battery backup, ask which loads should stay running", "For an estimate, ask for typical power usage and utility provider"],
  "cell-phone-sales": ["For an upgrade, ask which device and storage size", "For a trade-in, confirm the current model and condition", "For switching carriers, confirm line count and number-transfer needs"],
  "internet-cable-sales": ["For home internet, confirm service address and expected usage", "For a move, ask about installation date and existing wiring", "For a TV bundle, ask which channels and how many rooms need service"],
  "tax-prep": ["For filing, ask which tax year and types of income apply", "For self-employment, ask whether expense records are organized", "For an extension or amendment, confirm year and deadline"],
  "gym-sales": ["For membership, ask which location and hours work", "For classes, confirm preferred formats and times", "For a tour, ask about amenities and a good visit window"],
  "personal-trainer": ["For strength training, ask about goals, experience and equipment access", "For remote coaching, ask about weekly availability", "For small-group sessions, confirm group size and preferred schedule"],
  "life-coach": ["For goal-setting, ask which area the client wants to focus on", "For accountability, ask about preferred check-in frequency", "For a discovery call, confirm format and availability"],
  counseling: ["For an intake, ask about appointment format", "For telehealth, confirm state and scheduling preference", "For coverage questions, ask whether the client prefers insurance or self-pay"],
  "dog-walker": ["For daily walks, ask about number of dogs and leash routine", "For pet sitting, confirm dates, feeding and visit frequency", "For a meet-and-greet, ask about entry instructions and comfort with strangers"],
  "dog-training": ["For puppy training, ask about age and current routine", "For leash manners, ask when pulling or reactivity happens", "For recall, ask where the dog is normally exercised"],
  "pet-grooming": ["For a full groom, confirm breed, size and coat condition", "For nail trimming, ask about handling preferences", "For deshedding, ask about coat type and last appointment"],
  "nail-lash-stylist": ["For lashes, ask about a full set or fill and the current style", "For nails, confirm gel, acrylic or natural nail service", "For an event, ask about inspiration photos and appointment deadline"],
  "meal-prep": ["For weekly orders, confirm meal and portion counts", "For custom menus, ask about allergies and dietary preferences", "For delivery, ask about area and preferred drop-off time"],
  "home-services": ["For repairs, ask what failed and when it started", "For installations, confirm equipment or materials and site access", "For recurring upkeep, ask about property size and desired frequency"],
  plumbing: ["For leaks, ask which fixture and when the leak occurs", "For a slow drain, confirm how many drains are affected", "For water-heater work, confirm fuel type, brand and reported symptoms"],
  maintenance: ["For property turnover, ask about the work list and move-in deadline", "For preventive maintenance, ask about sites and equipment", "For small repairs, ask for photos, access and priority"],
  "home-insurance": ["For a new purchase, confirm closing date and property type", "For renewal, ask about requested coverage changes", "For rental properties, confirm occupancy and desired effective date"],
  "vehicle-insurance": ["For a new vehicle, ask about year, make and purchase date", "For switching, ask about current coverage and renewal timing", "For multiple vehicles, ask about vehicle count and personal or business use"],
  "real-estate": ["For buyers, ask about market, property type and timing", "For sellers, confirm location and target listing window", "For relocation, ask about move date and areas of interest"],
  photography: ["For portraits, ask about group size and location preference", "For events, confirm date, venue and coverage hours", "For product photography, ask about item count and deliverables"],
  catering: ["For a corporate lunch, confirm headcount and delivery window", "For a private event, ask about dietary restrictions and venue facilities", "For a staffed buffet, confirm service duration and rentals"],
  "event-planning": ["For a wedding, ask which vendors are already booked", "For a corporate event, confirm venue, headcount and schedule", "For day-of coordination, ask about vendor contacts and setup needs"],
  tutoring: ["For subject tutoring, ask about grade level and topics", "For test prep, confirm the test and date", "For recurring sessions, ask about online or in-person format and availability"],
  "mental-health-clinician": ["For intake, confirm preferred appointment format", "For virtual visits, ask what state the client will attend from", "For scheduling, ask about availability and contact preference"],
  electrical: ["For an EV charger, ask about charger model and parking distance from the panel", "For a panel upgrade, ask about existing service and reason for upgrade", "For an outlet issue, ask which outlets are affected and whether the breaker trips"],
  "appliance-repair": ["For a fridge not cooling (e.g., Whirlpool), confirm brand/model and whether the freezer still cools", "For an ice maker that stopped producing ice (e.g., Samsung), confirm brand/model and whether the water dispenser works", "For a leaking fridge (e.g., GE), confirm brand/model and where water collects"],
  "pressure-washing": ["For a driveway, ask about surface and oil stains", "For house washing, ask about siding type and number of stories", "For a patio, ask about material, furniture and water access"],
  "water-damage-restoration": ["For a plumbing leak, confirm whether the source has stopped", "For flooding, ask which rooms and materials are affected", "For drying, ask when the damage occurred and whether standing water remains"],
  "pool-service": ["For cleaning, confirm pool size and service frequency", "For a pump problem, ask for brand and symptoms", "For an opening, ask about cover type and pool condition"],
  fencing: ["For privacy fencing, ask about material, footage and gates", "For repair, confirm whether posts, panels or hinges are damaged", "For a driveway gate, ask for opening width and manual or powered operation"],
  irrigation: ["For a dry zone, ask which zone and whether heads pop up", "For controller trouble, ask for brand/model and display symptoms", "For new drip irrigation, ask about bed layout and water source"],
  "tree-service": ["For pruning, ask about tree size and branches near structures", "For removal, confirm yard access and any nearby utility lines", "For stump grinding, ask for stump diameter and gate width"],
  "gutter-services": ["For overflow, ask where it happens during rain", "For replacement, ask about linear footage and number of stories", "For guards, confirm gutter type and typical debris"],
  siding: ["For storm damage, confirm affected elevations and current material", "For vinyl repair, ask about color and profile match", "For full replacement, ask about tear-off and preferred material"],
  "window-replacement": ["For fogged glass, ask which panes and frame type", "For drafts, ask about opening count and when drafts occur", "For a full upgrade, confirm window styles and approximate dimensions"],
  "exterior-doors": ["For an entry door, ask whether the frame is also being replaced", "For a patio slider, ask about rough dimensions and track condition", "For a storm door, confirm swing direction and clearance"],
  "deck-building": ["For new construction, ask about footprint and height", "For resurfacing, ask about existing framing and finish preference", "For a repair, confirm whether stairs, boards or railings are affected"],
  concrete: ["For a driveway, ask about size and demolition needs", "For a patio, ask about finish and access for equipment", "For a sidewalk, confirm length, grade and obstructions"],
  "pavers-hardscaping": ["For a patio, ask about footprint, paver style and drainage", "For a walkway, confirm route, width and grade", "For a retaining wall, ask about height and slope"],
  "foundation-repair": ["For slab movement, ask where cracks or sticking doors first appeared", "For pier and beam, ask about crawl-space access and uneven floors", "For an inspection, confirm foundation type and visible changes"],
  flooring: ["For vinyl plank, ask about square footage and subfloor", "For hardwood refinishing, ask about finish, stains and occupied rooms", "For carpet, confirm room count, stairs and removal"],
  "kitchen-remodeling": ["For a layout change, ask whether the sink or range moves", "For a refresh, confirm what stays, including cabinets and appliances", "For a full renovation, ask about scope, timing and budget range"],
  "bathroom-remodeling": ["For a tub-to-shower conversion, confirm opening dimensions and drain location", "For accessibility, ask which features the client wants", "For a full remodel, confirm fixtures, layout and number of bathrooms"],
  cabinetry: ["For refacing, ask about cabinet box condition and door count", "For custom cabinets, ask about layout and storage needs", "For installation, confirm drawings, sizes and delivery date"],
  countertops: ["For quartz, ask about slab preference and approximate dimensions", "For replacement, ask about tear-out and sink type", "For a vanity top, confirm wall-to-wall width and faucet holes"],
  "tile-installation": ["For a backsplash, ask about area and tile format", "For a shower, confirm existing substrate and scope of waterproofing", "For a floor, ask about square footage and what needs removal"],
  drywall: ["For patching, ask about hole size and texture", "For a ceiling stain, confirm whether the underlying leak has stopped", "For hanging drywall, ask about room dimensions and finish level"],
  painting: ["For interiors, ask about room count, colors and furniture", "For exteriors, confirm siding material, stories and peeling areas", "For cabinets, ask about doors, finish and surface condition"],
  "finish-carpentry": ["For baseboards, ask about footage and preferred profile", "For trim, confirm opening count and paint or stain", "For built-ins, ask for dimensions and reference photos"],
  insulation: ["For an attic, confirm access, square footage and existing material", "For a crawl space, ask about moisture and clearance", "For air sealing, ask where drafts occur and what was already inspected"],
  "basement-remodeling": ["For a finished room, ask about ceiling height and intended use", "For a bathroom addition, confirm whether plumbing rough-ins exist", "For a full basement, ask about moisture history and unfinished areas"],
};

const fallbackTopics = ["Confirm the job scope, timing and best way to follow up"];
const AUTHOR = "shedlr_follow_up";

function applianceTopics(intake) {
  const matches = [
    [/\b(?:ice\s?maker|no ice)\b/i, "Confirm the brand and model, whether the water dispenser works, and when the ice maker stopped producing ice"],
    [/\b(?:leak\w*|puddle|water pooling)\b/i, "Confirm the brand and model, where water collects, and whether the leak is constant"],
    [/\b(?:warm|not cooling|won['’]t cool|not cold|too cold|freezing food|thawing)\b/i, "Confirm the brand and model, current temperatures, and whether both compartments are affected"],
  ];
  if (/\b(?:fridge|refrigerator|freezer|ice\s?maker)\b/i.test(intake)) {
    const targeted = matches.filter(([pattern]) => pattern.test(intake)).map(([, question]) => question);
    return targeted.length ? targeted : ["Confirm the brand and model, what the fridge is doing, and when the issue started"];
  }
  if (/\b(?:washer|washing machine|dryer|dishwasher|oven|range|stove)\b/i.test(intake)) {
    return ["Confirm the appliance brand and model, what part of the cycle or operation fails, and any error code"];
  }
  return followUpTopics["appliance-repair"];
}

const openers = [label => `${label} follow-up prep.`, label => `Prep for the ${label} follow-up.`, label => `${label}: ready for the next outreach.`, label => `Next-step notes, ${label}.`, label => `${label} lead, outreach plan.`, label => `Before the next ${label} contact:`, label => `${label} lead: what to have ready.`, label => `Heads-up for the ${label} outreach.`];
const intakeLines = [t => `Lead intake: “${t}”`, t => `They wrote: “${t}”`, t => `Request on file: “${t}”`, t => `From the form: “${t}”`, t => `Their message: “${t}”`, t => `As submitted: “${t}”`];
// Generic contact guidance. These are instructions for the next attempt, never claims that a call already happened.
const contactPlans = [
  "If there is no answer, leave a short voicemail with the callback number and try again later today.",
  "Call first; if it goes to voicemail, leave a brief message and follow with a text.",
  "Try a call during business hours and keep the voicemail under 20 seconds.",
  "If the line is busy or unanswered, text the lead and retry the call the next morning.",
  "Offer two appointment windows when you reach them and confirm the best number to use.",
  "If the lead replies by text, answer by text and offer a quick call afterward.",
  "Confirm the best time of day to call before asking the detailed questions.",
  "If voicemail is full, send a text or email instead and note the attempt.",
  "Open by confirming the job and the service address, then move on to details.",
  "If they ask for more time, set a specific follow-up day before ending the conversation.",
  "Reference the original request in the voicemail so the lead recognizes the call.",
  "Space call attempts several hours apart rather than back to back.",
];
const checkInLabels = ["check-in", "follow-up", "re-check", "next touch"];
const questionLeads = ["Suggested questions", "Worth asking", "Questions to cover", "Details to confirm"];
const nextLeads = ["Next question to cover", "Ask this time", "Focus for this contact", "Also worth confirming"];

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}

export function buildFollowUpNote({ id = 0, category, preferred_category: preferredCategory, message, prior = 0 }) {
  const known = [category, preferredCategory].find(id => Object.hasOwn(followUpTopics, id));
  const intake = String(message || "").trim();
  const excerpt = intake.length > 400 ? `${intake.slice(0, 400).trimEnd()}…` : intake;
  const topics = known === "appliance-repair" ? applianceTopics(intake) : known ? followUpTopics[known] : fallbackTopics;
  const label = known ? categoryLabels[known] : "Service";
  const seed = hash(`${id}:${prior}`);
  const pick = (list, salt) => list[hash(`${seed}:${salt}`) % list.length];
  const intakeLine = excerpt ? pick(intakeLines, "i")(excerpt) : "No job details were provided in the intake.";
  const plan = pick(contactPlans, "p");
  if (prior > 0) {
    const heading = `${label} ${pick(checkInLabels, "c")} ${prior + 1}.`;
    return [heading, intakeLine, `${pick(nextLeads, "n")}: ${topics[(seed >>> 3) % topics.length]}.`, plan].join(" ");
  }
  const start = seed % topics.length;
  const ordered = topics.map((_, i) => topics[(start + i) % topics.length]);
  return [pick(openers, "o")(label), intakeLine, `${pick(questionLeads, "q")}: ${ordered.join("; ")}.`, plan].join(" ");
}

// Catches up every lead on an active business account whose latest note (or delivery,
// when it has no notes) is more than 60 minutes old. Newer activity is left alone.
export async function addRecentFollowUpNotes(db, options = {}, now = new Date()) {
  const cutoff = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const until = now.toISOString();
  const maxLeads = Math.min(Math.max(Math.floor(Number(options?.maxLeads)) || 500, 1), 2000);
  const dryRun = options?.dryRun === true;
  const eligible = `
    b.status = 'active' AND l.status <> 'archived'
    AND julianday(la.assigned_at) <= julianday(?)
    AND COALESCE((SELECT MAX(julianday(ln.created_at)) FROM lead_notes ln WHERE ln.assignment_id = la.id), julianday(la.assigned_at)) <= julianday(?)
  `;
  const assignments = `
    FROM lead_assignments la
    JOIN businesses b ON b.id = la.business_id
    JOIN leads l ON l.id = la.lead_id
  `;
  const { results = [] } = await db.prepare(`
    SELECT la.id, l.category, l.message, b.preferred_category,
           (SELECT COUNT(*) FROM lead_notes pn WHERE pn.assignment_id = la.id AND pn.author = ?) AS prior
    ${assignments}
    WHERE ${eligible}
    ORDER BY COALESCE((SELECT MAX(julianday(ln.created_at)) FROM lead_notes ln WHERE ln.assignment_id = la.id), julianday(la.assigned_at)), la.id
    LIMIT ?
  `).bind(AUTHOR, cutoff, cutoff, maxLeads + 1).all();
  const hasMore = results.length > maxLeads;
  const rows = results.slice(0, maxLeads);

  let count = 0;
  if (!dryRun) {
    for (let i = 0; i < rows.length; i += 50) {
      // Recheck eligibility in the INSERT so overlapping runs cannot both add a note.
      const writes = await db.batch(rows.slice(i, i + 50).map(row => db.prepare(`
        INSERT INTO lead_notes (assignment_id, business_id, lead_id, author, content, created_at, updated_at)
        SELECT la.id, la.business_id, la.lead_id, ?, ?, ?, ?
        ${assignments}
        WHERE la.id = ? AND ${eligible}
      `).bind(AUTHOR, buildFollowUpNote(row), until, until, row.id, cutoff, cutoff)));
      count += writes.reduce((total, write) => total + (write.meta?.changes || 0), 0);
    }
  }
  return { scanned: rows.length, backfilled_leads: count, notes_created: count, has_more: hasMore, dry_run: dryRun };
}
