export const BAM_LINK_GOAL = 50;

const centralDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit"
});
const centralOffset = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Chicago", timeZoneName: "shortOffset"
});

export function centralDayWindow(instant = new Date()) {
  const parts = Object.fromEntries(centralDate.formatToParts(instant).map(({type,value})=>[type,value]));
  const anchor = Date.UTC(+parts.year,+parts.month-1,+parts.day);
  // At 00:00 UTC it is still the previous evening in Central time. Its offset
  // also applies at the following local midnight, before any 2 a.m. DST change.
  const midnight = utc => {
    const zone = centralOffset.formatToParts(new Date(utc)).find(p=>p.type==="timeZoneName").value;
    return new Date(utc - Number(zone.slice(3))*3600000).toISOString();
  };
  return {day:`${parts.year}-${parts.month}-${parts.day}`,start:midnight(anchor),end:midnight(anchor+86400000)};
}

// Normalize business phone formatting so the same recipient doesn't count
// twice if the rep logs it under different categories or locations.
const phone = ["+","(",")","-","."," "].reduce((s,c)=>`replace(${s},'${c}','')`,"trim(h.contact)");
const phoneKey = `CASE WHEN length(${phone})=11 AND substr(${phone},1,1)='1' THEN substr(${phone},2) ELSE ${phone} END`;
export const linkCountSql = rep => `(SELECT COUNT(DISTINCT
    CASE WHEN length(${phone}) BETWEEN 10 AND 15 AND ${phone} NOT GLOB '*[^0-9]*'
         THEN 'phone:' || (${phoneKey}) ELSE 'row:' || e.detail END)
  FROM bam_training_events e JOIN bam_training_hitlist h ON h.id=CAST(e.detail AS INTEGER) AND h.rep_id=e.rep_id
  WHERE e.rep_id=${rep} AND e.kind='Program link sent' AND e.happened_at>=? AND e.happened_at<?)`;
