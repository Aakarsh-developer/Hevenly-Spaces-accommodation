const brandColors = {
  primary: '#14532d',
  accent: '#1f6f4a',
  surface: '#f5f7f5',
  text: '#102218',
  muted: '#5f6e64',
  border: '#d8e0da',
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

interface EmailSection {
  title?: string;
  body: string;
}

interface BrandedEmailOptions {
  preheader: string;
  eyebrow?: string;
  headline: string;
  intro: string;
  sections?: EmailSection[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerTitle?: string;
  footerText?: string;
}

export const renderBrandedEmail = (options: BrandedEmailOptions) => {
  const sectionsHtml = (options.sections || [])
    .map((section) => `
      <div style="margin-top: 18px;">
        ${section.title ? `<p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: ${brandColors.text};">${escapeHtml(section.title)}</p>` : ''}
        <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${brandColors.muted};">${escapeHtml(section.body)}</p>
      </div>
    `)
    .join('');

  const ctaHtml = options.ctaLabel && options.ctaUrl
    ? `
      <div style="margin-top: 24px;">
        <a href="${options.ctaUrl}" style="display: inline-block; padding: 12px 20px; border-radius: 999px; background: ${brandColors.primary}; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none;">
          ${escapeHtml(options.ctaLabel)}
        </a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(options.headline)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: ${brandColors.surface}; font-family: Arial, Helvetica, sans-serif; color: ${brandColors.text};">
        <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
          ${escapeHtml(options.preheader)}
        </div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${brandColors.surface}; padding: 24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border: 1px solid ${brandColors.border}; border-radius: 24px; overflow: hidden;">
                <tr>
                  <td style="padding: 28px 28px 18px; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%); color: #ffffff;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; opacity: 0.82;">${escapeHtml(options.eyebrow || 'Havenly Spaces')}</p>
                    <h1 style="margin: 14px 0 0; font-size: 30px; line-height: 1.25;">${escapeHtml(options.headline)}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px;">
                    <p style="margin: 0; font-size: 15px; line-height: 1.8; color: ${brandColors.text};">${escapeHtml(options.intro)}</p>
                    ${sectionsHtml}
                    ${ctaHtml}
                    <div style="margin-top: 26px; padding-top: 18px; border-top: 1px solid ${brandColors.border};">
                      <p style="margin: 0; font-size: 13px; font-weight: 700; color: ${brandColors.text};">${escapeHtml(options.footerTitle || 'Need help?')}</p>
                      <p style="margin: 8px 0 0; font-size: 13px; line-height: 1.7; color: ${brandColors.muted};">${escapeHtml(options.footerText || 'If anything feels unclear, just reply to the platform support team or sign in to your dashboard for the next step.')}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export const renderPlainTextEmail = (options: BrandedEmailOptions) => {
  const sectionText = (options.sections || [])
    .map((section) => `${section.title ? `${section.title}: ` : ''}${section.body}`)
    .join('\n\n');

  return [
    options.headline,
    '',
    options.intro,
    '',
    sectionText,
    '',
    options.ctaLabel && options.ctaUrl ? `${options.ctaLabel}: ${options.ctaUrl}` : '',
    '',
    options.footerTitle || 'Need help?',
    options.footerText || 'If anything feels unclear, sign in to your dashboard for the next step.',
  ].filter(Boolean).join('\n');
};
