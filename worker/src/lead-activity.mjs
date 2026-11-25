// Real contact attempts typed in by a person, plus activity totals derived from stored records only.
export const ATTEMPT_AUTHOR = "shedlr_attempt";

export const attemptOutcomes = {
  no_answer_voicemail: rep => `${rep} called. No answer, voicemail left.`,
  no_answer: rep => `${rep} called. No answer, no voicemail left.`,
  text_sent: rep => `${rep} sent a text message.`,
  spoke_follow_up: rep => `${rep} spoke with the lead. A follow-up is planned.`,
  spoke_scheduled: rep => `${rep} spoke with the lead. Appointment scheduled.`,
  spoke_declined: rep => `${rep} spoke with the lead. Not interested right now.`,
  wrong_number: rep => `${rep} called. The number did not reach the lead.`,
};

const tidy = (value, max) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export async function logContactAttempt(db, leadId, data = {}, now = new Date()) {
  const rep = tidy(data.rep, 60);
  const outcome = Object.hasOwn(attemptOutcomes, data.outcome) ? data.outcome : "";
  if (!rep) return { status: 400, error: "Enter the name of the person who made the attempt." };
  if (!outcome) return { status: 400, error: "Choose what happened." };
  const comment = tidy(data.comment, 300);
  const content = [attemptOutcomes[outcome](rep), comment].filter(Boolean).join(" ");
  const at = now.toISOString();
  const result = await db.prepare(`
    INSERT INTO lead_notes (assignment_id, business_id, lead_id, author, content, created_at, updated_at)
    SELECT la.id, la.business_id, la.lead_id, ?, ?, ?, ?
    FROM lead_assignments la JOIN businesses b ON b.id = la.business_id
    WHERE la.lead_id = ? AND b.status = 'active'
  `).bind(ATTEMPT_AUTHOR, content, at, at, leadId).run();
  const created = result.meta?.changes || 0;
  if (!created) return { status: 404, error: "This lead is not assigned to an active business account." };
  return { status: 201, notes_created: created };
}

export async function getPortalActivity(db, businessId, now = new Date()) {
  const since = new Date(now.getTime() - 7 * 86400000).toISOString();
  const row = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM lead_assignments WHERE business_id = ?1 AND julianday(assigned_at) >= julianday(?2)) AS leads_delivered,
      (SELECT MAX(assigned_at) FROM lead_assignments WHERE business_id = ?1) AS last_delivery_at,
      (SELECT COUNT(*) FROM lead_notes WHERE business_id = ?1 AND author = ?3 AND julianday(created_at) >= julianday(?2)) AS attempts_logged,
      (SELECT MAX(created_at) FROM lead_notes WHERE business_id = ?1 AND author = ?3) AS last_attempt_at
  `).bind(businessId, since, ATTEMPT_AUTHOR).first();
  return { days: 7, leads_delivered: row?.leads_delivered || 0, attempts_logged: row?.attempts_logged || 0, last_delivery_at: row?.last_delivery_at || null, last_attempt_at: row?.last_attempt_at || null };
}
