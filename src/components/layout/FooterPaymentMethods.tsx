interface PaymentLogoProps {
  className?: string;
}

function UpiLogo({ className = "" }: PaymentLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 28"
      aria-hidden="true"
      focusable="false"
    >
      <text
        x="0"
        y="21"
        fill="#3D3D3D"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="18"
        fontWeight="700"
      >
        UPI
      </text>
      <path
        d="M52 4h8l6 20h-6l-1.2-4.2H53L51.8 24h-6L52 4zm4.2 11.2 2.2-7.4-2.2 7.4z"
        fill="#097939"
      />
      <path d="M62 4h5.5v20H62V4z" fill="#F47920" />
    </svg>
  );
}

function VisaLogo({ className = "" }: PaymentLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M30.2 23.2 33.6 1h5.8l-3.4 22.2h-5.8zM49.8 1.4c-1.1-.4-2.9-.8-5.1-.8-5.6 0-9.6 3-9.6 7.2 0 3.1 2.8 4.9 4.9 5.9 2.2 1.1 2.9 1.8 2.9 2.8 0 1.5-1.7 2.2-3.3 2.2-2.2 0-3.4-.3-5.2-1.1l-.7-.3-.8 4.9c1.3.6 3.8 1.1 6.3 1.1 6 0 9.9-3 9.9-7.6 0-2.5-1.5-4.4-4.8-6-2-1-3.2-1.7-3.2-2.7 0-.9.9-1.9 2.9-1.9 1.7-.1 2.9.3 3.8.7l.5.2.8-4.8zM63.6 1 58.8 23.2h5.5L69 1h-5.4zM24.5 1 19.8 16.1 19.3 13c-.9-3.7-3.7-7.7-6.8-9.7L16.8 23h5.8l8.6-22h-6.7zM9.8 1 3.2 23.2H8.7l1.1-3h6.7l.6 3h5.2L14.2 1H9.8zm1.2 13.5 2.8-7.6 1.6 7.6h-4.4z"
        fill="#1A1F71"
      />
    </svg>
  );
}

function MastercardLogo({ className = "" }: PaymentLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 30"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="18" cy="15" r="11" fill="#EB001B" />
      <circle cx="30" cy="15" r="11" fill="#F79E1B" fillOpacity="0.95" />
      <path
        d="M24 7.4a11 11 0 0 0-3.8 7.6 11 11 0 0 0 3.8 7.6 11 11 0 0 0 3.8-7.6 11 11 0 0 0-3.8-7.6z"
        fill="#FF5F00"
      />
    </svg>
  );
}

function PayPalLogo({ className = "" }: PaymentLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 88 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M32.8 1.6c-2.2-.1-4.5 1.6-5 4.2l-3.4 21.6h6.1l.8-5.2h3.7c4.3 0 7.6-3.5 8.1-7.7.4-3.1-1.8-5.9-5-6.4l-.3-.5zm1.2 4.2h3.1c1.8.2 2.8 1.4 2.5 3.1-.3 1.9-2 3.2-3.9 3.2h-3.4l1.7-6.3z"
        fill="#003087"
      />
      <path
        d="M52.2 1.6c-2.2-.1-4.5 1.6-5 4.2L43.8 27.4h6.1l.8-5.2h3.7c4.3 0 7.6-3.5 8.1-7.7.4-3.1-1.8-5.9-5-6.4l-.3-.5zm1.2 4.2h3.1c1.8.2 2.8 1.4 2.5 3.1-.3 1.9-2 3.2-3.9 3.2h-3.4l1.7-6.3z"
        fill="#009CDE"
      />
      <path
        d="M14.6 1.6H8.3c-.6 0-1.1.4-1.2 1L2.2 24.2c-.1.5.3 1 .8 1h4.7c.6 0 1.1-.4 1.2-1l1-6.3h3.4c4.9 0 8.7-4 9.2-8.8.2-1.8-.2-3.2-1.2-4.2-1-1-2.5-1.5-4.7-1.5zm.8 8.6c-.4 2.7-2.8 4.7-5.6 4.7h-2.8l1.1-7.1h2.8c1.3 0 2.3.4 2.9 1.1.5.6.7 1.4.6 2.3z"
        fill="#003087"
      />
    </svg>
  );
}

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI", Logo: UpiLogo },
  { id: "visa", label: "Visa", Logo: VisaLogo },
  { id: "mastercard", label: "Mastercard", Logo: MastercardLogo },
  { id: "paypal", label: "PayPal", Logo: PayPalLogo },
] as const;

export default function FooterPaymentMethods() {
  return (
    <div className="site-footer__payments-bar">
      <ul className="site-footer__payment-list">
        {PAYMENT_METHODS.map(({ id, label, Logo }) => (
          <li key={id}>
            <span className="site-footer__payment-badge" aria-label={label}>
              <Logo className="site-footer__payment-logo" />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
