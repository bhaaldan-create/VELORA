/**
 * VELORA — Google Apps Script (إرسال الطلبات إلى Gmail)
 *
 * الخطوات:
 * 1) افتحي https://script.google.com
 * 2) New project → الصقي هذا الملف مكان الكود
 * 3) Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4) انسخي الـ Web App URL وضعِيه في .env.local:
 *    ORDER_WEBHOOK_URL=https://script.google.com/macros/s/XXXX/exec
 * 5) أعيدي تشغيل السيرفر
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents || "{}");
    var to = data.to || Session.getActiveUser().getEmail();
    var subject = data.subject || "طلب جديد من VELORA";
    var html = data.html || "";
    var text = data.text || "";
    var replyTo = data.replyTo || "";

    var options = {
      to: to,
      subject: subject,
      htmlBody: html,
      body: text || "طلب جديد من موقع VELORA",
      name: "VELORA Orders",
    };

    if (replyTo) {
      options.replyTo = replyTo;
    }

    MailApp.sendEmail(options);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: "VELORA Orders Webhook" }),
  ).setMimeType(ContentService.MimeType.JSON);
}
