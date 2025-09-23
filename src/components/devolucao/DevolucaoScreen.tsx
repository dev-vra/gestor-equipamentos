import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Package } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    loadMovimentacoes();
  }, []);

  const loadMovimentacoes = async () => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          colaboradores:colaborador_id(nome),
          equipamentos:equipamento_id(tipo, descricao)
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
  };

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
      prev.map(eq =>
        eq.equipamento_id === equipamentoId ? { ...eq, [field]: value } : eq
      )
    );
  };

  const handleRegistrarDevolucao = async () => {
    if (!selectedRetirada || equipamentosDevolucao.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma retirada e configure os equipamentos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar movimentações de devolução
      const devolucoes = equipamentosDevolucao.map(eq => ({
        tipo: 'Devolucao',
        colaborador_id: movimentacoes.find(m => m.id === selectedRetirada)?.colaborador_id,
        equipamento_id: eq.equipamento_id,
        grupo_retirada: movimentacoes.find(m => m.id === selectedRetirada)?.grupo_retirada,
        quantidade: eq.quantidade,
        estado_conservacao: eq.estado_conservacao,
        avarias: eq.avarias,
      }));

      const { error: devolucaoError } = await supabase
        .from('movimentacoes')
        .insert(devolucoes);

      if (devolucaoError) throw devolucaoError;

      // Atualizar estoque dos equipamentos
      for (const eq of equipamentosDevolucao) {
        // Buscar quantidade atual do equipamento
        const { data: equipData, error: equipError } = await supabase
          .from('equipamentos')
          .select('quantidade')
          .eq('id', eq.equipamento_id)
          .single();

        if (equipError) throw equipError;

        // Atualizar quantidade
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            quantidade: equipData.quantidade + eq.quantidade,
            estado_conservacao: eq.estado_conservacao,
            avarias: eq.avarias
          })
          .eq('id', eq.equipamento_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: "Devolução registrada com sucesso!",
      });

      // Reset form
      handleCancelar();
      
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