"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="text-6xl mb-4">📧</div>
          <CardTitle className="text-2xl font-bold">Sprawdź swoją skrzynkę email</CardTitle>
          <CardDescription>
            Wysłaliśmy link aktywacyjny na adres:
            <div className="font-medium text-text-primary mt-2">{email}</div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-background-secondary p-4 rounded-lg text-sm text-text-secondary">
            <p className="mb-2">
              Kliknij w link w emailu, aby aktywować swoje konto i rozpocząć 14-dniowy trial.
            </p>
            <p>
              Jeśli nie widzisz emaila, sprawdź folder SPAM.
            </p>
          </div>

          <div className="text-center">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Powrót do logowania
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
