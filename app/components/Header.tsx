import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-rule-soft">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/stc-logo.png"
            alt="Subject To Contract"
            width={981}
            height={520}
            priority
            className="h-10 w-auto"
          />
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
