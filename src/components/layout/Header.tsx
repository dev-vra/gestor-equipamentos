import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoImage from "@/assets/logo.png";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBackButton = false, onBack }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="Logo" className="h-8 w-auto" />
              {title && (
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}