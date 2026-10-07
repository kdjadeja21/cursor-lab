"use client";

import { Check, Clock, Globe, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const durations = ["15", "30", "60"];
const slots = ["09:00", "09:30", "10:30", "11:00", "13:30", "14:00", "15:30", "16:00"];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function BookingWidget() {
  const today = useMemo(() => startOfToday(), []);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState("30");
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const pretty = date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const unavailable = (d: Date) => d < today || d.getDay() === 0 || d.getDay() === 6;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl shadow-primary/10">
      <div className="grid md:grid-cols-[240px_1fr]">
        <div className="border-b p-6 md:border-r md:border-b-0">
          <div className="mb-4 grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            AR
          </div>
          <p className="text-sm text-muted-foreground">Alex Rivera</p>
          <h3 className="text-lg font-semibold">Intro call</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><Clock className="size-4" />{duration} min</li>
            <li className="flex items-center gap-2"><Video className="size-4" />Slotly Video</li>
            <li className="flex items-center gap-2"><Globe className="size-4" />Your local timezone</li>
          </ul>
          <ToggleGroup
            value={[duration]}
            onValueChange={(v) => v[0] && setDuration(v[0])}
            variant="outline"
            className="mt-6"
            aria-label="Duration"
          >
            {durations.map((d) => (
              <ToggleGroupItem key={d} value={d}>{d}m</ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {confirmed ? (
          <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Check className="size-7" />
            </span>
            <h3 className="text-xl font-semibold">You are booked</h3>
            <p className="text-sm text-muted-foreground">
              {pretty} at {slot} for {duration} minutes. A calendar invite is on its way.
            </p>
            <Button variant="outline" onClick={() => { setConfirmed(false); setSlot(null); setDate(undefined); }}>
              Book another
            </Button>
          </div>
        ) : (
          <div className="grid gap-2 p-4 sm:grid-cols-[auto_1fr]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => { setDate(d); setSlot(null); }}
              disabled={unavailable}
              className="mx-auto bg-transparent"
            />
            <div className="min-w-36 p-2">
              {date ? (
                <>
                  <p className="mb-3 text-sm font-medium">{pretty}</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                    {slots.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        aria-pressed={slot === s}
                        className={cn(
                          "rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:border-primary",
                          slot === s && "border-primary bg-primary text-primary-foreground hover:border-primary",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <Button className="mt-4 w-full" disabled={!slot} onClick={() => setConfirmed(true)}>
                    Confirm booking
                  </Button>
                </>
              ) : (
                <p className="grid h-full min-h-40 place-items-center text-center text-sm text-muted-foreground">
                  Pick a day to see open times.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
