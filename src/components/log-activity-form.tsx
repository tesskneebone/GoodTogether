"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Droplet, ImagePlus, X } from "lucide-react";
import { logActivity } from "@/lib/actions/activity-log";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ExistingLoggedActivity {
  id: string;
  title: string;
  category: string;
  org_name: string | null;
  occurred_at: string;
  hours: number;
  note: string | null;
  photo_url: string | null;
  location: string | null;
}

export function LogActivityForm({
  userId,
  existingActivity,
}: {
  userId: string;
  existingActivity?: ExistingLoggedActivity;
}) {
  const router = useRouter();
  const supabase = createClient();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState(existingActivity?.category ?? "health");
  const [title, setTitle] = useState(existingActivity?.title ?? "");
  const [hours, setHours] = useState(String(existingActivity?.hours ?? 1));
  const [photoUrl, setPhotoUrl] = useState(existingActivity?.photo_url ?? "");
  const [uploading, setUploading] = useState(false);
  const isEditing = !!existingActivity;

  const today = todayLocal();
  const earliest = daysAgoLocal(31);

  function applyBloodDonationPreset() {
    setCategory("health");
    setTitle("Blood donation");
    setHours("1");
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("activity-photos")
      .upload(path, file, { cacheControl: "3600" });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("activity-photos").getPublicUrl(path);
    setPhotoUrl(data.publicUrl);
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
        setPhotoUrl("");
        router.push("/feed");
        router.refresh();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="activity_id" value={existingActivity?.id ?? ""} />

      {!isEditing && (
        <button
          type="button"
          onClick={applyBloodDonationPreset}
          className="flex w-full items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-100"
        >
          <Droplet className="h-5 w-5 shrink-0" aria-hidden="true" />
          Donated blood or platelets recently? Tap to fill this in.
        </button>
      )}

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
            defaultValue={existingActivity?.org_name ?? ""}
            placeholder="e.g. American Red Cross"
            className="input mt-1"
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-stone-700">
          Location (optional)
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={existingActivity?.location ?? ""}
          placeholder="e.g. Santa Monica, or a street address"
          className="input mt-1"
        />
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
            defaultValue={existingActivity?.occurred_at ?? today}
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
        <textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={existingActivity?.note ?? ""}
          className="input mt-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700">Photo (optional)</label>
        <input type="hidden" name="photo_url" value={photoUrl} />
        {photoUrl ? (
          <div className="relative mt-1 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt="" className="h-32 w-32 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => setPhotoUrl("")}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-white"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary mt-1 inline-flex items-center gap-1.5"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            {uploading ? "Uploading..." : "Add a photo"}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Saving..." : isEditing ? "Save changes" : "Log activity"}
      </button>
    </form>
  );
}
