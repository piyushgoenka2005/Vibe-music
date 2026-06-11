import { FOOTER_COLUMNS } from "@/data/footer";
import FooterColumn from "./FooterColumn";

export default function FooterLinks() {
  return (
    <section className="assets-site-footer__help-links">
      {FOOTER_COLUMNS.map((column) => (
        <FooterColumn key={column.heading} column={column} />
      ))}
    </section>
  );
}
