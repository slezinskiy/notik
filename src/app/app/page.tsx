import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return <AppShell />;
}
