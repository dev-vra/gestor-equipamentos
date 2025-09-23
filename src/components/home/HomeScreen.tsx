import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Package, PackageOpen, Users, Wrench } from "lucide-react";
import logoImage from "@/assets/logo.png";

interface HomeScreenProps {
  onNavigate: (section: 'retirada' | 'devolucao' | 'cadastro') => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl">
          {/* Logo Central */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img src={logoImage} alt="Logo da Empresa" className="h-24 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sistema de Controle de Equipamentos
            </h1>
            <p className="text-muted-foreground">
              Gerencie retiradas, devoluções e cadastros de forma eficiente
            </p>
          </div>

          {/* Botões Principais */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card border-border hover:shadow-accent transition-all duration-300 cursor-pointer group"
                  onClick={() => onNavigate('retirada')}>
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Registrar Retirada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Registre a retirada de equipamentos pelos colaboradores
                </p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Acessar
                </Button>
              </div>
            </Card>

            <Card className="bg-gradient-card border-border hover:shadow-accent transition-all duration-300 cursor-pointer group"
                  onClick={() => onNavigate('devolucao')}>
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <PackageOpen className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Registrar Devolução
                </h3>
                <p className="text-muted-foreground mb-6">
                  Processe devoluções e avalie o estado dos equipamentos
                </p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Acessar
                </Button>
              </div>
            </Card>

            <Card className="bg-gradient-card border-border hover:shadow-accent transition-all duration-300 cursor-pointer group"
                  onClick={() => onNavigate('cadastro')}>
              <div className="p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Cadastros
                </h3>
                <p className="text-muted-foreground mb-6">
                  Gerencie equipamentos e colaboradores do sistema
                </p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                  Acessar
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <footer className="p-6 text-center">
        <p className="text-muted-foreground text-sm">
          Sistema de Controle de Equipamentos - Versão 1.0
        </p>
      </footer>
    </div>
  );
}