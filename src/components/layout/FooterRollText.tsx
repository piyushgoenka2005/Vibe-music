interface FooterRollTextProps {
  children: string;
}

export default function FooterRollText({ children }: FooterRollTextProps) {
  return (
    <span className="footer-roll-text">
      <span className="footer-roll-text__track">
        <span className="footer-roll-text__line">{children}</span>
        <span className="footer-roll-text__line" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}
