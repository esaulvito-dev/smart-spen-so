import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Transaction, CATEGORY_LABELS, CATEGORY_ICONS, TransactionCategory } from '@/hooks/useTransactions';
import { useCustomCategories } from '@/hooks/useCustomCategories';

interface ExportReportDialogProps {
  transactions: Transaction[];
  periodLabel?: string;
  startDate?: Date;
  endDate?: Date;
}

type ExportType = 'income' | 'expense' | 'all';
type ExportFormat = 'pdf' | 'excel';

// Extract custom category name from description
const extractCustomCategory = (desc: string | null): string | null => {
  if (!desc) return null;
  const match = desc.match(/^\[([^\]]+)\]/);
  return match ? match[1] : null;
};

export function ExportReportDialog({ 
  transactions, 
  periodLabel = 'Este mes',
  startDate = new Date(),
  endDate = new Date()
}: ExportReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<ExportType>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: customCategories = [] } = useCustomCategories();
  const { toast } = useToast();

  const filteredTransactions = transactions.filter(t => {
    if (exportType === 'all') return true;
    return t.type === exportType;
  });

  const getCategoryDisplay = (transaction: Transaction) => {
    const customCatName = extractCustomCategory(transaction.description);
    
    if (customCatName) {
      const customCat = customCategories.find(c => c.name === customCatName);
      return {
        icon: customCat?.icon || '📋',
        label: customCatName
      };
    }
    
    return {
      icon: CATEGORY_ICONS[transaction.category as TransactionCategory] || '📦',
      label: CATEGORY_LABELS[transaction.category as TransactionCategory] || transaction.category
    };
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpenses;
  
  const stats = { totalIncome, totalExpenses, balance };

  const handleExportPDF = () => {
    const typeLabel = exportType === 'all' ? 'Completo' : exportType === 'income' ? 'Ingresos' : 'Gastos';
    
    const printContent = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Reporte ${typeLabel} - BudgetTrack</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', system-ui, sans-serif; 
              padding: 40px; 
              max-width: 800px; 
              margin: 0 auto; 
              color: #1f2937;
              line-height: 1.5;
            }
            .header { 
              display: flex; 
              align-items: center; 
              justify-content: space-between;
              margin-bottom: 32px; 
              padding-bottom: 24px;
              border-bottom: 3px solid #10B981;
            }
            .brand { display: flex; align-items: center; gap: 12px; }
            .brand-icon { 
              width: 48px; 
              height: 48px; 
              background: linear-gradient(135deg, #10B981, #059669);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 24px;
            }
            .brand-text h1 { 
              color: #10B981; 
              font-size: 28px;
              font-weight: 700;
            }
            .brand-text p { 
              color: #6B7280; 
              font-size: 12px;
              margin-top: 2px;
            }
            .report-info { text-align: right; }
            .report-info h2 { font-size: 18px; color: #374151; }
            .report-info .period { color: #6B7280; font-size: 13px; margin-top: 4px; }
            
            .stats { 
              display: grid; 
              grid-template-columns: repeat(3, 1fr); 
              gap: 16px; 
              margin: 24px 0; 
            }
            .stat-card { 
              padding: 20px; 
              border: 1px solid #E5E7EB; 
              border-radius: 12px;
              text-align: center;
            }
            .stat-label { font-size: 12px; color: #6B7280; margin-bottom: 4px; }
            .stat-value { font-size: 24px; font-weight: 700; }
            .income { color: #10B981; }
            .expense { color: #EF4444; }
            .balance-positive { color: #10B981; }
            .balance-negative { color: #EF4444; }
            
            h3 { 
              color: #374151; 
              margin-top: 32px;
              margin-bottom: 16px;
              padding-bottom: 8px; 
              border-bottom: 2px solid #E5E7EB;
              font-size: 16px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse;
              margin-top: 12px;
            }
            th { 
              background: #F9FAFB; 
              padding: 12px 8px; 
              text-align: left; 
              font-size: 12px;
              color: #6B7280;
              border-bottom: 2px solid #E5E7EB;
            }
            td { 
              padding: 12px 8px; 
              border-bottom: 1px solid #F3F4F6;
              font-size: 13px;
            }
            .amount-income { color: #10B981; font-weight: 600; }
            .amount-expense { color: #EF4444; font-weight: 600; }
            
            .footer { 
              margin-top: 48px; 
              padding-top: 24px;
              border-top: 1px solid #E5E7EB;
              text-align: center; 
              color: #9CA3AF; 
              font-size: 11px; 
            }
            .footer-brand { 
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              margin-bottom: 8px;
            }
            .footer-brand span { color: #10B981; font-weight: 600; }
            
            @media print {
              body { padding: 20px; }
              .stat-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">
              <div class="brand-icon">💰</div>
              <div class="brand-text">
                <h1>BudgetTrack</h1>
                <p>Tu gestor financiero personal</p>
              </div>
            </div>
            <div class="report-info">
              <h2>Reporte de ${typeLabel}</h2>
              <p class="period">${format(startDate, "d MMM", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}</p>
            </div>
          </div>

          ${exportType === 'all' || exportType === 'income' ? `
          <div class="stats" style="${exportType !== 'all' ? 'grid-template-columns: repeat(2, 1fr);' : ''}">
            ${exportType === 'all' || exportType === 'income' ? `
            <div class="stat-card">
              <p class="stat-label">Ingresos Totales</p>
              <p class="stat-value income">+S/ ${stats.totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            ` : ''}
            ${exportType === 'all' ? `
            <div class="stat-card">
              <p class="stat-label">Gastos Totales</p>
              <p class="stat-value expense">-S/ ${stats.totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            <div class="stat-card">
              <p class="stat-label">Balance</p>
              <p class="stat-value ${stats.balance >= 0 ? 'balance-positive' : 'balance-negative'}">S/ ${stats.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="stats" style="grid-template-columns: repeat(1, 1fr); max-width: 300px;">
            <div class="stat-card">
              <p class="stat-label">Gastos Totales</p>
              <p class="stat-value expense">-S/ ${stats.totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          `}

          <h3>📋 Detalle de Transacciones (${filteredTransactions.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th style="text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(t => {
                const { icon, label } = getCategoryDisplay(t);
                const cleanDesc = t.description?.replace(/^\[[^\]]+\]\s*/, '') || '-';
                return `
                <tr>
                  <td>${format(new Date(t.date), 'd MMM yyyy', { locale: es })}</td>
                  <td>${icon} ${label}</td>
                  <td>${cleanDesc}</td>
                  <td style="text-align: right;" class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                    ${t.type === 'income' ? '+' : '-'}S/ ${Number(t.amount).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              `;}).join('')}
              ${filteredTransactions.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #9CA3AF; padding: 32px;">Sin transacciones en este período</td></tr>' : ''}
            </tbody>
          </table>

          <div class="footer">
            <div class="footer-brand">
              <span>💰 BudgetTrack</span>
            </div>
            <p>Generado el ${format(new Date(), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</p>
            <p style="margin-top: 4px;">www.budgettrack.app</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = () => {
    const typeLabel = exportType === 'all' ? 'Completo' : exportType === 'income' ? 'Ingresos' : 'Gastos';
    
    // Create CSV content with BOM for Excel
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Header with branding
    csvContent += 'BUDGETTRACK - REPORTE FINANCIERO\n';
    csvContent += `Tipo de Reporte:,${typeLabel}\n`;
    csvContent += `Período:,${format(startDate, "d MMM yyyy", { locale: es })} - ${format(endDate, "d MMM yyyy", { locale: es })}\n`;
    csvContent += `Generado:,${format(new Date(), "d/MM/yyyy HH:mm", { locale: es })}\n`;
    csvContent += '\n';
    
    // Summary
    csvContent += 'RESUMEN\n';
    if (exportType === 'all' || exportType === 'income') {
      csvContent += `Total Ingresos:,S/ ${stats.totalIncome.toLocaleString('es-PE', { minimumFractionDigits: 2 })}\n`;
    }
    if (exportType === 'all' || exportType === 'expense') {
      csvContent += `Total Gastos:,S/ ${stats.totalExpenses.toLocaleString('es-PE', { minimumFractionDigits: 2 })}\n`;
    }
    if (exportType === 'all') {
      csvContent += `Balance:,S/ ${stats.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}\n`;
    }
    csvContent += '\n';
    
    // Transactions
    csvContent += 'DETALLE DE TRANSACCIONES\n';
    csvContent += 'Fecha,Tipo,Categoría,Descripción,Monto\n';
    
    filteredTransactions.forEach(t => {
      const { label } = getCategoryDisplay(t);
      const cleanDesc = (t.description?.replace(/^\[[^\]]+\]\s*/, '') || '-').replace(/,/g, ';');
      const typeLabel = t.type === 'income' ? 'Ingreso' : 'Gasto';
      const sign = t.type === 'income' ? '' : '-';
      
      csvContent += `${format(new Date(t.date), 'd/MM/yyyy')},${typeLabel},${label},"${cleanDesc}",${sign}${Number(t.amount).toFixed(2)}\n`;
    });
    
    csvContent += '\n';
    csvContent += 'Generado por BudgetTrack - www.budgettrack.app\n';
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `BudgetTrack_Reporte_${typeLabel}_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (exportFormat === 'pdf') {
        handleExportPDF();
      } else {
        handleExportExcel();
      }
      
      toast({
        title: 'Reporte exportado',
        description: `Tu reporte de ${exportType === 'all' ? 'transacciones' : exportType === 'income' ? 'ingresos' : 'gastos'} ha sido generado.`,
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo exportar el reporte.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportar Reporte
          </DialogTitle>
          <DialogDescription className="text-sm">
            Descarga un reporte detallado con la marca de BudgetTrack.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Export Type */}
          <div className="space-y-2">
            <Label className="text-sm">Tipo de reporte</Label>
            <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
              <SelectTrigger className="h-11 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    📊 Reporte Completo
                  </span>
                </SelectItem>
                <SelectItem value="income">
                  <span className="flex items-center gap-2">
                    📈 Solo Ingresos
                  </span>
                </SelectItem>
                <SelectItem value="expense">
                  <span className="flex items-center gap-2">
                    📉 Solo Gastos
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm">Formato</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  exportFormat === 'pdf' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileText className={`w-8 h-8 ${exportFormat === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">PDF</span>
                <span className="text-xs text-muted-foreground">Ideal para imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  exportFormat === 'excel' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className={`w-8 h-8 ${exportFormat === 'excel' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium text-sm">Excel</span>
                <span className="text-xs text-muted-foreground">Ideal para análisis</span>
              </button>
            </div>
          </div>
          
          {/* Preview info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Resumen del reporte:</p>
            <p className="text-sm font-medium">
              {filteredTransactions.length} transacciones • {periodLabel}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="flex-1 h-11 sm:h-10"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || filteredTransactions.length === 0}
            className="flex-1 h-11 sm:h-10 gradient-primary"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Descargar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
