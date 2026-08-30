import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import ContactSection from "@/components/section/contact";
import Footer from "@/components/section/footer";
import Leaderboard from "@/components/hunt/Leaderboard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Scavenger Hunt — NUST Orientation '26",
  description:
    "Join the NUST Orientation scavenger hunt — hunt for clues across H-12 campus, climb the leaderboard, and win prizes during Orientation Week.",
  path: "/scavenger-hunt",
});

export default function ScavengerHuntPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />
      <Leaderboard />
      <ContactSection />
      <Footer />
    </main>
  );
}
