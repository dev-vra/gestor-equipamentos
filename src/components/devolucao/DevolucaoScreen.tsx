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
  equipamentos?: {
    tipo: string;
    descricao: string;
    numero_serie: string;
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

  const handleSelectRetirada = (retiradaId: string) => {
    setSelectedRetiradaId(retiradaId);
    const retiradaSelecionada = movimentacoes.find(m => m.id === retiradaId);
    if (retiradaSelecionada && retiradaSelecionada.equipamentos) {
      const equipamento: EquipmentoDevolucao = {
        movimentacao_id: retiradaSelecionada.id,
        equipamento_id: retiradaSelecionada.equipamento_id,
        tipo: retiradaSelecionada.equipamentos.tipo || '',
        descricao: retiradaSelecionada.equipamentos.descricao || '',
        numero_serie: retiradaSelecionada.equipamentos.numero_serie || '',
        estado_conservacao: 'Bom',
        avarias: '',
        quantidade: retiradaSelecionada.quantidade,
      };
      setEquipamentosDevolucao([equipamento]);
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
      const movimentacaoRetirada = movimentacoes.find(m => m.id === selectedRetiradaId);
      if (!movimentacaoRetirada || !movimentacaoRetirada.colaboradores) {
        throw new Error('Dados da retirada original ou do colaborador não encontrados.');
      }
      
      // Lógica de BD (mantida como referência)
      // ... a sua lógica para inserir 'Devolucao' e atualizar o stock vai aqui

      const itens = equipamentosDevolucao.map(eq => ({
        // Adicionada uma verificação (|| '') para segurança.
        item_id: (eq.equipamento_id || '').slice(0, 8), 
        item_desc: eq.descricao,
        item_serie: eq.numero_serie,
        novas_avarias: eq.avarias || 'Nenhuma',
        novo_estado: eq.estado_conservacao,
        item_qtd: eq.quantidade
      }));

      const documentData = {
        razao_funcionario: movimentacaoRetirada.colaboradores.razao_social || '',
        cnpj_funcionario: movimentacaoRetirada.colaboradores.cnpj || '',
        nome_funcionario: movimentacaoRetirada.colaboradores.nome || '',
        cpf_funcionario: movimentacaoRetirada.colaboradores.cpf || '',
        funcao_funcionario: movimentacaoRetirada.colaboradores.cargo || '',
        id_retirada: (movimentacaoRetirada.id || '').slice(0, 8),
        data_devolucao_efetiva: new Date().toLocaleDateString('pt-BR'),
        itens: itens,
      };
        
      await generateTermoDevolucao(documentData);
      
      toast({ title: "Sucesso", description: "Devolução registada e documento gerado com sucesso!" });

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

  // O JSX (return) permanece o mesmo
  return (
    <div className="min-h-screen bg-background">
      <Header title="Registar Devolução" showBackButton onBack={onBack} />
      
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
                    <TableHead>ID</TableHead>
                    <TableHead>Data Retirada</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.map((movimentacao) => (
                    <TableRow 
                      key={movimentacao.id}
                      className={selectedRetiradaId === movimentacao.id ? "bg-primary/5 border-primary/20" : ""}
                    >
                      <TableCell className="font-medium">{movimentacao.id.slice(0, 8)}</TableCell>
                      <TableCell>{new Date(movimentacao.data_movimentacao).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{movimentacao.colaboradores?.nome}</TableCell>
                      <TableCell>{movimentacao.equipamentos?.descricao}</TableCell>
                      <TableCell>{movimentacao.grupo_retirada}</TableCell>
                      <TableCell>{movimentacao.quantidade}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          variant={selectedRetiradaId === movimentacao.id ? "default" : "outline"}
                          onClick={() => handleSelectRetirada(movimentacao.id)}
                        >
                          {selectedRetiradaId === movimentacao.id ? "Selecionado" : "Selecionar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
