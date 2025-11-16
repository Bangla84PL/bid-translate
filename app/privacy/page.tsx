import Link from "next/link";
import { Footer } from "@/components/layout/footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background-primary flex flex-col">
      <header className="border-b border-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold font-mono text-accent-primary">
            BidTranslate
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-6">Polityka Prywatności</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-text-secondary">
            <strong>Data ostatniej aktualizacji:</strong> 15 stycznia 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">1. Wprowadzenie</h2>
            <p className="text-text-secondary">
              BidTranslate ("my", "nas", "nasz") szanuje prywatność użytkowników i zobowiązuje się
              do ochrony danych osobowych. Niniejsza Polityka Prywatności wyjaśnia, jakie dane
              zbieramy, w jaki sposób je wykorzystujemy i jakie prawa przysługują użytkownikom.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">2. Administrator Danych</h2>
            <p className="text-text-secondary">
              Administratorem danych osobowych jest SmartCamp.AI
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Email: hello@smartcamp.ai</li>
              <li>Strona: https://smartcamp.ai</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">3. Dane Zbierane</h2>
            <h3 className="text-xl font-semibold mt-4">3.1 Dane Agencji Tłumaczeniowych</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Adres email</li>
              <li>Nazwa firmy</li>
              <li>NIP</li>
              <li>Adres siedziby</li>
              <li>Logo firmy (opcjonalnie)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">3.2 Dane Tłumaczy</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Adres email</li>
              <li>Imię i nazwisko</li>
              <li>Numer telefonu (opcjonalnie)</li>
              <li>Pary językowe</li>
              <li>Specjalizacje</li>
              <li>Status tłumacza przysięgłego</li>
            </ul>

            <h3 className="text-xl font-semibold mt-4">3.3 Dane Techniczne</h3>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Adres IP</li>
              <li>Typ przeglądarki</li>
              <li>Dane o urządzeniu</li>
              <li>Logi aktywności</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">4. Cel Przetwarzania Danych</h2>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Świadczenie usług platformy aukcyjnej</li>
              <li>Zarządzanie kontami użytkowników</li>
              <li>Przetwarzanie płatności</li>
              <li>Komunikacja z użytkownikami</li>
              <li>Wysyłka powiadomień o aukcjach</li>
              <li>Analiza i ulepszanie usług</li>
              <li>Zapewnienie bezpieczeństwa platformy</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">5. Podstawa Prawna Przetwarzania</h2>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Zgoda użytkownika (Art. 6 ust. 1 lit. a RODO)</li>
              <li>Wykonanie umowy (Art. 6 ust. 1 lit. b RODO)</li>
              <li>Obowiązek prawny (Art. 6 ust. 1 lit. c RODO)</li>
              <li>Prawnie uzasadniony interes (Art. 6 ust. 1 lit. f RODO)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">6. Udostępnianie Danych</h2>
            <p className="text-text-secondary">
              Dane mogą być udostępniane następującym kategoriom odbiorców:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Dostawcy usług płatniczych (Stripe)</li>
              <li>Dostawcy usług hostingowych</li>
              <li>Dostawcy usług email (dla powiadomień)</li>
              <li>Organy państwowe (w ramach obowiązków prawnych)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">7. Prawa Użytkowników (RODO)</h2>
            <p className="text-text-secondary">Użytkownikom przysługują następujące prawa:</p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong>Prawo dostępu</strong> - do swoich danych osobowych</li>
              <li><strong>Prawo do sprostowania</strong> - nieprawidłowych danych</li>
              <li><strong>Prawo do usunięcia</strong> - "prawo do bycia zapomnianym"</li>
              <li><strong>Prawo do ograniczenia przetwarzania</strong></li>
              <li><strong>Prawo do przenoszenia danych</strong></li>
              <li><strong>Prawo do sprzeciwu</strong> wobec przetwarzania</li>
              <li><strong>Prawo do cofnięcia zgody</strong></li>
            </ul>
            <p className="text-text-secondary mt-4">
              Aby skorzystać z powyższych praw, prosimy o kontakt: hello@smartcamp.ai
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">8. Okres Przechowywania Danych</h2>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Dane konta - do czasu usunięcia konta</li>
              <li>Dane aukcji - 5 lat (wymogi archiwizacyjne)</li>
              <li>Dane płatności - zgodnie z przepisami prawa podatkowego</li>
              <li>Logi techniczne - 90 dni</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">9. Bezpieczeństwo Danych</h2>
            <p className="text-text-secondary">
              Stosujemy odpowiednie środki techniczne i organizacyjne:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Szyfrowanie SSL/TLS</li>
              <li>Bezpieczne przechowywanie haseł (bcrypt)</li>
              <li>Regularne kopie zapasowe</li>
              <li>Kontrola dostępu do danych</li>
              <li>Monitoring bezpieczeństwa</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">10. Pliki Cookie</h2>
            <p className="text-text-secondary">
              Używamy plików cookie do:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Utrzymywania sesji użytkownika</li>
              <li>Zapamiętywania preferencji</li>
              <li>Analizy ruchu na stronie</li>
            </ul>
            <p className="text-text-secondary mt-4">
              Użytkownik może zarządzać cookies w ustawieniach przeglądarki.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">11. Zmiany w Polityce</h2>
            <p className="text-text-secondary">
              Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce Prywatności.
              O istotnych zmianach użytkownicy zostaną powiadomieni przez email.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">12. Kontakt</h2>
            <p className="text-text-secondary">
              W sprawach dotyczących ochrony danych osobowych prosimy o kontakt:
            </p>
            <ul className="list-none text-text-secondary space-y-2">
              <li>Email: hello@smartcamp.ai</li>
              <li>Strona: https://smartcamp.ai</li>
            </ul>
          </section>

          <div className="bg-accent-primary/10 border border-accent-primary rounded-lg p-6 mt-8">
            <p className="text-sm">
              <strong className="text-accent-primary">Uwaga prawna:</strong> Powyższa polityka
              prywatności jest szablonem i wymaga dostosowania do konkretnych wymagań prawnych
              oraz konsultacji z prawnikiem przed wdrożeniem produkcyjnym.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
