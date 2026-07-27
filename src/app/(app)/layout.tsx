import { redirect } from "next/navigation";
import { getCurrentProfileContext } from "@/lib/queries/profile";
import { Header } from "./_components/Header";
import { Nav } from "./_components/Nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentProfileContext();
  if (!context) redirect("/login");

  const { profile, counter } = context;

  return (
    <div className="min-h-dvh bg-bg">
      <Nav role={profile.role} />
      <div className="app-shell-content flex min-h-dvh flex-col">
        <Header name={profile.name} role={profile.role} counter={counter} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
