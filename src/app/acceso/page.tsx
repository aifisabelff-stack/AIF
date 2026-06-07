import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { PanelAccessLoginForm } from "@/components/panel/panel-access-login-form";
import { clearStalePanelLockCookie } from "@/lib/panel-lock-cookie";

type Props = {
  searchParams: Promise<{ desde?: string }>;
};

export default async function AccesoPage({ searchParams }: Props) {
  await clearStalePanelLockCookie();
  const { desde } = await searchParams;
  const redirectTo = desde?.startsWith("/") ? desde : "/panel";

  return (
    <div className="landing-page flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <Link href="/" className="mb-8 transition-opacity hover:opacity-90">
        <LogoMark width={80} presentation="transparent" />
      </Link>
      <PanelAccessLoginForm redirectTo={redirectTo} />
      <Link
        href="/"
        className="mt-8 text-sm font-medium text-iaf-600 hover:text-gold-700"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
