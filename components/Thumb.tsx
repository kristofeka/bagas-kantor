import type { Product } from "../lib/shop";

// Kotak gambar produk: foto dari sheet bila ada, kalau tidak kotak warna.
export default function Thumb({ product, size = "sm" }: { product: Product; size?: "sm" | "big" | "card" }) {
  const className = size === "sm" ? "swatch" : `swatch ${size}`;
  return product.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={product.image} alt="" loading="lazy" />
  ) : (
    <span className={className} style={{ background: product.color }} aria-hidden="true" />
  );
}
