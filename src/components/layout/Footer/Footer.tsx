import FooterLinks from "./FooterLinks";
import FooterNewsletter from "./FooterNewsletter";
import FooterBottom from "./FooterBottom";

const newGearImages = [
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/15.jpg?format=webp",
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/12.jpg?format=webp",
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/8.jpg?format=webp",
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/9.jpg?format=webp",
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/16.jpg?format=webp",
  "https://media.sweetwater.com/m/include/footer/images/new-gear-day/7.jpg?format=webp",
];

export default function Footer() {
  return (
    <footer id="assets-footer" className="bg-[var(--grey100)] text-white">
      <section className="border-b border-[var(--grey80)] bg-[var(--grey90)] py-10">
        <div className="sw-container">
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
            <div className="hidden justify-end gap-3 lg:flex">
              {newGearImages.slice(0, 3).map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`New Gear Day ${index + 1}`}
                  className="h-[110px] w-[110px] rounded object-cover"
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--grey20)]">
                Happy
              </p>
              <img
                src="https://media.sweetwater.com/m/newgearday/logo.png?format=webp"
                alt="#NewGearDay"
                className="mx-auto my-3 h-[38px] w-auto"
              />
              <p className="text-sm text-[var(--grey20)]">
                Happy customers, one piece of gear at a time!{" "}
                <a href="#" className="text-white underline hover:text-[var(--grey0)]">
                  Learn More
                </a>
              </p>
            </div>

            <div className="hidden justify-start gap-3 lg:flex">
              {newGearImages.slice(3).map((src, index) => (
                <img
                  key={src}
                  src={src}
                  alt={`New Gear Day ${index + 4}`}
                  className="h-[110px] w-[110px] rounded object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--grey80)] py-10">
        <div className="sw-container">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <span className="text-[28px] font-bold text-[var(--blue)]">ViBE</span>
              <p className="mt-4 text-sm leading-relaxed text-[var(--grey20)]">
                Your destination for professional music, recording, and audio
                equipment.
              </p>
            </div>

            <FooterLinks />
          </div>

          <div className="mt-10">
            <FooterNewsletter />
          </div>
        </div>
      </section>

      <FooterBottom />
    </footer>
  );
}
