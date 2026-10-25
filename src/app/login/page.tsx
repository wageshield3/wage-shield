import AuthForm from "@/modules/auth/components/AuthForm";

export default function Page() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F3F6FA] p-6 text-[#12263F]">
      <AuthForm mode="login" />
    </main>
  );
}
