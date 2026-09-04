"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { OpportunityCategory } from "@/types/database";

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  category: OpportunityCategory;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function SignupCalendar({ events }: { events: CalendarEvent[] }) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const d = new Date(event.startsAt);
      const key = dateKey(d);
      const existing = map.get(key) ?? [];
      existing.push(event);
      map.set(key, existing);
    }
    return map;
  }, [events]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="btn-secondary"
        >
          &larr; Prev
        </button>
        <h2 className="text-lg font-semibold text-stone-900">
          {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="btn-secondary"
        >
          Next &rarr;
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-stone-500">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="aspect-square" />;
          const dayEvents = eventsByDay.get(dateKey(date)) ?? [];
          const isToday = dateKey(date) === dateKey(today);
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg border p-1.5 text-left ${
                isToday ? "border-brand-400 bg-brand-50" : "border-stone-200"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isToday ? "text-brand-700" : "text-stone-500"
                }`}
              >
                {date.getDate()}
              </p>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <Link
                    key={event.id}
                    href={`/opportunities/${event.id}`}
                    className="block truncate rounded bg-brand-100 px-1 py-0.5 text-[10px] font-medium text-brand-800 hover:bg-brand-200"
                    title={`${event.title} · ${CATEGORY_LABELS[event.category]}`}
                  >
                    {event.title}
                  </Link>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-stone-500">+{dayEvents.length - 2} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
