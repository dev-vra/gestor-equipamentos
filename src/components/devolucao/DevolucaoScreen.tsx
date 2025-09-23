import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Package } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateTermoDevolucao } from "@/services/documentService";

interface Movimentacao {
  id: string;
  data_movimentacao: string;
  colaborador_id: string;
  equipamento_id: string;
  grupo_retirada: string;
  quantidade: number;
  colaboradores?: {
    nome: string;
  };
  equipamentos?: {
    tipo: string;
    descricao: string;
  };
}

interface EquipmentoDevolucao {
  movimentacao_id: string;
  equipamento_id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  estado_conservacao: string;
  avarias: string;
  quantidade: number;
}

interface DevolucaoScreenProps {
  onBack: () => void;
}

export function DevolucaoScreen({ onBack }: DevolucaoScreenProps) {
  const [selectedRetirada, setSelectedRetirada] = useState<string>("");
  const [equipamentosDevolucao, setEquipamentosDevolucao] = useState<EquipmentoDevolucao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const { toast } = useToast();

  const loadMovimentacoes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          colaboradores:colaborador_id(nome),
          equipamentos:equipamento_id(tipo, descricao, numero_serie)
        `)
        .eq('tipo', 'Retirada')
        .order('data_movimentacao', { ascending: false });
      
      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadMovimentacoes();
  }, [loadMovimentacoes]);

  const handleSelectRetirada = async (retiradaId: string) => {
    setSelectedRetirada(retiradaId);
    
    try {
      // Buscar equipamentos da movimentação selecionada
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          id,
          equipamento_id,
          quantidade,
          equipamentos:equipamento_id(tipo, descricao, numero_serie)
        `)
        .eq('id', retiradaId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const equipamentos: EquipmentoDevolucao[] = data.map(item => ({
          movimentacao_id: item.id,
          equipamento_id: item.equipamento_id,
          tipo: item.equipamentos?.tipo || '',
          descricao: item.equipamentos?.descricao || '',
          numero_serie: item.equipamentos?.numero_serie || '',
          estado_conservacao: 'Bom',
          avarias: '',
          quantidade: item.quantidade,
        }));
        
        setEquipamentosDevolucao(equipamentos);
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos da retirada:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos da retirada.",
        variant: "destructive",
      });
    }
  };

  const updateEquipamento = (equipamentoId: string, field: keyof EquipmentoDevolucao, value: string) => {
    setEquipamentosDevolucao(prev =>
      prev.map(equip =>
        equip.equipamento_id === equipamentoId ? { ...equip, [field]: value } : equip
      )
    );
  };

  const handleRegistrarDevolucao = async () => {
    console.log('Iniciando registro de devolução...');
    console.log('Retirada selecionada:', selectedRetirada);
    console.log('Equipamentos para devolução:', equipamentosDevolucao);
    
    if (!selectedRetirada || equipamentosDevolucao.length === 0) {
      const errorMsg = !selectedRetirada ? 'Nenhuma retirada selecionada' : 'Nenhum equipamento para devolução';
      console.error('Erro de validação:', errorMsg);
      
      toast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    try {
      // Encontrar a movimentação de retirada selecionada
      const movimentacaoRetirada = movimentacoes.find(m => m.id === selectedRetirada);
      
      if (!movimentacaoRetirada) {
        throw new Error('Movimentação de retirada não encontrada');
      }
      
      console.log('Movimentação de retirada encontrada:', movimentacaoRetirada);
      
      // Criar movimentações de devolução
      const devolucoes = equipamentosDevolucao.map(eq => ({
        tipo: 'Devolucao',
        colaborador_id: movimentacaoRetirada.colaborador_id,
        equipamento_id: eq.equipamento_id,
        grupo_retirada: movimentacaoRetirada.grupo_retirada,
        quantidade: eq.quantidade,
        estado_conservacao: eq.estado_conservacao,
        avarias: eq.avarias,
        data_movimentacao: new Date().toISOString()
      }));

      console.log('Registrando devolução no banco de dados...');
      const { data, error: devolucaoError } = await supabase
        .from('movimentacoes')
        .insert(devolucoes)
        .select();

      if (devolucaoError) {
        console.error('Erro ao registrar devolução:', devolucaoError);
        throw devolucaoError;
      }
      
      console.log('Devolução registrada com sucesso:', data);

      // Atualizar estoque dos equipamentos
      console.log('Atualizando estoque dos equipamentos...');
      for (const eq of equipamentosDevolucao) {
        console.log(`Atualizando equipamento ID: ${eq.equipamento_id}`);
        
        // Buscar quantidade atual do equipamento
        console.log('Buscando quantidade atual do equipamento...');
        const { data: equipData, error: equipError } = await supabase
          .from('equipamentos')
          .select('quantidade, estado_conservacao, avarias')
          .eq('id', eq.equipamento_id)
          .single();

        if (equipError) {
          console.error('Erro ao buscar equipamento:', equipError);
          throw equipError;
        }
        
        console.log('Dados atuais do equipamento:', equipData);
        
        // Atualizar quantidade
        console.log('Atualizando quantidade e estado do equipamento...');
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            quantidade: (equipData.quantidade || 0) + eq.quantidade,
            estado_conservacao: eq.estado_conservacao || equipData.estado_conservacao,
            avarias: eq.avarias || equipData.avarias
          })
          .eq('id', eq.equipamento_id);

        if (updateError) {
          console.error('Erro ao atualizar equipamento:', updateError);
          throw updateError;
        }
        
        console.log('Equipamento atualizado com sucesso');
      }

      toast({
        title: "Sucesso",
        description: "Devolução registrada com sucesso!",
      });

      // Reset form
      handleCancelar();
      
      // Reutilizando a variável movimentacaoRetirada que já foi definida anteriormente
      if (movimentacaoRetirada) {
        const documentData = {
          nomeColaborador: movimentacaoRetirada.colaboradores?.nome || 'Nome não disponível',
          dataDevolucao: new Date().toLocaleDateString('pt-BR'),
          itens: equipamentosDevolucao.map(eq => ({
            descricao: eq.descricao,
            quantidade: eq.quantidade,
            numeroSerie: eq.numero_serie,
            estado: eq.estado_conservacao
          })),
          totalItens: equipamentosDevolucao.reduce((acc, curr) => acc + curr.quantidade, 0)
        };
        
        console.log('Gerando termo de devolução com dados:', documentData);
        await generateTermoDevolucao(documentData);
      }
      
      // Recarregar movimentações
      await loadMovimentacoes();
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a devolução.",
        variant: "destructive",
      });
    }
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
                    <TableHead>Equipamento</TableHead>
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
                      <TableCell className="font-medium">{movimentacao.id.slice(0, 8)}</TableCell>
                      <TableCell>{new Date(movimentacao.data_movimentacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{movimentacao.colaboradores?.nome}</TableCell>
                      <TableCell>{movimentacao.equipamentos?.tipo}</TableCell>
                      <TableCell>{movimentacao.grupo_retirada}</TableCell>
                      <TableCell>{movimentacao.quantidade}</TableCell>
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
                      <TableRow key={equipamento.equipamento_id}>
                        <TableCell className="font-medium">{equipamento.tipo}</TableCell>
                        <TableCell>{equipamento.descricao}</TableCell>
                        <TableCell>{equipamento.numero_serie}</TableCell>
                        <TableCell>
                          <Select 
                            value={equipamento.estado_conservacao}
                            onValueChange={(value) => updateEquipamento(equipamento.equipamento_id, 'estado_conservacao', value)}
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
                            value={equipamento.avarias}
                            onChange={(e) => updateEquipamento(equipamento.equipamento_id, 'avarias', e.target.value)}
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