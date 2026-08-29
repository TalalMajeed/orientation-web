"use client";

import { useState } from "react";

import DecorEllipse from "@/components/site/ellipse";

interface ScheduleItem {
  time: string;
  activity: string;
  venue: string;
}

interface ScheduleDay {
  label: string;
  date: string;
  weekday: string;
  items: ScheduleItem[];
}

const SCHEDULE: ScheduleDay[] = [
  {
    label: "Day 1",
    date: "2nd Sep",
    weekday: "Wednesday",
    items: [
      {
        time: "1000–1130 hrs",
        activity: "Opening & Briefing / Q&A Session with Parents",
        venue: "Jinnah Auditorium / NBS Hall (broadcast)",
      },
      {
        time: "1200–1300 hrs",
        activity: "Principal S3H Address + Q&A Session",
        venue: "Jinnah Auditorium",
      },
      {
        time: "1400–1500 hrs",
        activity: "Principal NBS Address + Q&A Session",
        venue: "Jinnah Auditorium",
      },
      {
        time: "1530–1630 hrs",
        activity: "Principal SEECS Address + Q&A Session",
        venue: "Jinnah Auditorium",
      },
      { time: "1400–1600 hrs", activity: "Meet Your OGs", venue: "NBS Ground" },
      { time: "1600–2100 hrs", activity: "Batch Photo", venue: "Convocation Ground" },
    ],
  },
  {
    label: "Day 2",
    date: "3rd Sep",
    weekday: "Thursday",
    items: [
      {
        time: "0900–1300 hrs",
        activity: "Reception at Schools / SEECS Reception & Orientation",
        venue: "Respective Schools / NET Exam Hall",
      },
      {
        time: "1430–1600 hrs",
        activity: "Closing Ceremony of NUST Summer School",
        venue: "CIPS Auditorium",
      },
      { time: "1300–1900 hrs", activity: "OG Activities", venue: "NBS Ground" },
      { time: "1400–1900 hrs", activity: "Club and Societies Activities", venue: "NUST" },
      { time: "1800–2100 hrs", activity: "Drama by NDC", venue: "Jinnah Auditorium" },
    ],
  },
  {
    label: "Day 3",
    date: "4th Sep",
    weekday: "Friday",
    items: [
      {
        time: "1000–1230 hrs",
        activity: "Life at NUST (Registrar + FAO + Alumni)",
        venue: "Jinnah Auditorium",
      },
      { time: "1000–1230 hrs", activity: "Life at NUST — SEECS", venue: "SCEE Seminar Hall" },
      { time: "1530–1630 hrs", activity: "Closing Ceremony", venue: "Jinnah Auditorium" },
      { time: "1700–2200 hrs", activity: "Bazm Night / Society Stalls", venue: "SCME Ground" },
    ],
  },
];

export default function ScheduleSection() {
  const [active, setActive] = useState(0);
  const day = SCHEDULE[active];

  return (
    <section id="schedule" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <DecorEllipse className="orbit pointer-events-none absolute right-[-12%] top-[20%] h-[65%] w-[55%] text-fg/15" />
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— Orientation Week</p>
        <div className="mt-4">
          <h2 className="font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
            The Schedule
          </h2>
        </div>

        <div className="mt-10 flex flex-wrap gap-3" role="tablist" aria-label="Orientation day">
          {SCHEDULE.map((d, index) => (
            <button
              key={d.label}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => setActive(index)}
              className={`cursor-pointer rounded-full border-2 border-dotted px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                index === active
                  ? "border-transparent bg-fg text-surface"
                  : "border-fg/30 text-fg/60 hover:border-fg hover:text-fg"
              }`}
            >
              {d.label} · {d.date}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[180px_1fr] sm:gap-8">
          <div className="flex flex-row items-center gap-3 rounded-2xl bg-inverse-surface px-5 py-4 text-inverse-fg sm:flex-col sm:items-start sm:justify-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-inverse-fg/60">
              {day.label}
            </p>
            <p className="font-serif text-2xl font-bold leading-tight text-inverse-fg">
              {day.date}
            </p>
            <p className="font-italic text-sm italic text-inverse-fg/70">{day.weekday}</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-fg/12">
            {day.items.map((item, index) => (
              <div
                key={`${day.label}-${index}`}
                className={`grid gap-1.5 px-5 py-4 sm:grid-cols-[150px_1fr_auto] sm:items-center sm:gap-6 sm:py-3.5 ${
                  index > 0 ? "border-t border-fg/10" : ""
                }`}
              >
                <p className="font-mono text-xs uppercase tracking-[0.08em] text-fg/50">
                  {item.time}
                </p>
                <p className="font-serif text-lg leading-snug text-fg">{item.activity}</p>
                <p className="font-italic text-sm italic text-fg/60 sm:text-right">
                  {item.venue}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
