import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Thumb from "../../../components/Thumb";
import { loadProducts } from "../../../lib/affiliate-sheet";
import { PROP_IDS, PROP_PAGES, groupByProp, isPropId } from "../../../lib/shop";

// Sama seperti halaman utama: baca ulang Google Sheet paling lambat tiap 5 menit.
export const revalidate = 300;

export const generateStaticParams = () => PROP_IDS.map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isPropId(slug)) return {};
  const { label, intro } = PROP_PAGES[slug];
  return { title: `${label} pilihan Bagas — Budak Kantor AI`, description: intro };
}

export default async function BarangPage({ params }: Props) {
  const { slug } = await params;
  if (!isPropId(slug)) notFound();

  const groups = groupByProp(await loadProducts());
  const items = groups.get(slug) ?? [];
  const { label, intro } = PROP_PAGES[slug];

  return (
    <div className="barang-page" data-track-area="halaman_barang">
      <header className="barang-top">
        <Link href="/" className="back" data-track="balik_ke_meja">
          ← Meja Bagas
        </Link>
        <span className="brand-mini">
          <span className="badge">AI</span>
          Budak Kantor AI
        </span>
      </header>

      <section className="barang-hero">
        <p className="eyebrow">Barang di meja Bagas</p>
        <h1>{label}</h1>
        <p className="intro">“{intro}”</p>
        {items.length > 0 && <p className="count">{items.length} pilihan</p>}
      </section>

      {groups.size > 1 && (
        <div className="barang-tabs" role="navigation" aria-label="Barang lain">
          {PROP_IDS.filter((id) => groups.has(id)).map((id) => (
            <Link
              key={id}
              href={`/barang/${id}`}
              className={id === slug ? "chip active" : "chip"}
              aria-current={id === slug ? "page" : undefined}
              data-track="tab_barang"
              data-track-value={id}
            >
              {PROP_PAGES[id].label} <span>{groups.get(id)!.length}</span>
            </Link>
          ))}
        </div>
      )}

      {items.length > 0 ? (
        <ul className="barang-grid">
          {items.map((product, index) => (
            <li key={`${product.url}-${index}`} className="barang-card">
              {index === 0 && <span className="pick">Pilihan Bagas</span>}
              <Thumb product={product} size="card" />
              <div className="barang-info">
                <b>{product.name}</b>
                {product.note && <p>{product.note}</p>}
              </div>
              <div className="barang-buy">
                {product.price && <span className="price">{product.price}</span>}
                <a
                  href={product.url}
                  target="_blank"
                  rel="sponsored noreferrer"
                  data-track="afiliasi_halaman"
                  data-track-value={`${slug}:${index + 1}`}
                >
                  Lihat di {product.store}
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="barang-empty">
          <p>Belum ada barang di sini. Bagas masih survei harga.</p>
          <Link href="/" className="back">
            ← Balik ke meja
          </Link>
        </div>
      )}

      <p className="disclosure barang-disclosure">
        Gue nggak digaji buat promosi. Tapi kalau lo beli lewat link di sini, gue dapat komisi kecil. Harga bisa berubah, cek di toko.
      </p>
    </div>
  );
}
