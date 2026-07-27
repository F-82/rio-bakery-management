import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { getHomeHref } from "@/lib/nav";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  redirect(profile ? getHomeHref(profile.role) : "/login");
}
