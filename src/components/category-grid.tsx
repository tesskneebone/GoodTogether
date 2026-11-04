import Link from "next/link";
import { Leaf, Utensils, GraduationCap, HeartHandshake } from "lucide-react";

const CATEGORY_GROUPS = [
  {
    label: "Environment & Outdoors",
    description: "Beach cleanups, conservation, community gardens, and park restoration.",
    categories: ["environment"],
    icon: Leaf,
    iconBg: "bg-brand-100 text-brand-700",
  },
  {
    label: "Food & Hunger",
    description: "Food banks, meal preparation, and food distribution.",
    categories: ["food_security"],
    icon: Utensils,
    iconBg: "bg-sunset-100 text-sunset-700",
  },
  {
    label: "Education & Youth",
    description: "Tutoring, mentoring, and youth programs.",
    categories: ["education", "youth"],
    icon: GraduationCap,
    iconBg: "bg-sky-100 text-sky-700",
  },
  {
    label: "Community Support",
    description: "Homelessness services, senior support, and neighborhood outreach.",
    categories: ["homelessness", "seniors"],
    icon: HeartHandshake,
    iconBg: "bg-brand-100 text-brand-700",
  },
] as const;

export function CategoryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORY_GROUPS.map(({ label, description, categories, icon: Icon, iconBg }) => (
        <Link
          key={label}
          href={`/opportunities?category=${categories.join(",")}`}
          className="card-interactive flex flex-col gap-3 p-6"
        >
          <span className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${iconBg}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 className="font-semibold text-stone-900">{label}</h3>
          <p className="text-sm text-stone-500">{description}</p>
        </Link>
      ))}
    </div>
  );
}
