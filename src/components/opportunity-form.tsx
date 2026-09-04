"use client";

import { useRef, useState, useTransition } from "react";
import { CATEGORIES, CATEGORY_LABELS, LA_NEIGHBORHOODS } from "@/lib/constants";
import type { Opportunity } from "@/types/database";
import type { OpportunityFormState as ActionState } from "@/lib/actions/opportunities";

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function OpportunityForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: Opportunity;
  submitLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action({ error: null }, formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">Title</label>
        <input
          name="title"
          required
          className="input"
          defaultValue={defaultValues?.title}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Description
        </label>
        <textarea
          name="description"
          required
          rows={5}
          className="input"
          defaultValue={defaultValues?.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Category
          </label>
          <select
            name="category"
            required
            className="input"
            defaultValue={defaultValues?.category ?? ""}
          >
            <option value="" disabled>
              Select a cause
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Neighborhood
          </label>
          <input
            name="neighborhood"
            required
            list="la-neighborhoods"
            className="input"
            defaultValue={defaultValues?.neighborhood}
          />
          <datalist id="la-neighborhoods">
            {LA_NEIGHBORHOODS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          Address (optional)
        </label>
        <input
          name="address"
          className="input"
          defaultValue={defaultValues?.address ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Starts at
          </label>
          <input
            type="datetime-local"
            name="starts_at"
            required
            className="input"
            defaultValue={
              defaultValues ? toLocalInputValue(defaultValues.starts_at) : undefined
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Ends at
          </label>
          <input
            type="datetime-local"
            name="ends_at"
            required
            className="input"
            defaultValue={
              defaultValues ? toLocalInputValue(defaultValues.ends_at) : undefined
            }
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Total spots
          </label>
          <input
            type="number"
            name="spots_total"
            min={1}
            required
            className="input"
            defaultValue={defaultValues?.spots_total ?? 10}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
