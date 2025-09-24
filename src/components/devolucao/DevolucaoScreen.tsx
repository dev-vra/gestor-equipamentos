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

// Interfaces (sem alterações)
interface Equipamento {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  quantidade: number;
  estado_conservacao?: string;
  avarias?: string;
}

interface Movimentacao {
  id: string;
  data_movimentacao: string;
  colaborador_id: string;
  equipamento_id: string;
  grupo_retirada: string;
  quantidade: number;
  colaboradores?: {
    nome: string;
    cargo: string;
    razao_social: string;
    cnpj: string;
    cpf: string;
  };
  equipamentos?: Equipamento;
  equipamento?: Equipamento; // Adicionando para compatibilidade
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
  grupo_retirada: string;
  data_retirada: string;
  colaborador_nome: string;
  colaborador_cargo: string;
}

interface DevolucaoScreenProps {
  onBack: () => void;
}

export function DevolucaoScreen({ onBack }: DevolucaoScreenProps) {
  const [selectedRetiradaId, setSelectedRetiradaId] = useState<string>("");
  const [equipamentosDevolucao, setEquipamentosDevolucao] = useState<EquipmentoDevolucao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const { toast } = useToast();

  // ==================================================================
  // ✅ ALTERAÇÃO NA FUNÇÃO loadMovimentacoes
  // ==================================================================
  const loadMovimentacoes = useCallback(async () => {
    try {
      // O campo 'equipamento_id' foi adicionado à consulta.
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          id, data_movimentacao, grupo_retirada, quantidade, equipamento_id, colaborador_id,
          colaboradores:colaborador_id(nome, cargo, razao_social, cnpj, cpf),
          equipamentos:equipamento_id(tipo, descricao, numero_serie)
        `)
        .eq('tipo', 'Retirada')
        .order('data_movimentacao', { ascending: false });
      
      if (error) throw error;
      setMovimentacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({ title: "Erro", description: "Não foi possível carregar as movimentações.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { loadMovimentacoes(); }, [loadMovimentacoes]);

  const handleSelectRetirada = (grupoRetirada: string) => {
    setSelectedRetiradaId(grupoRetirada);
    
    // Filtrar todas as movimentações do mesmo grupo
    const movimentacoesDoGrupo = movimentacoes.filter(m => m.grupo_retirada === grupoRetirada);
    
    if (movimentacoesDoGrupo.length > 0) {
      const primeiroItem = movimentacoesDoGrupo[0];
      const colaborador = primeiroItem.colaboradores;
      
      const equipamentos: EquipmentoDevolucao[] = movimentacoesDoGrupo.map(mov => ({
        movimentacao_id: mov.id,
        equipamento_id: mov.equipamento_id,
        tipo: mov.equipamentos?.tipo || '',
        descricao: mov.equipamentos?.descricao || '',
        numero_serie: mov.equipamentos?.numero_serie || '',
        estado_conservacao: mov.equipamentos?.estado_conservacao || 'Bom',
        avarias: mov.equipamentos?.avarias || '',
        quantidade: mov.quantidade,
        grupo_retirada: mov.grupo_retirada,
        data_retirada: mov.data_movimentacao,
        colaborador_nome: colaborador?.nome || '',
        colaborador_cargo: colaborador?.cargo || ''
      }));
      
      setEquipamentosDevolucao(equipamentos);
    } else {
      setEquipamentosDevolucao([]);
    }
  };
  
  const updateEquipamento = (equipamentoId: string, field: keyof EquipmentoDevolucao, value: string) => {
    setEquipamentosDevolucao(prev =>
      prev.map(equip =>
        equip.equipamento_id === equipamentoId ? { ...equip, [field]: value } : equip
      )
    );
  };

  // ==================================================================
  // ✅ ALTERAÇÃO NA FUNÇÃO handleRegistrarDevolucao
  // ==================================================================
  const handleRegistrarDevolucao = async () => {
    if (!selectedRetiradaId || equipamentosDevolucao.length === 0) {
      toast({ title: "Erro", description: "Selecione uma retirada e confirme os equipamentos para devolução.", variant: "destructive" });
      return;
    }

    try {
      const movimentacoesDoGrupo = movimentacoes.filter(m => m.grupo_retirada === selectedRetiradaId);
      
      if (movimentacoesDoGrupo.length === 0) {
        throw new Error('Nenhuma movimentação encontrada para este grupo de retirada.');
      }

      const primeiroItem = movimentacoesDoGrupo[0];
      const colaborador = primeiroItem.colaboradores;
      
      if (!colaborador) {
        throw new Error('Dados do colaborador não encontrados.');
      }

      // Criar movimentações de devolução para cada item
      const devolucoes = equipamentosDevolucao.map(equip => ({
        tipo: 'Devolucao',
        colaborador_id: primeiroItem.colaborador_id,
        equipamento_id: equip.equipamento_id,
        grupo_retirada: selectedRetiradaId,
        quantidade: equip.quantidade,
        estado_conservacao: equip.estado_conservacao,
        avarias: equip.avarias,
        data_movimentacao: new Date().toISOString()
      }));

      // Inserir as devoluções
      const { error: devolucaoError } = await supabase
        .from('movimentacoes')
        .insert(devolucoes);

      if (devolucaoError) throw devolucaoError;

      // Atualizar o estoque e estado dos equipamentos
      for (const equip of equipamentosDevolucao) {
        // Buscar quantidade atual
        const { data: equipamentoAtual, error: fetchError } = await supabase
          .from('equipamentos')
          .select('quantidade')
          .eq('id', equip.equipamento_id)
          .single();

        if (fetchError) throw fetchError;

        // Atualizar quantidade e estado
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({
            quantidade: (equipamentoAtual?.quantidade || 0) + equip.quantidade,
            estado_conservacao: equip.estado_conservacao,
            avarias: equip.avarias
          })
          .eq('id', equip.equipamento_id);

        if (updateError) throw updateError;
      }

      // Preparar dados para o documento
      const itens = equipamentosDevolucao.map(eq => ({
        item_id: eq.equipamento_id.slice(0, 8),
        item_desc: eq.descricao,
        item_serie: eq.numero_serie,
        novas_avarias: eq.avarias || 'Nenhuma',
        novo_estado: eq.estado_conservacao,
        item_qtd: eq.quantidade
      }));

      const documentData = {
        razao_funcionario: colaborador.razao_social || '',
        cnpj_funcionario: colaborador.cnpj || '',
        nome_funcionario: colaborador.nome || '',
        cpf_funcionario: colaborador.cpf || '',
        funcao_funcionario: colaborador.cargo || '',
        id_retirada: selectedRetiradaId,
        data_devolucao_efetiva: new Date().toLocaleDateString('pt-BR'),
        itens: itens,
      };
        
      // Gerar o documento de devolução
      await generateTermoDevolucao(documentData);
      
      toast({ 
        title: "Sucesso", 
        description: `Devolução do grupo ${selectedRetiradaId} registrada com sucesso!` 
      });

      // Limpar seleção e recarregar
      handleCancelar();
      await loadMovimentacoes();
    } catch (error) {
      console.error('Erro ao registar devolução:', error);
      toast({ title: "Erro", description: "Não foi possível registar a devolução.", variant: "destructive" });
    }
  };

  const handleCancelar = () => {
    setSelectedRetiradaId("");
    setEquipamentosDevolucao([]);
  };

  // Agrupar movimentações por grupo_retirada
  const gruposUnicos = Array.from(
    new Set(movimentacoes.map(m => m.grupo_retirada))
  );

  // Obter detalhes do grupo selecionado
  const grupoSelecionado = movimentacoes.find(m => m.grupo_retirada === selectedRetiradaId);
  
  return (
    <div className="min-h-screen bg-background">
      <Header title="Registrar Devolução" showBackButton onBack={onBack} />
      
      <div className="container mx-auto p-6 space-y-6">
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
                    <TableHead>Grupo de Retirada</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Equipamentos</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gruposUnicos.map((grupo) => {
                    const primeiraMov = movimentacoes.find(m => m.grupo_retirada === grupo);
                    const totalItens = movimentacoes
                      .filter(m => m.grupo_retirada === grupo)
                      .reduce((acc, curr) => acc + curr.quantidade, 0);
                    
                    return (
                      <TableRow 
                        key={grupo}
                        className={selectedRetiradaId === grupo ? "bg-primary/5 border-primary/20" : ""}
                      >
                        <TableCell className="font-medium">{grupo}</TableCell>
                        <TableCell>
                          {primeiraMov ? new Date(primeiraMov.data_movimentacao).toLocaleDateString('pt-BR') : ''}
                        </TableCell>
                        <TableCell>{primeiraMov?.colaboradores?.nome}</TableCell>
                        <TableCell>
                          {movimentacoes
                            .filter(m => m.grupo_retirada === grupo)
                            .map(m => `${m.quantidade}x ${m.equipamentos?.descricao}`)
                            .join(', ')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedRetiradaId === grupo ? "default" : "outline"}
                            onClick={() => handleSelectRetirada(grupo)}
                          >
                            {selectedRetiradaId === grupo ? "Selecionado" : "Selecionar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>

        {selectedRetiradaId && (
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
                  Registar Devolução
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
