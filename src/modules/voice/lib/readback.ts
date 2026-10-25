import type { Lang } from "@/lib/types";

type Values = { hours: number; promised: number; paid: number; site: string };

// The spoken sentence is built here in code, so the AI never changes any number.
export function readback(lang: Lang, v: Values): string {
  const balance = v.promised - v.paid;
  if (lang === "kn") {
    return `ಇಂದು ${v.hours} ಗಂಟೆ ಕೆಲಸ.${v.site ? ` ಸ್ಥಳ ${v.site}.` : ""} ಒಪ್ಪಿದ ಕೂಲಿ ${v.promised} ರೂಪಾಯಿ. ಕೊಟ್ಟದ್ದು ${v.paid} ರೂಪಾಯಿ. ಬಾಕಿ ${balance} ರೂಪಾಯಿ. ಇದು ಸರಿಯೇ?`;
  }
  if (lang === "hi") {
    return `आज ${v.hours} घंटे काम।${v.site ? ` जगह ${v.site}।` : ""} तय मज़दूरी ${v.promised} रुपये। मिले ${v.paid} रुपये। बकाया ${balance} रुपये। क्या यह सही है?`;
  }
  return `Today, ${v.hours} hours of work.${v.site ? ` Site: ${v.site}.` : ""} Promised ${v.promised} rupees. Paid ${v.paid} rupees. Balance ${balance} rupees. Is this correct?`;
}
