export default function FooterBottom() {
  return (
    <div className="py-6">
      <div className="sw-container flex flex-col gap-4 text-sm text-[var(--grey50)] lg:flex-row lg:items-center lg:justify-between">
        <p>© 2026 ViBE. All rights reserved.</p>

        <div className="flex flex-wrap gap-5">
          <a href="#" className="hover:text-white">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white">
            Terms of Service
          </a>
          <a href="#" className="hover:text-white">
            Cookies
          </a>
        </div>
      </div>
    </div>
  );
}
