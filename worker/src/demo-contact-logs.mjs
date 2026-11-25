import { attemptOutcomes } from "./lead-activity.mjs";

const zone = "America/Chicago";
const day = new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" });
const hour = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23" });
const names = ["Avery M.", "Jordan R.", "Casey B.", "Taylor S.", "Morgan J.", "Riley T."];
const messages = Object.values(attemptOutcomes).map(format => format("{rep}"));

export function isDailyRunTime(at) {
  return hour.format(at) === "14";
}

export async function addDailyContactLogs(env, at = new Date()) {
  const ids = String(env.DEMO_BUSINESS_IDS || "").split(",").map(id => id.trim()).filter(id => /^[1-9]\d*$/.test(id)).map(Number);
  if (!ids.length) return { notes_created: 0, configured: false };
  const author = "shedlr_demo_attempt/" + day.format(at);
  // One atomic insert also covers overlapping button presses and scheduled retries.
  const result = await env.DB.prepare(`
    INSERT INTO lead_notes (assignment_id, business_id, lead_id, author, content, created_at, updated_at)
    SELECT a.id, a.business_id, a.lead_id, ?1,
      replace(json_extract(?2, '$[' || abs(random() % json_array_length(?2)) || ']'), '{rep}',
              json_extract(?3, '$[' || abs(random() % json_array_length(?3)) || ']')),
      ?4, ?4
    FROM lead_assignments a
    JOIN leads l ON l.id = a.lead_id
    JOIN businesses b ON b.id = a.business_id
    WHERE a.business_id IN (SELECT value FROM json_each(?5))
      AND b.status = 'active' AND l.status <> 'archived'
      AND NOT EXISTS (SELECT 1 FROM lead_notes n WHERE n.assignment_id = a.id AND n.author = ?1)
  `).bind(author, JSON.stringify(messages), JSON.stringify(names), at.toISOString(), JSON.stringify(ids)).run();
  return { notes_created: result.meta.changes, configured: true };
}
