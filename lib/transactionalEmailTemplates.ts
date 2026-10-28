export type EmailContent = { subject: string; text: string; html: string };

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export function portalEmailUrl(path: string) {
  const base = new URL(process.env.APP_URL || '');
  if (base.username || base.password || (base.protocol !== 'https:' &&
      !(process.env.NODE_ENV !== 'production' && base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) {
    throw new Error('Email portal URL is not configured');
  }
  return new URL(path, base.origin).toString();
}

export function pergasEmail(input: { subject: string; name: string; title: string; paragraphs: string[]; action: string; href: string }): EmailContent {
  const e = escapeEmailHtml;
  const settings = portalEmailUrl('/member/settings');
  const greeting = `Assalamu alaikum ${input.name || 'Member'},`;
  const footer = 'Official Pergas Member Portal communication. You receive this email because Email Notifications is enabled. Manage RSVP confirmation and announcement emails in Member Settings.';
  return {
    subject: input.subject.replace(/[\r\n]/g, ' ').slice(0, 180),
    text: [greeting, input.title, ...input.paragraphs, `${input.action}: ${input.href}`, footer, settings].join('\n\n'),
    html: `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta charset="utf-8"><title>${e(input.title)}</title></head>
<body style="margin:0;background:#f4f7f4;font-family:Arial,Helvetica,sans-serif;color:#203020">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="padding:24px;background:#176b32;color:#fff;font-size:24px;font-weight:bold">PERGAS<br><span style="font-size:13px;font-weight:normal">Member Portal</span></td></tr>
<tr><td style="padding:28px;line-height:1.6"><p>${e(greeting)}</p><h1 style="font-size:23px;line-height:1.3">${e(input.title)}</h1>
${input.paragraphs.map(p => `<p style="white-space:pre-line">${e(p)}</p>`).join('')}
<p style="margin:28px 0"><a href="${e(input.href)}" style="display:inline-block;background:#176b32;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px">${e(input.action)}</a></p></td></tr>
<tr><td style="padding:20px 28px;background:#edf3ee;font-size:12px;line-height:1.6">${e(footer)}<br><a href="${e(settings)}" style="color:#176b32">Manage email preferences</a></td></tr>
</table></td></tr></table></body></html>`,
  };
}

export function rsvpConfirmationEmail(name: string, event: {
  id: string; title: string; event_date: string | null; start_time: string | null; end_time: string | null; venue: string | null;
}) {
  const date = event.event_date ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'full', timeZone: 'Asia/Singapore' })
    .format(new Date(`${event.event_date.slice(0, 10)}T12:00:00Z`)) : 'To be confirmed';
  const time = event.start_time ? `${event.start_time.slice(0, 5)}${event.end_time ? ` – ${event.end_time.slice(0, 5)}` : ''} (Singapore time)` : 'To be confirmed';
  return pergasEmail({ subject: `Pergas RSVP confirmed: ${event.title}`, name, title: 'Your event registration is confirmed',
    paragraphs: [event.title, `Date: ${date}\nTime: ${time}\nVenue: ${event.venue || 'To be confirmed'}`,
      'If a membership QR code is required at the event, open the Pergas Member Portal to display your current membership QR. Please do not use an old screenshot.'],
    action: 'View event in Member Portal', href: portalEmailUrl(`/member/events/${encodeURIComponent(event.id)}`),
  });
}
