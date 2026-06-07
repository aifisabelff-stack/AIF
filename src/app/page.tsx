import { MapPin, Phone, Instagram } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PanelAccessLinkWrapper } from "@/components/panel/panel-access-link-wrapper";
import { LandingFeatureCarousel } from "@/components/landing/landing-feature-carousel";
import { ResultadosSection } from "@/components/landing/resultados-section";
import { TratamientoFacialSection } from "@/components/landing/tratamiento-facial-section";
import { OfferedTherapiesCard } from "@/components/landing/offered-therapies-card";
import { ReservaButton } from "@/components/booking/reserva-button";
import { getActiveOfferedTherapies } from "@/lib/queries";
import { BRAND, FLAGSHIP_TREATMENT } from "@/lib/brand";

export default async function HomePage() {
  let activeTherapies: Awaited<ReturnType<typeof getActiveOfferedTherapies>> = [];
  try {
    activeTherapies = await getActiveOfferedTherapies();
  } catch (err) {
    console.error("[HomePage] No se pudieron cargar las terapias:", err);
  }
  return (
    <div className="landing-page relative min-h-screen">
      <div className="relative mx-auto max-w-3xl px-5 py-8 text-center md:px-10 md:py-10">
        {/* Hero */}
        <section className="flex flex-col items-center pt-4">
          <Logo
            size="xl"
            showText={false}
            presentation="transparent"
            priority
            className="leading-none"
          />
          <div className="landing-gold-line mx-auto mt-6 mb-8 max-w-[120px]" />
          <p className="font-display text-sm font-medium uppercase tracking-[0.35em] text-gold-600">
            {BRAND.tagline}
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-iaf-900 md:text-4xl">
            {BRAND.subtitle}
          </h1>
          <p className="mt-2 font-display text-xl text-gold-600 md:text-2xl">{BRAND.owner}</p>
          <p className="font-script mt-4 text-3xl text-iaf-600 md:text-4xl">{BRAND.slogan}</p>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-iaf-800/90">
            {FLAGSHIP_TREATMENT.intro}
          </p>
          <div className="mt-8 flex justify-center">
            <ReservaButton className="px-8 py-3.5" />
          </div>
        </section>

        <LandingFeatureCarousel>
          <TratamientoFacialSection />
          <ResultadosSection />
          <OfferedTherapiesCard therapies={activeTherapies} />
        </LandingFeatureCarousel>

        {/* Contacto */}
        <footer className="mt-16 border-t border-gold-400/25 pt-10">
          <PanelAccessLinkWrapper />
          <p className="mt-3 text-sm text-iaf-700">{BRAND.subtitle}</p>
          <p className="font-script mt-2 text-xl text-gold-600">{BRAND.slogan}</p>

          <div className="mt-8 space-y-3 text-sm text-iaf-800">
            <a
              href={BRAND.phoneHref}
              className="inline-flex items-center justify-center gap-2 hover:text-gold-700"
            >
              <Phone className="h-4 w-4 text-gold-600" />
              {BRAND.phone}
            </a>
            <p className="flex items-start justify-center gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" />
              <span>
                {BRAND.address}
                <br />
                {BRAND.city}
              </span>
            </p>
            <a
              href={BRAND.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 font-medium hover:text-gold-700"
            >
              <Instagram className="h-4 w-4 text-gold-600" />
              {BRAND.instagram}
            </a>
          </div>

          <p className="mt-8 text-xs text-iaf-600">
            © {new Date().getFullYear()} IAF Aesthetic · {BRAND.owner}
          </p>
        </footer>
      </div>
    </div>
  );
}

