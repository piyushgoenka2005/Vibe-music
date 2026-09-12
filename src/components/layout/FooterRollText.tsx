interface FooterRollTextProps {
  children: string;
}

export default function FooterRollText({ children }: FooterRollTextProps) {
  return (
    <span className="footer-roll-text">
      <span className="footer-roll-text__track">
        <span className="footer-roll-text__line" data-text={children}>
          {children}
        </span>
      </span>
    </span>
  );
}
