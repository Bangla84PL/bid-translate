import { Suspense } from "react";
import { getCurrentAgency } from "@/lib/supabase/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getDashboardStats(agencyId: string) {
  const supabase = await createServerSupabaseClient();

  // Get active auctions count
  const { count: activeAuctions } = await supabase
    .from("bid_translate_auctions")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .in("status", ["in_progress", "pending_start"]);

  // Get completed auctions this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: completedThisMonth } = await supabase
    .from("bid_translate_auctions")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "completed")
    .gte("completed_at", startOfMonth.toISOString());

  // Get average savings
  const { data: completedAuctions } = await supabase
    .from("bid_translate_auctions")
    .select("starting_price, final_price")
    .eq("agency_id", agencyId)
    .eq("status", "completed")
    .not("final_price", "is", null);

  let averageSavings = 0;
  if (completedAuctions && completedAuctions.length > 0) {
    const totalSavings = completedAuctions.reduce((sum, auction) => {
      const savings = ((auction.starting_price - auction.final_price!) / auction.starting_price) * 100;
      return sum + savings;
    }, 0);
    averageSavings = totalSavings / completedAuctions.length;
  }

  // Get success rate (completed vs failed)
  const { count: totalAuctions } = await supabase
    .from("bid_translate_auctions")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .in("status", ["completed", "failed", "cancelled"]);

  const successRate = totalAuctions && totalAuctions > 0
    ? ((completedThisMonth || 0) / totalAuctions) * 100
    : 0;

  return {
    activeAuctions: activeAuctions || 0,
    completedThisMonth: completedThisMonth || 0,
    averageSavings: Math.round(averageSavings * 10) / 10,
    successRate: Math.round(successRate),
  };
}

async function getRecentAuctions(agencyId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: auctions } = await supabase
    .from("bid_translate_auctions")
    .select("id, language_pair, word_count, status, current_price, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(5);

  return auctions || [];
}

export default async function DashboardPage() {
  const agency = await getCurrentAgency();

  if (!agency) {
    return <div>Loading...</div>;
  }

  const stats = await getDashboardStats(agency.id);
  const recentAuctions = await getRecentAuctions(agency.id);

  // Calculate trial days remaining
  const trialEndsAt = new Date(agency.trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-text-secondary">
          Witaj, <span className="text-text-primary font-medium">{agency.company_name}</span>
        </p>
      </div>

      {/* Trial Banner */}
      {agency.subscription_status === "trial" && (
        <Card className="border-accent-primary bg-accent-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Trial: {daysRemaining} {daysRemaining === 1 ? "dzień" : "dni"} pozostało
                </p>
                <p className="text-sm text-text-secondary">
                  Twój trial kończy się {trialEndsAt.toLocaleDateString("pl-PL")}
                </p>
              </div>
              <Link href="/settings#subscription">
                <Button>Wybierz plan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Aktywne aukcje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeAuctions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Ukończone (ten miesiąc)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.completedThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Średnie oszczędności
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-success">
              {stats.averageSavings}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Sukces aukcji
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Limits */}
      <Card>
        <CardHeader>
          <CardTitle>Wykorzystanie planu</CardTitle>
          <CardDescription>
            Plan: <Badge>{agency.plan_type}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-secondary">Aukcje w tym miesiącu</span>
              <span className="text-sm font-medium">
                {agency.auctions_used_this_month} / {agency.max_auctions_per_month}
              </span>
            </div>
            <Progress
              value={(agency.auctions_used_this_month / agency.max_auctions_per_month) * 100}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Auctions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ostatnie aukcje</CardTitle>
            <Link href="/auctions">
              <Button variant="outline" size="sm">
                Zobacz wszystkie
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAuctions.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p className="mb-4">Nie masz jeszcze żadnych aukcji</p>
              <Link href="/auctions/new">
                <Button>Stwórz pierwszą aukcję</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAuctions.map((auction) => (
                <Link
                  key={auction.id}
                  href={`/auctions/${auction.id}`}
                  className="block p-4 rounded-lg border border-background-secondary hover:border-accent-primary transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {auction.language_pair.source} → {auction.language_pair.target}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {auction.word_count.toLocaleString()} słów
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          auction.status === "completed"
                            ? "success"
                            : auction.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {auction.status}
                      </Badge>
                      <div className="text-sm text-text-secondary mt-1">
                        {auction.current_price} PLN
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Szybkie akcje</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/auctions/new">
            <Button className="w-full" size="lg">
              ⚡ Stwórz aukcję
            </Button>
          </Link>
          <Link href="/translators">
            <Button variant="outline" className="w-full" size="lg">
              👥 Zarządzaj tłumaczami
            </Button>
          </Link>
          <Link href="/analytics">
            <Button variant="outline" className="w-full" size="lg">
              📈 Zobacz analitykę
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
