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
import { generateTermoRetirada, generateTermoDevolucao, generateTermoEntregaEPI } from "@/services/documentService";

interface Equipment {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  quantidade: number;
  epi: boolean;
  estado_conservacao?: string;
  avarias?: string;
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

      // Carregar colaboradores com campos adicionais
      const { data: colabData, error: colabError } = await supabase
        .from('colaboradores')
        .select('id, nome, cargo, razao_social, cnpj, cpf');

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
      setFilteredEquipments(equipments);
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
      const existing = prev.find((item) => item.id === equipmentId);
      if (existing) {
        if (existing.quantity < equipment.quantidade) {
          return prev.map((item) =>
            item.id === equipmentId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return prev;
      } else {
        return [...prev, { id: equipmentId, quantity: 1 }];
      }
    });
  };

  const handleRegistrarRetirada = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0 || !returnDate) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const grupoRetirada = `GRP_${Date.now()}`;
      
      // Criar movimentações para cada equipamento
      const movimentacoes = selectedEquipments.map(selected => ({
        tipo: 'Retirada',
        colaborador_id: selectedEmployee,
        equipamento_id: selected.id,
        grupo_retirada: grupoRetirada,
        quantidade: selected.quantity,
        data_prevista_devolucao: returnDate,
      }));
  
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert(movimentacoes);
  
      if (movError) throw movError;
  
      // Atualizar estoque dos equipamentos
      for (const selected of selectedEquipments) {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            quantidade: equipments.find(eq => eq.id === selected.id)!.quantidade - selected.quantity 
          })
          .eq('id', selected.id);
  
        if (updateError) throw updateError;
      }
  
      // Gerar termo de retirada
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      
      // Obter a lista completa de equipamentos para referência
      const { data: equipamentosData, error: equipError } = await supabase
        .from('equipamentos')
        .select('*');
      
      if (equipError) throw equipError;
      
      // Converter para o tipo Equipment[] para garantir a tipagem correta
      const equipamentos = equipamentosData as Equipment[];
      
      // Prepara os itens para o template
      const itens = equipamentosDetalhes.map(eq => {
        const equipamento = equipamentos.find(e => e.id === eq.id) || eq;
        const quantidade = 'selectedQuantity' in eq ? eq.selectedQuantity : 1;
        
        return {
          id: equipamento.id || '',
          desc: equipamento.descricao || '',
          serie: equipamento.numero_serie || 'N/A',
          avaria: 'avarias' in equipamento ? equipamento.avarias : 'Nenhuma',
          estado: 'estado_conservacao' in equipamento ? equipamento.estado_conservacao : 'Bom',
          qtd: quantidade,
          
          // Mantendo os campos antigos para compatibilidade
          descricao: equipamento.descricao || '',
          quantidade: quantidade,
          numeroSerie: equipamento.numero_serie || 'N/A',
          estado: 'estado_conservacao' in equipamento ? equipamento.estado_conservacao : 'Bom',
          avarias: 'avarias' in equipamento ? equipamento.avarias : 'Nenhuma'
        };
      });

      const dataDocumento = {
        // Dados da empresa (vindos do cadastro do colaborador)
        razao_funcionario: colaborador?.razao_social || '',
        cnpj_funcionario: colaborador?.cnpj || '',
        
        // Dados do colaborador
        nomeColaborador: colaborador?.nome || '',
        cpf_funcionario: colaborador?.cpf || '',
        cargoColaborador: colaborador?.cargo || '',
        
        // Datas
        dataRetirada: new Date().toLocaleDateString('pt-BR'),
        dataDevolucao: new Date(returnDate).toLocaleDateString('pt-BR'),
        
        // Itens para o loop no template
        itens: itens,
        
        // Total de itens
        totalItens: itens.reduce((acc, item) => acc + item.qtd, 0)
      };
  
      // Gerar o documento
      await generateTermoRetirada(dataDocumento);
  
      toast({
        title: "Sucesso",
        description: "Retirada registrada e documento gerado com sucesso!",
      });
  
      // Reset form
      setSelectedEmployee("");
      setReturnDate("");
      setSelectedEquipments([]);
      
      // Recarregar equipamentos
      await loadData();
    } catch (error) {
      console.error('Erro ao registrar retirada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a retirada.",
        variant: "destructive",
      });
    }
  };

  const handleEntregaEPI = async () => {
    console.log('Iniciando geração de termo de entrega de EPI...');
    
    if (!selectedEmployee || selectedEquipments.length === 0) {
      const errorMsg = !selectedEmployee ? 'Nenhum colaborador selecionado' : 'Nenhum equipamento selecionado';
      console.error('Erro de validação:', errorMsg);
      
      toast({
        title: 'Erro',
        description: 'Selecione um colaborador e pelo menos um equipamento EPI.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log('Colaborador selecionado ID:', selectedEmployee);
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      console.log('Dados do colaborador:', colaborador);
      
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      console.log('Equipamentos selecionados:', equipamentosDetalhes);
      
      // Filtrar apenas itens EPI
      const itensEPI = equipamentosDetalhes.filter(item => item.epi);
      console.log('Itens EPI filtrados:', itensEPI);
      
      if (itensEPI.length === 0) {
        console.warn('Nenhum item EPI encontrado nos equipamentos selecionados');
        toast({
          title: 'Aviso',
          description: 'Nenhum item EPI selecionado.',
          variant: 'default',
        });
        return;
      }

      // Prepara os itens para o template
      const itens = itensEPI.map(item => ({
        descricao: item.descricao || '',
        quantidade: item.selectedQuantity || 1,
        numeroSerie: item.numero_serie || 'N/A',
        estado: item.estado_conservacao || 'Bom',
        avarias: item.avarias || 'Nenhuma',
        ca: 'N/A' // Adicionando campo CA para compatibilidade
      }));

      const dataDocumento = {
        // Dados do colaborador
        nomeColaborador: colaborador?.nome || '',
        cargoColaborador: colaborador?.cargo || '',
        
        // Datas
        dataEntrega: new Date().toLocaleDateString('pt-BR'),
        
        // Itens para o loop no template
        itens: itens,
        
        // Total de itens
        totalItens: itens.reduce((acc, item) => acc + item.quantidade, 0)
      };

      console.log('Dados para geração do documento:', dataDocumento);
      
      try {
        console.log('Chamando generateTermoEntregaEPI...');
        await generateTermoEntregaEPI(dataDocumento);
        console.log('Documento gerado com sucesso');
        
        toast({
          title: "Sucesso",
          description: "Termo de Entrega de EPI gerado com sucesso!",
        });
      } catch (docError) {
        console.error('Erro na geração do documento:', docError);
        throw docError; // Re-lança o erro para ser capturado pelo catch externo
      }
      
    } catch (error) {
      console.error('Erro ao gerar termo de entrega de EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o termo de entrega de EPI.",
        variant: "destructive",
      });
    }
  };
  
  const handleRegistrarDevolucao = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione um colaborador e pelo menos um equipamento para devolução.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      
      const dataDocumento = {
        nomeColaborador: colaborador?.nome || '',
        cargoColaborador: colaborador?.cargo || '',
        dataDevolucao: new Date().toLocaleDateString('pt-BR'),
        itens: equipamentosDetalhes.map(item => ({
          descricao: item.descricao || '',
          quantidade: item.selectedQuantity || 0,
          numeroSerie: item.numero_serie || 'N/A',
          estado: 'Em bom estado' // Você pode adicionar um seletor de estado se necessário
        })),
        totalItens: equipamentosDetalhes.reduce((acc, curr) => acc + (curr.selectedQuantity || 0), 0)
      };

      await generateTermoDevolucao(dataDocumento);
      
      toast({
        title: "Sucesso",
        description: "Termo de Devolução gerado com sucesso!",
      });
      
    } catch (error) {
      console.error('Erro ao gerar termo de devolução:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o termo de devolução.",
        variant: "destructive",
      });
    }
  };

  const getSelectedEquipmentDetails = () => {
    return selectedEquipments.map(selected => {
      const equipment = equipments.find(eq => eq.id === selected.id);
      return {
        ...equipment,
        selectedQuantity: selected.quantity
      };
    });
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => 
      prev.filter(item => item.id !== equipmentId)
    );
  };

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