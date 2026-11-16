import { sendEmail } from '../functions/api/utils/email';

const senderEmail =
  process.env.ORBITMAIL_FROM || process.env.EMAIL_FROM || 'contact@orbitsaas.cloud';

const recipients = [
  'adnanshahria2019@gmail.com',
  'adnanshahria2006@gmail.com',
  'adnanshahriaot@gmail.com'
];

async function run() {
  console.log('Sending test messages via OrbitMail...\n');

  for (const to of recipients) {
    try {
      const res = await sendEmail({
        to,
        subject: 'OrbitMail Live Test: Fashion Doniya System Notification',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #111827; margin-top: 0;">Fashion Doniya &bull; OrbitMail Delivery Test</h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.5;">Hello Adnan,</p>
            <p style="color: #374151; font-size: 14px; line-height: 1.5;">This is a test notification verifying email dispatch from <strong>Fashion Doniya</strong> routed through centralized <strong>OrbitMail</strong> (<code>https://mail.orbitsaas.cloud</code>).</p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 18px; border-radius: 8px; margin: 18px 0; font-size: 13px; color: #334155;">
              <p style="margin: 4px 0;"><strong>Recipient:</strong> ${to}</p>
              <p style="margin: 4px 0;"><strong>Sender:</strong> ${senderEmail}</p>
              <p style="margin: 4px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <p style="margin: 4px 0;"><strong>Status:</strong> Accepted for delivery</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">OrbitMail Centralized Infrastructure &bull; Fashion Doniya</p>
          </div>
        `
      });

      console.log(`[SUCCESS] ${to}`);
      console.log(JSON.stringify(res, null, 2));
      console.log('--------------------------------------------------');
    } catch (err: any) {
      console.error(`[FAILED] ${to}:`, err.message);
      console.log('--------------------------------------------------');
    }
  }

  // Also test array batch sending
  console.log('\nTesting multi-recipient batch send...');
  try {
    const batchRes = await sendEmail({
      to: recipients,
      subject: 'OrbitMail Multi-Recipient Test: Fashion Doniya Alert',
      html: '<p>Multi-recipient dispatch test to all configured admin addresses.</p>'
    });
    console.log('[BATCH SUCCESS]');
    console.log(JSON.stringify(batchRes, null, 2));
  } catch (err: any) {
    console.error('[BATCH FAILED]:', err.message);
  }
}

run();
