import Link from "next/link";
import { Footer } from "@/components/layout/footer";

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold mb-6">Regulamin Usługi</h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <p className="text-text-secondary">
            <strong>Data wejścia w życie:</strong> 15 stycznia 2025
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">1. Postanowienia Ogólne</h2>
            <p className="text-text-secondary">
              1.1. Niniejszy Regulamin określa zasady korzystania z platformy BidTranslate
              dostępnej pod adresem app.bidtranslate.com
            </p>
            <p className="text-text-secondary">
              1.2. Usługodawcą jest SmartCamp.AI
            </p>
            <p className="text-text-secondary">
              1.3. Korzystanie z Platformy oznacza akceptację niniejszego Regulaminu
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">2. Definicje</h2>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li><strong>Platforma</strong> - system BidTranslate służący do organizowania aukcji reverse dla biur tłumaczeń</li>
              <li><strong>Agencja</strong> - biuro tłumaczeń korzystające z Platformy</li>
              <li><strong>Tłumacz</strong> - freelancer uczestniczący w aukcjach</li>
              <li><strong>Aukcja</strong> - proces reverse auction dla projektów tłumaczeniowych</li>
              <li><strong>Konto</strong> - zarejestrowane konto Agencji w systemie</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">3. Rejestracja i Konto</h2>
            <p className="text-text-secondary">
              3.1. Korzystanie z Platformy wymaga utworzenia Konta
            </p>
            <p className="text-text-secondary">
              3.2. Warunki rejestracji:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Pełna zdolność do czynności prawnych</li>
              <li>Prowadzenie działalności gospodarczej w zakresie tłumaczeń</li>
              <li>Podanie prawdziwych danych rejestracyjnych</li>
            </ul>
            <p className="text-text-secondary">
              3.3. Agencja odpowiada za bezpieczeństwo swojego hasła dostępu
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">4. Zasady Korzystania z Usługi</h2>
            <p className="text-text-secondary">
              4.1. Agencja ma prawo do:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Tworzenia aukcji zgodnie z limitem wybranego planu</li>
              <li>Zarządzania bazą tłumaczy</li>
              <li>Dostępu do statystyk i analityk</li>
            </ul>
            <p className="text-text-secondary">
              4.2. Agencja zobowiązuje się do:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Podawania prawdziwych informacji o projektach</li>
              <li>Szanowania czasu tłumaczy</li>
              <li>Zapłaty za wybrany plan subskrypcji</li>
              <li>Nienadużywania systemu</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">5. Zasady Aukcji</h2>
            <p className="text-text-secondary">
              5.1. Aukcja reverse polega na stopniowej redukcji ceny o 5% co rundę
            </p>
            <p className="text-text-secondary">
              5.2. Każda runda trwa 60 sekund
            </p>
            <p className="text-text-secondary">
              5.3. Minimalna liczba uczestników: 3
            </p>
            <p className="text-text-secondary">
              5.4. Maksymalna liczba uczestników: 10
            </p>
            <p className="text-text-secondary">
              5.5. Agencja ma prawo zatwierdzić lub odrzucić zwycięzcę aukcji
            </p>
            <p className="text-text-secondary">
              5.6. Platforma nie odpowiada za jakość wykonanych tłumaczeń
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">6. Plany Subskrypcji i Płatności</h2>
            <p className="text-text-secondary">
              6.1. Dostępne plany:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Starter - 100 PLN/miesiąc (25 aukcji, 100 tłumaczy)</li>
              <li>Professional - 250 PLN/miesiąc (100 aukcji, 1000 tłumaczy)</li>
              <li>Unlimited - 1000 PLN/miesiąc (nielimitowane)</li>
              <li>Lifetime - 10,000 PLN jednorazowo (nielimitowane, dożywotni dostęp)</li>
            </ul>
            <p className="text-text-secondary">
              6.2. Okres próbny: 14 dni za darmo
            </p>
            <p className="text-text-secondary">
              6.3. Płatności procesowane przez Stripe
            </p>
            <p className="text-text-secondary">
              6.4. Ceny zawierają podatek VAT
            </p>
            <p className="text-text-secondary">
              6.5. Brak zwrotów za niewykorzystane aukcje
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">7. Anulowanie Subskrypcji</h2>
            <p className="text-text-secondary">
              7.1. Subskrypcję można anulować w dowolnym momencie
            </p>
            <p className="text-text-secondary">
              7.2. Dostęp trwa do końca okresu rozliczeniowego
            </p>
            <p className="text-text-secondary">
              7.3. Aktywne aukcje mogą być dokończone po wygaśnięciu subskrypcji
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">8. Ochrona Danych Osobowych</h2>
            <p className="text-text-secondary">
              8.1. Ochrona danych regulowana jest przez <Link href="/privacy" className="text-accent-primary hover:underline">Politykę Prywatności</Link>
            </p>
            <p className="text-text-secondary">
              8.2. Agencja jest administratorem danych tłumaczy w swojej bazie
            </p>
            <p className="text-text-secondary">
              8.3. Platforma zapewnia narzędzia zgodności z RODO
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">9. Odpowiedzialność</h2>
            <p className="text-text-secondary">
              9.1. Platforma nie ponosi odpowiedzialności za:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Jakość wykonanych tłumaczeń</li>
              <li>Spory między Agencją a Tłumaczem</li>
              <li>Niedotrzymanie terminów przez Tłumacza</li>
              <li>Straty finansowe wynikłe z nieudanych aukcji</li>
            </ul>
            <p className="text-text-secondary">
              9.2. Odpowiedzialność Platformy ograniczona jest do wysokości opłaty subskrypcyjnej
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">10. Zakaz Nadużyć</h2>
            <p className="text-text-secondary">
              10.1. Zabronione jest:
            </p>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              <li>Tworzenie fałszywych aukcji</li>
              <li>Manipulowanie systemem</li>
              <li>Naruszanie praw innych użytkowników</li>
              <li>Automatyzacja działań bez zgody</li>
              <li>Reverse engineering Platformy</li>
            </ul>
            <p className="text-text-secondary">
              10.2. Naruszenie może skutkować zawieszeniem lub usunięciem Konta
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">11. Zmiany Regulaminu</h2>
            <p className="text-text-secondary">
              11.1. Zastrzegamy sobie prawo do zmian Regulaminu
            </p>
            <p className="text-text-secondary">
              11.2. O zmianach użytkownicy zostaną powiadomieni 7 dni wcześniej
            </p>
            <p className="text-text-secondary">
              11.3. Kontynuacja korzystania z Platformy oznacza akceptację zmian
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">12. Prawo Właściwe</h2>
            <p className="text-text-secondary">
              12.1. Regulamin podlega prawu polskiemu
            </p>
            <p className="text-text-secondary">
              12.2. Spory rozstrzygane będą przez polskie sądy właściwe dla siedziby Usługodawcy
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold mt-8">13. Kontakt</h2>
            <ul className="list-none text-text-secondary space-y-2">
              <li>Email: hello@smartcamp.ai</li>
              <li>Strona: https://smartcamp.ai</li>
            </ul>
          </section>

          <div className="bg-accent-primary/10 border border-accent-primary rounded-lg p-6 mt-8">
            <p className="text-sm">
              <strong className="text-accent-primary">Uwaga prawna:</strong> Powyższy regulamin
              jest szablonem i wymaga dostosowania do konkretnych wymagań prawnych oraz konsultacji
              z prawnikiem przed wdrożeniem produkcyjnym.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
