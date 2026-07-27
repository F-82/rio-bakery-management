import { getCurrentProfile } from "@/lib/queries/profile";
import { signOut } from "@/lib/actions/auth";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Rio Bakers Hut</h1>
      <p className="text-sm">
        Signed in as {profile?.name ?? "Unknown"} ({profile?.role ?? "no role"})
      </p>
      <form action={signOut}>
        <button type="submit" className="rounded border px-4 py-2 text-sm">
          Sign out
        </button>
      </form>
    </div>
  );
}
