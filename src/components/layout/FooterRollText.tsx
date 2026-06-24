interface FooterRollTextProps {
  children: string;
}

export default function FooterRollText({ children }: FooterRollTextProps) {
  return (
    <span className="footer-roll-text">
      <span className="footer-roll-text__track" aria-hidden="true">
        <span className="footer-roll-text__line">{children}</span>
        <span className="footer-roll-text__line">{children}</span>
      </span>
      <span className="footer-roll-text__sr">{children}</span>
    </span>
  );
}
