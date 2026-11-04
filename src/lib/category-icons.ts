import {
  Leaf,
  GraduationCap,
  Utensils,
  Home,
  PawPrint,
  HeartPulse,
  Users,
  Gamepad2,
  Siren,
  Palette,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { OpportunityCategory } from "@/types/database";

export const CATEGORY_ICONS: Record<OpportunityCategory, LucideIcon> = {
  environment: Leaf,
  education: GraduationCap,
  food_security: Utensils,
  homelessness: Home,
  animal_welfare: PawPrint,
  health: HeartPulse,
  seniors: Users,
  youth: Gamepad2,
  disaster_relief: Siren,
  arts_culture: Palette,
  other: Star,
};
