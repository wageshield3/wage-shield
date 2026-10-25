"use server";

import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs/promises";
import path from "path";

export interface ComplaintResult {
  englishLetter: string;
  localSummary: string;
  totals: { promised: number; paid: number; unpaid: number; days: number };
  evidence: { voiceNotes: number; photos: number; coworkers: number };
}

export async function generateComplaint(language: string): Promise<ComplaintResult> {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Unauthorized");

  // Fetching logs using the correct "work_date" column
  const { data: logs, error } = await supabase
    .from("work_logs")
    .select("*, evidence_files(id), coworker_confirmations(id)")
    .eq("worker_id", user.id)
    .order("work_date", { ascending: true });

  if (error) {
    console.error("Error fetching logs from Supabase:", error);
  }

  const safeLogs = logs || [];
  
  let promised = 0;
  let paid = 0;
  let voiceNotes = 0;
  let photos = 0;
  let coworkers = 0;

  safeLogs.forEach(log => {
    promised += Number(log.promised_wage || 0);
    paid += Number(log.paid_amount || 0);
    if (log.source === "voice" || log.audio_url) voiceNotes++;
    if (log.evidence_files && log.evidence_files.length > 0) photos++;
    if (log.coworker_confirmations && log.coworker_confirmations.length > 0) coworkers++;
  });

  const totals = { 
    promised, 
    paid, 
    unpaid: promised - paid, 
    days: safeLogs.length 
  };

  // THIS IS THE LINE I ACCIDENTALLY DELETED EARLIER!
  const evidence = { voiceNotes, photos, coworkers };

  const fallbackLetter = `To,
[OFFICE ADDRESS TO BE VERIFIED]

Subject: Non-payment of wages

Respected Sir/Madam,
I am writing to formally report unpaid wages. I worked for ${totals.days} days. 
Total wages promised: Rs ${totals.promised}. 
Total wages paid: Rs ${totals.paid}. 
Pending amount: Rs ${totals.unpaid}.

I request your urgent assistance.

Yours faithfully,
[Worker Name]`;

  const fallbackSummary = `You worked for ${totals.days} days. You are owed Rs ${totals.unpaid}.`;

  try {
    const legalFilePath = path.join(process.cwd(), 'data', 'legal-reference.json');
    let legalData = "";
    try {
      legalData = await fs.readFile(legalFilePath, 'utf8');
    } catch (e) {
      console.warn("Legal reference file missing or unreadable.");
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) throw new Error("Missing SARVAM_API_KEY");

    const systemPrompt = `You are a legal aid assistant helping an informal worker in India. 
Use this legal data if needed: ${legalData}. 
Write a formal complaint letter in English addressed to the labour authority (use [OFFICE ADDRESS TO BE VERIFIED] if exact address is missing).
DO NOT do any math. Use these exact numbers provided: 
Days worked: ${totals.days}, Promised: Rs ${totals.promised}, Paid: Rs ${totals.paid}, Unpaid: Rs ${totals.unpaid}.
Also provide a 2-sentence summary in the language code: ${language}.
Output ONLY valid JSON in this format, with no markdown formatting around it:
{"englishLetter": "...", "localSummary": "..."}`;

    const response = await fetch("https://api.sarvam.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sarvam-30b",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.2
      })
    });

    if (!response.ok) throw new Error(`Sarvam chat failed: ${response.status}`);

    const aiData = await response.json();
    let text = aiData.choices[0].message.content;
    
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        englishLetter: parsed.englishLetter || fallbackLetter,
        localSummary: parsed.localSummary || fallbackSummary,
        totals,
        evidence
      };
    }
    throw new Error("Could not parse JSON");
  } catch (error) {
    console.error("AI Generation Error:", error);
    return { englishLetter: fallbackLetter, localSummary: fallbackSummary, totals, evidence };
  }
}