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

export async function generatePdf(options: PdfOptions) {
  const { title, subtitle, columns, data, companyName, companyLogo, primaryColor, footer, orientation = 'portrait', showHeader = true } = options;

  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const color = primaryColor || '#1976d2';
  const rgb = hexToRgb(color);
  let y = margin;

  if (showHeader) {
    if (companyLogo) {
      const logoDataUrl = await loadImageAsDataUrl(companyLogo);
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, getImageFormat(companyLogo), margin, y, 30, 10);
        } catch {}
      }
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

export async function generateSingleInvoicePdf(invoice: any, company?: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const color = company?.primaryColor || '#1976d2';
  const rgb = hexToRgb(color);
  let y = margin;

  const logo = company?.logoPdf || company?.logo;

  if (logo) {
    const logoDataUrl = await loadImageAsDataUrl(logo);
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, getImageFormat(logo), margin, y, 42, 16); } catch {}
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.text('FACTURE', pageWidth - margin, y + 6, { align: 'right' });

  if (company?.name) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(40);
    doc.text(String(company.name), margin, y + 20);
  }
  y += 24;

  const contactLines: string[] = [];
  if (company?.address) contactLines.push(String(company.address));
  if (company?.phone) contactLines.push(String(company.phone));
  if (company?.email) contactLines.push(String(company.email));
  if (company?.directorName) contactLines.push(`Gérant: ${company.directorName}`);

  if (contactLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    contactLines.forEach((line, i) => { doc.text(line, margin, y + i * 4); });
    y += contactLines.length * 4;
  }

  doc.setDrawColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`N° ${invoice.number || ''}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(70);
  doc.text(`Date: ${formatPdfDate(invoice.date)}`, pageWidth - margin, y, { align: 'right' });
  y += 5;
  if (invoice.dueDate) {
    doc.text(`Échéance: ${formatPdfDate(invoice.dueDate)}`, pageWidth - margin, y, { align: 'right' });
    y += 5;
  }

  if (invoice.client) {
    y += 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('FACTURÉ À', margin, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30);
    doc.text(String(invoice.client.name || ''), margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(90);
    const clientLines: string[] = [];
    if (invoice.client.phone) clientLines.push(`${invoice.client.phoneCode || ''} ${invoice.client.phone}`);
    if (invoice.client.address) clientLines.push(String(invoice.client.address));
    if (clientLines.length) {
      clientLines.forEach((line, i) => { doc.text(line, margin, y + i * 4); });
      y += clientLines.length * 4;
    }
  }

  y += 4;

  const items = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ description: invoice.notes || 'Prestation', quantity: 1, unitPrice: invoice.subtotal || invoice.total, total: invoice.total }];

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: items.map((l: any) => [
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

  const tableEnd = (doc as any).lastAutoTable.finalY;

  // --- Totaux (empilés proprement sous le tableau, jamais dessus) ---
  let totalsStartY = tableEnd + 10;
  const totalsRight = pageWidth - margin - 8;

  if (totalsStartY > pageHeight - 74) {
    doc.addPage();
    totalsStartY = margin + 10;
  }

  doc.setDrawColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.setLineWidth(0.3);
  doc.line(margin, totalsStartY - 4, pageWidth - margin, totalsStartY - 4);

  let ty = totalsStartY;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(80);
  doc.text(`Sous-total: ${formatPdfAmount(invoice.subtotal || invoice.total)}`, totalsRight, ty, { align: 'right' });
  ty += 5.5;
  if (invoice.taxRate > 0) {
    doc.text(`TVA (${invoice.taxRate}%): ${formatPdfAmount(invoice.taxAmount || 0)}`, totalsRight, ty, { align: 'right' });
    ty += 5.5;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  doc.text(`Total: ${formatPdfAmount(invoice.total)}`, totalsRight, ty, { align: 'right' });
  ty += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);
  doc.text(`Payé: ${formatPdfAmount(invoice.paidAmount || 0)}`, totalsRight, ty, { align: 'right' });
  ty += 5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(rgb ? rgb[0] : 0, rgb ? rgb[1] : 0, rgb ? rgb[2] : 0);
  const reste = (invoice.total || 0) - (invoice.paidAmount || 0);
  doc.text(`Reste dû: ${formatPdfAmount(reste)}`, totalsRight, ty, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  ty += 7;

  let notesY = ty;
  if (invoice.notes) {
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.text(`Notes: ${invoice.notes}`, margin, notesY);
    notesY += 5;
  }

  // --- Signature & cachet (en bas de page, avec saut de page si besoin) ---
  if (notesY > pageHeight - 48) {
    doc.addPage();
  }
  const sigY = pageHeight - 36;
  doc.setDrawColor(200);
  doc.setLineWidth(0.3);
  doc.line(margin, sigY, pageWidth - margin, sigY);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text('Signature & cachet', margin, sigY + 4);

  const signer = company?.directorName || company?.name || '';
  if (signer) {
    doc.setFontSize(9);
    doc.setTextColor(60);
    doc.text(`Le Directeur — ${signer}`, pageWidth - margin, sigY + 4, { align: 'right' });
  }

  if (company?.signature) {
    const sigDataUrl = await loadImageAsDataUrl(company.signature);
    if (sigDataUrl) {
      try { doc.addImage(sigDataUrl, getImageFormat(company.signature), pageWidth - margin - 45, sigY - 16, 45, 14); } catch {}
    }
  }
  if (company?.stamp) {
    const stampDataUrl = await loadImageAsDataUrl(company.stamp);
    if (stampDataUrl) {
      try { doc.addImage(stampDataUrl, getImageFormat(company.stamp), pageWidth - margin - 20, sigY - 22, 20, 20); } catch {}
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(company?.name || 'BuildFlow ERP', pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  return doc;
}

function getImageFormat(url: string): string {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'PNG';
  if (clean.endsWith('.webp') || clean.endsWith('.svg')) return 'PNG';
  return 'JPEG';
}

const MAX_IMAGE_DIM = 900;

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, MAX_IMAGE_DIM / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.max(1, Math.round(img.naturalWidth * scale));
          const h = Math.max(1, Math.round(img.naturalHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          const isPng = getImageFormat(url) === 'PNG';
          const dataUrl = ctx ? canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.85) : null;
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } catch {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); };
      img.src = objectUrl;
    });
  } catch {
    return null;
  }
}
