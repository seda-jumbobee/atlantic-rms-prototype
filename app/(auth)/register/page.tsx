"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogoMark } from "@/components/logo";
import { isCorporateEmail, ALLOWED_EMAIL_DOMAINS } from "@/lib/data/users";
import { AlertCircle, CheckCircle2, MailCheck } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isCorporateEmail(email)) {
      return setError(`Registration is restricted to corporate emails: ${ALLOWED_EMAIL_DOMAINS.map((d) => "@" + d).join(", ")}.`);
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="border-border/70 shadow-xl">
        <CardHeader className="items-center text-center">
          <div className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
            <MailCheck className="size-6" />
          </div>
          <CardTitle className="mt-2 text-xl">Request submitted</CardTitle>
          <CardDescription>Closed registration — pending review</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <Alert>
            <CheckCircle2 className="size-4" />
            <AlertTitle>Confirm your email</AlertTitle>
            <AlertDescription>
              We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
            </AlertDescription>
          </Alert>
          <p>
            After you confirm, a Procurement Manager approves the account before first sign-in.
            Access is limited to Atlantic Project Cargo, JumboBee and Atlantic Express staff.
          </p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">Back to sign in</Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 shadow-xl">
      <CardHeader className="items-center text-center">
        <LogoMark className="size-12" />
        <CardTitle className="mt-2 text-xl">Request access</CardTitle>
        <CardDescription>Corporate accounts only · approval required</CardDescription>
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
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Corporate email</Label>
            <Input id="email" type="email" placeholder="you@atlanticprojectcargo.com" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Company</Label>
            <Select value={company} onValueChange={setCompany} required>
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apc">Atlantic Project Cargo</SelectItem>
                <SelectItem value="jb">JumboBee</SelectItem>
                <SelectItem value="aec">Atlantic Express Corp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full">Submit request</Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/login" className="ml-1 font-medium text-primary hover:underline">Sign in</Link>
      </CardFooter>
    </Card>
  );
}
