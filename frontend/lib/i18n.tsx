"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin", region: "National / Global" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari", region: "North & Central India" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari", region: "Maharashtra" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil", region: "Tamil Nadu & Puducherry" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu", region: "Andhra Pradesh & Telangana" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali", region: "West Bengal & Tripura" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", script: "Gujarati", region: "Gujarat" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada", region: "Karnataka" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam", region: "Kerala & Lakshadweep" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", script: "Gurmukhi", region: "Punjab" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", script: "Odia", region: "Odisha" },
  { code: "as", name: "Assamese", nativeName: "অসমীয়া", script: "Bengali-Assamese", region: "Assam" },
  { code: "ur", name: "Urdu", nativeName: "اردو", script: "Perso-Arabic", region: "Pan-India" },
];

interface I18nContextType {
  currentLanguage: LanguageOption;
  setLanguage: (code: string) => void;
  t: (key: string, fallback?: string) => string;
}

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    "platform.title": "APAAR-Vault",
    "platform.subtitle": "AICTE Platform",
    "platform.tagline": "APAAR ID-Based Student Data Management and Verification Platform for AICTE-Approved Institutions",
    "nav.overview": "Dashboard",
    "nav.institutions": "Institutions",
    "nav.students": "Student Records",
    "nav.intake": "Enrolment & Intake",
    "nav.data_quality": "Data Validation",
    "nav.duplicates": "Duplicate Investigation",
    "nav.verify": "APAAR Verification",
    "nav.upload": "Bulk Data Import",
    "nav.reports": "Reports & Analytics",
    "nav.notifications": "Notifications",
    "nav.users": "User Management",
    "nav.audit": "Audit Logs",
    "nav.settings": "Settings",
    "nav.assistant": "AI Officer Assistant",
    "nav.corrections": "Correction Requests",
    "nav.student_portal": "Academic Credentials",
    "search.placeholder": "Search students, institutions, APAAR ID...",
    "role.label": "Role",
    "lang.select": "Language",
    "lang.switched": "Portal language switched to",
    "theme.system": "System Default",
    "theme.light": "White",
    "theme.dark": "Dark",
    "btn.reset": "Reset Demo Data",
    "btn.logout": "Sign out",
  },
  hi: {
    "platform.title": "अपार-वॉल्ट (APAAR-Vault)",
    "platform.subtitle": "एआईसीटीई राष्ट्रीय मंच",
    "platform.tagline": "एआईसीटीई-अनुमोदित संस्थानों के लिए अपार आईडी-आधारित छात्र डेटा प्रबंधन एवं सत्यापन मंच",
    "nav.overview": "डैशबोर्ड एवं अवलोकन",
    "nav.institutions": "संस्थान निर्देशिका",
    "nav.students": "छात्र अभिलेख",
    "nav.intake": "स्वीकृत प्रवेश एवं नामांकन",
    "nav.data_quality": "डेटा सत्यापन एवं गुणवत्ता",
    "nav.duplicates": "डुप्लिकेट सुरक्षा निवारण",
    "nav.verify": "अपार सत्यापन",
    "nav.upload": "थोक डेटा अपलोड",
    "nav.reports": "रिपोर्ट एवं विश्लेषण",
    "nav.notifications": "सूचनाएं एवं अलर्ट",
    "nav.users": "उपयोगकर्ता प्रबंधन",
    "nav.audit": "अपरिवर्तनीय ऑडिट लेजर",
    "nav.settings": "सिस्टम सेटिंग्स",
    "nav.assistant": "एआईसीटीई एआई सहायक",
    "nav.corrections": "संशोधन अनुरोध",
    "nav.student_portal": "शैक्षणिक साख",
    "search.placeholder": "छात्र, संस्थान, अपार आईडी खोजें...",
    "role.label": "भूमिका",
    "lang.select": "भाषा चुनें",
    "lang.switched": "पोर्टल भाषा बदली गई:",
    "theme.system": "सिस्टम डिफॉल्ट",
    "theme.light": "सफेद (White)",
    "theme.dark": "डार्क (Dark)",
    "btn.reset": "डेमो डेटा रीसेट करें",
    "btn.logout": "लॉग आउट करें",
  },
  mr: {
    "platform.title": "अपार-वॉल्ट (APAAR-Vault)",
    "platform.subtitle": "एआयसीटीई राष्ट्रीय मंच",
    "platform.tagline": "एआयसीटीई मान्यताप्राप्त संस्थांसाठी अपार आयडी-आधारित विद्यार्थी डेटा व्यवस्थापन",
    "nav.overview": "डॅशबोर्ड व आढावा",
    "nav.institutions": "संस्थांची यादी",
    "nav.students": "विद्यार्थी नोंदी",
    "nav.intake": "प्रवेश क्षमता व नोंदणी",
    "nav.data_quality": "डेटा प्रमाणीकरण",
    "nav.duplicates": "डुप्लिकेट पडताळणी",
    "nav.verify": "अपार पडताळणी",
    "nav.upload": "मोठ्या प्रमाणावर डेटा अपलोड",
    "nav.reports": "अहवाल व विश्लेषण",
    "nav.notifications": "सूचना",
    "nav.users": "वापरकर्ता व्यवस्थापन",
    "nav.audit": "ऑडिट लेजर",
    "nav.settings": "सिस्टम सेटिंग्ज",
    "nav.assistant": "एआय अधिकारी सहाय्यक",
    "nav.corrections": "दुरुस्ती विनंत्या",
    "nav.student_portal": "शैक्षणिक प्रमाणपत्रे",
    "search.placeholder": "विद्यार्थी, संस्था किंवा अपार आयडी शोधा...",
    "role.label": "भूमिका",
    "lang.select": "भाषा निवडा",
    "lang.switched": "पोर्टल भाषा बदलली:",
    "theme.system": "प्रणाली डीफॉल्ट",
    "theme.light": "पांढरा (White)",
    "theme.dark": "डार्क (Dark)",
    "btn.reset": "डेमो डेटा रीसेट",
    "btn.logout": "बाहेर पडा",
  },
  ta: {
    "platform.title": "அபார்-வால்ட் (APAAR-Vault)",
    "platform.subtitle": "AICTE தேசிய தளம்",
    "platform.tagline": "AICTE-அங்கீகரிக்கப்பட்ட நிறுவனங்களுக்கான அபார் ஐடி மாணவர் தரவு மேலாண்மை",
    "nav.overview": "டாஷ்போர்டு",
    "nav.institutions": "நிறுவனங்கள்",
    "nav.students": "மாணவர் பதிவுகள்",
    "nav.intake": "சேர்க்கை மற்றும் கண்காணிப்பு",
    "nav.data_quality": "தரவு சரிபார்ப்பு",
    "nav.duplicates": "நகல் விசாரணை",
    "nav.verify": "அபார் சரிபார்ப்பு",
    "nav.upload": "மொத்த தரவு பதிவேற்றம்",
    "nav.reports": "அறிக்கைகள் & பகுப்பாய்வு",
    "nav.notifications": "அறிவிப்புகள்",
    "nav.users": "பயனர் மேலாண்மை",
    "nav.audit": "தணிக்கை பதிவு",
    "nav.settings": "அமைப்புகள்",
    "nav.assistant": "AI உதவியாளர்",
    "nav.corrections": "திருத்தக் கோரிக்கைகள்",
    "nav.student_portal": "கல்வி சான்றுகள்",
    "search.placeholder": "மாணவர்கள், நிறுவனங்கள், அபார் ஐடியைத் தேடுக...",
    "role.label": "பங்கு",
    "lang.select": "மொழியைத் தேர்ந்தெடுக்கவும்",
    "lang.switched": "மொழி மாற்றப்பட்டது:",
    "theme.system": "இயல்புநிலை",
    "theme.light": "வெள்ளை (White)",
    "theme.dark": "கருப்பு (Dark)",
    "btn.reset": "தரவை மீட்டமை",
    "btn.logout": "வெளியேறு",
  },
  te: {
    "platform.title": "అపార్-వాల్ట్ (APAAR-Vault)",
    "platform.subtitle": "AICTE జాతీయ వేదిక",
    "platform.tagline": "AICTE-ఆమోదిత విద్యాసంస్థల కోసం అపార్ ఐడీ విద్యార్థి డేటా నిర్వహణ",
    "nav.overview": "డాష్‌బోర్డ్",
    "nav.institutions": "విద్యాసంస్థలు",
    "nav.students": "విద్యార్థి రికార్డులు",
    "nav.intake": "ప్రవేశాలు & సామర్థ్యం",
    "nav.data_quality": "డేటా ధృవీకరణ",
    "nav.duplicates": "డూప్లికేట్ పరిశోధన",
    "nav.verify": "అపార్ ధృవీకరణ",
    "nav.upload": "బల్క్ డేటా అప్‌లోడ్",
    "nav.reports": "నివేదికలు & విశ్లేషణ",
    "nav.notifications": "నోటిఫికేషన్లు",
    "nav.users": "వినియోగదారు నిర్వహణ",
    "nav.audit": "ఆడిట్ లాగ్‌లు",
    "nav.settings": "సెట్టింగ్‌లు",
    "nav.assistant": "AI సహాయకుడు",
    "nav.corrections": "దిద్దుబాటు అభ్యర్థనలు",
    "nav.student_portal": "విద్యా ఆధారాలు",
    "search.placeholder": "విద్యార్థులు, సంస్థలు లేదా అపార్ ఐడీని శోధించండి...",
    "role.label": "పాత్ర",
    "lang.select": "భాషను ఎంచుకోండి",
    "lang.switched": "భాష మార్చబడింది:",
    "theme.system": "సిస్టమ్ డిఫాల్ట్",
    "theme.light": "తెలుపు (White)",
    "theme.dark": "డార్క్ (Dark)",
    "btn.reset": "డేటా రీసెట్ చేయండి",
    "btn.logout": "లాగ్ అవుట్",
  },
  bn: {
    "platform.title": "অপার-ভল্ট (APAAR-Vault)",
    "platform.subtitle": "AICTE জাতীয় পোর্টাল",
    "platform.tagline": "AICTE-অনুমোদিত প্রতিষ্ঠানের জন্য অপার আইডি শিক্ষার্থী ডেটা ব্যবস্থাপনা",
    "nav.overview": "ড্যাশবোর্ড",
    "nav.institutions": "প্রতিষ্ঠানসমূহ",
    "nav.students": "শিক্ষার্থী রেকর্ড",
    "nav.intake": "ভর্তি ও আসন সংখ্যা",
    "nav.data_quality": "তথ্য বৈধকরণ",
    "nav.duplicates": "ডুপ্লিকেট তদন্ত",
    "nav.verify": "অপার যাচাইকরণ",
    "nav.upload": "বাল্ক তথ্য আপলোড",
    "nav.reports": "প্রতিবেদন ও বিশ্লেষণ",
    "nav.notifications": "বিজ্ঞপ্তি",
    "nav.users": "ব্যবহারকারী ব্যবস্থাপনা",
    "nav.audit": "অডিট লগ",
    "nav.settings": "সেটিংস",
    "nav.assistant": "এআই সহকারী",
    "nav.corrections": "সংশোধন অনুরোধ",
    "nav.student_portal": "একাডেমিক প্রমাণপত্র",
    "search.placeholder": "শিক্ষার্থী, প্রতিষ্ঠান বা অপার আইডি অনুসন্ধান করুন...",
    "role.label": "ভূমিকা",
    "lang.select": "ভাষা নির্বাচন করুন",
    "lang.switched": "ভাষা পরিবর্তিত হয়েছে:",
    "theme.system": "সিস্টেম ডিফল্ট",
    "theme.light": "সাদা (White)",
    "theme.dark": "ডার্ক (Dark)",
    "btn.reset": "ডেমো রিসেট করুন",
    "btn.logout": "সাইন আউট",
  },
  gu: {
    "platform.title": "અપાર-વોલ્ટ (APAAR-Vault)",
    "platform.subtitle": "AICTE રાષ્ટ્રીય પોર્ટલ",
    "platform.tagline": "AICTE માન્ય સંસ્થાઓ માટે અપાર આઈડી વિદ્યાર્થી ડેટા મેનેજમેન્ટ",
    "nav.overview": "ડેશબોર્ડ",
    "nav.institutions": "સંસ્થાઓ",
    "nav.students": "વિદ્યાર્થી રેકોર્ડ",
    "nav.intake": "પ્રવેશ ક્ષમતા અને દેખરેખ",
    "nav.data_quality": "ડેટા માન્યતા",
    "nav.duplicates": "ડુપ્લિકેટ તપાસ",
    "nav.verify": "અપાર ચકાસણી",
    "nav.upload": "બલ્ક ડેટા અપલોડ",
    "nav.reports": "અહેવાલો અને વિશ્લેષણ",
    "nav.notifications": "સૂચનાઓ",
    "nav.users": "વપરાશકર્તા વ્યવસ્થાપન",
    "nav.audit": "ઓડિટ લૉગ્સ",
    "nav.settings": "સેટિંગ્સ",
    "nav.assistant": "AI સહાયક",
    "nav.corrections": "સુધારણા વિનંતીઓ",
    "nav.student_portal": "શૈક્ષણિક ઓળખપત્રો",
    "search.placeholder": "વિદ્યાર્થી, સંસ્થા કે અપાર આઈડી શોધો...",
    "role.label": "ભૂમિકા",
    "lang.select": "ભાષા પસંદ કરો",
    "lang.switched": "ભાષા બદલાઈ:",
    "theme.system": "સિસ્ટમ ડિફોલ્ટ",
    "theme.light": "સફેદ (White)",
    "theme.dark": "ડાર્ક (Dark)",
    "btn.reset": "ડેટા રીસેટ",
    "btn.logout": "લૉગ આઉટ",
  },
  kn: {
    "platform.title": "ಅಪಾರ್-ವಾಲ್ಟ್ (APAAR-Vault)",
    "platform.subtitle": "AICTE ರಾಷ್ಟ್ರೀಯ ಪೋರ್ಟಲ್",
    "platform.tagline": "AICTE ಅನುಮೋದಿತ ಸಂಸ್ಥೆಗಳಿಗೆ ಅಪಾರ್ ಐಡಿ ವಿದ್ಯಾರ್ಥಿ ದತ್ತಾಂಶ ನಿರ್ವಹಣೆ",
    "nav.overview": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "nav.institutions": "ಸಂಸ್ಥೆಗಳು",
    "nav.students": "ವಿದ್ಯಾರ್ಥಿ ದಾಖಲೆಗಳು",
    "nav.intake": "ದಾಖಲಾತಿ ಮತ್ತು ಸಾಮರ್ಥ್ಯ",
    "nav.data_quality": "ದತ್ತಾಂಶ ಮೌಲ್ಯೀಕರಣ",
    "nav.duplicates": "ನಕಲಿ ತನಿಖೆ",
    "nav.verify": "ಅಪಾರ್ ಪರಿಶೀಲನೆ",
    "nav.upload": "ದೊಡ್ಡ ಪ್ರಮಾಣದ ದತ್ತಾಂಶ ಅಪ್‌ಲೋಡ್",
    "nav.reports": "ವರದಿಗಳು ಮತ್ತು ವಿಶ್ಲೇಷಣೆ",
    "nav.notifications": "ಅಧಿಸೂಚನೆಗಳು",
    "nav.users": "ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ",
    "nav.audit": "ಆಡಿಟ್ ದಾಖಲೆಗಳು",
    "nav.settings": "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    "nav.assistant": "AI ಸಹಾಯಕ",
    "nav.corrections": "ತಿದ್ದುಪಡಿ ವಿನಂತಿಗಳು",
    "nav.student_portal": "ಶೈಕ್ಷಣಿಕ ರುಜುವಾತುಗಳು",
    "search.placeholder": "ವಿದ್ಯಾರ್ಥಿ, ಸಂಸ್ಥೆ ಅಥವಾ ಅಪಾರ್ ಐಡಿ ಹುಡುಕಿ...",
    "role.label": "ಪಾತ್ರ",
    "lang.select": "ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    "lang.switched": "ಭಾಷೆ ಬದಲಾಗಿದೆ:",
    "theme.system": "ಸಿಸ್ಟಂ ಡೀಫಾಲ್ಟ್",
    "theme.light": "ಬಿಳಿ (White)",
    "theme.dark": "ಡಾರ್ಕ್ (Dark)",
    "btn.reset": "ದತ್ತಾಂಶ ಮರುಹೊಂದಿಸಿ",
    "btn.logout": "ಸೈನ್ ಔಟ್",
  },
  ml: {
    "platform.title": "അപാർ-വോൾട്ട് (APAAR-Vault)",
    "platform.subtitle": "AICTE ദേശീയ പോർട്ടൽ",
    "platform.tagline": "AICTE അംഗീകൃത സ്ഥാപനങ്ങൾക്കായുള്ള അപാർ ഐഡി വിദ്യാർത്ഥി വിവര പരിപാലനം",
    "nav.overview": "ഡാഷ്‌ബോർഡ്",
    "nav.institutions": "സ്ഥാപനങ്ങൾ",
    "nav.students": "വിദ്യാർത്ഥി രേഖകൾ",
    "nav.intake": "പ്രവേശനവും സീറ്റും",
    "nav.data_quality": "വിവര പരിശോധന",
    "nav.duplicates": "ഡ്യൂപ്ലിക്കേഷൻ അന്വേഷണം",
    "nav.verify": "അപാർ വെരിഫിക്കേഷൻ",
    "nav.upload": "ഡാറ്റ അപ്‌ലോഡ്",
    "nav.reports": "റിപ്പോർട്ടുകളും വിശകലനവും",
    "nav.notifications": "അറിയിപ്പുകൾ",
    "nav.users": "ഉപയോക്തൃ മാനേജ്മെന്റ്",
    "nav.audit": "ഓഡിറ്റ് ലോഗുകൾ",
    "nav.settings": "ക്രമീകരണങ്ങൾ",
    "nav.assistant": "AI അസിസ്റ്റന്റ്",
    "nav.corrections": "തിരുത്തൽ അപേക്ഷകൾ",
    "nav.student_portal": "അക്കാദമിക് യോഗ്യതകൾ",
    "search.placeholder": "വിദ്യാർത്ഥി, സ്ഥാപനം അല്ലെങ്കിൽ അപാർ ഐഡി തിരയുക...",
    "role.label": "പങ്ക്",
    "lang.select": "ഭാഷ തിരഞ്ഞെടുക്കുക",
    "lang.switched": "ഭാഷ മാറ്റി:",
    "theme.system": "സിസ്റ്റം ഡിഫോൾട്ട്",
    "theme.light": "വെള്ള (White)",
    "theme.dark": "ഡാർക്ക് (Dark)",
    "btn.reset": "ഡാറ്റ പുനഃസജ്ജമാക്കുക",
    "btn.logout": "ലോഗ് ഔട്ട്",
  },
  pa: {
    "platform.title": "ਅਪਾਰ-ਵਾਲਟ (APAAR-Vault)",
    "platform.subtitle": "AICTE ਕੌਮੀ ਪੋਰਟਲ",
    "platform.tagline": "AICTE-ਮਨਜ਼ੂਰਸ਼ੁਦਾ ਅਦਾਰਿਆਂ ਲਈ ਅਪਾਰ ਆਈਡੀ ਵਿਦਿਆਰਥੀ ਡਾਟਾ ਪ੍ਰਬੰਧਨ",
    "nav.overview": "ਡੈਸ਼ਬੋਰਡ",
    "nav.institutions": "ਸੰਸਥਾਵਾਂ",
    "nav.students": "ਵਿਦਿਆਰਥੀ ਰਿਕਾਰਡ",
    "nav.intake": "ਦਾਖਲਾ ਅਤੇ ਸਮਰੱਥਾ",
    "nav.data_quality": "ਡਾਟਾ ਪ੍ਰਮਾਣੀਕਰਨ",
    "nav.duplicates": "ਡੁਪਲੀਕੇਟ ਜਾਂਚ",
    "nav.verify": "ਅਪਾਰ ਤਸਦੀਕ",
    "nav.upload": "ਬਲਕ ਡਾਟਾ ਅੱਪਲੋਡ",
    "nav.reports": "ਰਿਪੋਰਟਾਂ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ",
    "nav.notifications": "ਸੂਚਨਾਵਾਂ",
    "nav.users": "ਯੂਜ਼ਰ ਪ੍ਰਬੰਧਨ",
    "nav.audit": "ਆਡਿਟ ਲੌਗ",
    "nav.settings": "ਸੈਟਿੰਗਾਂ",
    "nav.assistant": "AI ਸਹਾਇਕ",
    "nav.corrections": "ਸੋਧ ਬੇਨਤੀਆਂ",
    "nav.student_portal": "ਅਕਾਦਮਿਕ ਪ੍ਰਮਾਣ ਪੱਤਰ",
    "search.placeholder": "ਵਿਦਿਆਰਥੀ, ਸੰਸਥਾ ਜਾਂ ਅਪਾਰ ਆਈਡੀ ਖੋਜੋ...",
    "role.label": "ਭੂਮਿਕਾ",
    "lang.select": "ਭਾਸ਼ਾ ਚੁਣੋ",
    "lang.switched": "ਭਾਸ਼ਾ ਬਦਲੀ ਗਈ:",
    "theme.system": "ਸਿਸਟਮ ਡਿਫਾਲਟ",
    "theme.light": "ਚਿੱਟਾ (White)",
    "theme.dark": "ਗੂੜ੍ਹਾ (Dark)",
    "btn.reset": "ਡੇਟਾ ਰੀਸੈਟ ਕਰੋ",
    "btn.logout": "ਸਾਈਨ ਆਉਟ",
  },
  or: {
    "platform.title": "ଅପାର-ଭଲ୍ଟ (APAAR-Vault)",
    "platform.subtitle": "AICTE ଜାତୀୟ ପୋର୍ଟାଲ୍",
    "platform.tagline": "AICTE ଅନୁମୋଦିତ ଅନୁଷ୍ଠାନଗୁଡ଼ିକ ପାଇଁ ଅପାର ID ଛାତ୍ର ତଥ୍ୟ ପରିଚାଳନା",
    "nav.overview": "ଡ୍ୟାସବୋର୍ଡ",
    "nav.institutions": "ଅନୁଷ୍ଠାନଗୁଡ଼ିକ",
    "nav.students": "ଛାତ୍ର ରେକର୍ଡ",
    "nav.intake": "ନାମଲେଖା ଏବଂ କ୍ଷମତା",
    "nav.data_quality": "ତଥ୍ୟ ବୈଧିକରଣ",
    "nav.duplicates": "ନକଲି ଅନୁସନ୍ଧାନ",
    "nav.verify": "ଅପାର ଯାଞ୍ଚ",
    "nav.upload": "ବଲ୍କ ତଥ୍ୟ ଅପଲୋଡ୍",
    "nav.reports": "ରିପୋର୍ଟ ଏବଂ ବିଶ୍ଳେଷଣ",
    "nav.notifications": "ବିଜ୍ଞପ୍ତି",
    "nav.users": "ଉପଭୋକ୍ତା ପରିଚାଳନା",
    "nav.audit": "ଅଡିଟ୍ ଲଗ୍",
    "nav.settings": "ସେଟିଂସମୂହ",
    "nav.assistant": "AI ସହାୟକ",
    "nav.corrections": "ସଂଶୋଧନ ଅନୁରୋଧ",
    "nav.student_portal": "ଏକାଡେମିକ୍ ପ୍ରମାଣପତ୍ର",
    "search.placeholder": "ଛାତ୍ର, ଅନୁଷ୍ଠାନ କିମ୍ବା ଅପାର ID ସନ୍ଧାନ କରନ୍ତୁ...",
    "role.label": "ଭୂମିକା",
    "lang.select": "ଭାଷା ବାଛନ୍ତୁ",
    "lang.switched": "ଭାଷା ପରିବର୍ତ୍ତିତ ହୋଇଛି:",
    "theme.system": "ସିଷ୍ଟମ୍ ଡିଫଲ୍ଟ",
    "theme.light": "ଧଳା (White)",
    "theme.dark": "ଗାଢ଼ (Dark)",
    "btn.reset": "ତଥ୍ୟ ରିସେଟ୍ କରନ୍ତୁ",
    "btn.logout": "ଲଗ୍ ଆଉଟ୍",
  },
  as: {
    "platform.title": "অপৰ-ভল্ট (APAAR-Vault)",
    "platform.subtitle": "AICTE ৰাষ্ট্ৰীয় পৰ্টেল",
    "platform.tagline": "AICTE-অনুমোদিত শিক্ষানুষ্ঠানৰ বাবে অপৰ আইডি ছাত্ৰ তথ্য ব্যৱস্থাপনা",
    "nav.overview": "ডেশ্ববৰ্ড",
    "nav.institutions": "শিক্ষানুষ্ঠানসমূহ",
    "nav.students": "ছাত্ৰ তথ্যসম্ভাৰ",
    "nav.intake": "ভৰ্তি আৰু ক্ষমতা",
    "nav.data_quality": "তথ্য বৈধকৰণ",
    "nav.duplicates": "নকল তথ্য অনুসন্ধান",
    "nav.verify": "অপৰ সত্যাপন",
    "nav.upload": "বাল্ক তথ্য আপলোড",
    "nav.reports": "প্ৰতিবেদন আৰু বিশ্লেষণ",
    "nav.notifications": "জাননী",
    "nav.users": "ব্যৱহাৰকাৰী ব্যৱস্থাপনা",
    "nav.audit": "অডিট লগ",
    "nav.settings": "ছেটিংছ",
    "nav.assistant": "এআই সহায়ক",
    "nav.corrections": "সংশোধন অনুৰোধ",
    "nav.student_portal": "শৈক্ষিক প্ৰমাণপত্ৰ",
    "search.placeholder": "ছাত্ৰ, শিক্ষানুষ্ঠান বা অপৰ আইডি সন্ধান কৰক...",
    "role.label": "ভূমিকা",
    "lang.select": "ভাষা বাছক",
    "lang.switched": "ভাষা সলনি কৰা হৈছে:",
    "theme.system": "ছিষ্টেম ডিফল্ট",
    "theme.light": "বগা (White)",
    "theme.dark": "ডাৰ্ক (Dark)",
    "btn.reset": "তথ্য ৰিছেট কৰক",
    "btn.logout": "লগ আউট",
  },
  ur: {
    "platform.title": "اپار-والٹ (APAAR-Vault)",
    "platform.subtitle": "AICTE قومی پورٹل",
    "platform.tagline": "طلباء کے ڈیٹا کا انتظام اور تصدیقی پلیٹ فارم برائے منظور شدہ ادارے",
    "nav.overview": "ڈیش بورڈ",
    "nav.institutions": "ادارے",
    "nav.students": "طلباء کا ریکارڈ",
    "nav.intake": "داخلے اور گنجائش",
    "nav.data_quality": "ڈیٹا کی توثیق",
    "nav.duplicates": "ڈپلیکیٹ جانچ",
    "nav.verify": "اپار تصدیق",
    "nav.upload": "بلک ڈیٹا اپ لوڈ",
    "nav.reports": "رپورٹس اور تجزیات",
    "nav.notifications": "اطلاعات",
    "nav.users": "صارفین کا انتظام",
    "nav.audit": "آڈٹ لاگز",
    "nav.settings": "ترتیبات",
    "nav.assistant": "اے آئی اسسٹنٹ",
    "nav.corrections": "درستگی کی درخواستیں",
    "nav.student_portal": "تعلیمی اسناد",
    "search.placeholder": "طلباء، ادارے یا اپار آئی ڈی تلاش کریں...",
    "role.label": "کردار",
    "lang.select": "زبان منتخب کریں",
    "lang.switched": "پورٹل کی زبان تبدیل ہو گئی:",
    "theme.system": "سسٹم ڈیفالٹ",
    "theme.light": "سفید (White)",
    "theme.dark": "ڈارک (Dark)",
    "btn.reset": "ڈیٹا دوبارہ ترتیب دیں",
    "btn.logout": "لاگ آؤٹ",
  },
};

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

