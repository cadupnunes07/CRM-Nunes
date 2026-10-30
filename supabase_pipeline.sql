-- Execute apenas após verificar as tabelas existentes; não recrie banco com dados sem backup.
-- IDs compatíveis com useLeads.ts.
insert into public.pipeline_stages (id, nome, ordem, cor) values
('contato-0','Contato 0',1,'#94a3b8'),
('primeiro-contato','Primeiro contato',2,'#60a5fa'),
('negociacao','Em negociação',3,'#f59e0b'),
('proposta','Proposta enviada',4,'#a78bfa'),
('fechado','Fechado',5,'#34d399'),
('perdido','Perdido',6,'#f87171')
on conflict (id) do update set nome=excluded.nome, ordem=excluded.ordem, cor=excluded.cor;
-- Verifique se RLS de leads restringe criado_por = auth.uid().
