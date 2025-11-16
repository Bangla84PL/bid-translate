"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuctionRealtime } from "@/lib/hooks/useAuctionRealtime";
import { calculateAuctionStats } from "@/lib/auction/state-machine";

interface Auction {
  id: string;
  language_pair: { source: string; target: string };
  specialization: string | null;
  is_sworn: boolean;
  word_count: number;
  deadline: string;
  starting_price: number;
  current_price: number;
  description: string;
  status: string;
  current_round: number;
  num_participants: number;
  winner_id: string | null;
  final_price: number | null;
  created_at: string;
}

interface Participant {
  id: string;
  translator_id: string;
  confirmed_at: string | null;
  eliminated_at: string | null;
  eliminated_round: number | null;
  is_winner: boolean;
  translators: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function AuctionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;

  const [auction, setAuction] = useState<Auction | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time updates
  const { auction: realtimeAuction, participantsRemaining } = useAuctionRealtime(auctionId);

  useEffect(() => {
    fetchAuctionData();
  }, [auctionId]);

  // Update local state when realtime data changes
  useEffect(() => {
    if (realtimeAuction) {
      setAuction((prev) => (prev ? { ...prev, ...realtimeAuction } : prev));
    }
  }, [realtimeAuction]);

  const fetchAuctionData = async () => {
    try {
      // Fetch auction details
      const response = await fetch(`/api/auctions/${auctionId}`);
      const data = await response.json();

      if (response.ok) {
        setAuction(data.auction);
      }

      // Fetch participants
      const participantsResponse = await fetch(`/api/auctions/${auctionId}/participants`);
      const participantsData = await participantsResponse.json();

      if (participantsResponse.ok) {
        setParticipants(participantsData.participants || []);
      }
    } catch (error) {
      console.error("Error fetching auction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/start`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      alert("Aukcja rozpoczęta!");
      fetchAuctionData();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleApproveWinner = async () => {
    // TODO: Implement winner approval
    alert("Funkcja zatwierdzania zwycięzcy w przygotowaniu");
  };

  if (loading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  if (!auction) {
    return <div className="p-6">Nie znaleziono aukcji</div>;
  }

  const stats = calculateAuctionStats(auction.starting_price, auction.final_price);
  const confirmedCount = participants.filter((p) => p.confirmed_at).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Aukcja: {auction.language_pair.source} → {auction.language_pair.target}
          </h1>
          <p className="text-text-secondary">ID: {auction.id.slice(0, 8)}...</p>
        </div>
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
      </div>

      {/* Action buttons */}
      {auction.status === "pending_start" && (
        <Card className="border-accent-primary bg-accent-primary/10">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  Potwierdzeń: {confirmedCount} / {auction.num_participants}
                </p>
                <p className="text-sm text-text-secondary">
                  Minimum 3 potwierdzeń wymagane do startu
                </p>
              </div>
              <Button
                onClick={handleStartAuction}
                disabled={confirmedCount < 3}
              >
                Rozpocznij aukcję
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live auction status */}
      {auction.status === "in_progress" && (
        <Card className="border-accent-primary">
          <CardHeader>
            <CardTitle>Aukcja w toku - Runda {auction.current_round}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-primary">
                  {auction.current_price} PLN
                </div>
                <div className="text-sm text-text-secondary">Aktualna cena</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{participantsRemaining}</div>
                <div className="text-sm text-text-secondary">
                  Pozostali uczestnicy
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{auction.current_round}</div>
                <div className="text-sm text-text-secondary">Runda</div>
              </div>
            </div>

            <div className="bg-background-secondary p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">
                  Redukcja ceny od początku
                </span>
                <span className="font-medium">
                  {Math.round(
                    ((auction.starting_price - auction.current_price) /
                      auction.starting_price) *
                      100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  ((auction.starting_price - auction.current_price) /
                    auction.starting_price) *
                  100
                }
              />
            </div>

            <div className="text-center text-sm text-text-secondary">
              🔴 Aukcja trwa... Odświeżanie automatyczne
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed auction */}
      {auction.status === "completed" && (
        <Card className="border-accent-success">
          <CardHeader>
            <CardTitle>Aukcja zakończona 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-secondary p-4 rounded-lg">
                <div className="text-2xl font-bold text-accent-success">
                  {auction.final_price} PLN
                </div>
                <div className="text-sm text-text-secondary">Finalna cena</div>
              </div>
              <div className="bg-background-secondary p-4 rounded-lg">
                <div className="text-2xl font-bold text-accent-success">
                  {stats.savingsPercent}%
                </div>
                <div className="text-sm text-text-secondary">
                  Oszczędność ({stats.savingsAmount} PLN)
                </div>
              </div>
            </div>

            {auction.winner_id && (
              <div className="bg-accent-success/10 border border-accent-success rounded-lg p-4">
                <p className="font-medium">Zwycięzca wyłoniony</p>
                <p className="text-sm text-text-secondary mt-1">
                  Zatwierdź zwycięzcę, aby otrzymać dane kontaktowe
                </p>
                <Button onClick={handleApproveWinner} className="mt-3">
                  Zatwierdź zwycięzcę
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project details */}
      <Card>
        <CardHeader>
          <CardTitle>Szczegóły projektu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-text-secondary text-sm">Para językowa:</span>
              <p className="font-medium">
                {auction.language_pair.source} → {auction.language_pair.target}
              </p>
            </div>
            <div>
              <span className="text-text-secondary text-sm">Liczba słów:</span>
              <p className="font-medium">{auction.word_count.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-text-secondary text-sm">Termin:</span>
              <p className="font-medium">
                {new Date(auction.deadline).toLocaleDateString("pl-PL")}
              </p>
            </div>
            <div>
              <span className="text-text-secondary text-sm">Cena początkowa:</span>
              <p className="font-medium">{auction.starting_price} PLN</p>
            </div>
            {auction.specialization && (
              <div>
                <span className="text-text-secondary text-sm">Specjalizacja:</span>
                <p className="font-medium">{auction.specialization}</p>
              </div>
            )}
            <div>
              <span className="text-text-secondary text-sm">Tłumacz przysięgły:</span>
              <p className="font-medium">{auction.is_sworn ? "Tak" : "Nie"}</p>
            </div>
          </div>

          {auction.description && (
            <div className="pt-4 border-t border-background-secondary">
              <span className="text-text-secondary text-sm">Opis:</span>
              <p className="mt-1">{auction.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Participants */}
      <Card>
        <CardHeader>
          <CardTitle>Uczestnicy ({participants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center justify-between p-3 rounded-lg border border-background-secondary"
              >
                <div>
                  <div className="font-medium">
                    {participant.translators.first_name}{" "}
                    {participant.translators.last_name}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {participant.translators.email}
                  </div>
                </div>
                <div className="flex gap-2">
                  {participant.is_winner && (
                    <Badge variant="success">Zwycięzca</Badge>
                  )}
                  {participant.eliminated_at && (
                    <Badge variant="destructive">
                      Wyeliminowany (Runda {participant.eliminated_round})
                    </Badge>
                  )}
                  {!participant.confirmed_at && !participant.eliminated_at && (
                    <Badge variant="secondary">Oczekuje</Badge>
                  )}
                  {participant.confirmed_at && !participant.eliminated_at && (
                    <Badge variant="default">Aktywny</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
