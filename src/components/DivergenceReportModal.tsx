import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft, X, Download } from 'lucide-react';
import { Button } from './Button';
import { jsPDF } from 'jspdf';

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

interface DivergenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  divergenceItems: any[];
  propertyAddress?: string;
}

export const DivergenceReportModal: React.FC<DivergenceModalProps> = ({
  isOpen,
  onClose,
  divergenceItems: initialItems,
  propertyAddress = 'Imóvel'
}) => {
  const [items, setItems] = useState<any[]>(initialItems);
  const [filter, setFilter] = useState<'all' | 'severe' | 'pending'>('all');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync if initialItems changes
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => {
    if (filter === 'severe') return item.isSevere || item.status === 'Piorou Drasticamente';
    if (filter === 'pending') return !item.validated;
    return true;
  });

  const handleValidateAll = (status: boolean) => {
    setItems(prev => prev.map(d => ({ ...d, validated: status })));
  };

  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF();
      let y = 20;

      // Header
      doc.setFillColor(185, 28, 28);
      doc.rect(0, 0, 210, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('RELATÓRIO CONSOLIDADO DE DIVERGÊNCIAS', 14, 18);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text(`Imóvel: ${propertyAddress} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);

      y = 42;
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('1. RESUMO DA AUDITORIA COMPARATIVA', 14, y);
      y += 6;

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const totalValidated = items.filter(d => d.validated).length;
      const totalSevere = items.filter(d => (d.isSevere || d.status === 'Piorou Drasticamente') && d.validated).length;
      const totalCost = items.filter(d => d.validated).reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);

      doc.text(`Total de Divergências Validadas: ${totalValidated} | Estado Piorado Drasticamente: ${totalSevere} item(ns)`, 14, y);
      y += 5;
      doc.text(`Estimativa de Reparos Aprovados: R$ ${totalCost.toFixed(2)}`, 14, y);
      y += 10;

      doc.setFont(undefined, 'bold');
      doc.text('2. QUADRO DETALHADO DE DIVERGÊNCIAS VALIDADAS PELO VISTORIADOR', 14, y);
      y += 8;

      const validatedItems = items.filter(d => d.validated);
      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        const isSevere = item.isSevere || item.status === 'Piorou Drasticamente';
        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        // Card background (soft red for severe)
        doc.setFillColor(isSevere ? 254 : 248, isSevere ? 242 : 250, isSevere ? 242 : 252);
        doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
        doc.setDrawColor(isSevere ? 239 : 226, isSevere ? 68 : 232, isSevere ? 68 : 240);
        doc.roundedRect(14, y, 182, 28, 2, 2, 'S');

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(isSevere ? 185 : 30, isSevere ? 28 : 41, isSevere ? 28 : 59);
        doc.text(`[${item.roomName}] - ${item.itemName} (${item.status})`, 18, y + 6);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Entrada: ${item.conditionBefore || 'Bom'}  |  Saída: ${item.conditionAfter || 'Regular'}  |  Responsabilidade: ${item.responsibility}  |  Est: R$ ${(Number(item.cost) || 0).toFixed(2)}`, 18, y + 12);

        const splitDesc = doc.splitTextToSize(`Constatação: ${item.description}${item.notes ? ` (Parecer: ${item.notes})` : ''}`, 174);
        doc.text(splitDesc, 18, y + 17);

        y += 32;
      }

      // Conclusão e Assinatura
      if (y > 230) {
        doc.addPage();
        y = 30;
      } else {
        y += 10;
      }

      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. TERMO DE VALIDAÇÃO TÉCNICA', 14, y);
      y += 6;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.text('Declaro que todos os pontos de divergência acima foram minuciosamente auditados e conferidos visualmente com base nos registros fotográficos e laudos aplicáveis.', 14, y);
      y += 20;

      doc.line(14, y, 90, y);
      doc.line(120, y, 196, y);
      y += 5;
      doc.text('Vistoriador Responsável', 14, y);
      doc.text('Locatário / Ciente', 120, y);

      doc.save(`Relatorio_Divergencias_${propertyAddress}.pdf`);
      onClose();
    } catch (err) {
      console.error('Erro ao gerar relatório de divergências:', err);
      alert('Erro ao gerar PDF do relatório de divergências.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[270] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Validação do Vistoriador
              </span>
              <span className="text-stone-400 text-xs">
                {items.length} divergência(s) apurada(s)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="text-red-500" size={24} />
              Relatório Consolidado de Divergências
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              Revise, valide e ajuste cada ponto de divergência identificado na vistoria/comparação antes da emissão do documento final.
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-white p-2 rounded-full hover:bg-stone-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filters */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">Filtrar:</span>
            <button 
              onClick={() => setFilter('all')} 
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all",
                filter === 'all' ? "bg-stone-900 text-white" : "bg-white text-stone-700 border border-stone-200"
              )}
            >
              Todas ({items.length})
            </button>
            <button 
              onClick={() => setFilter('severe')} 
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1",
                filter === 'severe' ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Piorou Drasticamente ({items.filter(d => d.isSevere || d.status === 'Piorou Drasticamente').length})
            </button>
            <button 
              onClick={() => setFilter('pending')} 
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold transition-all",
                filter === 'pending' ? "bg-yellow-600 text-white" : "bg-yellow-50 text-yellow-800 border border-yellow-200"
              )}
            >
              Pendentes ({items.filter(d => !d.validated).length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleValidateAll(true)}
              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Validar Todas
            </button>
            <button
              type="button"
              onClick={() => handleValidateAll(false)}
              className="text-stone-600 bg-white hover:bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg font-bold transition-colors"
            >
              Desmarcar
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredItems.map((item, idx) => {
            const isSevere = item.isSevere || item.status === 'Piorou Drasticamente';
            return (
              <div 
                key={item.id || idx}
                className={cn(
                  "rounded-2xl border-2 p-4 transition-all space-y-3",
                  isSevere 
                    ? "bg-red-50/90 border-red-300 shadow-xs ring-1 ring-red-200" 
                    : "bg-white border-stone-200",
                  item.validated ? "ring-1 ring-emerald-500/30" : "opacity-90"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-stone-900 text-sm sm:text-base">
                      {item.roomName} → {item.itemName}
                    </span>
                    {isSevere ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                        Piorou Drasticamente
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                        {item.status || 'Divergência'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-xs">
                      <input 
                        type="checkbox"
                        checked={item.validated}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setItems(prev => prev.map(d => d.id === item.id ? { ...d, validated: val } : d));
                        }}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <span className={item.validated ? "text-emerald-700 font-bold" : "text-stone-500"}>
                        {item.validated ? 'Ponto Validado' : 'Validar'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Comparison badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-stone-600">
                    Entrada: <strong className="text-emerald-700">{item.conditionBefore || 'Bom'}</strong>
                  </div>
                  <span>→</span>
                  <div className={cn(
                    "px-2.5 py-1 rounded-lg border font-bold",
                    isSevere ? "bg-red-100 border-red-300 text-red-800" : "bg-stone-100 border-stone-200 text-stone-800"
                  )}>
                    Saída: {item.conditionAfter || 'Danificado'}
                  </div>
                  <div className="ml-auto text-xs font-bold text-stone-500">
                    Custo Estimado: <span className="text-red-700 font-black">R$ {Number(item.cost || 0).toFixed(2)}</span>
                  </div>
                </div>

                {/* Description input */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                    Descrição da Alteração Identificada
                  </label>
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) => {
                      const val = e.target.value;
                      setItems(prev => prev.map(d => d.id === item.id ? { ...d, description: val } : d));
                    }}
                    className="w-full text-xs p-2.5 bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Descreva o dano ou divergência verificada..."
                  />
                </div>

                {/* Responsibility & Inspector notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Atribuição de Responsabilidade
                    </label>
                    <select
                      value={item.responsibility}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(prev => prev.map(d => d.id === item.id ? { ...d, responsibility: val } : d));
                      }}
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg outline-none font-bold"
                    >
                      <option value="Locatário">Locatário (Ressarcimento / Reparo)</option>
                      <option value="Locador">Locador (Desgaste Natural / Estrutural)</option>
                      <option value="A Negociar">A Negociar / Indefinido</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-stone-500 mb-1">
                      Observação / Parecer do Vistoriador
                    </label>
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItems(prev => prev.map(d => d.id === item.id ? { ...d, notes: val } : d));
                      }}
                      placeholder="Ex: Foto do laudo de entrada confirma estado novo..."
                      className="w-full text-xs p-2 bg-white border border-stone-200 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-100 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-stone-600 text-center sm:text-left">
            <span className="font-bold text-stone-800">
              {items.filter(d => d.validated).length} de {items.length}
            </span> itens validados pelo vistoriador.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-stone-600 text-xs w-full sm:w-auto"
            >
              Voltar
            </Button>

            <Button
              variant="primary"
              disabled={isGenerating}
              onClick={handleExportPDF}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-md w-full sm:w-auto justify-center"
              icon={Download}
            >
              <span>{isGenerating ? 'Emitindo PDF...' : 'Emitir Relatório Final Validado'}</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
