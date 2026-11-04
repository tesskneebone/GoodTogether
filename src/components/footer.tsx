import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-base font-bold text-brand-700">
              <Logo className="h-7 w-7" />
              GoodTogether<span className="text-stone-400"> LA</span>
            </Link>
            <p className="mt-3 text-sm text-stone-500">
              Connecting Angelenos with real volunteer opportunities across LA.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Volunteers</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/opportunities" className="hover:text-brand-700">
                  Browse opportunities
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="hover:text-brand-700">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Organizations</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/signup" className="hover:text-brand-700">
                  Post an opportunity
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">About</h3>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li>
                <Link href="/about" className="hover:text-brand-700">
                  Our mission
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-brand-700">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-brand-700">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-brand-700">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-stone-400">&copy; {new Date().getFullYear()} GoodTogether LA.</p>
      </div>
    </footer>
  );
}
