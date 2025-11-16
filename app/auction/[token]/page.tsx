"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { createClient } from "@/lib/supabase/client";

interface AuctionData {
  id: string;
  languagePair: { source: string; target: string };
  wordCount: number;
  startingPrice: number;
  currentPrice: number;
  currentRound: number;
  deadline: string;
  description: string;
  status: string;
  roundStartedAt?: Date;
}

export default function TranslatorAuctionPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [auction, setAuction] = useState<AuctionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState(false);
  const [winner, setWinner] = useState(false);

  useEffect(() => {
    loadAuctionData();
    setupRealtimeSubscription();
  }, [token]);

  const loadAuctionData = async () => {
    try {
      // In a real implementation, we'd validate the token and load auction data
      // For now, this is a placeholder
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const supabase = createClient();

    // Subscribe to auction updates
    const channel = supabase
      .channel(`auction-updates`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "auctions",
        },
        (payload) => {
          // Update local state when auction changes
          console.log("Auction updated:", payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const response = await fetch(`/api/auctions/${auction?.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setConfirmed(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const handleBid = async (decision: "accept" | "decline") => {
    setBidding(true);
    try {
      const response = await fetch(`/api/auctions/${auction?.id}/bid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      if (decision === "decline") {
        setEliminated(true);
      }

      if (data.winner) {
        setWinner(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBidding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-text-secondary">Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-accent-error">Błąd</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Winner screen
  if (winner) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="text-6xl mb-4">🎉</div>
            <CardTitle className="text-2xl">Gratulacje!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">Wygrałeś aukcję!</p>
            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="text-3xl font-bold text-accent-success">
                {auction?.currentPrice} PLN
              </div>
              <div className="text-sm text-text-secondary mt-1">Finalna cena</div>
            </div>
            <p className="text-sm text-text-secondary">
              Agencja skontaktuje się z Tobą wkrótce z dalszymi szczegółami projektu.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Eliminated screen
  if (eliminated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Dziękujemy za udział</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              Zostałeś wyeliminowany z aukcji. Dziękujemy za udział i zapraszamy do kolejnych!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Confirmation screen
  if (!confirmed) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Zaproszenie do aukcji</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-background-secondary p-6 rounded-lg space-y-4">
              <div className="flex justify-between">
                <span className="text-text-secondary">Para językowa:</span>
                <span className="font-medium">
                  {auction?.languagePair.source} → {auction?.languagePair.target}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Liczba słów:</span>
                <span className="font-medium">{auction?.wordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Termin:</span>
                <span className="font-medium">
                  {auction?.deadline ? new Date(auction.deadline).toLocaleDateString("pl-PL") : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Cena początkowa:</span>
                <span className="font-medium text-accent-primary">
                  {auction?.startingPrice} PLN
                </span>
              </div>
            </div>

            {auction?.description && (
              <div>
                <h3 className="font-medium mb-2">Opis projektu:</h3>
                <p className="text-text-secondary text-sm">{auction.description}</p>
              </div>
            )}

            <div className="bg-accent-primary/10 border border-accent-primary rounded-lg p-4">
              <p className="text-sm">
                ⚡ Aukcja rozpocznie się, gdy minimum 3 tłumaczy potwierdzi udział.
                Każda runda trwa 60 sekund, a cena spada o 5% co rundę.
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full"
              size="lg"
            >
              {confirming ? "Potwierdzanie..." : "Potwierdzam udział"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Waiting for auction to start
  if (auction?.status === "pending_start") {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>Oczekiwanie na start aukcji</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse text-4xl mb-4">⏳</div>
            <p className="text-text-secondary">
              Czekamy aż wystarczająca liczba tłumaczy potwierdzi udział.
              Aukcja rozpocznie się automatycznie.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active auction - bidding screen
  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aukcja w toku</CardTitle>
            <Badge>Runda {auction?.currentRound}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current price */}
          <div className="text-center">
            <div className="text-sm text-text-secondary mb-2">Aktualna cena</div>
            <div className="text-5xl font-bold text-accent-primary animate-pulse-price">
              {auction?.currentPrice} PLN
            </div>
          </div>

          {/* Countdown timer */}
          {auction?.roundStartedAt && (
            <CountdownTimer
              roundStartedAt={auction.roundStartedAt}
              onTimeout={() => handleBid("decline")}
            />
          )}

          {/* Decision buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => handleBid("decline")}
              disabled={bidding}
              className="h-20 text-lg"
            >
              ❌ Rezygnuję
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={() => handleBid("accept")}
              disabled={bidding}
              className="h-20 text-lg"
            >
              ✅ Akceptuję
            </Button>
          </div>

          {/* Project details */}
          <div className="bg-background-secondary p-4 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Para językowa:</span>
              <span>{auction?.languagePair.source} → {auction?.languagePair.target}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Liczba słów:</span>
              <span>{auction?.wordCount.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
