import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentAgency } from "@/lib/supabase/auth";

/**
 * GET /api/analytics
 * Get analytics data for the current agency
 */
export async function GET(request: NextRequest) {
  try {
    const agency = await getCurrentAgency();

    if (!agency) {
      return NextResponse.json({ error: "Nie znaleziono agencji" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get("range") || "30d";

    // Calculate date range
    let startDate = new Date();
    switch (range) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "all":
        startDate = new Date(0); // Beginning of time
        break;
    }

    const supabase = await createServerSupabaseClient();

    // Get all auctions in range
    const { data: auctions } = await supabase
      .from("bid_translate_auctions")
      .select("*")
      .eq("agency_id", agency.id)
      .gte("created_at", startDate.toISOString());

    if (!auctions) {
      return NextResponse.json({
        totalAuctions: 0,
        completedAuctions: 0,
        failedAuctions: 0,
        averageSavings: 0,
        totalSavings: 0,
        successRate: 0,
        averageParticipants: 0,
        averageRounds: 0,
        translatorParticipation: [],
      });
    }

    // Calculate metrics
    const completed = auctions.filter((a) => a.status === "completed");
    const failed = auctions.filter((a) => a.status === "failed");

    const totalSavings = completed.reduce((sum, a) => {
      if (a.final_price) {
        return sum + (a.starting_price - a.final_price);
      }
      return sum;
    }, 0);

    const averageSavings =
      completed.length > 0
        ? completed.reduce((sum, a) => {
            if (a.final_price) {
              return sum + ((a.starting_price - a.final_price) / a.starting_price) * 100;
            }
            return sum;
          }, 0) / completed.length
        : 0;

    const successRate =
      auctions.length > 0 ? (completed.length / auctions.length) * 100 : 0;

    const averageRounds =
      completed.length > 0
        ? completed.reduce((sum, a) => sum + a.current_round, 0) / completed.length
        : 0;

    const averageParticipants =
      auctions.length > 0
        ? auctions.reduce((sum, a) => sum + a.num_participants, 0) / auctions.length
        : 0;

    // Get translator participation stats
    const { data: participantStats } = await supabase
      .from("bid_translate_auction_participants")
      .select(`
        translator_id,
        is_winner,
        translators (
          email,
          first_name,
          last_name
        )
      `)
      .in(
        "auction_id",
        auctions.map((a) => a.id)
      );

    // Aggregate by translator
    const translatorMap = new Map<string, any>();

    participantStats?.forEach((p) => {
      const key = p.translator_id;
      if (!translatorMap.has(key)) {
        translatorMap.set(key, {
          email: p.translators.email,
          name: `${p.translators.first_name} ${p.translators.last_name}`,
          totalAuctions: 0,
          wins: 0,
        });
      }

      const translator = translatorMap.get(key);
      translator.totalAuctions++;
      if (p.is_winner) {
        translator.wins++;
      }
    });

    const translatorParticipation = Array.from(translatorMap.values())
      .sort((a, b) => b.totalAuctions - a.totalAuctions);

    return NextResponse.json({
      totalAuctions: auctions.length,
      completedAuctions: completed.length,
      failedAuctions: failed.length,
      averageSavings: Math.round(averageSavings * 10) / 10,
      totalSavings: Math.round(totalSavings * 100) / 100,
      successRate: Math.round(successRate),
      averageParticipants: Math.round(averageParticipants * 10) / 10,
      averageRounds: Math.round(averageRounds * 10) / 10,
      translatorParticipation,
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania analityki" },
      { status: 500 }
    );
  }
}
