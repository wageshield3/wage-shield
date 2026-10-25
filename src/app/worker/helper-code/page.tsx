import Link from "next/link";
import LinkCodeCard from "@/modules/helpermode/components/LinkCodeCard";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-5 bg-[#F3F6FA] p-6 text-[#12263F]">
      <Link href="/worker" className="min-h-11 font-bold underline">← Back</Link>
      <LinkCodeCard />
    </main>
  );
}
