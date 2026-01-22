import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/marketing/Hero";
import Workflow from "@/components/marketing/Workflow";
import WhyChooseUs from "@/components/marketing/WhyChooseUs";
import Testimonials from "@/components/marketing/Testimonials";

const Index = () => {
  console.log("Index component rendering...");
  const canonical = typeof window !== "undefined" ? window.location.href : "/";
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Glassify",
    url: canonical,
    sameAs: [] as string[],
  };

  return (
    <>
      <Helmet>
        <title>Glassify Auto Glass Repair & Replacement</title>
        <meta
          name="description"
          content="Report glass damage. We handle insurance approval and coordinate your repair at certified shops. Fast, fair, quality."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Glassify Auto Glass Repair & Replacement" />
        <meta property="og:description" content="Report glass damage. We handle insurance approval and coordinate your repair at certified shops." />
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
      </main>

      <Footer />
    </>
  );
};

export default Index;
