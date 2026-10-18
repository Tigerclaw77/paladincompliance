// RFC 5545 iCalendar output for the compliance calendar. All-day events with a
// display reminder one day before. Pure and unit tested.

export type IcsEvent = {
  uid: string;
  /** YYYY-MM-DD */
  date: string;
  summary: string;
  description: string;
  url?: string;
};

export function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Folds a content line to 75 octets per RFC 5545 section 3.1. */
export function foldIcsLine(line: string) {
  const encoder = new TextEncoder();

  if (encoder.encode(line).length <= 75) {
    return line;
  }

  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;

  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;

    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }

    current += char;
    currentBytes += bytes;
  }

  parts.push(current);

  return parts.join("\r\n ");
}

function compactDate(date: string) {
  return date.replace(/-/g, "");
}

function nextDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));

  return next.toISOString().slice(0, 10);
}

export function buildIcs({
  calendarName,
  events,
  now = new Date(),
}: {
  calendarName: string;
  events: IcsEvent[];
  now?: Date;
}) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Paladin Compliance//Compliance Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(event.date)}`,
      `DTEND;VALUE=DATE:${compactDate(nextDay(event.date))}`,
      `SUMMARY:${escapeIcsText(event.summary)}`,
      `DESCRIPTION:${escapeIcsText(event.description)}`
    );

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcsText(event.summary)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}
