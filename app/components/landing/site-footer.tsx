const footerLinks = [
  { label: "Product", href: "#", ariaLabel: "Product (placeholder link)" },
  { label: "Docs", href: "#", ariaLabel: "Docs (placeholder link)" },
  { label: "Privacy", href: "#", ariaLabel: "Privacy (placeholder link)" },
  { label: "Terms", href: "#", ariaLabel: "Terms (placeholder link)" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-zinc-600">© {year} Harbor</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-label={link.ariaLabel}
                  className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
