import { Link } from "wouter";
import { Presentation, LayoutDashboard } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 sm:px-8 justify-between">
        <Link href="/" className="flex items-center gap-2 group interactive-transition hover:opacity-80">
          <div className="bg-primary/10 p-2 rounded-xl text-primary group-hover:bg-primary/20 interactive-transition">
            <Presentation className="h-6 w-6" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">Stitch AI</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground interactive-transition flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-accent shadow-inner flex items-center justify-center text-primary-foreground font-semibold text-sm">
            ME
          </div>
        </nav>
      </div>
    </header>
  );
}
