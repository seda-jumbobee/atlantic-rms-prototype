"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { LogoMark } from "@/components/logo";
import { useSession } from "@/components/session-provider";
import { AlertCircle, ShieldCheck, User as UserIcon } from "lucide-react";

export default function LoginPage() {
  const { login, loginAs } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(email);
    if (!res.ok) return setError(res.error ?? "Sign in failed.");
    router.push("/");
  };

  const demo = (id: string) => { loginAs(id); router.push("/"); };

  return (
    <Card className="border-border/70 shadow-xl">
      <CardHeader className="items-center text-center">
        <LogoMark className="size-12" />
        <CardTitle className="mt-2 text-xl">Sign in to Atlantic RMS</CardTitle>
        <CardDescription>Rate Management Solution · Atlantic Project Cargo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Corporate email</Label>
            <Input id="email" type="email" placeholder="you@atlanticprojectcargo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">demo quick access</span>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => demo("u-nick")} className="gap-1.5">
            <UserIcon className="size-4" /> Manager
          </Button>
          <Button variant="outline" onClick={() => demo("u-max")} className="gap-1.5">
            <ShieldCheck className="size-4" /> Procurement
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="ml-1 font-medium text-primary hover:underline">Request access</Link>
      </CardFooter>
    </Card>
  );
}
