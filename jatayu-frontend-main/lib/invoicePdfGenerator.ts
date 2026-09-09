import { BookingDetail } from "./seekerDashboard";
import { formatCurrency } from "@/components/checkout/checkoutUtils";

export type GenericInvoiceData = {
  invoiceId: string;
  referenceId: string;
  issueDate: string;
  clientName: string;
  clientEmail?: string;
  expertName: string;
  expertRole?: string;
  consultationLabel: string;
  scheduledDate: string;
  scheduledTime?: string;
  consultationFee: number;
  platformFee: number;
  gst: number;
  walletApplied?: number;
  totalPaid: number;
  paymentMethod?: string;
  paymentStatus?: "Paid" | "Pending" | "Refunded";
};

export function generateInvoiceHtml(data: GenericInvoiceData): string {
  const statusColor = data.paymentStatus === "Paid" ? "#2e7d32" : "#e53b17";
  const statusBg = data.paymentStatus === "Paid" ? "#e8f5e9" : "#fff1ed";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice - ${data.invoiceId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4;
      margin: 12mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0b0d14;
      background: #ffffff;
      padding: 24px 32px;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
    }

    /* Top Brand Bar */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 24px;
      border-bottom: 2px solid #f1f1f1;
      margin-bottom: 24px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-icon {
      width: 38px;
      height: 38px;
      background: #e53b17;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 20px;
    }

    .brand-name {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: #0b0d14;
    }

    .brand-sub {
      font-size: 11px;
      color: #686868;
      font-weight: 500;
    }

    .invoice-badge-wrap {
      text-align: right;
    }

    .invoice-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 4px 10px;
      border-radius: 6px;
      background: ${statusBg};
      color: ${statusColor};
      margin-bottom: 6px;
    }

    .invoice-id {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
      color: #0b0d14;
    }

    .invoice-date {
      font-size: 12px;
      color: #686868;
    }

    /* Addresses Grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    .party-card {
      background: #fafafa;
      border: 1px solid #e6e6e6;
      border-radius: 12px;
      padding: 16px 18px;
    }

    .party-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #888888;
      margin-bottom: 8px;
    }

    .party-name {
      font-size: 15px;
      font-weight: 700;
      color: #0b0d14;
      margin-bottom: 4px;
    }

    .party-detail {
      font-size: 12px;
      color: #555555;
      line-height: 1.4;
    }

    /* Session Info Card */
    .session-info {
      background: #fbfbfb;
      border: 1px dashed #d6d6d6;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .session-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .session-label {
      font-size: 11px;
      color: #888888;
      font-weight: 600;
      text-transform: uppercase;
    }

    .session-val {
      font-size: 13px;
      font-weight: 600;
      color: #0b0d14;
    }

    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }

    .items-table th {
      background: #f5f5f5;
      color: #555555;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 14px;
      text-align: left;
      border-top: 1px solid #e6e6e6;
      border-bottom: 1px solid #e6e6e6;
    }

    .items-table th:last-child {
      text-align: right;
    }

    .items-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #eeeeee;
      font-size: 13px;
      color: #1a1a1a;
    }

    .items-table td:last-child {
      text-align: right;
      font-weight: 600;
    }

    .item-desc-main {
      font-weight: 600;
      color: #0b0d14;
    }

    .item-desc-sub {
      font-size: 11px;
      color: #777777;
      margin-top: 2px;
    }

    /* Summary Calculation */
    .calc-wrap {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }

    .calc-table {
      width: 320px;
    }

    .calc-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      color: #555555;
    }

    .calc-row.discount {
      color: #2e7d32;
      font-weight: 600;
    }

    .calc-divider {
      height: 1px;
      background: #e6e6e6;
      margin: 8px 0;
    }

    .calc-total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 10px 14px;
      background: #0b0d14;
      color: #ffffff;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      margin-top: 6px;
    }

    .calc-total-amount {
      font-size: 18px;
      font-weight: 800;
      color: #ffffff;
    }

    /* Footer & Seal */
    .footer {
      border-top: 1px solid #eeeeee;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #888888;
      font-size: 11px;
    }

    .footer-note {
      max-width: 480px;
      line-height: 1.4;
    }

    .verified-stamp {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px dashed #2e7d32;
      border-radius: 6px;
      background: #f1f8f1;
      color: #2e7d32;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div class="brand-logo">
        <div class="brand-icon">J</div>
        <div>
          <div class="brand-name">Jatayu</div>
          <div class="brand-sub">Verified Advisory Platform</div>
        </div>
      </div>
      <div class="invoice-badge-wrap">
        <div class="invoice-tag">${data.paymentStatus || "PAID"}</div>
        <div class="invoice-id">${data.invoiceId}</div>
        <div class="invoice-date">Date: ${data.issueDate}</div>
      </div>
    </div>

    <!-- Parties -->
    <div class="grid-2">
      <div class="party-card">
        <div class="party-title">Billed By</div>
        <div class="party-name">Jatayu Platform Services Pvt Ltd</div>
        <div class="party-detail">
          GSTIN: 29AAACJ1234F1Z5<br />
          Indiranagar, 100ft Road, Bengaluru<br />
          Karnataka, India — 560038<br />
          support@jatayu.io
        </div>
      </div>
      <div class="party-card">
        <div class="party-title">Billed To</div>
        <div class="party-name">${data.clientName || "Valued Client"}</div>
        <div class="party-detail">
          ${data.clientEmail ? `${data.clientEmail}<br />` : ""}
          Booking Ref: <strong>${data.referenceId}</strong><br />
          Expert: <strong>${data.expertName}</strong>
        </div>
      </div>
    </div>

    <!-- Session Details -->
    <div class="session-info">
      <div class="session-item">
        <span class="session-label">Service / Consultation</span>
        <span class="session-val">${data.consultationLabel}</span>
      </div>
      <div class="session-item">
        <span class="session-label">Scheduled Date</span>
        <span class="session-val">${data.scheduledDate}</span>
      </div>
      ${data.scheduledTime ? `
      <div class="session-item">
        <span class="session-label">Time Slot</span>
        <span class="session-val">${data.scheduledTime}</span>
      </div>` : ""}
      <div class="session-item">
        <span class="session-label">Payment Method</span>
        <span class="session-val">${data.paymentMethod || "Online (Razorpay Escrow)"}</span>
      </div>
    </div>

    <!-- Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="item-desc-main">${data.consultationLabel}</div>
            <div class="item-desc-sub">1:1 Consultation with ${data.expertName}</div>
          </td>
          <td>1</td>
          <td>${formatCurrency(data.consultationFee)}</td>
          <td>${formatCurrency(data.consultationFee)}</td>
        </tr>
        <tr>
          <td>
            <div class="item-desc-main">Platform & Infrastructure Fee</div>
            <div class="item-desc-sub">Secure video escrow & compliance</div>
          </td>
          <td>1</td>
          <td>${formatCurrency(data.platformFee)}</td>
          <td>${formatCurrency(data.platformFee)}</td>
        </tr>
        <tr>
          <td>
            <div class="item-desc-main">Goods & Services Tax (GST 18%)</div>
            <div class="item-desc-sub">CGST (9%) + SGST (9%)</div>
          </td>
          <td>1</td>
          <td>${formatCurrency(data.gst)}</td>
          <td>${formatCurrency(data.gst)}</td>
        </tr>
      </tbody>
    </table>

    <!-- Calculations -->
    <div class="calc-wrap">
      <div class="calc-table">
        <div class="calc-row">
          <span>Consultation Subtotal</span>
          <span>${formatCurrency(data.consultationFee)}</span>
        </div>
        <div class="calc-row">
          <span>Platform Fee</span>
          <span>${formatCurrency(data.platformFee)}</span>
        </div>
        <div class="calc-row">
          <span>GST (18%)</span>
          <span>${formatCurrency(data.gst)}</span>
        </div>
        ${
          data.walletApplied && data.walletApplied > 0
            ? `<div class="calc-row discount">
                 <span>Credits Applied</span>
                 <span>− ${formatCurrency(data.walletApplied)}</span>
               </div>`
            : ""
        }
        <div class="calc-divider"></div>
        <div class="calc-total">
          <span>Total Paid (INR)</span>
          <span class="calc-total-amount">${formatCurrency(data.totalPaid)}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-note">
        This is a digitally generated Tax Invoice / Receipt from Jatayu Platform. No physical signature is required. All consultation fees are held in secure escrow until session completion.
      </div>
      <div class="verified-stamp">
        ✓ Verified Escrow Payment
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;
}

/**
 * Triggers the browser print dialog for an invoice in a dedicated clean window
 */
export function printInvoicePdf(data: GenericInvoiceData) {
  const html = generateInvoiceHtml(data);
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Helper to download/print directly from a BookingDetail object
 */
export function downloadBookingInvoicePdf(booking: BookingDetail) {
  printInvoicePdf({
    invoiceId: booking.invoiceId,
    referenceId: booking.referenceId,
    issueDate: booking.placedOnLabel || "Dec 16, 2024",
    clientName: "Priya Sharma",
    clientEmail: "ananya@email.com",
    expertName: booking.expert.name,
    expertRole: booking.expert.role,
    consultationLabel: booking.consultationLabel,
    scheduledDate: booking.scheduledDateLabel,
    scheduledTime: booking.scheduledTimeLabel,
    consultationFee: booking.consultationFee,
    platformFee: booking.platformFee,
    gst: booking.gst,
    walletApplied: booking.walletApplied,
    totalPaid: booking.totalPaid,
    paymentMethod: "Online (Razorpay Escrow)",
    paymentStatus: booking.paymentStatus === "paid" ? "Paid" : "Pending",
  });
}
