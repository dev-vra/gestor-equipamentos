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

// Interfaces
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

// O componente permanece o mesmo, com alterações na função handleEntregaEPI
export function RetiradaScreen({ onBack }: RetiradaScreenProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<{id: string, quantity: number}[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const { toast } = useToast();
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);

  const loadData = useCallback(async () => {
    try {
      console.log('Iniciando carregamento de dados de equipamentos...');
      
      // Verificar se o Supabase está configurado corretamente
      if (!supabase) {
        console.error('Erro: Supabase não está configurado corretamente');
        throw new Error('Erro na configuração do banco de dados');
      }
      
      // Consulta para obter os equipamentos
      console.log('Executando consulta no banco de dados...');
      
      // Buscar os dados dos equipamentos incluindo as colunas canum e validade
      const { data: equipData, error: equipError } = await supabase
        .from('equipamentos')
        .select('id, tipo, descricao, numero_serie, quantidade, epi, estado_conservacao, avarias, canum, validade')
        .order('tipo', { ascending: true });
      
      if (equipError) {
        console.error('Erro ao buscar equipamentos:', equipError);
        throw equipError;
      }
      
      // Mapear os campos para os nomes esperados pelo restante do código
      const equipamentosComCA = equipData.map(equip => ({
        ...equip,
        // Mapear canum para ca e manter o valor original
        ca: equip.canum || 'Não informado',
        // Mapear validade para validade_ca e formatar a data se existir
        validade_ca: equip.validade ? new Date(equip.validade).toLocaleDateString('pt-BR') : 'Não informada'
      }));
      
      console.log('Estrutura dos dados de equipamentos:', equipamentosComCA.length > 0 ? Object.keys(equipamentosComCA[0]) : 'Nenhum equipamento encontrado');
      
      // Verificar se há dados retornados
      if (!equipData || equipData.length === 0) {
        console.warn('Nenhum equipamento encontrado na tabela "equipamentos"');
      } else {
        console.log(`Dados dos equipamentos carregados (${equipData.length} itens):`, equipData);
        // Verificar se os campos ca e validade_ca estão presentes nos dados
        equipData.forEach((equip, index) => {
          console.log(`Equipamento ${index + 1}:`, {
            tipo: equip.tipo,
            descricao: equip.descricao,
            temCA: 'ca' in equip,
            ca: equip.ca,
            temValidadeCA: 'validade_ca' in equip,
            validade_ca: equip.validade_ca
          });
        });
      }
      
      // Atualizar o estado com os dados carregados
      setEquipments(equipamentosComCA || []);
      setFilteredEquipments(equipamentosComCA || []);

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
  
  // A função de Retirada permanece igual, pois já estava correta
  const handleRegistrarRetirada = async () => {
    if (!selectedEmployee || selectedEquipments.length === 0 || !returnDate) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    try {
      const colaborador = colaboradores.find(c => c.id === selectedEmployee);
      const equipamentosDetalhes = getSelectedEquipmentDetails();
      
      const itens = equipamentosDetalhes.map(eq => ({
        id: eq.id || '',
        descricao: eq.descricao || '',
        numeroSerie: eq.numero_serie || 'N/A',
        avarias: eq.avarias || 'Nenhuma',
        estado: eq.estado_conservacao || 'Bom',
        quantidade: eq.selectedQuantity || 1,
      }));

      const dataDocumento = {
        razao_funcionario: colaborador?.razao_social || '',
        cnpj_funcionario: colaborador?.cnpj || '',
        nomeColaborador: colaborador?.nome || '',
        cpf_funcionario: colaborador?.cpf || '',
        cargoColaborador: colaborador?.cargo || '',
        dataRetirada: new Date().toISOString(),
        dataDevolucao: new Date(returnDate + 'T00:00:00').toISOString(),
        itens: itens,
        totalItens: itens.reduce((acc, item) => acc + item.quantidade, 0)
      };

      // Atualizar o estoque no Supabase
      const updates = equipamentosDetalhes.map(async (equip) => {
        const { data, error } = await supabase
          .from('equipamentos')
          .update({ quantidade: equip.quantidade - (equip.selectedQuantity || 1) })
          .eq('id', equip.id);
        
        if (error) throw error;
        return data;
      });

      // Aguardar a conclusão de todas as promessas de atualização
      await Promise.all(updates);

      // Registrar a movimentação
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert([{
          tipo: 'saida',
          colaborador_id: selectedEmployee,
          data_movimentacao: new Date().toISOString(),
          data_devolucao: new Date(returnDate + 'T00:00:00').toISOString(),
          itens: itens,
          status: 'pendente'
        }]);

      if (movError) throw movError;
 
      // Gerar o documento após as atualizações no banco de dados
      await generateTermoRetirada({
        ...dataDocumento,
        dataRetirada: new Date().toLocaleDateString('pt-BR'),
        dataDevolucao: new Date(returnDate + 'T00:00:00').toLocaleDateString('pt-BR')
      });
 
      toast({ title: "Sucesso", description: "Retirada registada e documento gerado com sucesso!" });
      
      setSelectedEmployee("");
      setReturnDate("");
      setSelectedEquipments([]);
      await loadData();

    } catch (error) {
      console.error('Erro ao registar retirada:', error);
      toast({ 
        title: "Erro", 
        description: `Não foi possível registar a retirada: ${error.message}`, 
        variant: "destructive" 
      });
    }
  };


  // ==================================================================
  // ✅ FUNÇÃO handleEntregaEPI COM CORREÇÃO APLICADA
  // ==================================================================
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
      
      // Formatando os itens para o template e para o banco de dados
      const itens = itensEPI.map(item => ({
        // Campos usados no template
        epi_descricao: item.descricao || '',
        epi_ca: item.ca || 'Não informado',
        epi_validade: item.validade_ca ? new Date(item.validade_ca).toLocaleDateString('pt-BR') : 'Não informada',
        epi_qtd: item.selectedQuantity || 0,
        
        // Garantindo que os campos estejam no nível raiz do item para compatibilidade
        id: item.id,
        ca: item.ca || 'Não informado',
        validade_ca: item.validade_ca ? new Date(item.validade_ca).toLocaleDateString('pt-BR') : 'Não informada',
        quantidade: item.selectedQuantity || 0,
        tipo: item.tipo || ''
      }));
      
      console.log('Itens formatados para o documento:', JSON.stringify(itens, null, 2));

      // Atualizar o estoque no Supabase
      const updates = itensEPI.map(async (equip) => {
        const { data, error } = await supabase
          .from('equipamentos')
          .update({ quantidade: equip.quantidade - (equip.selectedQuantity || 1) })
          .eq('id', equip.id);
        
        if (error) throw error;
        return data;
      });

      // ✅ CORREÇÃO: Aguardar a conclusão de todas as promessas de atualização
      await Promise.all(updates);

      // Registrar a entrega de EPI na tabela de movimentações
      const { error: movError } = await supabase
        .from('movimentacoes')
        .insert([{
          tipo: 'entrega_epi',
          colaborador_id: selectedEmployee,
          data_movimentacao: new Date().toISOString(),
          itens: itens.map(item => ({
            id: item.id,
            descricao: item.epi_descricao,
            quantidade: item.epi_qtd,
            ca: item.epi_ca,
            validade: item.epi_validade
          })),
          status: 'entregue'
        }]);

      if (movError) throw movError;

      const dataDocumento = {
        razao_funcionario: colaborador?.razao_social || '',
        cnpj_funcionario: colaborador?.cnpj || '',
        nome_funcionario: colaborador?.nome || '',
        cpf_funcionario: colaborador?.cpf || '',
        funcao_funcionario: colaborador?.cargo || '',
        data_entrega: new Date().toLocaleDateString('pt-BR'),
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        itens: itens,
        total_itens: itens.reduce((total, item) => total + (item.epi_qtd || 0), 0)
      };
      
      console.log('Dados enviados para o documento:', JSON.stringify(dataDocumento, null, 2));
      
      // Gerar o documento após as atualizações no banco de dados
      await generateTermoEntregaEPI(dataDocumento);
      
      toast({ 
        title: "Sucesso", 
        description: "Entrega de EPI registrada e documento gerado com sucesso!" 
      });
      
      // Limpar seleção após gerar o documento
      setSelectedEmployee("");
      setSelectedEquipments([]);
      await loadData(); // Recarregar os dados para atualizar a lista de equipamentos
      
    } catch (error) {
      console.error('Erro ao registrar entrega de EPI:', error);
      toast({ 
        title: "Erro", 
        description: `Não foi possível registrar a entrega de EPI: ${error.message}`, 
        variant: "destructive" 
      });
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