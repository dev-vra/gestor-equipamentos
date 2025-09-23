import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, FileText, Shield, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateTermoRetirada } from "@/services/documentService";

interface Equipment {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  quantidade: number;
  epi: boolean;
}

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
}

interface RetiradaScreenProps {
  onBack: () => void;
}

export function RetiradaScreen({ onBack }: RetiradaScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<{id: string, quantity: number}[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const { toast } = useToast();

  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);

  // Definir loadData com useCallback
  const loadData = useCallback(async () => {
    try {
      // Carregar equipamentos
      const { data: equipData, error: equipError } = await supabase
        .from('equipamentos')
        .select('*');

      if (equipError) throw equipError;
      setEquipments(equipData || []);
      setFilteredEquipments(equipData || []);

      // Carregar colaboradores
      const { data: colabData, error: colabError } = await supabase
        .from('colaboradores')
        .select('*');

      if (colabError) throw colabError;
      setColaboradores(colabData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtrar equipamentos
  useEffect(() => {
    if (searchTerm.trim() === '') {
    } else {
      const filtered = equipments.filter(
        (equip) =>
          equip.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          equip.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (equip.numero_serie || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipments(filtered);
    }
  }, [searchTerm, equipments]);

  const addEquipment = (equipmentId: string) => {
    const equipment = equipments.find((eq) => eq.id === equipmentId);
    if (!equipment) return;

    setSelectedEquipments((prev) => {
{{ ... }}
        nomeColaborador: colaborador?.nome || '',
        cargoColaborador: colaborador?.cargo || '',
        dataRetirada: new Date().toLocaleDateString('pt-BR'),
        dataDevolucao: new Date(returnDate).toLocaleDateString('pt-BR'),
        itens: equipamentosDetalhes.map(eq => ({
          descricao: eq.descricao || '',
          quantidade: eq.selectedQuantity || 0,
          numeroSerie: eq.numero_serie || 'N/A'
        })),
        totalItens: equipamentosDetalhes.reduce((acc, curr) => acc + (curr.selectedQuantity || 0), 0)
      };
  
{{ ... }}
      });
    }
  };

  const handleEntregaEPI = () => {
    console.log("Entrega EPI:", { selectedEmployee, returnDate, selectedEquipments });
    toast({
      title: "Info",
      description: "Geração de PDF EPI será implementada em breve.",
    });
{{ ... }}

  return (
    <div className="min-h-screen bg-background">
      <Header title="Registrar Retirada" showBackButton onBack={onBack} />
      
      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tabela de Equipamentos */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar equipamentos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Nº Série</TableHead>
                        <TableHead>Estoque</TableHead>
                        <TableHead>EPI</TableHead>
                        <TableHead>Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEquipments.map((equipment) => (
                        <TableRow key={equipment.id}>
                          <TableCell className="font-medium">{equipment.tipo}</TableCell>
                          <TableCell>{equipment.descricao}</TableCell>
                          <TableCell>{equipment.numero_serie}</TableCell>
                          <TableCell>{equipment.quantidade}</TableCell>
                          <TableCell>
                            {equipment.epi ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary">
                                <Shield className="w-3 h-3 mr-1" />
                                EPI
                              </Badge>
                            ) : (
                              <Badge variant="outline">Equipamento</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => addEquipment(equipment.id)}
                              disabled={equipment.quantidade === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </Card>
          </div>

          {/* Painel de Retirada */}
          <div className="space-y-6">
            <Card className="bg-card border-border">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Dados da Retirada</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Colaborador</label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o colaborador" />
                      </SelectTrigger>
                      <SelectContent>
                        {colaboradores.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.nome} - {employee.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Prevista de Devolução</label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Equipamentos Selecionados */}
            <Card className="bg-card border-border">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Equipamentos Selecionados</h3>
                
                {selectedEquipments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum equipamento selecionado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getSelectedEquipmentDetails().map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{item.tipo}</div>
                          <div className="text-sm text-muted-foreground">{item.descricao}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.selectedQuantity}</Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeEquipment(item.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleRegistrarRetirada}
                disabled={!selectedEmployee || selectedEquipments.length === 0 || !returnDate}
              >
                <FileText className="h-4 w-4 mr-2" />
                Registrar Retirada
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleEntregaEPI}
                disabled={!selectedEmployee || selectedEquipments.length === 0}
              >
                <Shield className="h-4 w-4 mr-2" />
                Entrega EPI
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}