function BatchFrame({
  src,
  alt,
  badge,
  dark = false,
}: {
  src: string;
  alt: string;
  badge: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-fg/12 ${dark ? "bg-ink" : "bg-fg/[0.03]"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block h-auto w-full" />
      <span className="absolute left-4 top-4 rounded-full border border-cream/40 bg-ink/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cream backdrop-blur-sm">
        {badge}
      </span>
    </div>
  );
}

export default function BatchPhotoSection() {
  return (
    <section id="batch-photo" className="relative overflow-hidden bg-surface px-6 py-28 sm:px-10">
      <div className="relative mx-auto max-w-[1600px]">
        <p className="font-italic text-sm italic text-fg/50">— One frame, whole batch</p>
        <h2 className="mt-4 font-serif text-[16vw] font-bold leading-[0.85] text-fg lg:text-[11vw]">
          The Batch Photo
        </h2>
        <p className="mt-8 max-w-2xl font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-fg/45">
          115 photographs, stitched into one, twice — once by day, once by night. Previews below
          are reduced in size for fast loading; download the full-resolution versions for the
          real thing.
        </p>

        <div className="mt-16">
          <BatchFrame
            src="/batch-photo-day.jpg"
            alt="NUST Orientation '26 batch photo, taken by day"
            badge="Day"
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/40 lg:col-span-3">
              Day batch photo
            </p>
            <div className="max-w-3xl font-serif text-xl leading-relaxed text-fg/80 lg:col-span-9">
              <p>
                Morning light has this way about barring honesty under a blanket of endless blue.
                Here it paints a crowd of thousands into proof, into evidence of a promise.
              </p>
              <p className="mt-5">
                Pyare freshies, here&apos;s your mirror from above, your ocean of a batch finally
                sitting still long enough to be seen in the full, brutal, loving candor of the
                sun. We hope you bask in it for all four (to five) years to come.
              </p>
              <p className="mt-5">
                No single frame could hold all of you, so we didn&apos;t ask it to. A hundred and
                fifteen pictures woven patiently over the labour of hours, thread by thread,
                until every face finds its place in the light, because a voyage this size reckons
                a portrait wide enough to cradle its entirety.
              </p>
            </div>
          </div>
        </div>

        <div className="my-20 flex items-center gap-4">
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
          <span className="h-2 w-2 rounded-full bg-fg/25" />
          <span className="h-px flex-1 border-t border-dashed border-fg/20" />
        </div>

        <div>
          <BatchFrame
            src="/batch-photo-night.jpg"
            alt="NUST Orientation '26 batch photo, taken by night"
            badge="Night"
            dark
          />
          <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-fg/40 lg:col-span-3">
              Night batch photo
            </p>
            <div className="max-w-3xl font-serif text-xl leading-relaxed text-fg/80 lg:col-span-9">
              <p>
                Four years from now, some of these faces might mean everything to you. Today,
                some are still strangers. We don&apos;t think one photograph can hold the stories
                of an entire batch, but we tried anyway. Here is the Orientation &apos;26 batch
                photo in its full glory: iridescent and glowing.
              </p>
              <p className="mt-5">
                115 photographs, carefully stitched together to make sure every freshie has a
                face in the frame and a place in the whole. A collection of people who walked
                into NUST with separate journeys are now part of the same picture.
              </p>
              <p className="mt-5">
                Zoom in, find your face, find your people, and move past the ones you
                haven&apos;t met yet. You never know who the red string of fate has tied you to.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
