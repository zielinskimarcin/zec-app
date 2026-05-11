import { Link } from 'react-router';

const productLinks = [
  { label: 'Jak działa', href: '#how-it-works' },
  { label: 'Funkcje', href: '#features' },
  { label: 'Cennik', href: '#pricing' },
];

const appLinks = [
  { label: 'Logowanie', to: '/login' },
  { label: 'Rejestracja', to: '/register' },
  { label: 'Panel', to: '/app' },
];

const workflowItems = ['Wyszukiwanie leadów', 'Tworzenie kampanii', 'Wysyłka przez SMTP'];

export function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.9fr] mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.12] flex items-center justify-center">
                <img src="/logo.png" alt="ZEC" className="w-4 h-4 brightness-0 invert" />
              </div>
              <span className="font-['Outfit'] font-medium text-[18px] text-[#EAE8E1] tracking-[-0.02em]">
                zec
              </span>
            </div>
            <p className="text-sm text-[#A3A09A] leading-relaxed max-w-sm">
              Prospecting, kampanie i kontrolowana wysyłka maili w jednym panelu. Bez ręcznego składania procesu z kilku narzędzi.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#EAE8E1] mb-4">Produkt</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-[#827E78] hover:text-[#EAE8E1] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#EAE8E1] mb-4">Aplikacja</h4>
            <ul className="space-y-3">
              {appLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-[#827E78] hover:text-[#EAE8E1] transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-medium text-[#EAE8E1] mb-4">Flow</h4>
            <ul className="space-y-3">
              {workflowItems.map((item) => (
                <li key={item} className="text-sm text-[#827E78]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col md:flex-row justify-between gap-4">
          <p className="text-sm text-[#827E78]">© 2026 ZEC. All rights reserved.</p>
          <p className="text-sm text-[#827E78]">Built for focused outbound work.</p>
        </div>
      </div>
    </footer>
  );
}
