import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import Footer from "@/components/section/footer";
import WaitlistReveal from "@/components/section/waitlist-reveal";
import { pageMetadata } from "@/lib/seo";
import { countWaitlistEntries } from "@/services/waitlist/join";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata({
  title: "Game Waitlist — NUST Orientation '26",
  description:
    "Join the waitlist for the new Orientation game and be the first to know when it launches.",
  path: "/waitlist",
});

export default async function WaitlistPage() {
  const count = await countWaitlistEntries();

  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />

      <section className="px-6 py-16 sm:px-10 sm:py-20">
        <WaitlistReveal count={count} />
      </section>

      <Footer />
    </main>
  );
}
