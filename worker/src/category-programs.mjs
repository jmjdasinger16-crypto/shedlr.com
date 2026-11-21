// Public service taxonomy. An ID is persisted in orders, leads and businesses;
// a URL slug can differ to preserve an existing landing page and its inbound links.
export const groups = {
  "home-services": "Home Services",
  "outdoor-trades": "Exterior & Outdoor Trades",
  "remodeling": "Remodeling & Interior Trades",
  "automotive": "Automotive",
  "property": "Property, Insurance & Energy",
  "professional": "Professional Services & Sales",
  "personal": "Personal, Pets & Lifestyle"
};

// Existing pages and their historical per-lead values (not the monthly plan price).
const existing = [
  ["hvac", "HVAC", "home-services", 700],
  ["garage-door-services", "Garage Door Services", "home-services", 700],
  ["handyman", "Handyman", "home-services", 500],
  ["house-cleaning", "House Cleaning", "home-services", 600, "cleaning"],
  ["junk-removal", "Junk Removal", "home-services", 600],
  ["pest-control", "Pest Control", "home-services", 500],
  ["moving", "Moving Services", "home-services", 900, "moving-services"],
  ["roofing", "Roofing", "outdoor-trades", 300],
  ["landscaping", "Landscaping", "outdoor-trades", 700, "lawn-care"],
  ["home-remodeling", "Home Remodeling", "remodeling", 900],
  ["auto-hail-damage", "Auto Hail Damage", "automotive", 1200],
  ["auto-mechanic", "Auto Mechanic / Auto Repair", "automotive", 700],
  ["auto-detailing", "Auto Detailing", "automotive", 400],
  ["auto-commercial-detailing", "Fleet & Commercial Detailing", "automotive", 800],
  ["car-sales", "Car Sales", "automotive", 1000],
  ["airbnb", "Airbnb / Short-Term Rentals", "property"],
  ["insurance", "Insurance (general)", "property", 100],
  ["solar", "Solar", "property", 1000],
  ["cell-phone-sales", "Cell Phone Sales", "professional", 400],
  ["internet-cable-sales", "Internet & Cable Sales", "professional", 500],
  ["tax-prep", "Tax Preparation", "professional", 600],
  ["gym-sales", "Gym Membership Sales", "professional", 300],
  ["personal-trainer", "Personal Trainer", "personal", 400, "personal-training"],
  ["life-coach", "Life Coach", "personal", 100, "life-coaching"],
  ["counseling", "Counseling", "personal", 500],
  ["dog-walker", "Dog Walker", "personal", 200, "dog-walking-pet-sitting"],
  ["dog-training", "Dog Training", "personal", 400],
  ["pet-grooming", "Pet Grooming", "personal", 400],
  ["nail-lash-stylist", "Nail & Lash Stylists", "personal", 300],
  ["meal-prep", "Meal Prep", "personal", 400]
];

