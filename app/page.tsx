import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background-primary">
      {/* Header */}
      <header className="border-b border-background-secondary">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold font-mono text-accent-primary">
                BidTranslate
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                Zaloguj się
              </Link>
              <Link
                href="/register"
                className="bg-accent-primary text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Rozpocznij trial
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Reverse Auction Platform dla{" "}
            <span className="text-accent-primary">Biur Tłumaczeń</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Zmniejsz czas pozyskiwania tłumaczy z 2+ godzin do mniej niż 15 minut.
            Oszczędzaj 10-15% kosztów dzięki przejrzystym aukcjom.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link
              href="/register"
              className="bg-accent-primary text-white px-8 py-3 rounded-md text-lg hover:bg-blue-600 transition-colors"
            >
              14 dni za darmo
            </Link>
            <a
              href="#how-it-works"
              className="border border-text-secondary text-text-secondary px-8 py-3 rounded-md text-lg hover:border-text-primary hover:text-text-primary transition-colors"
            >
              Jak to działa
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-background-secondary p-8 rounded-lg">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-3">Szybkie aukcje</h3>
            <p className="text-text-secondary">
              Aukcje trwają średnio 5-10 minut. Każda runda to tylko 60 sekund na decyzję.
            </p>
          </div>
          <div className="bg-background-secondary p-8 rounded-lg">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-3">Niższe koszty</h3>
            <p className="text-text-secondary">
              Średnia oszczędność 10-15% dzięki konkurencyjnym aukcjom.
            </p>
          </div>
          <div className="bg-background-secondary p-8 rounded-lg">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-3">Precyzyjne dopasowanie</h3>
            <p className="text-text-secondary">
              Wybieraj tłumaczy według pary językowej, specjalizacji i statusu przysięgłego.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Jak to działa</h2>
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-xl font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Stwórz aukcję</h3>
                <p className="text-text-secondary">
                  Określ parę językową, specjalizację, liczbę słów, termin i cenę początkową.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-xl font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Wybierz tłumaczy (3-10)</h3>
                <p className="text-text-secondary">
                  System automatycznie filtruje bazę według kryteriów. Zaproś wybranych tłumaczy.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-xl font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Aukcja rozpoczyna się</h3>
                <p className="text-text-secondary">
                  Cena spada o 5% co rundę. Tłumacze akceptują lub rezygnują w 60 sekund.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center text-xl font-bold">
                4
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Zatwierdź zwycięzcę</h3>
                <p className="text-text-secondary">
                  Ostatni pozostały uczestnik wygrywa. Zatwierdź i otrzymaj dane kontaktowe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Wybierz swój plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-background-secondary p-8 rounded-lg border border-transparent hover:border-accent-primary transition-colors">
            <h3 className="text-2xl font-bold mb-4">Starter</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">100</span>
              <span className="text-text-secondary"> PLN/miesiąc</span>
            </div>
            <ul className="space-y-3 mb-8 text-text-secondary">
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                25 aukcji/miesiąc
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                100 tłumaczy w bazie
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                14 dni trial
              </li>
            </ul>
          </div>
          <div className="bg-background-secondary p-8 rounded-lg border-2 border-accent-primary">
            <div className="bg-accent-primary text-white text-sm px-3 py-1 rounded-full inline-block mb-4">
              Najpopularniejszy
            </div>
            <h3 className="text-2xl font-bold mb-4">Professional</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">250</span>
              <span className="text-text-secondary"> PLN/miesiąc</span>
            </div>
            <ul className="space-y-3 mb-8 text-text-secondary">
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                100 aukcji/miesiąc
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                1,000 tłumaczy w bazie
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                14 dni trial
              </li>
            </ul>
          </div>
          <div className="bg-background-secondary p-8 rounded-lg border border-transparent hover:border-accent-primary transition-colors">
            <h3 className="text-2xl font-bold mb-4">Unlimited</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">1,000</span>
              <span className="text-text-secondary"> PLN/miesiąc</span>
            </div>
            <ul className="space-y-3 mb-8 text-text-secondary">
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                Nielimitowane aukcje
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                Nielimitowani tłumacze
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                14 dni trial
              </li>
            </ul>
          </div>
          <div className="bg-background-secondary p-8 rounded-lg border border-transparent hover:border-accent-primary transition-colors">
            <h3 className="text-2xl font-bold mb-4">Lifetime</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">10,000</span>
              <span className="text-text-secondary"> PLN jednorazowo</span>
            </div>
            <ul className="space-y-3 mb-8 text-text-secondary">
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                Nielimitowane aukcje
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                Nielimitowani tłumacze
              </li>
              <li className="flex items-start">
                <span className="text-accent-success mr-2">✓</span>
                Dożywotni dostęp
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-background-secondary mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-text-secondary">
            <p>
              © Created with ❤️ by{" "}
              <a
                href="https://smartcamp.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                SmartCamp.AI
              </a>
              {" | "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              {" | "}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              {" | "}
              <a href="mailto:hello@smartcamp.ai" className="hover:underline">
                Contact
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
