import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shield, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Equipamento {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  estado_conservacao: string;
  avarias: string;
  quantidade: number;
  created_at: string;
  updated_at: string;
  epi: boolean;
  canum?: string;
  tamanho?: string;
  validade?: string;
}

export function EquipamentosTab() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipamento, setEditingEquipamento] = useState<Equipamento | null>(null);
  
  const [formData, setFormData] = useState<Partial<Equipamento>>({
    tipo: "",
    descricao: "",
    numero_serie: "",
    estado_conservacao: "Bom",
    avarias: "",
    quantidade: 1,
    epi: false,
    canum: "",
    tamanho: "",
    validade: ""
  });

  useEffect(() => {
    loadEquipamentos();
  }, []);

  const loadEquipamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('*')
        .order('tipo');
      
      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os equipamentos.",
        variant: "destructive",
      });
    }
  };

  const filteredEquipamentos = equipamentos.filter(eq => 
    eq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.numero_serie || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      tipo: "",
      descricao: "",
      numero_serie: "",
      estado_conservacao: "Bom",
      avarias: "",
      quantidade: 1,
      epi: false,
      canum: "",
      tamanho: "",
      validade: ""
    });
    setEditingEquipamento(null);
  };

  const handleSubmit = async () => {
    try {
      // Validações básicas
      if (!formData.tipo || !formData.descricao) {
        toast({ title: "Erro", description: "Tipo e Descrição são campos obrigatórios.", variant: "destructive" });
        return;
      }

      // Validação condicional para EPI
      if (formData.epi) {
        if (!formData.canum || !formData.validade) {
          toast({ title: "Erro", description: "Para EPIs, o CA e a Validade são obrigatórios.", variant: "destructive" });
          return;
        }
      }

      const dataToSave = { ...formData };
      // Limpar campos de EPI se a opção não estiver marcada
      if (!dataToSave.epi) {
          dataToSave.canum = undefined;
          dataToSave.tamanho = undefined;
          dataToSave.validade = undefined;
      }

      if (editingEquipamento) {
        // Editar equipamento existente
        const { error } = await supabase
          .from('equipamentos')
          .update(dataToSave)
          .eq('id', editingEquipamento.id);
          
        if (error) throw error;
        toast({ title: "Sucesso", description: "Equipamento atualizado com sucesso!" });

      } else {
        // Adicionar novo equipamento
        const { error } = await supabase
          .from('equipamentos')
          .insert([dataToSave]);
          
        if (error) throw error;
        toast({ title: "Sucesso", description: "Equipamento adicionado com sucesso!" });
      }
      
      await loadEquipamentos();
      setIsDialogOpen(false);
      resetForm();

    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível salvar o equipamento.";
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    }
  };

  const handleEdit = (equipamento: Equipamento) => {
    // Ao editar, formatar a data de 'yyyy-mm-ddT...' para 'yyyy-mm-dd'
    const formattedEquipamento = {
        ...equipamento,
        validade: equipamento.validade ? equipamento.validade.split('T')[0] : ''
    };
    setEditingEquipamento(formattedEquipamento);
    setFormData(formattedEquipamento);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      toast({ title: "Sucesso", description: "Equipamento excluído com sucesso!" });
      await loadEquipamentos();

    } catch (error) {
      console.error('Erro ao excluir equipamento:', error);
      toast({ title: "Erro", description: "Não foi possível excluir o equipamento.", variant: "destructive" });
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar equipamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipamento ? "Editar Equipamento" : "Adicionar Equipamento"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Input
                    id="tipo"
                    value={formData.tipo || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="numero_serie">Número de Série</Label>
                  <Input
                    id="numero_serie"
                    value={formData.numero_serie || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado_conservacao">Estado de Conservação</Label>
                  <Select 
                    value={formData.estado_conservacao || "Bom"}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado_conservacao: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bom">Bom</SelectItem>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Ruim">Ruim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantidade">Quantidade</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    value={formData.quantidade || 1}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value, 10) || 1 }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="avarias">Avarias</Label>
                <Textarea
                  id="avarias"
                  value={formData.avarias || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, avarias: e.target.value }))}
                  placeholder="Descreva avarias existentes..."
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="epi"
                  checked={formData.epi || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, epi: checked }))}
                />
                <Label htmlFor="epi">É um EPI (Equipamento de Proteção Individual)</Label>
              </div>

              {formData.epi && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <Label htmlFor="canum">CA (Certificado de Aprovação) *</Label>
                    <Input
                      id="canum"
                      value={formData.canum || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, canum: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tamanho">Tamanho</Label>
                    <Input
                      id="tamanho"
                      value={formData.tamanho || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, tamanho: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validade">Validade *</Label>
                    <Input
                      id="validade"
                      type="date"
                      value={formData.validade || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, validade: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingEquipamento ? "Salvar Alterações" : "Adicionar Equipamento"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Nº Série</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>EPI</TableHead>
              <TableHead>Última Atualização</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipamentos.map((equipamento) => (
              <TableRow key={equipamento.id}>
                <TableCell className="font-medium">{equipamento.tipo}</TableCell>
                <TableCell>{equipamento.descricao}</TableCell>
                <TableCell>{equipamento.numero_serie}</TableCell>
                <TableCell>
                  <Badge variant={
                    equipamento.estado_conservacao === "Bom" ? "default" :
                    equipamento.estado_conservacao === "Regular" ? "secondary" : "destructive"
                  }>
                    {equipamento.estado_conservacao}
                  </Badge>
                </TableCell>
                <TableCell>{equipamento.quantidade}</TableCell>
                <TableCell>
                  {equipamento.epi ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Shield className="w-3 h-3 mr-1" />
                      EPI
                    </Badge>
                  ) : (
                    <Badge variant="outline">Equipamento</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {(() => {
                    // A data de atualização pode ser igual à de criação se nunca foi editado
                    const createdAt = new Date(equipamento.created_at);
                    const updatedAt = new Date(equipamento.updated_at);

                    // Compara as datas e usa a mais recente
                    const dataMaisRecente = updatedAt > createdAt ? updatedAt : createdAt;
                    
                    return dataMaisRecente.toLocaleDateString('pt-BR');
                  })()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(equipamento)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(equipamento.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

