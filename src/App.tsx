import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLeads } from './hooks/useLeads';
import type { Lead, LeadStatus } from './types';
import { BriefcaseBusiness, Plus, Search, LogOut, Download, Upload, X, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import './App.css';

const blank = { empresa: '', whatsapp: '', email: '', anotacoes: '', stage_id: 'contato-0' as LeadStatus };
const stageColors: Record<string, string> = { 'contato-0':'#94a3b8', 'primeiro-contato':'#60a5fa', negociacao:'#f59e0b', proposta:'#a78bfa', fechado:'#34d399', perdido:'#f87171' };
const message = (error: unknown) => error instanceof Error ? error.message : typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : 'Não foi possível concluir a operação.';

function Login() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    try { const result = await signIn(email.trim(),password); if (result.error) setError(message(result.error)); }
    catch (err) { setError(message(err)); } finally { setBusy(false); }
  }
  return <div className="auth-page"><div className="auth-card">
    <div className="brand"><div className="brand-icon"><BriefcaseBusiness size={23}/></div><div><strong>CRM Nunes</strong><small>Gestão comercial</small></div></div>
    <h1>Bem-vindo de volta</h1><p className="muted">Entre para acompanhar suas oportunidades.</p>
    <form onSubmit={submit} className="stack"><label>E-mail<input type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com"/></label>
    <label>Senha<input type="password" required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/></label>
    {error && <div className="notice error" role="alert">{error}</div>}
    <button className="primary full" disabled={busy||loading}>{busy?'Entrando...':'Entrar no CRM'}</button></form>
    <p className="auth-note">O acesso utiliza sua conta no Supabase. O cadastro de novos usuários deve ser autorizado pelo administrador.</p>
  </div></div>;
}

