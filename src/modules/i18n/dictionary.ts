import type { Lang } from "@/lib/types";

const en = {
  logDay: "Log your day", worked: "Worked", notWorked: "Did not work",
  hours: "Hours worked", promised: "Promised wage (₹)", paid: "Paid today (₹)",
  site: "Work site", contractor: "Contractor", date: "Date", save: "Save", saved: "Saved",
  unpaid: "Unpaid balance", days: "Days worked", totalPromised: "Promised", totalPaid: "Paid",
  recent: "Recent entries", none: "No entries yet", error: "Could not save. Please try again.",
  speak: "Press and speak your day", stop: "Tap to stop", processing: "Understanding…",
  confirmTitle: "Is this correct?", listen: "Listen again", correct: "Correct", sayAgain: "Say again",
  balance: "Balance due", voiceNote: "Your voice note is saved as evidence.",
  micError: "Could not use the microphone. Please allow microphone access.",
  voiceError: "Could not understand. Please try again or use the buttons below.",
  fillMissing: "Please tap the missing values.",
  disclaimer: "Guidance, not legal advice. Please verify with the labour office.",
} as const;
export type DictKey = keyof typeof en;
type Dict = Record<DictKey, string>;

const kn: Dict = {
  logDay: "ಇಂದಿನ ಕೆಲಸ ದಾಖಲಿಸಿ", worked: "ಕೆಲಸ ಮಾಡಿದೆ", notWorked: "ಕೆಲಸ ಇಲ್ಲ",
  hours: "ಕೆಲಸದ ಗಂಟೆಗಳು", promised: "ಒಪ್ಪಿದ ಕೂಲಿ (₹)", paid: "ಇಂದು ಕೊಟ್ಟದ್ದು (₹)",
  site: "ಕೆಲಸದ ಸ್ಥಳ", contractor: "ಗುತ್ತಿಗೆದಾರ", date: "ದಿನಾಂಕ", save: "ಉಳಿಸಿ", saved: "ಉಳಿಸಲಾಗಿದೆ",
  unpaid: "ಬಾಕಿ ಹಣ", days: "ಕೆಲಸದ ದಿನಗಳು", totalPromised: "ಒಪ್ಪಿದ್ದು", totalPaid: "ಕೊಟ್ಟದ್ದು",
  recent: "ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳು", none: "ಇನ್ನೂ ದಾಖಲೆ ಇಲ್ಲ", error: "ಉಳಿಸಲು ಆಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  speak: "ಒತ್ತಿ, ಇಂದಿನ ಕೆಲಸ ಹೇಳಿ", stop: "ನಿಲ್ಲಿಸಲು ಒತ್ತಿ", processing: "ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದೆ…",
  confirmTitle: "ಇದು ಸರಿಯೇ?", listen: "ಮತ್ತೆ ಕೇಳಿ", correct: "ಸರಿ", sayAgain: "ಮತ್ತೆ ಹೇಳಿ",
  balance: "ಬಾಕಿ", voiceNote: "ನಿಮ್ಮ ಧ್ವನಿ ದಾಖಲೆಯನ್ನು ಸಾಕ್ಷ್ಯವಾಗಿ ಉಳಿಸಲಾಗಿದೆ.",
  micError: "ಮೈಕ್ರೊಫೋನ್ ಬಳಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಅನುಮತಿ ನೀಡಿ.",
  voiceError: "ಅರ್ಥವಾಗಲಿಲ್ಲ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಕೆಳಗಿನ ಬಟನ್ ಬಳಸಿ.",
  fillMissing: "ಕಾಣೆಯಾದ ಮೌಲ್ಯಗಳನ್ನು ಒತ್ತಿ ಆಯ್ಕೆಮಾಡಿ.",
  disclaimer: "ಇದು ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ, ಕಾನೂನು ಸಲಹೆಯಲ್ಲ. ದಯವಿಟ್ಟು ಕಾರ್ಮಿಕ ಇಲಾಖೆಯಲ್ಲಿ ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.",
};
const hi: Dict = {
  logDay: "आज का काम दर्ज करें", worked: "काम किया", notWorked: "काम नहीं किया",
  hours: "काम के घंटे", promised: "तय मज़दूरी (₹)", paid: "आज मिला (₹)",
  site: "काम की जगह", contractor: "ठेकेदार", date: "तारीख", save: "सहेजें", saved: "सहेज लिया",
  unpaid: "बकाया रकम", days: "काम के दिन", totalPromised: "तय रकम", totalPaid: "मिली रकम",
  recent: "हाल की प्रविष्टियाँ", none: "अभी कोई प्रविष्टि नहीं", error: "सहेज नहीं सका। फिर कोशिश करें।",
  speak: "दबाएँ और आज का काम बोलें", stop: "रोकने के लिए दबाएँ", processing: "समझ रहा है…",
  confirmTitle: "क्या यह सही है?", listen: "फिर सुनें", correct: "सही है", sayAgain: "फिर बोलें",
  balance: "बकाया", voiceNote: "आपका वॉइस नोट सबूत के रूप में सहेजा गया है।",
  micError: "माइक्रोफ़ोन नहीं चला। कृपया अनुमति दें।",
  voiceError: "समझ नहीं आया। फिर कोशिश करें या नीचे के बटन इस्तेमाल करें।",
  fillMissing: "छूटी हुई जानकारी चुनें।",
  disclaimer: "यह मार्गदर्शन है, कानूनी सलाह नहीं। कृपया श्रम कार्यालय से पुष्टि करें।",
};

const all: Record<Lang, Dict> = { en, kn, hi };
export const t = (lang: Lang, key: DictKey): string => all[lang]?.[key] ?? en[key];
