"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addComment(
  activityKey: string,
  body: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty." };
  if (trimmed.length > 500) return { error: "Keep it under 500 characters." };

  const { error } = await supabase.from("activity_comments").insert({
    activity_key: activityKey,
    author_id: user.id,
    body: trimmed,
  });

  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { error: null };
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { error } = await supabase
    .from("activity_comments")
    .delete()
    .eq("id", commentId)
    .eq("author_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/feed");
  return { error: null };
}
