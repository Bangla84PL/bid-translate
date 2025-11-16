"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseTranslatorCSV, generateTranslatorCSVTemplate } from "@/lib/utils/csv";

interface Translator {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  language_pairs: { source: string; target: string }[];
  specializations: string[];
  is_sworn: boolean;
}

export default function TranslatorsPage() {
  const router = useRouter();
  const [translators, setTranslators] = useState<Translator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchTranslators();
  }, []);

  const fetchTranslators = async () => {
    try {
      const response = await fetch("/api/translators");
      const data = await response.json();
      setTranslators(data.translators || []);
    } catch (error) {
      console.error("Error fetching translators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const parsedData = await parseTranslatorCSV(file);

      const response = await fetch("/api/translators/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translators: parsedData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error);
      }

      alert(`Pomyślnie zaimportowano ${result.imported} tłumaczy`);
      fetchTranslators();
    } catch (error: any) {
      alert(error.message || "Błąd podczas importu");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const template = generateTranslatorCSVTemplate();
    const blob = new Blob([template], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translators_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć tego tłumacza?")) return;

    try {
      const response = await fetch(`/api/translators/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Błąd podczas usuwania");
      }

      fetchTranslators();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredTranslators = translators.filter((t) => {
    const query = searchQuery.toLowerCase();
    return (
      t.first_name.toLowerCase().includes(query) ||
      t.last_name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <div className="p-6">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Baza tłumaczy</h1>
          <p className="text-text-secondary">
            Zarządzaj swoją bazą tłumaczy ({translators.length} łącznie)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            📥 Pobierz szablon CSV
          </Button>
          <label htmlFor="csv-import">
            <Button variant="outline" disabled={importing} asChild>
              <span>{importing ? "Importowanie..." : "📤 Importuj CSV"}</span>
            </Button>
          </label>
          <input
            id="csv-import"
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />
          <Button onClick={() => router.push("/translators/new")}>
            + Dodaj tłumacza
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Szukaj po imieniu, nazwisku lub emailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </CardHeader>
        <CardContent>
          {filteredTranslators.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              <p className="mb-4">
                {searchQuery
                  ? "Nie znaleziono tłumaczy"
                  : "Nie masz jeszcze żadnych tłumaczy w bazie"}
              </p>
              {!searchQuery && (
                <Button onClick={() => router.push("/translators/new")}>
                  Dodaj pierwszego tłumacza
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTranslators.map((translator) => (
                <div
                  key={translator.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-background-secondary hover:border-accent-primary transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">
                        {translator.first_name} {translator.last_name}
                      </div>
                      {translator.is_sworn && (
                        <Badge variant="success">Przysięgły</Badge>
                      )}
                    </div>
                    <div className="text-sm text-text-secondary mt-1">
                      {translator.email}
                      {translator.phone && ` • ${translator.phone}`}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {translator.language_pairs.slice(0, 3).map((pair, idx) => (
                        <Badge key={idx} variant="outline">
                          {pair.source} → {pair.target}
                        </Badge>
                      ))}
                      {translator.language_pairs.length > 3 && (
                        <Badge variant="outline">
                          +{translator.language_pairs.length - 3} więcej
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/translators/${translator.id}`)}
                    >
                      Edytuj
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(translator.id)}
                    >
                      Usuń
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
