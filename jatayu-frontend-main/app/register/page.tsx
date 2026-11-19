import { redirect } from "next/navigation";

export default function RegisterPage() {
  redirect("/seeker/seeker-onboarding/?flow=signup");
}
