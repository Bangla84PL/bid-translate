import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentAgency } from "@/lib/supabase/auth";
import { Footer } from "@/components/layout/footer";

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const agency = await getCurrentAgency();

  if (!user || !agency) {
    redirect("/login");
  }

  const navigation = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Tłumacze", href: "/translators" },
    { name: "Aukcje", href: "/auctions" },
    { name: "Analityka", href: "/analytics" },
    { name: "Ustawienia", href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-background-secondary sticky top-0 z-50 bg-background-primary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold font-mono text-accent-primary">
              BidTranslate
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Wyloguj
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>

      <Footer />
    </div>
  );
}
