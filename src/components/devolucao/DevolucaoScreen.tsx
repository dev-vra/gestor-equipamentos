import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Package } from "lucide-react";
import { Header } from "@/components/layout/Header";

interface Movimentacao {
  id: string;
  data_retirada: string;
  funcionario: string;
  item_id: string;
  grupo_retirada: string;
  quantidade_retirada: number;
}

interface EquipmentoDevolucao {
  item_id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  estado_conservacao: string;
  avaria: string;
  quantidade: number;
}

interface DevolucaoScreenProps {
  onBack: () => void;
}

export function DevolucaoScreen({ onBack }: DevolucaoScreenProps) {
  const [selectedRetirada, setSelectedRetirada] = useState<string>("");
  const [equipamentosDevolucao, setEquipamentosDevolucao] = useState<EquipmentoDevolucao[]>([]);

  // Mock data - será substituído pela integração com Firebase
  const movimentacoes: Movimentacao[] = [
    { id: "1", data_retirada: "2024-01-15", funcionario: "João Silva", item_id: "1", grupo_retirada: "GRP001", quantidade_retirada: 2 },
    { id: "2", data_retirada: "2024-01-16", funcionario: "Maria Santos", item_id: "2", grupo_retirada: "GRP002", quantidade_retirada: 1 },
    { id: "3", data_retirada: "2024-01-17", funcionario: "Pedro Costa", item_id: "3", grupo_retirada: "GRP003", quantidade_retirada: 3 },
  ];

  const handleSelectRetirada = (retiradaId: string) => {
    setSelectedRetirada(retiradaId);
    
    // Mock data para equipamentos da retirada selecionada
    const mockEquipamentos: EquipmentoDevolucao[] = [
      {
        item_id: "1",
        tipo: "Capacete",
        descricao: "Capacete de Segurança Branco",
        numero_serie: "CAP001",
        estado_conservacao: "Bom",
        avaria: "",
        quantidade: 2
      },
      {
        item_id: "2",
        tipo: "Óculos",
        descricao: "Óculos de Proteção",
        numero_serie: "OCU001",
        estado_conservacao: "Bom",
        avaria: "",
        quantidade: 1
      }
    ];
    
    setEquipamentosDevolucao(mockEquipamentos);
  };

  const updateEquipamento = (itemId: string, field: keyof EquipmentoDevolucao, value: string) => {
    setEquipamentosDevolucao(prev =>
      prev.map(eq =>
        eq.item_id === itemId ? { ...eq, [field]: value } : eq
      )
    );
  };

  const handleRegistrarDevolucao = () => {
    // Implementar geração de PDF baseado no template de devolução
    console.log("Registrar devolução:", { selectedRetirada, equipamentosDevolucao });
  };

  const handleCancelar = () => {
    setSelectedRetirada("");
    setEquipamentosDevolucao([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Registrar Devolução" showBackButton onBack={onBack} />
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Tabela de Retiradas */}
        <Card className="bg-card border-border">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Retiradas Pendentes de Devolução
            </h3>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data Retirada</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Item ID</TableHead>
                    <TableHead>Grupo Retirada</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((movimentacao) => (
                    <TableRow 
                      key={movimentacao.id}
                      className={selectedRetirada === movimentacao.id ? "bg-primary/5 border-primary/20" : ""}
                    >
                      <TableCell className="font-medium">{movimentacao.id}</TableCell>
                      <TableCell>{new Date(movimentacao.data_retirada).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{movimentacao.funcionario}</TableCell>
                      <TableCell>{movimentacao.item_id}</TableCell>
                      <TableCell>{movimentacao.grupo_retirada}</TableCell>
                      <TableCell>{movimentacao.quantidade_retirada}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          variant={selectedRetirada === movimentacao.id ? "default" : "outline"}
                          onClick={() => handleSelectRetirada(movimentacao.id)}
                        >
                          {selectedRetirada === movimentacao.id ? "Selecionado" : "Selecionar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {/* Equipamentos para Devolução */}
        {selectedRetirada && (
          <Card className="bg-card border-border">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Equipamentos para Devolução</h3>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Nº Série</TableHead>
                      <TableHead>Estado Conservação</TableHead>
                      <TableHead>Avaria</TableHead>
                      <TableHead>Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipamentosDevolucao.map((equipamento) => (
                      <TableRow key={equipamento.item_id}>
                        <TableCell className="font-medium">{equipamento.item_id}</TableCell>
                        <TableCell>{equipamento.tipo}</TableCell>
                        <TableCell>{equipamento.descricao}</TableCell>
                        <TableCell>{equipamento.numero_serie}</TableCell>
                        <TableCell>
                          <Select 
                            value={equipamento.estado_conservacao}
                            onValueChange={(value) => updateEquipamento(equipamento.item_id, 'estado_conservacao', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bom">Bom</SelectItem>
                              <SelectItem value="Regular">Regular</SelectItem>
                              <SelectItem value="Ruim">Ruim</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Textarea
                            placeholder="Descreva avarias..."
                            value={equipamento.avaria}
                            onChange={(e) => updateEquipamento(equipamento.item_id, 'avaria', e.target.value)}
                            className="min-h-20 w-48"
                          />
                        </TableCell>
                        <TableCell>{equipamento.quantidade}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-4 mt-6">
                <Button onClick={handleRegistrarDevolucao} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Registrar Devolução
                </Button>
                <Button variant="outline" onClick={handleCancelar} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}