import { LandingPage } from "@/components/landing/landing-page";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://cekbar.id/#organization",
      name: "Cekbar",
      url: "https://cekbar.id",
      description:
        "Platform cek IMEI CEIR, unlock IMEI, dan GSM service terpercaya di Indonesia.",
    },
    {
      "@type": "WebSite",
      "@id": "https://cekbar.id/#website",
      url: "https://cekbar.id",
      name: "Cekbar",
      publisher: { "@id": "https://cekbar.id/#organization" },
      inLanguage: "id-ID",
    },
    {
      "@type": "WebPage",
      "@id": "https://cekbar.id/",
      url: "https://cekbar.id/",
      name: "Cekbar — Cek IMEI Perangkat, Pastikan Asli & Legal",
      isPartOf: { "@id": "https://cekbar.id/#website" },
      about: { "@id": "https://cekbar.id/#organization" },
      inLanguage: "id-ID",
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
