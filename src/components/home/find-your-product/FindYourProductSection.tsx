import "@/styles/find-your-product.css";
import FindYourProductRuntime from "@/components/home/find-your-product/FindYourProductRuntime";
import ScannerBagIcon from "@/components/home/find-your-product/ScannerBagIcon";
import ScannerBeam from "@/components/home/find-your-product/ScannerBeam";
import ScannerMarquee from "@/components/home/find-your-product/ScannerMarquee";

export default function FindYourProductSection() {
  return (
    <div className="find-your-product" data-find-your-product>
      <FindYourProductRuntime />

      <header className="find-your-product__header">
        <p className="find-your-product__eyebrow">
          <span className="find-your-product__eyebrow-line" aria-hidden />
          Shop by category
          <span className="find-your-product__eyebrow-line" aria-hidden />
        </p>
        <h2 id="find-your-product-title" className="find-your-product__title">
          Find Your Product
        </h2>
        <p className="find-your-product__subtitle">
          Curated departments for every stage — from bedroom studio to main stage.
        </p>
      </header>

      <section
        className="find-your-product__stage"
        aria-labelledby="find-your-product-title"
        aria-label="Find your product — trending gear"
      >
        <div className="find-your-product__spine" aria-hidden>
          <span className="find-your-product__spine-seg find-your-product__spine-seg--up" />
        </div>

        <ScannerMarquee />

        <div className="find-your-product__junction" aria-hidden>
          <div className="find-your-product__icon">
            <ScannerBagIcon />
          </div>
        </div>

        <ScannerBeam />
      </section>
    </div>
  );
}
