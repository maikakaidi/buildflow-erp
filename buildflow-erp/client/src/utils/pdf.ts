import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PdfColumn {
  header: string;
  dataKey: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

interface PdfOptions {
  title: string;
  subtitle?: string;
  columns: PdfColumn[];
  data: any[];
  companyName?: string;
  companyLogo?: string;
  primaryColor?: string;
  footer?: string;
  orientation?: 'portrait' | 'landscape';
  showHeader?: boolean;
}

export function generatePdf(options: PdfOptions) {
  const { title, subtitle, columns, data, companyName, companyLogo, primaryColor, footer, orientation = 'portrait', showHeader = true } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const color = primaryColor || '#1976d2';
  const rgb = hexToRgb(color);
  let y = margin;

  if (showHeader) {
    if (companyLogo) {
      try {
        doc.addImage(companyLogo, 'JPEG', margin, y, 30, 10);
      } catch {}
    }
    if (companyName) {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(companyName, companyLogo ? margin + 34 : margin, y + 4);
      y += 8;
    }
  }

  doc.setFontSize(18);
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.text(title, margin, y);
  y += 8;

  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, margin, y);
    y += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, margin, y);
  y += 4;

  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  const tableColumns = columns.map((col) => ({ header: col.header, dataKey: col.dataKey }));
  const tableData = data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      let val = row[col.dataKey];
      if (val === null || val === undefined) val = '—';
      if (col.align === 'right' && typeof val === 'number') {
        val = new Intl.NumberFormat('fr-FR').format(val);
      }
      obj[col.dataKey] = String(val);
    });
    return obj;
  });

  autoTable(doc, {
    startY: y,
    columns: tableColumns,
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: rgb || [25, 118, 210], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { left: margin, right: margin },
  });

  if (footer) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      const footerY = doc.internal.pageSize.getHeight() - 8;
      doc.text(footer, pageWidth / 2, footerY, { align: 'center' });
    }
  }

  return doc;
}

export function downloadPdf(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function formatPdfDate(date: string | Date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatPdfAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : null;
}

export function generateSingleInvoicePdf(invoice: any, company?: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const color = company?.primaryColor || '#1976d2';
  const rgb = hexToRgb(color);
  let y = margin;

  if (company?.logo) {
    try { doc.addImage(company.logo, 'JPEG', margin, y, 40, 14); } catch {}
  }
  doc.setFontSize(16);
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.text('FACTURE', pageWidth - margin, y + 4, { align: 'right' });
  y += 14;

  if (company?.name || company?.address) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    if (company?.name) doc.text(company.name, margin, y);
    if (company?.address) { y += 4; doc.text(company.address, margin, y); }
    if (company?.phone || company?.email) { y += 4; doc.text([company?.phone, company?.email].filter(Boolean).join(' | '), margin, y); }
    y += 4;
  }

  doc.setDrawColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 6;

  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(`N° ${invoice.number}`, margin, y);
  doc.text(`Date: ${formatPdfDate(invoice.date)}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  if (invoice.dueDate) {
    doc.text(`Échéance: ${formatPdfDate(invoice.dueDate)}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
  }

  y += 4;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  const items = invoice.items || [];
  const lines = items.length > 0 ? items : [{ description: invoice.notes || 'Prestation', quantity: 1, unitPrice: invoice.subtotal || invoice.total, total: invoice.total }];

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: lines.map((l: any) => [
      l.description || '—',
      l.quantity || 1,
      formatPdfAmount(l.unitPrice || l.total || 0),
      formatPdfAmount(l.total || 0),
    ]),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: rgb || [25, 118, 210], textColor: 255, fontStyle: 'bold' },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sous-total: ${formatPdfAmount(invoice.subtotal || invoice.total)}`, pageWidth - margin, finalY, { align: 'right' });
  if (invoice.taxRate > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`TVA (${invoice.taxRate}%): ${formatPdfAmount(invoice.taxAmount || 0)}`, pageWidth - margin, finalY + 5, { align: 'right' });
  }
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.text(`Total: ${formatPdfAmount(invoice.total)}`, pageWidth - margin, finalY + 10, { align: 'right' });

  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Payé: ${formatPdfAmount(invoice.paidAmount || 0)}`, pageWidth - margin, finalY + 16, { align: 'right' });
  const reste = (invoice.total || 0) - (invoice.paidAmount || 0);
  doc.text(`Reste: ${formatPdfAmount(reste)}`, pageWidth - margin, finalY + 22, { align: 'right' });

  if (invoice.notes) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Notes: ${invoice.notes}`, margin, finalY + 16);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(company?.name || 'BuildFlow ERP', pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  return doc;
}
