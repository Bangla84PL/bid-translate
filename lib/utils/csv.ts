import Papa from "papaparse";
import { TranslatorImportRow } from "@/types";

/**
 * Parse CSV file containing translator data
 * @param file - CSV file to parse
 * @returns Promise with array of translator rows
 */
export async function parseTranslatorCSV(file: File): Promise<TranslatorImportRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const translators: TranslatorImportRow[] = results.data.map((row: any) => ({
            email: row.email || row.Email || "",
            firstName: row.firstName || row.first_name || row["First Name"] || "",
            lastName: row.lastName || row.last_name || row["Last Name"] || "",
            phone: row.phone || row.Phone || "",
            languagePairs: row.languagePairs || row.language_pairs || row["Language Pairs"] || "",
            specializations: row.specializations || row.Specializations || "",
            isSworn: row.isSworn === "true" || row.is_sworn === "true" || row.IsSworn === "true" || false,
          }));

          resolve(translators);
        } catch (error) {
          reject(new Error("Błąd parsowania pliku CSV"));
        }
      },
      error: (error) => {
        reject(new Error(`Błąd odczytu pliku: ${error.message}`));
      },
    });
  });
}

/**
 * Parse language pairs from CSV string
 * @param pairsString - Comma-separated language pairs (e.g., "EN-PL,PL-EN")
 * @returns Array of language pair objects
 */
export function parseLanguagePairs(pairsString: string): { source: string; target: string }[] {
  if (!pairsString) return [];

  return pairsString.split(",").map((pair) => {
    const [source, target] = pair.trim().split("-");
    return { source: source.trim(), target: target.trim() };
  });
}

/**
 * Parse specializations from CSV string
 * @param specializationsString - Comma-separated specializations
 * @returns Array of specialization strings
 */
export function parseSpecializations(specializationsString: string): string[] {
  if (!specializationsString) return [];
  return specializationsString.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Generate CSV template for translator import
 * @returns CSV string
 */
export function generateTranslatorCSVTemplate(): string {
  const headers = [
    "email",
    "firstName",
    "lastName",
    "phone",
    "languagePairs",
    "specializations",
    "isSworn",
  ];

  const exampleRow = [
    "jan.kowalski@example.com",
    "Jan",
    "Kowalski",
    "+48123456789",
    "EN-PL,PL-EN",
    "medical,legal",
    "true",
  ];

  return `${headers.join(",")}\n${exampleRow.join(",")}`;
}
