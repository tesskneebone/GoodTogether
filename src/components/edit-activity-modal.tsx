"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateActivityExtras, type ActivityExtrasKind } from "@/lib/actions/activity-extras";

export function EditActivityButton({
  kind,
  id,
  userId,
  computedHours,
  initialHoursOverride,
  initialNote,
  initialPhotoUrl,
  variant = "pill",
}: {
  kind: ActivityExtrasKind;
  id: string;
  userId: string;
  computedHours: number;
  initialHoursOverride: number | null;
  initialNote: string | null;
  initialPhotoUrl: string | null;
  variant?: "pill" | "icon";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Edit"
          className="w-7 h-7 flex items-center justify-center rounded-full text-outline hover:bg-surface-container-low flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 rounded-full border border-outline-variant px-3 py-1 font-label-md text-label-md text-on-surface-variant transition hover:border-outline hover:text-on-surface"
        >
          <span className="material-symbols-outlined text-[16px]">edit</span>
          Edit
        </button>
      )}
      {open && (
        <EditActivityModal
          kind={kind}
          id={id}
          userId={userId}
          computedHours={computedHours}
          initialHoursOverride={initialHoursOverride}
          initialNote={initialNote}
          initialPhotoUrl={initialPhotoUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function EditActivityModal({
  kind,
  id,
  userId,
  computedHours,
  initialHoursOverride,
  initialNote,
  initialPhotoUrl,
  onClose,
}: {
  kind: ActivityExtrasKind;
  id: string;
  userId: string;
  computedHours: number;
  initialHoursOverride: number | null;
  initialNote: string | null;
  initialPhotoUrl: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [hours, setHours] = useState(String(initialHoursOverride ?? computedHours));
  const [note, setNote] = useState(initialNote ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleSave() {
    setError(null);
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("id", id);
    formData.set("note", note);
    formData.set("photo_url", photoUrl);
    formData.set("hours_override", hours);

    startTransition(async () => {
      const result = await updateActivityExtras(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-inverse-surface/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-container-lowest p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Edit entry</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-outline hover:bg-surface-container-low hover:text-on-surface"
            aria-label="Cancel"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-variant">Hours</label>
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
            <p className="mt-1 text-xs text-outline">
              Defaults to the opportunity&apos;s posted duration ({computedHours} hr
              {computedHours === 1 ? "" : "s"}) -- adjust if you actually spent more or less time.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-variant">
              Comment (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Say something about how it went..."
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-on-surface-variant">
              Photo (optional)
            </label>
            {photoUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt="" className="h-28 w-28 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-inverse-surface text-inverse-on-surface"
                  aria-label="Remove photo"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-full border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface-variant disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
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
        </div>

        {error && <p className="mt-3 text-sm text-error">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-outline-variant px-4 py-2 font-label-md text-label-md font-semibold text-on-surface-variant disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending || uploading}
            className="rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
