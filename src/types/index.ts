export type LeadStatus = 'contato-0' | 'primeiro-contato' | 'negociacao' | 'proposta' | 'fechado' | 'perdido';

export interface Lead {
  id: string;
  empresa: string;
  whatsapp: string;
  email: string;
  anotacoes: string;
  stage_id: LeadStatus;
  ordem_na_coluna: number;
  criado_em: string;
  atualizado_em: string;
  criado_por: string;
}

export interface Stage {
  id: LeadStatus;
  nome: string;
  ordem: number;
  cor: string;
}

export interface PipelineFilters {
  search: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  criado_em: string;
}
