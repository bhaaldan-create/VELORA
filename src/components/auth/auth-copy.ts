import type { Locale } from "@/i18n/dictionaries";

export function authCopy(locale: Locale) {
  const ar = locale !== "en";
  return {
    welcome: ar ? "مرحبًا بك في فيلورا" : "Welcome to VELORA",
    tagline: ar ? "وجهتك الأولى لجمال يليق بك." : "Your destination for beauty that suits you.",
    tabLogin: ar ? "تسجيل الدخول" : "Sign in",
    tabSignup: ar ? "إنشاء حساب جديد" : "Create account",
    email: ar ? "البريد الإلكتروني" : "Email",
    emailPlaceholder: ar ? "أدخل بريدك الإلكتروني" : "Enter your email",
    password: ar ? "كلمة المرور" : "Password",
    passwordPlaceholder: ar ? "أدخل كلمة المرور" : "Enter your password",
    confirmPassword: ar ? "تأكيد كلمة المرور" : "Confirm password",
    confirmPasswordPlaceholder: ar ? "أعد إدخال كلمة المرور" : "Re-enter your password",
    fullName: ar ? "الاسم الكامل" : "Full name",
    fullNamePlaceholder: ar ? "أدخل اسمك الكامل" : "Enter your full name",
    rememberMe: ar ? "تذكرني" : "Remember me",
    forgotPassword: ar ? "نسيت كلمة المرور؟" : "Forgot password?",
    forgotPasswordHint: ar
      ? "تواصلي معنا عبر WhatsApp لاستعادة الوصول إلى حسابك."
      : "Contact us on WhatsApp to recover access to your account.",
    loginCta: ar ? "تسجيل الدخول" : "Sign in",
    signupCta: ar ? "إنشاء الحساب" : "Create account",
    orContinue: ar ? "أو تابع باستخدام" : "Or continue with",
    verifyTitle: ar ? "تحقق من بريدك الإلكتروني" : "Verify your email",
    verifySubtitle: ar
      ? "أرسلنا رمز التحقق إلى بريدك الإلكتروني."
      : "We sent a verification code to your email.",
    verifySuccess: ar ? "تم التحقق من البريد" : "Email verified",
    verifySuccessPhone: ar
      ? "أدخل رقم الجوال لإتمام إنشاء الحساب."
      : "Enter your mobile number to complete registration.",
    phoneLabel: ar ? "رقم الجوال للتوصيل" : "Mobile for delivery",
    phoneHint: ar ? "(لا يُستخدم لرمز التحقق)" : "(Not used for verification codes)",
    phonePlaceholder: "07XXXXXXXXX",
    resend: ar ? "إعادة إرسال الرمز" : "Resend code",
    resendIn: (s: number) =>
      ar ? `إعادة الإرسال بعد ${s}ث` : `Resend in ${s}s`,
    changeEmail: ar ? "تغيير البريد" : "Change email",
    editDetails: ar ? "تعديل البيانات" : "Edit details",
    otpLoginLink: ar ? "الدخول برمز التحقق المرسل للبريد" : "Sign in with email code",
    passwordLoginLink: ar ? "الدخول بكلمة المرور" : "Sign in with password",
    sendOtpCta: ar ? "إرسال رمز التحقق" : "Send verification code",
    confirmOtpCta: ar ? "تأكيد الرمز" : "Confirm code",
    confirmLoginCta: ar ? "تأكيد الدخول" : "Confirm sign in",
    strengthWeak: ar ? "ضعيفة" : "Weak",
    strengthMedium: ar ? "متوسطة" : "Medium",
    strengthStrong: ar ? "قوية" : "Strong",
    socialSoon: ar ? "قريبًا" : "Coming soon",
    footer: ar
      ? "© 2026 VELORA Beauty. جميع الحقوق محفوظة."
      : "© 2026 VELORA Beauty. All rights reserved.",
    loading: ar ? "جارٍ التحميل…" : "Loading…",
    redirecting: ar ? "جارٍ التحويل…" : "Redirecting…",
    processing: ar ? "جارٍ المعالجة…" : "Processing…",
    sending: ar ? "جارٍ الإرسال…" : "Sending…",
    signingIn: ar ? "جارٍ الدخول…" : "Signing in…",
    passwordMin: ar ? "8 أحرف على الأقل" : "At least 8 characters",
    otpOnlyHint: ar
      ? "رمز التحقق يُرسل إلى هذا البريد فقط"
      : "Verification code is sent to this email only",
    checkInbox: ar
      ? "تحققي من بريدك — الرسالة من فريق VELORA Beauty."
      : "Check your inbox — look for a message from VELORA Beauty.",
    devCode: ar ? "رمز مؤقت:" : "Dev code:",
    emailVerified: ar ? "تم التحقق من بريدك." : "Your email is verified.",
    mustVerifyEmail: ar
      ? "يجب تأكيد رمز البريد أولاً قبل إنشاء الحساب."
      : "Please verify your email before creating an account.",
    completeFields: ar ? "أكملي جميع الحقول بشكل صحيح." : "Please complete all fields correctly.",
    passwordMismatch: ar ? "كلمتا المرور غير متطابقتين." : "Passwords do not match.",
    language: ar ? "العربية" : "English",
  } as const;
}
