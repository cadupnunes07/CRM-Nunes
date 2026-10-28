import { useState } from 'react';
import { Phone, Mail, MoreHorizontal, ChevronRight } from 'lucide-react';
import type { Lead } from '@/types';

type LeadCardProps = {
  lead: Lead;
  onOpenDetail: (lead: Lead) => void;
};

export function LeadCard({ lead, onOpenDetail }: LeadCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const whatsappLink = `https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`;

  return (
    <div
      className="lead-card group relative"
      draggable
      onDragStart={(e) => {
        e.dataTransfer?.setData('application/lead-id', lead.id);
        e.dataTransfer?.setData('application/lead-stage', lead.stage_id);
        if (e.dataTransfer) {
  e.dataTransfer.effectAllowed = 'move';
}
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(lead);
        }
      }}
      onClick={() => onOpenDetail(lead)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 line-clamp-1">{lead.empresa}</h3>
          {lead.whatsapp && (
            <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600">
              <Phone className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{lead.whatsapp}</span>
            </div>
          )}
          {lead.email && (
            <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-600">
              <Mail className="w-3 h-3" />
              <span className="truncate max-w-[140px]">{lead.email}</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
          className="p-1 hover:bg-neutral-100 rounded-md text-neutral-400 group-hover:text-neutral-600 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Mais opções"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {lead.anotacoes && (
        <p className="mt-2 text-sm text-neutral-600 line-clamp-2">{lead.anotacoes}</p>
      )}

      <div className="mt-3 pt-2 border-t border-neutral-100 flex items-center justify-between">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <Phone className="w-3 h-3" /> Abrir WhatsApp
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(lead);
          }}
          className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
        >
          Ver detalhes <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-12 w-48 bg-white border border-neutral-200 rounded-md shadow-lg py-1 z-20 animate-fade-in">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            Editar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