// Categories already accepted by the Worker that did not have a dedicated page.
// id, label, group, legacy price, search audience, work types, screening details,
// BAM availability verb phrase, hypothetical BAM job scenario.
const missing = [
  ["home-services", "Home Services", "home-services", 600, "multi-service home businesses", "home repairs|property upkeep|installation requests", "the service needed, property type and whether the customer wants a repair, replacement or recurring visits", "take a home repair request", "A homeowner wants two small repairs done in one visit and can share a list before scheduling."],
  ["plumbing", "Plumbing", "home-services", 700, "local plumbers", "leak repairs|drain clearing|water heater replacements", "the affected fixture or system, symptoms, access and how soon service is needed", "inspect a leaking water heater", "A homeowner found water near a tank water heater and wants an assessment and a repair or replacement quote."],
  ["maintenance", "Maintenance", "home-services", 500, "property maintenance companies", "rental turnovers|preventive maintenance|small property repairs", "the property count, work list, access arrangements and desired frequency", "handle a property maintenance visit", "A property manager has a vacant rental that needs door hardware adjusted and fixtures checked before move-in."],
  ["home-insurance", "Home Insurance", "property", 100, "home insurance agents", "new homeowner quotes|policy renewals|coverage comparisons", "the property location, occupancy, requested coverage and policy effective date", "help with a home insurance quote", "A buyer wants to compare homeowners policies before an upcoming closing."],
  ["vehicle-insurance", "Vehicle Insurance", "property", 100, "auto insurance agents", "personal auto quotes|policy renewals|multi-vehicle comparisons", "the policy state, vehicle type, coverage requested and renewal or purchase timing", "help with an auto insurance quote", "A driver wants to compare coverage for two vehicles before the current policy renews."],
  ["real-estate", "Real Estate", "property", 800, "real estate agents and brokerages", "buyer consultations|seller consultations|relocation inquiries", "the target market, property type, buying or selling intent and estimated timeline", "speak with a prospective home seller", "A homeowner wants to discuss listing a property and has a target move date this summer."],
  ["photography", "Photography", "professional", 800, "professional photographers", "portrait sessions|event photography|commercial shoots", "the shoot type, date, location and deliverables the client is looking for", "photograph a small event", "A local business wants two hours of event coverage and a set of edited photos for its website."],
  ["catering", "Catering", "professional", 700, "catering companies", "corporate catering|private events|buffet service", "the event date, venue, estimated guest count, food preferences and service format", "cater a corporate lunch", "An office wants a buffet lunch for 35 guests with vegetarian options and a defined delivery window."],
  ["event-planning", "Event Planning", "professional", 1000, "event planners", "corporate events|private celebrations|day-of coordination", "the event date, venue status, headcount and level of planning support requested", "coordinate a small private event", "A client has booked a venue for 60 guests but needs help with vendors and the day-of schedule."],
  ["tutoring", "Tutoring", "personal", 400, "independent tutors and tutoring services", "math tutoring|reading support|test preparation", "the subject, grade or skill level, session format and availability, without asking for unnecessary student information", "take a new math tutoring client", "A parent wants weekly algebra tutoring and prefers an after-school session."],
  ["mental-health-clinician", "Mental Health Clinician", "personal", 500, "mental health practices", "individual therapy inquiries|telehealth inquiries|in-person consultations", "contact preference, service location, appointment format and availability; no clinical history is needed in the interest form", "discuss availability for a new consultation", "An adult is asking whether a practice has evening availability and offers telehealth in their state."]
];

