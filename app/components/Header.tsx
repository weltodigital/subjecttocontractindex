import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-rule-soft">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-lg font-medium text-forest">STC</span>
          <span className="hidden text-sm text-charcoal-soft sm:inline">
            UK Estate Agent Index
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-charcoal-soft">
          <Link href="/methodology" className="hover:text-forest">
            Methodology
          </Link>
          <Link href="/about" className="hover:text-forest">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
