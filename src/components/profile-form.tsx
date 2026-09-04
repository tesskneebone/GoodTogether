"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import { AvatarUploader } from "@/components/avatar-uploader";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import type { Profile } from "@/types/database";

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfile({ error: null }, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <AvatarUploader
        userId={profile.id}
        initialUrl={profile.avatar_url}
        fullName={profile.full_name}
        onUploaded={setAvatarUrl}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          {profile.role === "org" ? "Your name" : "Full name"}
        </label>
        <input
          name="full_name"
          required
          className="input"
          defaultValue={profile.full_name}
        />
      </div>

      {profile.role === "org" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Organization name
          </label>
          <input
            name="org_name"
            required
            className="input"
            defaultValue={profile.org_name ?? ""}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">Age</label>
            <input
              type="number"
              name="age"
              min={13}
              max={120}
              className="input"
              defaultValue={profile.age ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Neighborhood
            </label>
            <select
              name="neighborhood"
              className="input"
              defaultValue={profile.neighborhood ?? ""}
            >
              <option value="">Not set</option>
              {LA_NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700">
          {profile.role === "org" ? "About your organization" : "Bio"}
        </label>
        <textarea
          name="bio"
          rows={4}
          className="input"
          placeholder={
            profile.role === "org"
              ? "Tell volunteers what your organization does..."
              : "Tell orgs a little about yourself..."
          }
          defaultValue={profile.bio ?? ""}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-brand-700">Profile updated.</p>}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
