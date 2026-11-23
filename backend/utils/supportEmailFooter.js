export function escapeEmailHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function getSupportTicketUrl({ recipientRole, ticketNumber, frontendBaseUrl = process.env.FRONTEND_URL }) {
  const base = typeof frontendBaseUrl === 'string' ? frontendBaseUrl.trim().replace(/\/+$/, '') : '';
  if (!base) {
    return null;
  }

  const encodedTicket = encodeURIComponent(String(ticketNumber || '').trim());
  if (recipientRole === 'admin') {
    return `${base}/admin/support/${encodedTicket}/`;
  }
  if (recipientRole === 'expert') {
    return `${base}/expert/support/?ticket=${encodedTicket}`;
  }
  return `${base}/seeker/support/?ticket=${encodedTicket}`;
}

export function buildSupportEmailFooter({ recipientRole, ticketNumber, frontendBaseUrl = process.env.FRONTEND_URL }) {
  const ticketUrl = getSupportTicketUrl({ recipientRole, ticketNumber, frontendBaseUrl });
  if (!ticketUrl) {
    console.warn('[Support] FRONTEND_URL is not configured; omitting ticket link footer from support email.');
    return {
      ticketUrl: null,
      htmlFooter: '',
      textFooter: '',
    };
  }

  const escapedUrl = escapeEmailHtml(ticketUrl);
  return {
    ticketUrl,
    htmlFooter: `<p style="margin-top: 16px; font-size: 12px; color: #666;">This email is auto-generated. To respond on this ticket, please click on <a href="${escapedUrl}" style="color: #E53B17;">${escapedUrl}</a>.</p>`,
    textFooter: `This email is auto-generated. To respond on this ticket, please click on ${ticketUrl}.`,
  };
}
