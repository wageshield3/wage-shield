import type { Lang } from "@/lib/types";
import { setLanguage } from "../actions";

const OPTIONS: { code: Lang; label: string }[] = [
  { code: "en", label: "English" }, { code: "kn", label: "ಕನ್ನಡ" }, { code: "hi", label: "हिंदी" },
];

export default function LanguageSwitch({ current }: { current: Lang }) {
  return (
    <div className="flex gap-2" role="group" aria-label="Language">
      {OPTIONS.map((o) => (
        <form key={o.code} action={setLanguage}>
          <input type="hidden" name="lang" value={o.code} />
          <button type="submit" aria-pressed={current === o.code}
            className={`min-h-11 rounded-xl border-2 border-[#12263F] px-4 font-bold ${current === o.code ? "bg-[#12263F] text-white" : "bg-white text-[#12263F]"}`}>
            {o.label}
          </button>
        </form>
      ))}
    </div>
  );
}
