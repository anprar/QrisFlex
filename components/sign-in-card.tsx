"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const signInSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.string().email("Masukkan email yang valid."),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInCard({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      name: "Demo Merchant",
      email: "demo@qrisflex.id",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success("Sesi dashboard aktif.");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal masuk.");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Card className="surface-strong overflow-hidden rounded-[36px] border border-white/30">
      <CardHeader>
        <CardDescription>Login required</CardDescription>
        <CardTitle className="text-3xl">Masuk ke dashboard QrisFlex</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Nama</label>
            <Input placeholder="Nama merchant atau tim" {...form.register("name")} />
            {form.formState.errors.name ? <p className="text-sm text-danger">{form.formState.errors.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">Email</label>
            <Input placeholder="you@qrisflex.id" type="email" {...form.register("email")} />
            {form.formState.errors.email ? <p className="text-sm text-danger">{form.formState.errors.email.message}</p> : null}
          </div>
          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Masuk dengan akses instan
          </Button>
        </form>

        {googleEnabled ? (
          <Button className="w-full" onClick={() => void signIn("google", { redirectTo: "/dashboard" })} size="lg" type="button" variant="outline">
            Masuk dengan Google
          </Button>
        ) : (
          <div className="rounded-[24px] border border-dashed border-border px-4 py-4 text-sm leading-7 text-muted-foreground">
            Provider Google aktif otomatis jika `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` tersedia di environment Vercel.
          </div>
        )}

        <p className="text-sm leading-7 text-muted-foreground">
          Gunakan email dengan akhiran `@pro.qrisflex.id` jika ingin melihat bypass rate limit pro plan saat demo.
          <span className="block pt-2">
            Belum perlu akun penuh? Coba dulu converter gratis di <Link className="font-semibold text-foreground underline" href="/">landing page</Link>.
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
