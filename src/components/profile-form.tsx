"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/lib/actions/profile";
import { AvatarUploader } from "@/components/avatar-uploader";
import { LA_NEIGHBORHOODS } from "@/lib/constants";
import type { Profile } from "@/types/database";

const inputClass =
  "block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface shadow-sm focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary";

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
        <label className="mb-1 block text-sm font-medium text-on-surface-variant">
          {profile.role === "org" ? "Your name" : "Full name"}
        </label>
        <input name="full_name" required className={inputClass} defaultValue={profile.full_name} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-on-surface-variant">Username</label>
        <div className="flex items-center">
          <span className="rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-outline">
            @
          </span>
          <input
            name="username"
            required
            pattern="[a-z0-9_]{3,20}"
            title="3-20 characters: lowercase letters, numbers, underscores"
            className={`${inputClass} rounded-l-none`}
            defaultValue={profile.username}
            onChange={(e) => {
              e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
            }}
          />
        </div>
        <p className="mt-1 text-xs text-outline">Your public profile: /u/{profile.username}</p>
      </div>

      {profile.role === "org" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-on-surface-variant">
            Organization name
          </label>
          <input name="org_name" required className={inputClass} defaultValue={profile.org_name ?? ""} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface-variant">Age</label>
            <input
              type="number"
              name="age"
              min={13}
              max={120}
              className={inputClass}
              defaultValue={profile.age ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface-variant">
              Neighborhood
            </label>
            <select name="neighborhood" className={inputClass} defaultValue={profile.neighborhood ?? ""}>
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
        <label className="mb-1 block text-sm font-medium text-on-surface-variant">
          {profile.role === "org" ? "About your organization" : "Bio"}
        </label>
        <textarea
          name="bio"
          rows={4}
          className={inputClass}
          placeholder={
            profile.role === "org"
              ? "Tell volunteers what your organization does..."
              : "Tell orgs a little about yourself..."
          }
          defaultValue={profile.bio ?? ""}
        />
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-outline-variant p-4">
        <input
          type="checkbox"
          name="is_private"
          defaultChecked={profile.is_private}
          className="mt-0.5 h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
        />
        <span>
          <span className="block text-sm font-medium text-on-surface-variant">Private account</span>
          <span className="block text-sm text-outline">
            When on, your public profile, activity, and badges are visible only to you
            &mdash; hidden from the feed, the leaderboard, and your{" "}
            {profile.username ? `/u/${profile.username}` : "public profile"} page for
            everyone else.
          </span>
        </span>
      </label>

      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-secondary">Profile updated.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-primary-container px-4 py-2 font-label-md text-label-md font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
