// Fixed, DLT-ready SMS templates. SMS NEVER contains AI-written or free text: only these exact texts,
// with each {#var#} filled in the order given by VARIABLE_ORDER.
//
// India's DLT rules: register every text below EXACTLY as written (same spaces, punctuation and the
// "- CareBridge" signature) on your operator's DLT portal, under your registered header (sender ID).
// Hindi, Bengali, Telugu and Tamil must be registered as Unicode templates; English as a plain-text template.
// Category: "Service Implicit" (transactional reminders to people who consented) – VERIFY with your DLT operator.
// After approval, put each DLT template ID in the env var named by envKey(), e.g. SMS_TEMPLATE_ID_REMINDER_24H_HI.
// If you change any wording here you MUST re-register the template, or operators will block the message.
import type { Kind, Lang } from "./util.js";

/** Same order for every template and language. No medical details are ever included. */
export const VARIABLE_ORDER = ["patientFirstName", "hospitalName", "date", "time", "hospitalPhone"] as const;
export type SmsVariables = Record<(typeof VARIABLE_ORDER)[number], string>;

/** DLT limits each {#var#} to 30 characters (VERIFY with your operator); longer values are shortened. */
export const VAR_MAX = 30;

export const SMS_TEMPLATES: Record<Kind, Record<Lang, string>> = {
  CONFIRMATION: {
    EN: "Dear {#var#}, your appointment at {#var#} is confirmed for {#var#} at {#var#}. To confirm or reschedule call {#var#}. Reply STOP to opt out. - CareBridge",
    HI: "प्रिय {#var#}, आपकी अपॉइंटमेंट पक्की हो गई है। अस्पताल: {#var#}, तारीख: {#var#}, समय: {#var#}। पुष्टि करने या समय बदलने के लिए कॉल करें: {#var#}। रिमाइंडर बंद करने के लिए STOP लिखकर भेजें। - CareBridge",
    BN: "প্রিয় {#var#}, আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত হয়েছে। হাসপাতাল: {#var#}, তারিখ: {#var#}, সময়: {#var#}। নিশ্চিত করতে বা সময় বদলাতে কল করুন: {#var#}। রিমাইন্ডার বন্ধ করতে STOP লিখে পাঠান। - CareBridge",
    TE: "ప్రియమైన {#var#}, మీ అపాయింట్‌మెంట్ ఖరారైంది. ఆసుపత్రి: {#var#}, తేదీ: {#var#}, సమయం: {#var#}. నిర్ధారించడానికి లేదా సమయం మార్చడానికి కాల్ చేయండి: {#var#}. రిమైండర్‌లు ఆపడానికి STOP అని పంపండి. - CareBridge",
    TA: "அன்புள்ள {#var#}, உங்கள் சந்திப்பு உறுதி செய்யப்பட்டது. மருத்துவமனை: {#var#}, தேதி: {#var#}, நேரம்: {#var#}. உறுதிப்படுத்த அல்லது நேரத்தை மாற்ற அழைக்கவும்: {#var#}. நினைவூட்டல்களை நிறுத்த STOP என அனுப்பவும். - CareBridge",
  },
  REMINDER_24H: {
    EN: "Dear {#var#}, reminder: your appointment at {#var#} is tomorrow, {#var#} at {#var#}. To confirm or reschedule call {#var#}. Reply STOP to opt out. - CareBridge",
    HI: "प्रिय {#var#}, याद दिला दें, आपकी अपॉइंटमेंट कल है। अस्पताल: {#var#}, तारीख: {#var#}, समय: {#var#}। पुष्टि करने या समय बदलने के लिए कॉल करें: {#var#}। रिमाइंडर बंद करने के लिए STOP लिखकर भेजें। - CareBridge",
    BN: "প্রিয় {#var#}, মনে করিয়ে দিচ্ছি, আপনার অ্যাপয়েন্টমেন্ট আগামীকাল। হাসপাতাল: {#var#}, তারিখ: {#var#}, সময়: {#var#}। নিশ্চিত করতে বা সময় বদলাতে কল করুন: {#var#}। রিমাইন্ডার বন্ধ করতে STOP লিখে পাঠান। - CareBridge",
    TE: "ప్రియమైన {#var#}, గుర్తు చేస్తున్నాం, మీ అపాయింట్‌మెంట్ రేపు ఉంది. ఆసుపత్రి: {#var#}, తేదీ: {#var#}, సమయం: {#var#}. నిర్ధారించడానికి లేదా సమయం మార్చడానికి కాల్ చేయండి: {#var#}. రిమైండర్‌లు ఆపడానికి STOP అని పంపండి. - CareBridge",
    TA: "அன்புள்ள {#var#}, நினைவூட்டல்: உங்கள் சந்திப்பு நாளை. மருத்துவமனை: {#var#}, தேதி: {#var#}, நேரம்: {#var#}. உறுதிப்படுத்த அல்லது நேரத்தை மாற்ற அழைக்கவும்: {#var#}. நினைவூட்டல்களை நிறுத்த STOP என அனுப்பவும். - CareBridge",
  },
  REMINDER_2H: {
    EN: "Dear {#var#}, your appointment at {#var#} is today, {#var#} at {#var#}, in about 2 hours. To confirm or reschedule call {#var#}. Reply STOP to opt out. - CareBridge",
    HI: "प्रिय {#var#}, आपकी अपॉइंटमेंट आज लगभग 2 घंटे में है। अस्पताल: {#var#}, तारीख: {#var#}, समय: {#var#}। पुष्टि करने या समय बदलने के लिए कॉल करें: {#var#}। रिमाइंडर बंद करने के लिए STOP लिखकर भेजें। - CareBridge",
    BN: "প্রিয় {#var#}, আপনার অ্যাপয়েন্টমেন্ট আজ, প্রায় 2 ঘণ্টা পরে। হাসপাতাল: {#var#}, তারিখ: {#var#}, সময়: {#var#}। নিশ্চিত করতে বা সময় বদলাতে কল করুন: {#var#}। রিমাইন্ডার বন্ধ করতে STOP লিখে পাঠান। - CareBridge",
    TE: "ప్రియమైన {#var#}, మీ అపాయింట్‌మెంట్ ఈరోజు, సుమారు 2 గంటల్లో ఉంది. ఆసుపత్రి: {#var#}, తేదీ: {#var#}, సమయం: {#var#}. నిర్ధారించడానికి లేదా సమయం మార్చడానికి కాల్ చేయండి: {#var#}. రిమైండర్‌లు ఆపడానికి STOP అని పంపండి. - CareBridge",
    TA: "அன்புள்ள {#var#}, உங்கள் சந்திப்பு இன்று, சுமார் 2 மணி நேரத்தில். மருத்துவமனை: {#var#}, தேதி: {#var#}, நேரம்: {#var#}. உறுதிப்படுத்த அல்லது நேரத்தை மாற்ற அழைக்கவும்: {#var#}. நினைவூட்டல்களை நிறுத்த STOP என அனுப்பவும். - CareBridge",
  },
};

