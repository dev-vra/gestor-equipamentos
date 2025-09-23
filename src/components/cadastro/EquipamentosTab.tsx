import { useState } from "react";
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

interface Equipamento {
  id: string;
  tipo: string;
  descricao: string;
  numero_serie: string;
  estado_conservacao: string;
  avarias: string;
  quantidade: number;
  data_cadastro: string;
  epi: boolean;
  canum?: string;
  tamanho?: string;
  validade?: string;
}

export function EquipamentosTab() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([
    {
      id: "1",
      tipo: "Capacete",
      descricao: "Capacete de Segurança Branco",
      numero_serie: "CAP001",
      estado_conservacao: "Bom",
      avarias: "",
      quantidade: 15,
      data_cadastro: "2024-01-15",
      epi: true,
      canum: "12345",
      tamanho: "Único",
      validade: "2025-12-31"
    },
    {
      id: "2",
      tipo: "Notebook",
      descricao: "Notebook Dell Inspiron",
      numero_serie: "NOT001",
      estado_conservacao: "Bom",
      avarias: "",
      quantidade: 5,
      data_cadastro: "2024-01-16",
      epi: false
    }
  ]);

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

  const filteredEquipamentos = equipamentos.filter(eq => 
    eq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.numero_serie.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleSubmit = () => {
    if (editingEquipamento) {
      // Editar equipamento existente
      setEquipamentos(prev =>
        prev.map(eq =>
          eq.id === editingEquipamento.id
            ? { ...eq, ...formData }
            : eq
        )
      );
    } else {
      // Adicionar novo equipamento
      const newEquipamento: Equipamento = {
        id: Date.now().toString(),
        data_cadastro: new Date().toISOString().split('T')[0],
        ...formData as Equipamento
      };
      setEquipamentos(prev => [...prev, newEquipamento]);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (equipamento: Equipamento) => {
    setEditingEquipamento(equipamento);
    setFormData(equipamento);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setEquipamentos(prev => prev.filter(eq => eq.id !== id));
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
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
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
                <Label htmlFor="descricao">Descrição</Label>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) }))}
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="epi"
                  checked={formData.epi || false}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, epi: checked }))}
                />
                <Label htmlFor="epi">É um EPI (Equipamento de Proteção Individual)</Label>
              </div>

              {formData.epi && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label htmlFor="canum">CA (Certificado de Aprovação)</Label>
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
                    <Label htmlFor="validade">Validade</Label>
                    <Input
                      id="validade"
                      type="date"
                      value={formData.validade || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, validade: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingEquipamento ? "Salvar" : "Adicionar"}
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
              <TableHead>Data Cadastro</TableHead>
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
                <TableCell>{new Date(equipamento.data_cadastro).toLocaleDateString('pt-BR')}</TableCell>
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