/**
 * Google Apps Script — إرسال رمز VELORA عبر واتساب (اختياري)
 *
 * انشري كـ Web App (Anyone) والصقي الرابط في:
 * WHATSAPP_OTP_WEBHOOK_URL
 *
 * تحتاجين خدمة ترسل واتساب فعلياً (مثل CallMeBot API أو بوابة محلية).
 * مثال CallMeBot: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 * أو استبدلي sendWhatsApp بأي مزوّد لديكِ.
 */

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    const phone = String(body.phone || "").replace(/\D/g, "");
    const message = String(body.message || "");
    const code = String(body.code || "");

    if (!phone || !message) {
      return json_({ ok: false, error: "phone/message required" });
    }

    // --- استبدلي هذا الجزء بمزوّد واتساب لديكِ ---
    // مثال وهمي: سجّل في السجل فقط
    console.log("VELORA WhatsApp OTP", phone, code, message);

    // مثال CallMeBot (يحتاج تفعيل الرقم مسبقاً على الخدمة):
    // const apikey = PropertiesService.getScriptProperties().getProperty("CALLMEBOT_KEY");
    // const url = "https://api.callmebot.com/whatsapp.php?phone=" + phone + "&text=" + encodeURIComponent(message) + "&apikey=" + apikey;
    // UrlFetchApp.fetch(url);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