// Standalone niches selected so reps can target businesses that advertise the
// specialty directly, not one category per material or minor variant.
const specialties = [
  ["electrical", "Electrical Services", "home-services", "electricians", "panel upgrades|EV charger installs|outlet and lighting work", "the requested electrical work, existing equipment, property type and whether it is an install or a repair", "quote an EV charger install", "A homeowner has a garage parking space and wants to know whether their existing panel can support a Level 2 charger."],
  ["appliance-repair", "Appliance Repair", "home-services", "appliance repair companies", "refrigerator repairs|washer and dryer repairs|dishwasher repairs", "the appliance type, brand, model if available, symptoms and installation setup", "diagnose a washer that won’t drain", "A front-load washer stops mid-cycle and leaves water in the drum; the owner can share the model number."],
  ["pressure-washing", "Pressure Washing", "home-services", "pressure washing companies", "driveway cleaning|house washing|patio cleaning", "the surface material, approximate size, staining, access and water supply", "wash a driveway and walkway", "A homeowner wants to clean a two-car concrete driveway and a front walkway before listing the house."],
  ["water-damage-restoration", "Water Damage Restoration", "home-services", "water damage restoration companies", "water extraction|structural drying|post-leak cleanup", "the water source, affected rooms or materials, whether the leak has stopped and the requested response window", "assess water damage from a stopped leak", "A supply line leaked into two rooms. The water has been shut off, and the owner wants a drying and cleanup assessment."],
  ["pool-service", "Pool Service", "home-services", "pool service companies", "weekly pool cleaning|pool openings|pool equipment diagnostics", "the pool type, current condition, equipment brand if relevant and whether the request is recurring or one-time", "take on weekly pool service", "A homeowner with an in-ground pool wants weekly cleaning and a separate check of a noisy pump."],
  ["fencing", "Fencing & Gates", "outdoor-trades", "fence contractors", "privacy fence installation|chain-link fence repair|driveway gate replacement", "the fence material, approximate linear footage, gate count and whether removal is part of the job", "replace a backyard fence", "A homeowner wants roughly 120 linear feet of wood privacy fence replaced, plus a walk gate and haul-off."],
  ["irrigation", "Irrigation & Sprinklers", "outdoor-trades", "irrigation and sprinkler contractors", "sprinkler system installation|sprinkler zone repairs|drip irrigation", "the system type, affected zones, controller symptoms and whether the customer wants repair or installation", "repair a sprinkler zone", "One sprinkler zone won’t run and another leaves a wet spot. The homeowner wants a diagnostic visit and repair quote."],
  ["tree-service", "Tree Service", "outdoor-trades", "tree service companies", "tree trimming|tree removal|stump grinding", "tree size and location, access, nearby structures or lines and whether stump work is requested", "quote tree trimming and stump grinding", "An owner wants two branches trimmed back from a roof and a separate stump ground near a side gate."],
  ["gutter-services", "Gutter Services", "outdoor-trades", "gutter contractors", "seamless gutter installs|gutter repairs|gutter guard installs", "the stories, approximate gutter length, downspout locations and whether existing gutters need removal", "replace a section of gutter", "A homeowner wants a leaking second-story gutter replaced and the downspout redirected away from the foundation."],
  ["siding", "Siding Installation & Repair", "outdoor-trades", "siding contractors", "vinyl siding replacement|fiber cement siding installs|siding repairs", "the current cladding, affected elevations, visible damage and whether the request is for repair or replacement", "quote a siding replacement", "The back elevation has damaged vinyl siding, and the owner wants options for replacing that wall."],
  ["window-replacement", "Window Replacement", "outdoor-trades", "window replacement contractors", "replacement windows|window frame repairs|energy-efficient window upgrades", "the opening count, frame type, symptoms and whether the homeowner wants inserts or full-frame replacement", "quote replacement windows", "A homeowner wants to replace six drafty windows and compare insert and full-frame options."],
  ["exterior-doors", "Exterior Door Installation", "outdoor-trades", "exterior door installers", "front entry doors|sliding patio doors|storm door installs", "the door type, rough dimensions, condition of the opening and whether the frame or hardware also needs replacing", "replace a sliding patio door", "A patio slider sticks and lets in water. The homeowner wants a quote that includes inspection of the existing frame."],
  ["deck-building", "Deck Building & Repair", "outdoor-trades", "deck builders", "wood deck construction|composite deck replacement|deck and railing repairs", "the deck dimensions, height, existing framing and whether stairs or railings are in scope", "quote a deck rebuild", "A homeowner wants a 12-by-16-foot deck rebuilt in composite, with new stairs and a railing."],
  ["concrete", "Concrete Flatwork", "outdoor-trades", "concrete contractors", "concrete driveways|concrete patios|sidewalk replacement", "the pour dimensions, finish, site access and whether old concrete needs demolition and haul-off", "quote a driveway replacement", "An owner wants a cracked two-car driveway removed and replaced and can send approximate measurements."],
  ["pavers-hardscaping", "Pavers & Hardscaping", "outdoor-trades", "hardscape contractors", "paver patios|paver walkways|retaining walls", "the project footprint, grade, drainage, material preference and equipment access", "quote a paver patio", "A homeowner wants a 300-square-foot paver patio and needs the contractor to assess slope and runoff."],
  ["foundation-repair", "Foundation Repair", "outdoor-trades", "foundation repair contractors", "foundation inspections|slab stabilization|pier and beam repairs", "the foundation type, visible symptoms, access and whether an inspection or repair estimate is requested", "inspect a foundation concern", "A homeowner reports drywall cracks and a door that no longer closes properly and wants a foundation assessment."],
  ["flooring", "Flooring Installation & Refinishing", "remodeling", "flooring contractors", "luxury vinyl plank installation|hardwood refinishing|carpet replacement", "the approximate square footage, chosen material, subfloor condition and whether existing flooring needs removal", "quote new living-room flooring", "A homeowner wants to replace about 650 square feet of carpet with luxury vinyl plank and may need subfloor prep."],
  ["kitchen-remodeling", "Kitchen Remodeling", "remodeling", "kitchen remodelers", "kitchen renovations|layout changes|kitchen additions", "the current layout, desired changes, appliance or utility moves, target budget and start window", "quote a kitchen remodel", "A homeowner wants new cabinetry and an island and is deciding whether to move the sink to a different wall."],
  ["bathroom-remodeling", "Bathroom Remodeling", "remodeling", "bathroom remodelers", "bathroom renovations|tub-to-shower conversions|accessible bathroom upgrades", "the existing layout, shower or tub changes, accessibility needs and rough budget", "quote a tub-to-shower conversion", "A homeowner wants a hall bathroom tub replaced with a walk-in shower and may also replace the vanity."],
  ["cabinetry", "Cabinetry & Cabinet Refacing", "remodeling", "cabinet and refacing companies", "custom cabinetry|cabinet refacing|cabinet installation", "the affected rooms, approximate cabinet count, condition and whether the layout or cabinet boxes will change", "quote kitchen cabinet refacing", "A homeowner wants new fronts and hardware on an existing kitchen layout and can provide photos of the cabinet boxes."],
  ["countertops", "Countertop Fabrication & Installation", "remodeling", "countertop fabricators and installers", "quartz countertop installation|granite countertop replacement|vanity tops", "the material, approximate dimensions, sink and cooktop cutouts and whether removal is needed", "measure for a countertop replacement", "A kitchen needs quartz on two wall runs and an island, with a sink cutout and disposal of the old laminate."],
  ["tile-installation", "Tile Installation", "remodeling", "tile setters", "backsplash installation|shower tile|tile floor installation", "the surface, square footage, tile format and existing substrate or waterproofing requirements", "quote new shower tile", "A homeowner wants shower wall tile replaced and needs the contractor to assess the substrate first."],
  ["drywall", "Drywall Installation & Repair", "remodeling", "drywall contractors", "drywall hanging|ceiling patch repairs|texture matching", "the wall or ceiling area, access height, existing texture and whether damage is still active", "repair damaged drywall", "A plumbing leak was fixed, and the owner wants two ceiling patches repaired and textured to blend with the existing ceiling."],
  ["painting", "Interior & Exterior Painting", "remodeling", "painting contractors", "interior repainting|exterior house painting|trim and cabinet painting", "the rooms or elevations, surface condition, height, preparation needs and target timing", "quote an interior repaint", "A homeowner wants walls and trim repainted in three rooms and wants to know if patching can be included."],
  ["finish-carpentry", "Finish Carpentry & Trim", "remodeling", "finish carpenters", "baseboard installation|interior trim|custom built-ins", "the rooms, approximate linear footage or dimensions, trim profile and whether finishing is required", "quote baseboards and door trim", "An owner just replaced flooring and wants taller baseboards and matching door casings in four rooms."],
  ["insulation", "Insulation & Air Sealing", "remodeling", "insulation contractors", "attic insulation|crawl space insulation|air sealing", "the space, access, approximate area, existing insulation and any reported moisture concerns", "assess attic insulation", "A homeowner says the upstairs is hard to cool and wants an insulation and air-sealing assessment of an accessible attic."],
  ["basement-remodeling", "Basement Finishing & Remodeling", "remodeling", "basement remodelers", "basement finishing|basement bathroom additions|basement layout updates", "the existing finish level, intended rooms, moisture concerns and whether plumbing or egress work may be needed", "quote a basement finishing project", "A homeowner wants to turn part of an unfinished basement into a family room and discuss adding a half bath."]
];

const content = ([id, label, group, legacyPrice, audience, jobs, fit, service, example], isNew = false) => ({
  id, label, group, legacyPrice, slug: id, isNew, audience, jobs: jobs.split("|"), fit, service, example
});

export const programs = [
  ...existing.map(([id, label, group, legacyPrice, slug = id]) => ({ id, label, group, legacyPrice, slug })),
  ...missing.map(row => content(row)),
  ...specialties.map(([id, label, group, ...rest]) => content([id, label, group, undefined, ...rest], true))
].sort((a, b) => a.label.localeCompare(b.label, "en"));

export const categoryLabels = Object.fromEntries(programs.map(({ id, label }) => [id, label]));
export const categoryIds = programs.map(({ id }) => id);
export const bamCategories = programs.map(({ id, label, group, slug, audience, service, example }) => ({
  id, label, group: groups[group], page: `/leads/${slug}.html`,
  ...(service ? { audience, service, example } : {})
}));