function Board() {
  const { user, signOut } = useAuth();
  const { leads, stages, loading, fetchLeads, createLead, updateLead, deleteLead, moveLead, importLeads, exportLeads } = useLeads();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Lead|null>(null);
  const [form, setForm] = useState(blank);
  const [modal, setModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice,setNotice] = useState<{text:string;error:boolean}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(()=>{void fetchLeads().catch(e=>setNotice({text:message(e),error:true}));},[fetchLeads]);
  const filtered = leads.filter(l=>[l.empresa,l.whatsapp,l.email,l.anotacoes].join(' ').toLowerCase().includes(search.toLowerCase()));
  const openNew=()=>{setEditing(null);setForm(blank);setModal(true);};
  const openEdit=(lead:Lead)=>{setEditing(lead);setForm({empresa:lead.empresa,whatsapp:lead.whatsapp,email:lead.email||'',anotacoes:lead.anotacoes||'',stage_id:lead.stage_id});setModal(true);};
  const notify=(text:string,error=false)=>setNotice({text,error});
  async function save(e:FormEvent){ e.preventDefault(); if(!form.empresa.trim()||!form.whatsapp.trim())return; setBusy(true);
    try { if(editing)await updateLead(editing.id,form); else await createLead({...form, ordem_na_coluna:0}); setModal(false);notify(editing?'Lead atualizado.':'Lead cadastrado.'); }
    catch(e){notify(message(e),true);}finally{setBusy(false);} }
  async function remove(){if(!editing||!window.confirm(`Excluir ${editing.empresa}? Esta ação não pode ser desfeita.`))return;setBusy(true);try{await deleteLead(editing.id);setModal(false);notify('Lead excluído.');}catch(e){notify(message(e),true);}finally{setBusy(false);}}
  async function drop(e:React.DragEvent<HTMLElement>,stage:LeadStatus){e.preventDefault();const id=e.dataTransfer.getData('application/lead-id');if(!id)return;try{await moveLead(id,stage,leads.filter(l=>l.stage_id===stage).length);notify('Lead movido.');}catch(err){notify(message(err),true);}}
  async function upload(e:ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];if(!file)return;try{const result=await importLeads(await file.text());notify(`${result.inserted} leads importados.`);}catch(err){notify(message(err),true);}finally{e.target.value='';}}
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-icon"><BriefcaseBusiness size={20}/></div><div><strong>CRM Nunes</strong><small>Pipeline comercial</small></div></div><div className="user-actions"><span className="user-name">{user?.nome||user?.email}</span><button className="icon-button" title="Sair" onClick={()=>void signOut()}><LogOut size={18}/></button></div></header>
    <main className="main"><div className="page-head"><div><span className="eyebrow">ÁREA COMERCIAL</span><h1>Seu pipeline de vendas</h1><p className="muted">Organize contatos e avance suas oportunidades.</p></div><button className="primary" onClick={openNew}><Plus size={18}/> Novo lead</button></div>
    <div className="toolbar"><div className="search"><Search size={17}/><input aria-label="Pesquisar leads" placeholder="Buscar empresa, WhatsApp ou observação" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="tools"><span className="lead-total">{filtered.length} lead{filtered.length===1?'':'s'}</span><button title="Atualizar" className="secondary" onClick={()=>void fetchLeads()}><RefreshCw size={16}/><span>Atualizar</span></button><button className="secondary" onClick={()=>fileRef.current?.click()}><Upload size={16}/><span>Importar CSV</span></button><button className="secondary" onClick={exportLeads}><Download size={16}/><span>Exportar</span></button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={upload}/></div></div>
    {notice&&<div className={`notice ${notice.error?'error':'success'}`} role="status">{notice.text}<button aria-label="Fechar aviso" onClick={()=>setNotice(null)}><X size={16}/></button></div>}
    <div className="board" aria-label="Pipeline Kanban">{stages.map(stage=>{const items=filtered.filter(l=>l.stage_id===stage.id).sort((a,b)=>a.ordem_na_coluna-b.ordem_na_coluna);return <section key={stage.id} className="column" onDragOver={e=>e.preventDefault()} onDrop={e=>void drop(e,stage.id)}><div className="column-heading"><span className="stage-dot" style={{background:stageColors[stage.id]||'#94a3b8'}}/><h2>{stage.nome}</h2><span className="count">{items.length}</span></div><div className="column-body">{items.map(lead=><article key={lead.id} className="crm-card" draggable onDragStart={e=>{e.dataTransfer.setData('application/lead-id',lead.id);e.dataTransfer.effectAllowed='move';}}><button className="card-main" onClick={()=>openEdit(lead)}><strong>{lead.empresa}</strong><small>{lead.whatsapp}</small>{lead.anotacoes&&<p>{lead.anotacoes}</p>}</button><div className="card-bottom"><a onClick={e=>e.stopPropagation()} href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/> WhatsApp</a><button onClick={()=>openEdit(lead)}>Editar</button></div></article>)}{!loading&&items.length===0&&<p className="empty">Arraste leads para esta etapa</p>}</div></section>})}</div>
    {loading&&<p className="muted loading">Carregando leads...</p>}
    </main>
    {modal&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setModal(false);}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><h2 id="modal-title">{editing?'Editar lead':'Cadastrar lead'}</h2><p className="muted">Informações da oportunidade</p></div><button className="icon-button" aria-label="Fechar" onClick={()=>setModal(false)}><X size={20}/></button></div><form onSubmit={save} className="stack"><label>Empresa *<input required value={form.empresa} onChange={e=>setForm({...form,empresa:e.target.value})}/></label><label>WhatsApp *<input required value={form.whatsapp} onChange={e=>setForm({...form,whatsapp:e.target.value})} placeholder="5522999999999"/></label><label>E-mail<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label><label>Etapa<select value={form.stage_id} onChange={e=>setForm({...form,stage_id:e.target.value as LeadStatus})}>{stages.map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select></label><label>Anotações<textarea rows={4} value={form.anotacoes} onChange={e=>setForm({...form,anotacoes:e.target.value})}/></label><div className="modal-actions">{editing&&<button type="button" disabled={busy} className="danger" onClick={()=>void remove()}><Trash2 size={16}/> Excluir</button>}<div className="fill"/><button type="button" className="secondary" onClick={()=>setModal(false)}>Cancelar</button><button className="primary" disabled={busy}>{busy?'Salvando...':'Salvar lead'}</button></div></form></div></div>}
  </div>;
}
function AppContent(){const {loading,isAuthenticated}=useAuth();if(loading)return <div className="auth-page"><p>Carregando CRM Nunes...</p></div>;return isAuthenticated?<Board/>:<Login/>;}
export default function App(){return <AuthProvider><AppContent/></AuthProvider>;}