/** Env var holding the DLT template ID, e.g. SMS_TEMPLATE_ID_CONFIRMATION_EN, SMS_TEMPLATE_ID_REMINDER_2H_TA. */
export const envKey = (kind: Kind, lang: Lang) => `SMS_TEMPLATE_ID_${kind}_${lang}`;

export function getTemplate(kind: Kind, lang: Lang) {
  const text = SMS_TEMPLATES[kind]?.[lang];
  if (!text) throw Object.assign(new Error("Unknown SMS template " + kind + "_" + lang), { code: "not_configured" });
  return {
    key: kind,
    lang,
    text,
    variableOrder: VARIABLE_ORDER,
    templateId: (process.env[envKey(kind, lang)] || "").trim() || null,
    envKey: envKey(kind, lang),
    unicode: lang !== "EN",
  };
}

/** Values in template order, cleaned and shortened to the DLT limit. Never free text. */
export function orderedValues(vars: SmsVariables): string[] {
  return VARIABLE_ORDER.map((k) => {
    const v = String(vars[k] ?? "").replace(/[\r\n\t{}<>#]/g, " ").replace(/\s+/g, " ").trim();
    return v.length > VAR_MAX ? v.slice(0, VAR_MAX - 1).trimEnd() + "…" : v;
  });
}

/** The exact SMS text the patient receives. */
export function renderSms(kind: Kind, lang: Lang, vars: SmsVariables) {
  const t = getTemplate(kind, lang), vals = orderedValues(vars);
  let i = 0;
  const text = t.text.replace(/\{#var#\}/g, () => vals[i++] ?? "");
  return { ...t, values: vals, rendered: text, ...segments(text) };
}

/** GSM-7 vs Unicode (UCS-2) length and number of SMS parts. */
export function segments(text: string) {
  const gsm = /^[A-Za-z0-9 @£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà\n\r^{}\\[~\]|€]*$/.test(text);
  const len = [...text].length;
  const single = gsm ? 160 : 70, multi = gsm ? 153 : 67;
  return { encoding: gsm ? "GSM-7" : "Unicode", length: len, parts: len <= single ? 1 : Math.ceil(len / multi) };
}
