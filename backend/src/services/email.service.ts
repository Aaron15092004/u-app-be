import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const FROM_ADDRESS = 'Ủ App <no-reply@uapp.health>';

export async function sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<void> {
  const deepLinkBase = process.env.APP_DEEP_LINK_BASE ?? 'uapp://';
  const resetUrl = `${deepLinkBase}reset-password?token=${encodeURIComponent(resetToken)}`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Khôi phục mật khẩu Ủ App</title>
</head>
<body style="font-family: sans-serif; background-color: #f5f5f5; padding: 24px;">
  <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 8px; padding: 32px;">
    <h2 style="color: #4CAF50;">Ủ App — Khôi phục mật khẩu</h2>
    <p>Xin chào,</p>
    <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.</p>
    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
    <a href="${resetUrl}"
       style="display: inline-block; margin: 16px 0; padding: 12px 24px;
              background-color: #4CAF50; color: #fff; text-decoration: none;
              border-radius: 6px; font-weight: bold;">
      Đặt lại mật khẩu
    </a>
    <p style="color: #666; font-size: 13px;">
      Liên kết này sẽ hết hạn sau <strong>15 phút</strong>.
      Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.
    </p>
    <hr style="border: none; border-top: 1px solid #eee;" />
    <p style="color: #aaa; font-size: 12px;">Ủ App — Ứng dụng quản lý sức khỏe toàn diện</p>
  </div>
</body>
</html>
`.trim();

  const textBody = `Ủ App — Khôi phục mật khẩu

Xin chào,

Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản của bạn.

Truy cập đường dẫn sau để đặt lại mật khẩu:
${resetUrl}

Liên kết này sẽ hết hạn sau 15 phút.
Nếu bạn không yêu cầu khôi phục mật khẩu, hãy bỏ qua email này.

Ủ App — Ứng dụng quản lý sức khỏe toàn diện`;

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject: 'Khôi phục mật khẩu Ủ App',
      html: htmlBody,
      text: textBody,
    });
  } catch (err) {
    console.error('[email.service] Failed to send password reset email:', err);
    throw err;
  }
}
