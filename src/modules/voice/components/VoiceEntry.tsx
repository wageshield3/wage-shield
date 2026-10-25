"use client";

import { useRef, useState, useTransition } from "react";
import type { Lang } from "@/lib/types";
import { t } from "@/modules/i18n/dictionary";
import { readback } from "../lib/readback";
import { saveVoiceLog } from "../actions";

const AUTO_READBACK = false; // set to true for the demo: the app reads the entry aloud by itself (uses more credits)
const MAX_SECONDS = 25;
const HOURS = [4, 6, 8, 9, 10, 12];
const PROMISED = [500, 600, 700, 800, 1000];
const PAID = [0, 100, 200, 300, 500];
const LOCALE: Record<Lang, string> = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };

type Entry = { hours: number | null; promised: number | null; paid: number | null; site: string; contractor: string };
type Phase = "idle" | "recording" | "processing" | "confirm" | "error";

const btn = "min-h-14 rounded-xl border-2 border-[#12263F] px-4 text-lg font-bold";

function Chips({ values, onPick }: { values: number[]; onPick: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button key={v} type="button" onClick={() => onPick(v)} className={`${btn} bg-white text-[#12263F]`}>{v}</button>
      ))}
    </div>
  );
}

export default function VoiceEntry({ lang, defaults }: { lang: Lang; defaults: { site: string; contractor: string; promised: number } }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [entry, setEntry] = useState<Entry | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<"micError" | "voiceError" | "error">("voiceError");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cache = useRef<{ text: string; url: string } | null>(null);

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  async function start() {
    setSaved(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        void send(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start();
      setPhase("recording");
      timer.current = setTimeout(stop, MAX_SECONDS * 1000);
    } catch {
      setErrorKey("micError");
      setPhase("error");
    }
  }

  async function send(blob: Blob) {
    setPhase("processing");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "note");
      fd.append("lang", lang);
      const res = await fetch("/api/voice/parse", { method: "POST", body: fd });
      if (!res.ok) throw new Error("parse failed");
      const data = (await res.json()) as {
        transcript: string; audioPath: string | null;
        entry: { hours: number | null; promised: number | null; paid: number | null; site: string | null; contractor: string | null };
      };
      setEntry({
        hours: data.entry.hours,
        promised: data.entry.promised ?? (defaults.promised || null),
        paid: data.entry.paid,
        site: data.entry.site ?? defaults.site,
        contractor: data.entry.contractor ?? defaults.contractor,
      });
      setTranscript(data.transcript);
      setAudioPath(data.audioPath);
      setPhase("confirm");
    } catch {
      setErrorKey("voiceError");
      setPhase("error");
    }
  }

  const ready = !!entry && entry.hours !== null && entry.promised !== null && entry.paid !== null;

  async function listen() {
    if (!entry || !ready) return;
    const text = readback(lang, { hours: entry.hours!, promised: entry.promised!, paid: entry.paid!, site: entry.site });
    setBusy(true);
    try {
      let url = cache.current?.text === text ? cache.current.url : "";
      if (!url) {
        const res = await fetch("/api/voice/speak", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, lang }),
        });
        if (!res.ok) throw new Error("tts failed");
        const { audio } = (await res.json()) as { audio: string };
        url = `data:audio/wav;base64,${audio}`;
        cache.current = { text, url };
      }
      await new Audio(url).play();
    } catch {
      const u = new SpeechSynthesisUtterance(text); // free browser voice as a backup
      u.lang = LOCALE[lang];
      window.speechSynthesis.speak(u);
    } finally {
      setBusy(false);
    }
  }

  function confirm() {
    if (!entry || !ready) return;
    const d = new Date();
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    startTransition(async () => {
      const r = await saveVoiceLog({
        date, hours: entry.hours!, promised: entry.promised!, paid: entry.paid!,
        site: entry.site, contractor: entry.contractor, transcript, audioPath,
      });
      if (r.ok) { setSaved(true); setPhase("idle"); setEntry(null); }
      else { setErrorKey("error"); setPhase("error"); }
    });
  }

  if (phase === "confirm" && entry) {
    const row = (label: string, value: string) => (
      <div className="flex justify-between border-b border-[#D9E1EA] py-2 text-lg"><span className="text-[#41546B]">{label}</span><b>{value}</b></div>
    );
    const rs = (n: number | null) => (n === null ? "?" : `₹${n}`);
    const balance = entry.promised !== null && entry.paid !== null ? entry.promised - entry.paid : null;
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5">
        <h2 className="text-2xl font-bold">{t(lang, "confirmTitle")}</h2>
        <div>
          {row(t(lang, "hours"), entry.hours === null ? "?" : `${entry.hours} h`)}
          {row(t(lang, "promised"), rs(entry.promised))}
          {row(t(lang, "paid"), rs(entry.paid))}
          {row(t(lang, "site"), entry.site || "—")}
          {row(t(lang, "contractor"), entry.contractor || "—")}
          {row(t(lang, "balance"), balance === null ? "?" : `₹${balance}`)}
        </div>
        {!ready && <p className="font-semibold text-[#B3261E]">{t(lang, "fillMissing")}</p>}
        {entry.hours === null && <Chips values={HOURS} onPick={(v) => setEntry({ ...entry, hours: v })} />}
        {entry.promised === null && <Chips values={PROMISED} onPick={(v) => setEntry({ ...entry, promised: v })} />}
        {entry.paid === null && <Chips values={PAID} onPick={(v) => setEntry({ ...entry, paid: v })} />}
        <p className="rounded-xl bg-[#E6EEF7] p-3 text-sm text-[#41546B]">{t(lang, "voiceNote")}</p>
        <button type="button" onClick={listen} disabled={!ready || busy} className={`${btn} bg-white disabled:opacity-50`}>{t(lang, "listen")}</button>
        <button type="button" onClick={confirm} disabled={!ready || pending} className="min-h-20 rounded-xl bg-[#1E7A4F] text-2xl font-bold text-white disabled:opacity-50">{t(lang, "correct")}</button>
        <button type="button" onClick={() => { setEntry(null); setPhase("idle"); }} className={`${btn} bg-white`}>{t(lang, "sayAgain")}</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center">
      <button
        type="button"
        onClick={phase === "recording" ? stop : start}
        disabled={phase === "processing"}
        aria-label={t(lang, "speak")}
        className={`flex h-44 w-44 items-center justify-center rounded-full text-[#12263F] shadow-[0_8px_0_#B97708] disabled:opacity-60 ${phase === "recording" ? "animate-pulse bg-[#E8B04C]" : "bg-[#F5A524]"}`}
      >
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
      </button>
      <div className="text-xl font-bold">
        {phase === "recording" ? t(lang, "stop") : phase === "processing" ? t(lang, "processing") : t(lang, "speak")}
      </div>
      {saved && <p role="status" className="rounded-xl bg-[#E3F4EA] px-4 py-2 font-semibold text-[#1E7A4F]">{t(lang, "saved")}</p>}
      {phase === "error" && <p role="alert" className="rounded-xl bg-[#FBE9E7] px-4 py-2 font-semibold text-[#B3261E]">{t(lang, errorKey)}</p>}
    </div>
  );
}
