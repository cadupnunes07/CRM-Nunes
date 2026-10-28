import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Lead, Stage } from '@/types';

const STAGES: Stage[] = [
  { id: 'contato-0', nome: 'Contato 0', ordem: 1, cor: 'stage-contato-0' },
  { id: 'primeiro-contato', nome: 'Primeiro contato', ordem: 2, cor: 'stage-primeiro-contato' },
  { id: 'negociacao', nome: 'Em negociação', ordem: 3, cor: 'stage-negociacao' },
  { id: 'proposta', nome: 'Proposta enviada', ordem: 4, cor: 'stage-proposta' },
  { id: 'fechado', nome: 'Fechado', ordem: 5, cor: 'stage-fechado' },
  { id: 'perdido', nome: 'Perdido', ordem: 6, cor: 'stage-perdido' },
];

export function useLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages] = useState<Stage[]>(STAGES);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('stage_id', { ascending: true })
      .order('ordem_na_coluna', { ascending: true });

    if (error) {
      console.error('Erro ao buscar leads:', error);
      setLoading(false);
      return;
    }

    setLeads((data ?? []).map((l) => ({ ...l, stage_id: l.stage_id as Lead['stage_id'] })));
    setLoading(false);
  }, []);

  const createLead = useCallback(
    async (lead: Omit<Lead, 'id' | 'criado_em' | 'atualizado_em' | 'criado_por'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const optimistic: Lead = {
        ...lead,
        id: crypto.randomUUID(),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        criado_por: user?.id ?? '',
        ordem_na_coluna: 0,
      };

      setLeads((prev) => [...prev, optimistic]);

      const { error } = await supabase.from('leads').insert([{ ...optimistic }]);

      if (error) {
        console.error('Erro ao criar lead:', error);
        setLeads((prev) => prev.filter((l) => l.id !== optimistic.id));
        throw error;
      }

      await fetchLeads();
      return optimistic;
    },
    [fetchLeads],
  );

  const updateLead = useCallback(
    async (id: string, updates: Partial<Pick<Lead, 'empresa' | 'whatsapp' | 'email' | 'anotacoes' | 'stage_id'>>) => {
      const previousIndex = leads.findIndex((l) => l.id === id);
      const previousLead = previousIndex >= 0 ? { ...leads[previousIndex] } : null;

      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updates, atualizado_em: new Date().toISOString() } : l)),
      );

      const { error } = await supabase.from('leads').update({ ...updates, atualizado_em: new Date().toISOString() }).eq('id', id);

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        if (previousLead) {
          setLeads((prev) => prev.map((l) => (l.id === id ? previousLead : l)));
        }
        throw error;
      }

      await fetchLeads();
    },
    [leads, fetchLeads],
  );

  const deleteLead = useCallback(
    async (id: string) => {
      const previousIndex = leads.findIndex((l) => l.id === id);
      const previousLead = previousIndex >= 0 ? { ...leads[previousIndex] } : null;

      setLeads((prev) => prev.filter((l) => l.id !== id));

      const { error } = await supabase.from('leads').delete().eq('id', id);

      if (error) {
        console.error('Erro ao excluir lead:', error);
        if (previousLead) {
          setLeads((prev) => [...prev.slice(0, previousIndex), previousLead, ...prev.slice(previousIndex)]);
        }
        throw error;
      }

      await fetchLeads();
    },
    [leads, fetchLeads],
  );

  const moveLead = useCallback(
    async (leadId: string, newStageId: Lead['stage_id'], newOrdem: number) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      const previousStage = lead.stage_id;
      const previousOrdem = lead.ordem_na_coluna;

      setLeads((prev) =>
        prev.map((l) => {
          if (l.id === leadId) {
            return { ...l, stage_id: newStageId, ordem_na_coluna: newOrdem, atualizado_em: new Date().toISOString() };
          }
          return l;
        }),
      );

      const { error } = await supabase
        .from('leads')
        .update({ stage_id: newStageId, ordem_na_coluna: newOrdem, atualizado_em: new Date().toISOString() })
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao mover lead:', error);
        setLeads((prev) =>
          prev.map((l) => {
            if (l.id === leadId) {
              return { ...l, stage_id: previousStage, ordem_na_coluna: previousOrdem };
            }
            return l;
          }),
        );
        throw error;
      }

      await fetchLeads();
    },
    [leads, fetchLeads],
  );

  const importLeads = useCallback(async (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return { inserted: 0, skipped: 0 };

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1).filter((l) => l.trim());

    const { data: { user } } = await supabase.auth.getUser();

    const leadsToInsert = rows.map((row) => {
      const values = row.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] ?? '';
      });
      return {
        empresa: obj.empresa || obj['nome da empresa'] || obj['nome'],
        whatsapp: obj.whatsapp || obj['whatsapp'] || obj['telefone'],
        email: obj.email || obj['e-mail'] || obj['email'],
        anotacoes: obj.anotacoes || obj.anotações || obj.notas || '',
        stage_id: 'contato-0' as Lead['stage_id'],
        ordem_na_coluna: 0,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        criado_por: user?.id ?? '',
      };
    });

    const { error } = await supabase.from('leads').insert(leadsToInsert);

    if (error) {
      console.error('Erro ao importar:', error);
      throw error;
    }

    await fetchLeads();
    return { inserted: leadsToInsert.length, skipped: 0 };
  }, [fetchLeads]);

  const exportLeads = useCallback(() => {
    const headers = ['empresa', 'whatsapp', 'email', 'anotacoes', 'stage_id', 'criado_em'];
    const rows = leads.map((l) => [
      `"${l.empresa}"`,
      `"${l.whatsapp}"`,
      `"${l.email}"`,
      `"${l.anotacoes}"`,
      l.stage_id,
      l.criado_em,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-crm-nunes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [leads]);

  return {
    leads,
    stages,
    loading,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    moveLead,
    importLeads,
    exportLeads,
  };
}
