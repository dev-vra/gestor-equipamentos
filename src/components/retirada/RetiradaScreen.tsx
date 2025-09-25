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
import { generateTermoRetirada, generateTermoEntregaEPI } from "@/services/documentService";

// Interfaces (sem alterações)
interface Equipment {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  quantidade: number;
  epi: boolean;
  estado_conservacao?: string;
  avarias?: string;
  ca?: string;
  validade_ca?: string;
}

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  razao_social?: string;
  cnpj?: string;
  cpf?: string;
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

  // As funções de load, filtros e seleção de equipamentos permanecem iguais.
  // ... (código existente omitido por brevidade)

  const loadData = useCallback(async () => {
    try {
      const { data: equipData, error: equipError } = await supabase.from('equipamentos').select('*');
      if (equipError) throw equipError;
      setEquipments(equipData || []);
      setFilteredEquipments(equipData || []);

      const { data: colabData, error: colabError } = await supabase.from('colaboradores').select('id, nome, cargo, razao_social, cnpj, cpf');
      if (colabError) throw colabError;
      setColaboradores(colabData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar os dados.', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEquipments(equipments);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = equipments.filter(
        (equip) =>
          equip.tipo.toLowerCase().includes(lowercasedTerm) ||
          equip.descricao.toLowerCase().includes(lowercasedTerm) ||
          (equip.numero_serie || '').toLowerCase().includes(lowercasedTerm)
      );
      setFilteredEquipments(filtered);
    }
  }, [searchTerm, equipments]);

   const getSelectedEquipmentDetails = () => {
    return selectedEquipments.map(selected => {
      const equipment = equipments.find(eq => eq.id === selected.id);
      if (!equipment) return null;
      return { ...equipment, selectedQuantity: selected.quantity };
    }).filter(Boolean) as (Equipment & { selectedQuantity: number })[];
  };

  const addEquipment = (equipmentId: string) => {
    const equipment = equipments.find((eq) => eq.id === equipmentId);
    if (!equipment) return;
    
    const alreadySelected = selectedEquipments.find(item => item.id === equipmentId);
    const alreadySelectedQuantity = alreadySelected ? alreadySelected.quantity : 0;

    if (equipment.quantidade > alreadySelectedQuantity) {
        setSelectedEquipments((prev) => {
            if (alreadySelected) {
                return prev.map((item) =>
                    item.id === equipmentId ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                return [...prev, { id: equipmentId, quantity: 1 }];
            }
        });
    } else {
        toast({ title: 'Aviso', description: 'Não há mais stock disponível para este item.', variant: 'default' });
    }
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => prev.filter(item => item.id !== equipmentId));
  };


  // ==================================================================
  // ✅ ALTERAÇÕES PRINCIPAIS NAS FUNÇÕES DE REGISTO
  // ==================================================================

  const handleRegistrarRetirada = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0 || !returnDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    try {
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      
      // 1. Gerar um ID de grupo único para esta retirada
      const grupoRetirada = `RET-${Date.now()}`;

      // 2. Criar um array de objetos para inserir no Supabase, um para cada equipamento
      const movimentacoesParaInserir = equipamentosDetalhes.map(equip => ({
        tipo: 'Retirada',
        colaborador_id: selectedEmployee,
        equipamento_id: equip.id, // ID do equipamento específico
        quantidade: equip.selectedQuantity,
        grupo_retirada: grupoRetirada, // Todos partilham o mesmo grupo
        data_movimentacao: new Date().toISOString(),
        data_devolucao: new Date(returnDate + 'T00:00:00').toISOString(),
        status: 'Pendente' // Adicionado para controlo
      }));
      
      // 3. Inserir todas as movimentações de uma vez
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert(movimentacoesParaInserir);

      if (movError) throw movError;

      // 4. Atualizar o stock para cada equipamento
      for (const equip of equipamentosDetalhes) {
          const novoStock = equip.quantidade - equip.selectedQuantity;
          const { error: updateError } = await supabase
              .from('equipamentos')
              .update({ quantidade: novoStock })
              .eq('id', equip.id);
          if (updateError) throw updateError;
      }
      
      // 5. Preparar dados para o documento (continua igual)
      const itensDocumento = equipamentosDetalhes.map(eq => ({
        item_id: (eq.id || '').slice(0, 8),
        item_desc: eq.descricao || '',
        item_serie: eq.numero_serie || 'N/A',
        item_avaria: eq.avarias || 'Nenhuma',
        item_estado: eq.estado_conservacao || 'Bom',
        item_qtd: eq.selectedQuantity
      }));
      
      const dataDocumento = {
        razao_funcionario: colaborador?.razao_social || '',
        cnpj_funcionario: colaborador?.cnpj || '',
        nome_funcionario: colaborador?.nome || '',
        cpf_funcionario: colaborador?.cpf || '',
        funcao_funcionario: colaborador?.cargo || '',
        id_retirada: grupoRetirada,
        data_retirada: new Date().toLocaleDateString('pt-BR'),
        data_devolucao_prevista: new Date(returnDate + 'T00:00:00').toLocaleDateString('pt-BR'),
        itens: itensDocumento
      };

      await generateTermoRetirada(dataDocumento);
 
      toast({ title: "Sucesso", description: `Retirada do grupo ${grupoRetirada} registada com sucesso!` });
      
      setSelectedEmployee("");
      setReturnDate("");
      setSelectedEquipments([]);
      await loadData();

    } catch (error) {
      console.error('Erro ao registar retirada:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({ title: "Erro", description: `Não foi possível registar a retirada: ${errorMessage}`, variant: "destructive" });
    }
  };

  const handleEntregaEPI = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0) {
      toast({ title: 'Erro', description: 'Selecione um colaborador e pelo menos um equipamento EPI.', variant: 'destructive' });
      return;
    }

    try {
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      const itensEPI = equipamentosDetalhes.filter(item => item.epi);

      if (itensEPI.length === 0) {
        toast({ title: 'Aviso', description: 'Nenhum item EPI selecionado.', variant: 'default' });
        return;
      }
      
      const grupoEntrega = `EPI-${Date.now()}`;

      // 1. Criar movimentações individuais para cada EPI entregue
      const movimentacoesEPIParaInserir = itensEPI.map(item => ({
        tipo: 'Entrega_EPI',
        colaborador_id: selectedEmployee,
        equipamento_id: item.id,
        quantidade: item.selectedQuantity,
        grupo_retirada: grupoEntrega, // Usar o mesmo campo para agrupar
        data_movimentacao: new Date().toISOString(),
        status: 'Pendente'
      }));

      // 2. Inserir no Supabase
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert(movimentacoesEPIParaInserir);

      if (movError) throw movError;
      
      // 3. Atualizar o stock para cada EPI
      for (const item of itensEPI) {
          const novoStock = item.quantidade - item.selectedQuantity;
          const { error: updateError } = await supabase
              .from('equipamentos')
              .update({ quantidade: novoStock })
              .eq('id', item.id);
          if (updateError) throw updateError;
      }
      
      // 4. Preparar dados para o documento
      const itensDocumento = itensEPI.map(item => ({
        epi_descricao: item.descricao || '',
        epi_ca: item.ca || 'N/A',
        epi_validade: item.validade_ca || 'N/A',
        epi_qtd: item.selectedQuantity || 0,
      }));

      const dataDocumento = {
        razao_funcionario: colaborador?.razao_social || '',
        cnpj_funcionario: colaborador?.cnpj || '',
        nome_funcionario: colaborador?.nome || '',
        cpf_funcionario: colaborador?.cpf || '',
        funcao_funcionario: colaborador?.cargo || '',
        data_entrega: new Date().toLocaleDateString('pt-BR'),
        itens: itensDocumento
      };

      await generateTermoEntregaEPI(dataDocumento);
      
      toast({ title: "Sucesso", description: "Entrega de EPI registada com sucesso!" });
      
      setSelectedEmployee("");
      setSelectedEquipments([]);
      await loadData();
      
    } catch (error) {
      console.error('Erro ao registar entrega de EPI:', error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      toast({ title: "Erro", description: `Não foi possível registar a entrega de EPI: ${errorMessage}`, variant: "destructive" });
    }
  };


  // O JSX (return) permanece o mesmo
  return (
    <div className="min-h-screen bg-background">
      <Header title="Registar Retirada" showBackButton onBack={onBack} />
      
      <div className="container mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Procurar equipamentos..."
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
                        <TableHead>Stock</TableHead>
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
                              disabled={equipment.quantidade <= (selectedEquipments.find(s => s.id === equipment.id)?.quantity || 0)}
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

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-4">Dados da Retirada</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Colaborador *</label>
                    <Select 
                      value={selectedEmployee} 
                      onValueChange={setSelectedEmployee}
                    >
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
                    <label className="text-sm font-medium mb-2 block">Data Prevista de Devolução *</label>
                    <Input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  {selectedEmployee && (
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="text-sm font-medium">Dados do Colaborador:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Razão Social: <span className="font-medium">{colaboradores.find(c => c.id === selectedEmployee)?.razao_social || 'Não informado'}</span></div>
                        <div>CNPJ: <span className="font-medium">{colaboradores.find(c => c.id === selectedEmployee)?.cnpj || 'Não informado'}</span></div>
                        <div>CPF: <span className="font-medium">{colaboradores.find(c => c.id === selectedEmployee)?.cpf || 'Não informado'}</span></div>
                        <div>Cargo: <span className="font-medium">{colaboradores.find(c => c.id === selectedEmployee)?.cargo || 'Não informado'}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

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

            <div className="space-y-3">
              <Button 
                className="w-full" 
                onClick={handleRegistrarRetirada}
                disabled={!selectedEmployee || selectedEquipments.length === 0 || !returnDate}
              >
                <FileText className="h-4 w-4 mr-2" />
                Registar Retirada
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