const I18nContext = createContext<I18nContextType>({
  currentLanguage: SUPPORTED_LANGUAGES[0],
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback || key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLangCode, setCurrentLangCode] = useState("en");

  // Ensure Google Translate element and script are loaded on-demand
  const ensureGoogleTranslateLoaded = useCallback(() => {
    if (typeof window === "undefined") return;

    if (!document.getElementById("google_translate_element")) {
      const div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.display = "none";
      document.body.appendChild(div);
    }

    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi,mr,ta,te,bn,gu,kn,ml,pa,or,as,ur",
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Sync Google Translate element & script
  const triggerGoogleTranslate = useCallback((code: string) => {
    try {
      if (typeof window === "undefined") return;

      const domain = window.location.hostname;
      if (code === "en") {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.${domain}; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;

        const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
        if (combo) {
          combo.value = "en";
          combo.dispatchEvent(new Event("change"));
        }

        // Clean up injected translation frames & inline styles
        const frames = document.querySelectorAll(".goog-te-banner-frame, iframe.skiptranslate, .VIpgJd-ZVi9od-aZ2wEe-wOHMyf");
        frames.forEach((f) => f.remove());
        document.body.style.top = "0px";
        return;
      }

      // Non-English: load Google Translate engine
      ensureGoogleTranslateLoaded();
      document.cookie = `googtrans=/en/${code}; path=/;`;
      if (domain && domain !== "localhost" && !domain.startsWith("127.0.0.1")) {
        document.cookie = `googtrans=/en/${code}; domain=.${domain}; path=/;`;
      }

      // Check if google combo select is mounted
      const combo = document.querySelector<HTMLSelectElement>(".goog-te-combo");
      if (combo) {
        combo.value = code;
        combo.dispatchEvent(new Event("change"));
      } else {
        // If combo not ready yet and not default, a light reload ensures Google Translate parses DOM
        const hasReloaded = sessionStorage.getItem(`lang_reloaded_${code}`);
        if (!hasReloaded) {
          sessionStorage.setItem(`lang_reloaded_${code}`, "1");
          window.location.reload();
        }
      }
    } catch (e) {
      console.warn("Google translate trigger error:", e);
    }
  }, [ensureGoogleTranslateLoaded]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("preferred_language");
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setCurrentLangCode(saved);
        if (saved !== "en") {
          document.cookie = `googtrans=/en/${saved}; path=/;`;
          ensureGoogleTranslateLoaded();
        } else {
          // Clear any leftover translation cookies
          document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      } else {
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [ensureGoogleTranslateLoaded]);

  const setLanguage = (code: string) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === code)) {
      setCurrentLangCode(code);
      try {
        localStorage.setItem("preferred_language", code);
      } catch {
        // Ignore localStorage error
      }
      triggerGoogleTranslate(code);
    }
  };

  const currentLanguage =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[currentLangCode] || TRANSLATIONS.en;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    const defaultDict = TRANSLATIONS.en;
    if (defaultDict && defaultDict[key]) {
      return defaultDict[key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ currentLanguage, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
