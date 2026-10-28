export type OtpFlow = "login" | "signup";
export type OtpBackStep = "login" | "register";

export function getOtpBackStep(flow?: OtpFlow): OtpBackStep {
  return flow === "login" ? "login" : "register";
}
