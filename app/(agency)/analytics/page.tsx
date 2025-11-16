"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  totalAuctions: number;
  completedAuctions: number;
  failedAuctions: number;
  averageSavings: number;
  totalSavings: number;
  successRate: number;
  averageParticipants: number;
  averageRounds: number;
  translatorParticipation: {
    email: string;
    name: string;
    totalAuctions: number;
    wins: number;
  }[];
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Ładowanie analityki...</div>;
  }

  if (!analytics) {
    return <div className="p-6">Brak danych do wyświetlenia</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analityka</h1>
          <p className="text-text-secondary">Przegląd wydajności i statystyk</p>
        </div>
        <div className="flex gap-2">
          {(["7d", "30d", "90d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md transition-colors ${
                timeRange === range
                  ? "bg-accent-primary text-white"
                  : "bg-background-secondary text-text-secondary hover:text-text-primary"
              }`}
            >
              {range === "7d" && "7 dni"}
              {range === "30d" && "30 dni"}
              {range === "90d" && "90 dni"}
              {range === "all" && "Wszystko"}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Wszystkie aukcje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.totalAuctions}</div>
            <div className="text-sm text-text-secondary mt-1">
              <span className="text-accent-success">{analytics.completedAuctions}</span> zakończone,{" "}
              <span className="text-accent-error">{analytics.failedAuctions}</span> nieudane
            </div>
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
              {analytics.averageSavings.toFixed(1)}%
            </div>
            <div className="text-sm text-text-secondary mt-1">
              {analytics.totalSavings.toFixed(0)} PLN łącznie
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Wskaźnik sukcesu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.successRate}%</div>
            <div className="text-sm text-text-secondary mt-1">
              Aukcje zakończone sukcesem
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-text-secondary">
              Średnia liczba rund
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{analytics.averageRounds.toFixed(1)}</div>
            <div className="text-sm text-text-secondary mt-1">
              ~{Math.round(analytics.averageRounds)} minut na aukcję
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top translators */}
      <Card>
        <CardHeader>
          <CardTitle>Najaktywniejszi tłumacze</CardTitle>
          <CardDescription>
            Tłumacze z największą liczbą uczestnictw w aukcjach
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.translatorParticipation.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              Brak danych o tłumaczach
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.translatorParticipation.slice(0, 10).map((translator, idx) => (
                <div
                  key={translator.email}
                  className="flex items-center justify-between p-3 rounded-lg border border-background-secondary"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-text-secondary">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-medium">{translator.name}</div>
                      <div className="text-sm text-text-secondary">
                        {translator.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{translator.totalAuctions}</div>
                      <div className="text-xs text-text-secondary">Aukcje</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-accent-success">
                        {translator.wins}
                      </div>
                      <div className="text-xs text-text-secondary">Wygrane</div>
                    </div>
                    <div>
                      <Badge variant="outline">
                        {translator.totalAuctions > 0
                          ? Math.round((translator.wins / translator.totalAuctions) * 100)
                          : 0}
                        % sukcesu
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Savings breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Miesięczne oszczędności</CardTitle>
            <CardDescription>Łączne oszczędności z aukcji</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent-success">
              {analytics.totalSavings.toFixed(0)} PLN
            </div>
            <div className="text-sm text-text-secondary mt-2">
              W porównaniu do cen początkowych
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Średnia liczba uczestników</CardTitle>
            <CardDescription>Średnia na aukcję</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {analytics.averageParticipants.toFixed(1)}
            </div>
            <div className="text-sm text-text-secondary mt-2">
              Tłumaczy na aukcję
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
