"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Auction {
  id: string;
  language_pair: { source: string; target: string };
  word_count: number;
  status: string;
  starting_price: number;
  current_price: number;
  created_at: string;
  deadline: string;
}

export default function AuctionsPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const response = await fetch("/api/auctions");
      const data = await response.json();
      setAuctions(data.auctions || []);
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: "secondary",
      pending_start: "default",
      in_progress: "default",
      completed: "success",
      failed: "destructive",
      cancelled: "secondary",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aukcje</h1>
          <p className="text-text-secondary">
            Zarządzaj swoimi aukcjami ({auctions.length} łącznie)
          </p>
        </div>
        <Link href="/auctions/new">
          <Button>⚡ Stwórz nową aukcję</Button>
        </Link>
      </div>

      {auctions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-text-secondary mb-4">
              Nie masz jeszcze żadnych aukcji
            </p>
            <Link href="/auctions/new">
              <Button>Stwórz pierwszą aukcję</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <Link key={auction.id} href={`/auctions/${auction.id}`}>
              <Card className="hover:border-accent-primary transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {auction.language_pair.source} → {auction.language_pair.target}
                    </CardTitle>
                    {getStatusBadge(auction.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Liczba słów:</span>
                    <span className="font-medium">
                      {auction.word_count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Cena początkowa:</span>
                    <span className="font-medium">{auction.starting_price} PLN</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Obecna cena:</span>
                    <span className="font-medium text-accent-primary">
                      {auction.current_price} PLN
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Termin:</span>
                    <span className="font-medium">
                      {new Date(auction.deadline).toLocaleDateString("pl-PL")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
