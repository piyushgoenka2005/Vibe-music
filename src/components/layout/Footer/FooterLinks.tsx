const footerData = [
  {
    title: "Customer Service",
    links: ["Contact Us", "Shipping", "Returns", "Order Status"],
  },
  {
    title: "Company",
    links: ["About Us", "Careers", "Blog", "Press"],
  },
  {
    title: "Resources",
    links: ["Buying Guides", "Tutorials", "Support", "FAQ"],
  },
];

export default function FooterLinks() {
  return (
    <>
      {footerData.map((section) => (
        <div key={section.title}>
          <h3 className="mb-4 text-base font-semibold">{section.title}</h3>
          <ul className="space-y-2">
            {section.links.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-sm text-[var(--grey20)] transition-colors hover:text-white"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
