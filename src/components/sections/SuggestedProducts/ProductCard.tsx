interface ProductCardProps {
  name: string;
  price: string;
  image?: string;
}

export default function ProductCard({ name, price, image }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col border border-[var(--grey10)] bg-white">
      <a href="#" className="block">
        <div className="flex aspect-square items-center justify-center bg-[var(--grey0)] p-6">
          <img
            src={
              image ??
              "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png"
            }
            alt={name}
            className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
          />
        </div>
      </a>

      <div className="flex flex-1 flex-col p-4">
        <a href="#" className="mb-2 text-[15px] leading-snug text-[var(--grey100)] hover:text-[var(--blue)]">
          {name}
        </a>

        <p className="mb-4 text-xl font-medium text-[var(--grey100)]">{price}</p>

        <button type="button" className="sw-btn sw-btn-blue mt-auto w-full text-sm">
          Add To Cart
        </button>
      </div>
    </article>
  );
}
