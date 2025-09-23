-- Criar tabela de equipamentos
CREATE TABLE public.equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  numero_serie TEXT UNIQUE,
  estado_conservacao TEXT DEFAULT 'Bom',
  avarias TEXT DEFAULT '',
  quantidade INTEGER NOT NULL DEFAULT 1,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  epi BOOLEAN DEFAULT false,
  canum TEXT DEFAULT '',
  tamanho TEXT DEFAULT '',
  validade TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de colaboradores
CREATE TABLE public.colaboradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf TEXT UNIQUE,
  cargo TEXT,
  cnpj TEXT UNIQUE,
  razao_social TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de movimentações
CREATE TABLE public.movimentacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('Retirada', 'Devolucao')),
  data_movimentacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id),
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id),
  grupo_retirada TEXT,
  quantidade INTEGER NOT NULL,
  estado_conservacao TEXT DEFAULT 'Bom',
  avarias TEXT DEFAULT '',
  data_prevista_devolucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (permitir acesso total por enquanto)
CREATE POLICY "Permitir acesso total a equipamentos" 
ON public.equipamentos 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acesso total a colaboradores" 
ON public.colaboradores 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir acesso total a movimentacoes" 
ON public.movimentacoes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar triggers para atualizar timestamps automaticamente
CREATE TRIGGER update_equipamentos_updated_at
  BEFORE UPDATE ON public.equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_movimentacoes_updated_at
  BEFORE UPDATE ON public.movimentacoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados de exemplo para testar
INSERT INTO public.colaboradores (nome, cpf, cargo, cnpj, razao_social) VALUES
('João Silva', '123.456.789-00', 'Técnico', '12.345.678/0001-90', 'Empresa ABC Ltda'),
('Maria Santos', '987.654.321-00', 'Engenheira', '98.765.432/0001-10', 'Tech Solutions'),
('Pedro Costa', '456.789.123-00', 'Operador', '45.678.912/0001-35', 'Industrial Corp');

INSERT INTO public.equipamentos (tipo, descricao, numero_serie, quantidade, epi, canum, tamanho, validade) VALUES
('Capacete', 'Capacete de segurança branco', 'CAP001', 10, true, '12345', 'Único', '2025-12-31'),
('Luvas', 'Luvas de proteção mecânica', 'LUV001', 50, true, '67890', 'G', '2024-06-30'),
('Furadeira', 'Furadeira elétrica 220V', 'FUR001', 5, false, '', '', ''),
('Óculos', 'Óculos de proteção transparente', 'OCU001', 25, true, '11111', 'Único', '2026-01-15'),
('Martelo', 'Martelo unha 500g', 'MAR001', 8, false, '', '', '');