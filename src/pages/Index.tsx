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
      </main>
    </>
  );
};

export default Index;
