"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet } from "lucide-react";
import { logActivity } from "@/lib/actions/activity-log";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function LogActivityForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("health");
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("1");

  const today = todayLocal();
  const earliest = daysAgoLocal(31);

  function applyBloodDonationPreset() {
    setCategory("health");
    setTitle("Blood donation");
    setHours("1");
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await logActivity(formData);
      if (result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        router.push("/feed");
        router.refresh();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={applyBloodDonationPreset}
        className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-100"
      >
        <Droplet className="h-5 w-5 shrink-0" aria-hidden="true" />
        Donated blood or platelets recently? Tap to fill this in.
      </button>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700">
          What did you do?
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Blood donation, Beach cleanup with a friend's group"
          className="input mt-1"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-stone-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input mt-1"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="org_name" className="block text-sm font-medium text-stone-700">
            Organization (optional)
          </label>
          <input
            id="org_name"
            name="org_name"
            type="text"
            placeholder="e.g. American Red Cross"
            className="input mt-1"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="occurred_at" className="block text-sm font-medium text-stone-700">
            Date
          </label>
          <input
            id="occurred_at"
            name="occurred_at"
            type="date"
            required
            defaultValue={today}
            min={earliest}
            max={today}
            className="input mt-1"
          />
          <p className="mt-1 text-xs text-stone-400">Up to a month in the past.</p>
        </div>
        <div>
          <label htmlFor="hours" className="block text-sm font-medium text-stone-700">
            Hours
          </label>
          <input
            id="hours"
            name="hours"
            type="number"
            required
            min="0.25"
            max="24"
            step="0.25"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="input mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-stone-700">
          Note (optional)
        </label>
        <textarea id="note" name="note" rows={3} className="input mt-1" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Logging..." : "Log activity"}
      </button>
    </form>
  );
}
