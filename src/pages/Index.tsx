import { Helmet } from "react-helmet-async";
import Hero from "@/components/marketing/Hero";
import Workflow from "@/components/marketing/Workflow";
import LeadForm from "@/components/marketing/LeadForm";

const Index = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "/";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DriveX",
    url: canonical,
    sameAs: [] as string[],
  };

  return (
    <>
      <Helmet>
        <title>DriveX Auto Glass Repair & Replacement</title>
        <meta
          name="description"
          content="Report glass damage. AI triage and smart matching to top repair shops. Or order DIY resin. Fast, fair, quality."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="DriveX Auto Glass Repair & Replacement" />
        <meta property="og:description" content="Report glass damage. AI triage and smart matching to top repair shops. Or DIY resin." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>

      <header>
        <Hero />
      </header>

      <main>
        <Workflow />
        <LeadForm />
        
        {/* Development shortcuts - remove in production */}
        <section className="bg-muted/30 py-8 border-t">
          <div className="container mx-auto max-w-3xl">
            <h3 className="text-lg font-semibold mb-4 text-center">🧪 Development Shortcuts</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/report/eo3w_x1IBgPaUDj8gsUVkI2qL8rG0gSx" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Jump to Partner Selection
              </a>
              <a href="/inspection/test123" className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors">
                Start Inspection Flow
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Index;
