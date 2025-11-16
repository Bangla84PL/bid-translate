import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Footer } from "./footer";

/**
 * Main dashboard layout with sidebar navigation
 */
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "📊" },
    { name: "Tłumacze", href: "/translators", icon: "👥" },
    { name: "Aukcje", href: "/auctions", icon: "⚡" },
    { name: "Analityka", href: "/analytics", icon: "📈" },
    { name: "Ustawienia", href: "/settings", icon: "⚙️" },
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
            <button className="text-text-secondary hover:text-text-primary">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-background-secondary p-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent-primary text-white"
                      : "text-text-secondary hover:bg-background-secondary hover:text-text-primary"
                  )}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
