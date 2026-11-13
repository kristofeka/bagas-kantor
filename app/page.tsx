import Experience from "../components/Experience";
import { loadProducts } from "../lib/affiliate-sheet";

// Halaman dibuat ulang paling lambat tiap 5 menit supaya perubahan di Google Sheet ikut tampil.
export const revalidate = 300;

export default async function Page() {
  const products = await loadProducts();
  return <Experience products={products} />;
}
