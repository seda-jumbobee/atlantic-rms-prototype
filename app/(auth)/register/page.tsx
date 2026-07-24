import { redirect } from "next/navigation";

// Closed registration — the old /register path now points at the access-request flow.
export default function RegisterRedirect() {
  redirect("/request-access");
}
