export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEV EMAIL]', { to, subject, html });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY not set, skipping email');
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Locket <noreply@locket.app>',
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send email');
  }
}