"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Błąd podczas rejestracji");
      }

      // Redirect to verification page
      router.push("/verify-email?email=" + encodeURIComponent(data.email));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            <Link href="/" className="text-accent-primary hover:underline">
              BidTranslate
            </Link>
          </CardTitle>
          <CardDescription className="text-center">
            Zarejestruj swoje biuro tłumaczeń i rozpocznij 14-dniowy trial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-accent-error/10 border border-accent-error text-accent-error px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="kontakt@biuro.pl"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-accent-error">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-accent-error">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-accent-error">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Nazwa firmy</Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Biuro Tłumaczeń ABC"
                {...register("companyName")}
                disabled={isLoading}
              />
              {errors.companyName && (
                <p className="text-sm text-accent-error">{errors.companyName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nip">NIP</Label>
                <Input
                  id="nip"
                  type="text"
                  placeholder="1234567890"
                  {...register("nip")}
                  disabled={isLoading}
                />
                {errors.nip && (
                  <p className="text-sm text-accent-error">{errors.nip.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adres</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Warszawa, Polska"
                  {...register("address")}
                  disabled={isLoading}
                />
                {errors.address && (
                  <p className="text-sm text-accent-error">{errors.address.message}</p>
                )}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Rejestracja..." : "Zarejestruj się"}
            </Button>

            <div className="text-center text-sm text-text-secondary">
              Masz już konto?{" "}
              <Link href="/login" className="text-accent-primary hover:underline">
                Zaloguj się
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
