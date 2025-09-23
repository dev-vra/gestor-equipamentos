import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, User } from "lucide-react";

interface Colaborador {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  cnpj: string;
  razao_social: string;
}

export function ColaboradoresTab() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([
    {
      id: "1",
      nome: "João Silva",
      cpf: "123.456.789-00",
      cargo: "Engenheiro",
      cnpj: "12.345.678/0001-90",
      razao_social: "Empresa ABC Ltda"
    },
    {
      id: "2",
      nome: "Maria Santos",
      cpf: "987.654.321-00",
      cargo: "Técnica",
      cnpj: "98.765.432/0001-10",
      razao_social: "Empresa XYZ S.A."
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);
  
  const [formData, setFormData] = useState<Partial<Colaborador>>({
    nome: "",
    cpf: "",
    cargo: "",
    cnpj: "",
    razao_social: ""
  });

  const filteredColaboradores = colaboradores.filter(col => 
    col.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.cpf.includes(searchTerm) ||
    col.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.razao_social.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nome: "",
      cpf: "",
      cargo: "",
      cnpj: "",
      razao_social: ""
    });
    setEditingColaborador(null);
  };

  const handleSubmit = () => {
    if (editingColaborador) {
      // Editar colaborador existente
      setColaboradores(prev =>
        prev.map(col =>
          col.id === editingColaborador.id
            ? { ...col, ...formData }
            : col
        )
      );
    } else {
      // Adicionar novo colaborador
      const newColaborador: Colaborador = {
        id: Date.now().toString(),
        ...formData as Colaborador
      };
      setColaboradores(prev => [...prev, newColaborador]);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (colaborador: Colaborador) => {
    setEditingColaborador(colaborador);
    setFormData(colaborador);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setColaboradores(prev => prev.filter(col => col.id !== id));
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar colaboradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingColaborador ? "Editar Colaborador" : "Adicionar Colaborador"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome completo"
                  />
                </div>
                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Ex: Engenheiro, Técnico..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ""}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      if (formatted.length <= 14) {
                        setFormData(prev => ({ ...prev, cpf: formatted }));
                      }
                    }}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj || ""}
                    onChange={(e) => {
                      const formatted = formatCNPJ(e.target.value);
                      if (formatted.length <= 18) {
                        setFormData(prev => ({ ...prev, cnpj: formatted }));
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="razao_social">Razão Social</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingColaborador ? "Salvar" : "Adicionar"}
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
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Razão Social</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColaboradores.map((colaborador) => (
              <TableRow key={colaborador.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {colaborador.nome}
                </TableCell>
                <TableCell>{colaborador.cpf}</TableCell>
                <TableCell>{colaborador.cargo}</TableCell>
                <TableCell>{colaborador.cnpj}</TableCell>
                <TableCell>{colaborador.razao_social}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(colaborador)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(colaborador.id)}>
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