"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AvatarCropModal } from "@/components/avatar-crop-modal";

export function AvatarUploader({
  userId,
  initialUrl,
  fullName,
  onUploaded,
}: {
  userId: string;
  initialUrl: string | null;
  fullName: string;
  onUploaded: (url: string) => void;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl);
  const [editingSrc, setEditingSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
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

    setEditingSrc(URL.createObjectURL(file));
  }

  function closeEditor() {
    if (editingSrc) URL.revokeObjectURL(editingSrc);
    setEditingSrc(null);
  }

  async function handleCropSave(blob: Blob) {
    closeEditor();
    setUploading(true);

    const path = `${userId}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, cacheControl: "3600", contentType: "image/jpeg" });

    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const cacheBusted = `${data.publicUrl}?t=${Date.now()}`;
    setPreview(cacheBusted);
    onUploaded(cacheBusted);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-sunset-300 to-brand-400 shadow-md">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
            {fullName?.[0]?.toUpperCase() ?? "?"}
          </span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-secondary"
        >
          {uploading ? "Uploading..." : "Change photo"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>

      {editingSrc && (
        <AvatarCropModal imageSrc={editingSrc} onCancel={closeEditor} onSave={handleCropSave} />
      )}
    </div>
  );
}
