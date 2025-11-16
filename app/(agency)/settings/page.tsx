"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { STRIPE_PLANS } from "@/lib/stripe/config";

interface Agency {
  id: string;
  company_name: string;
  nip: string;
  address: string;
  subscription_status: string;
  plan_type: string;
  trial_ends_at: string;
  max_auctions_per_month: number;
  max_translators: number;
  auctions_used_this_month: number;
}

export default function SettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchAgencyData();
  }, []);

  const fetchAgencyData = async () => {
    try {
      // This would be an actual API call
      setLoading(false);
    } catch (error) {
      console.error("Error fetching agency:", error);
      setLoading(false);
    }
  };

  const handleUpgrade = async (planType: string) => {
    setUpgrading(true);
    try {
      const response = await fetch("/api/subscriptions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustawienia</h1>
        <p className="text-text-secondary">Zarządzaj profilem agencji i subskrypcją</p>
      </div>

      {/* Company Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Firmy</CardTitle>
          <CardDescription>Dane firmy widoczne dla tłumaczy podczas aukcji</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Nazwa firmy</Label>
              <Input
                id="company_name"
                defaultValue={agency?.company_name}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="nip">NIP</Label>
              <Input id="nip" defaultValue={agency?.nip} disabled />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Adres</Label>
            <Input id="address" defaultValue={agency?.address} disabled />
          </div>
          <p className="text-sm text-text-secondary">
            Aby zmienić dane firmy, skontaktuj się z nami: hello@smartcamp.ai
          </p>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card id="subscription">
        <CardHeader>
          <CardTitle>Subskrypcja</CardTitle>
          <CardDescription>
            Aktualny plan:{" "}
            <Badge variant="default">{agency?.plan_type || "trial"}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {agency?.subscription_status === "trial" && (
            <div className="bg-accent-primary/10 border border-accent-primary rounded-lg p-4">
              <p className="font-medium">Okres próbny</p>
              <p className="text-sm text-text-secondary">
                Twój trial kończy się{" "}
                {new Date(agency.trial_ends_at).toLocaleDateString("pl-PL")}
              </p>
            </div>
          )}

          {/* Usage */}
          <div className="bg-background-secondary p-4 rounded-lg">
            <h3 className="font-medium mb-3">Wykorzystanie w tym miesiącu</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aukcje:</span>
                <span>
                  {agency?.auctions_used_this_month} / {agency?.max_auctions_per_month}
                </span>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(STRIPE_PLANS).map(([key, plan]) => (
              <div
                key={key}
                className="border border-background-secondary rounded-lg p-4 space-y-3"
              >
                <h3 className="font-bold">{plan.name}</h3>
                <div className="text-2xl font-bold">
                  {plan.price} PLN
                  {plan.interval && <span className="text-sm font-normal">/{plan.interval}</span>}
                </div>
                <ul className="text-sm space-y-1 text-text-secondary">
                  <li>
                    {plan.maxAuctions === -1 ? "∞" : plan.maxAuctions} aukcji
                  </li>
                  <li>
                    {plan.maxTranslators === -1 ? "∞" : plan.maxTranslators} tłumaczy
                  </li>
                </ul>
                <Button
                  onClick={() => handleUpgrade(key)}
                  disabled={upgrading || agency?.plan_type === key}
                  className="w-full"
                  size="sm"
                >
                  {agency?.plan_type === key ? "Aktualny" : "Wybierz"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Zarządzanie Kontem</CardTitle>
          <CardDescription>Akcje związane z kontem</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline">Zmień hasło</Button>
          <Button variant="destructive">Usuń konto</Button>
          <p className="text-sm text-text-secondary">
            Usunięcie konta jest nieodwracalne i spowoduje utratę wszystkich danych.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
