import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/marketing/Hero";
import Workflow from "@/components/marketing/Workflow";
import WhyChooseUs, { CustomerSegments } from "@/components/marketing/WhyChooseUs";
import Testimonials from "@/components/marketing/Testimonials";

const Index = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "/";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Autocristal",
    url: canonical,
    sameAs: [] as string[],
  };

  return (
    <>
      <Helmet>
        <title>Autocristal Auto Glass Repair & Replacement</title>
        <meta
          name="description"
          content="Report glass damage. AI triage and smart matching to top repair shops. Or order DIY resin. Fast, fair, quality."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Autocristal Auto Glass Repair & Replacement" />
        <meta property="og:description" content="Report glass damage. AI triage and smart matching to top repair shops. Or DIY resin." />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>

      <Header />

      <header>
        <Hero />
      </header>

      <main>
        <Testimonials />
        <WhyChooseUs />
        <Workflow />
        <CustomerSegments />
      </main>

      <Footer />
    </>
  );
};

export default Index;
