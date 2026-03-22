export function generateInvoiceHTML(invoice, bankOptions = {}, options = {}) {
  const { invoiceNo, billedTo, date, currency, lineItems, total } = invoice;
  const isUSD = (currency || 'USD').toUpperCase() === 'USD';
  const curSymbol = isUSD ? 'USD' : 'KES';
  
  const bank = {
    bankName: bankOptions?.bankName || '',
    bankCode: bankOptions?.bankCode || '',
    branch: bankOptions?.branch || '',
    accountName: bankOptions?.accountName || '',
    accountNumber: isUSD ? (bankOptions?.accountNumberUSD || '') : (bankOptions?.accountNumberKES || ''),
    swiftCode: bankOptions?.swiftCode || '',
  };

  const categories = [...new Set(lineItems.map(item => item.category).filter(c => c && c.toLowerCase() !== 'other'))];
  const serviceTypeHTML = categories.length > 0 ? `<p style="margin-top: 8px;"><span class="label">SERVICE TYPE:</span> ${categories.join(' / ').toUpperCase()}</p>` : '';

  const rows = lineItems.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td class="item-description">
            <span class="client-name">${item.name || item.clientName || '—'}</span><br>
            <span class="details">${item.description || item.details || '—'}</span>
        </td>
        <td style="font-size: 9pt; color: #555;">
            ${item.fromDate ? `${item.fromDate}<br>` : ''}
            ${item.toDate ? `to ${item.toDate}` : ''}
            ${(!item.fromDate && !item.toDate) ? '—' : ''}
        </td>
        <td>${Number(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('');

  const isReceipt = options.isReceipt || false;
  const docTitle = isReceipt ? `Receipt - ${options.receiptNo}` : `Invoice`;
  const docHeading = isReceipt ? `OFFICIAL RECEIPT` : `INVOICE`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          font-size: 10pt; 
          line-height: 1.4; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background: #fff;
        }
        .invoice-container { 
          width: 210mm; 
          min-height: 297mm; 
          padding: 1.2cm 1.5cm; 
          margin: 0 auto;
          box-sizing: border-box; 
        }
        @media print { 
          html, body { 
            width: 100%; 
            height: auto; 
            margin: 0; 
            padding: 0; 
          }
          .invoice-container {
            width: 100%;
            min-height: auto;
            padding: 0;
            margin: 0;
          }
          tr { page-break-inside: avoid; } 
          .invoice-table thead { display: table-header-group; } 
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #2E7D32; padding-bottom: 15px; }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo-section img { height: 90px; width: auto; object-fit: contain; }
        .company-info h1 { font-size: 18pt; color: #2E7D32; margin-bottom: 3px; }
        .company-info p { font-size: 9pt; color: #666; margin: 2px 0; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 24pt; color: #2E7D32; letter-spacing: 3px; margin-bottom: 5px; }
        .invoice-title .invoice-date { font-size: 10pt; color: #666; }
        .billing-sections { display: flex; justify-content: space-between; margin-bottom: 25px; gap: 30px; }
        .billing-box { flex: 1; background: #f9f9f9; padding: 12px 15px; border-left: 4px solid #2E7D32; }
        .billing-box h3 { font-size: 10pt; color: #2E7D32; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .billing-box p { font-size: 9.5pt; margin: 3px 0; color: #333; }
        .billing-box .label { font-weight: bold; color: #555; }
        .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
        .invoice-table thead { background: #2E7D32; color: white; }
        .invoice-table th { padding: 10px 12px; text-align: left; font-size: 9.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .invoice-table th:last-child { text-align: right; }
        .invoice-table td { padding: 10px 12px; border-bottom: 1px solid #ddd; font-size: 9.5pt; vertical-align: top; word-wrap: break-word; }
        .invoice-table td:last-child { text-align: right; font-weight: 600; }
        .invoice-table tbody tr:nth-child(even) { background: #f9f9f9; }
        .item-description .client-name { font-weight: 600; color: #2E7D32; }
        .item-description .details { color: #666; font-size: 9pt; }
        .section-header { background: #e8f5e9 !important; }
        .section-header td { font-weight: bold; color: #2E7D32; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; }
        .summary-section { display: flex; justify-content: flex-end; margin-bottom: 25px; }
        .summary-box { width: 280px; background: #f9f9f9; padding: 15px; border: 1px solid #ddd; }
        .summary-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; }
        .summary-row:last-child { border-bottom: none; }
        .summary-row.total { border-top: 2px solid #2E7D32; margin-top: 8px; padding-top: 10px; font-weight: bold; font-size: 12pt; color: #2E7D32; }
        .summary-row .label { color: #555; }
        .payment-section { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-left: 4px solid #2E7D32; page-break-inside: avoid; }
        .payment-section h3 { font-size: 10pt; color: #2E7D32; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 30px; }
        .payment-item { display: flex; font-size: 9.5pt; }
        .payment-item .label { font-weight: 600; color: #555; min-width: 120px; }

        .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; page-break-inside: avoid; }
        .footer p { font-size: 9pt; color: #666; margin: 3px 0; }
        .footer .thank-you { font-size: 11pt; color: #2E7D32; font-weight: 600; margin-bottom: 10px; }
        .footer .terms { font-style: italic; margin-top: 10px; }
    </style>
</head>
<body>
<div class="invoice-container">

<div class="header">
<div class="logo-section">
<img src="/logo.png" alt="Ladina Travel Safaris Logo">
<div class="company-info">
<h1>LADINA TRAVEL SAFARIS</h1>
<p>www.ladinatravelsafaris.com</p>
<p>Email: info@ladinatravelsafaris.com</p>
<p>Nairobi, Kenya</p>
</div>
</div>
<div class="invoice-title">
<h2>${docHeading}</h2>
<p class="invoice-date">${isReceipt ? 'Receipt Date:' : ''} ${isReceipt ? options.receiptDate : date}</p>
</div>
</div>

<div class="billing-sections">
<div class="billing-box">
<h3>PAY TO:</h3>
<p><span class="label">LADINA TRAVEL SAFARIS LTD</span></p>
<p>Nairobi, Kenya</p>
<p>Email: info@ladinatravelsafaris.com</p>
</div>
<div class="billing-box">
<h3>BILLED TO:</h3>
<p><span class="label">${billedTo}</span></p>
${serviceTypeHTML}
</div>
</div>

<table class="invoice-table">
<thead>
<tr>
<th style="width:7%">NO.</th>
<th style="width:48%">DESCRIPTION</th>
<th style="width:25%">FROM/TO DATE</th>
<th style="width:20%">AMOUNT (${curSymbol})</th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>

<div class="summary-section">
<div class="summary-box">
<div class="summary-row">
    <span class="label">Sub-Total:</span>
    <span>${curSymbol} ${Number(total).toFixed(2)}</span>
</div>
<div class="summary-row total">
    <span class="label">TOTAL:</span>
    <span>${curSymbol} ${Number(total).toFixed(2)}</span>
</div>
</div>
</div>



<div style="page-break-inside: avoid;">
  ${!isReceipt ? `
  <div class="payment-section">
  <h3>Payment Details - Bank Transfer</h3>
  <div class="payment-grid">
  <div class="payment-item"><span class="label">Bank Name:</span><span>${bank.bankName}</span></div>
  <div class="payment-item"><span class="label">Bank Code:</span><span>${bank.bankCode}</span></div>
  <div class="payment-item"><span class="label">Branch:</span><span>${bank.branch}</span></div>
  <div class="payment-item"><span class="label">Account Name:</span><span>${bank.accountName}</span></div>
  <div class="payment-item"><span class="label">Account Number:</span><span>${bank.accountNumber}</span></div>
  <div class="payment-item"><span class="label">SWIFT Code:</span><span>${bank.swiftCode}</span></div>
  </div>
  </div>
  ` : ''}

  <div class="footer">
  <p class="thank-you">Thank you for your business!</p>
  <p class="terms">Payment is required within 14 business days of invoice date.</p>
  <p>Please send remittance confirmation to info@ladinatravelsafaris.com</p>
  </div>
</div>

</div>
</body>
</html>
  `;
}

export function printInvoice(invoice, bankDetails) {
  const html = generateInvoiceHTML(invoice, bankDetails);
  
  let iframe = document.getElementById('print-iframe');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'print-iframe';
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
  }

  iframe.onload = () => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
}

export function previewInvoice(invoice, bankDetails) {
  return generateInvoiceHTML(invoice, bankDetails);
}

export async function downloadInvoice(invoice, bankDetails) {
  let html = generateInvoiceHTML(invoice, bankDetails);
  const filename = `Invoice-${invoice.invoiceNo || 'export'}.pdf`;

  // Inline the logo as base64 so puppeteer can render it without network access
  try {
    const logoRes = await fetch('/logo.png');
    if (logoRes.ok) {
      const blob = await logoRes.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      html = html.replace('src="/logo.png"', `src="${base64}"`);
    }
  } catch { /* logo optional */ }

  try {
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, filename }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'PDF generation failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`PDF download failed: ${e.message}`);
  }
}

export function previewReceipt(invoice, receipt, bankDetails) {
  let html = generateInvoiceHTML(invoice, bankDetails, { isReceipt: true, receiptNo: receipt.receiptNo, receiptDate: receipt.date });
  html = html.replace('</body>', `<div style="position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-15deg);font-size:100pt;font-weight:bold;color:rgba(46,125,50,0.1);border:15px solid rgba(46,125,50,0.1);padding:20px;border-radius:20px;z-index:9999;pointer-events:none;">PAID</div></body>`);
  return html;
}

export async function downloadReceipt(invoice, receipt, bankDetails) {
  let html = previewReceipt(invoice, receipt, bankDetails);
  const filename = `Receipt-${receipt.receiptNo || 'export'}.pdf`;

  try {
    const logoRes = await fetch('/logo.png');
    if (logoRes.ok) {
      const blob = await logoRes.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      html = html.replace('src="/logo.png"', `src="${base64}"`);
    }
  } catch { /* logo optional */ }

  try {
    const res = await fetch('/api/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, filename }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'PDF generation failed');
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert(`PDF download failed: ${e.message}`);
  }
}
