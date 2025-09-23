import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { EquipamentosTab } from "./EquipamentosTab";
import { ColaboradoresTab } from "./ColaboradoresTab";

interface CadastroScreenProps {
  onBack: () => void;
}

export function CadastroScreen({ onBack }: CadastroScreenProps) {
  const [activeTab, setActiveTab] = useState("equipamentos");

  return (
    <div className="min-h-screen bg-background">
      <Header title="Cadastros" showBackButton onBack={onBack} />
      
      <div className="container mx-auto p-6">
        <Card className="bg-card border-border">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="equipamentos" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Equipamentos
                </TabsTrigger>
                <TabsTrigger value="colaboradores" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Colaboradores
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="equipamentos" className="mt-6">
                <EquipamentosTab />
              </TabsContent>
              
              <TabsContent value="colaboradores" className="mt-6">
                <ColaboradoresTab />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}