import SiteChrome from "@/components/site/chrome";
import SiteNav from "@/components/site/nav";
import ContactSection from "@/components/section/contact";
import Footer from "@/components/section/footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Scavenger Hunt — NUST Orientation '26",
  description:
    "Join the NUST Orientation scavenger hunt — hunt for clues across H-12 campus, climb the leaderboard, and win prizes during Orientation Week.",
  path: "/scavenger-hunt",
});

// Results are hidden for now while standings are being finalized — swap this
// back for <Leaderboard /> (components/hunt/Leaderboard.tsx, untouched) once
// ready to reveal.
export default function ScavengerHuntPage() {
  return (
    <main className="min-h-screen bg-surface text-fg">
      <SiteChrome />
      <SiteNav />

      <section id="scavenger-hunt" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
        <div className="relative mx-auto max-w-[1600px]">
          <p className="font-italic text-sm italic text-fg/50">— Find every spot</p>
          <h2 className="mt-4 font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
            Scavenger Hunt
          </h2>

          <div className="mt-10 flex items-center justify-center rounded-[30px] border border-dashed border-fg/40 px-6 py-24 text-center sm:px-10">
            <div>
              <p className="font-serif text-4xl font-bold text-fg sm:text-5xl">Results are in…</p>
              <p className="mt-4 font-italic text-lg italic text-fg/60">
                And it&apos;s going to be a surprise. Stay tuned for the reveal.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ContactSection />
      <Footer />
    </main>
  );
}
