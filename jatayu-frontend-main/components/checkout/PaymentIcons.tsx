import React from "react";
import { Smartphone, Zap, Building2, CreditCard } from "lucide-react";

/* Clean, unified UPI App Brand Badges */

export function GPayIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "8px",
        background: "#4285F4",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        letterSpacing: "-0.02em",
      }}
    >
      GPay
    </span>
  );
}

export function PhonePeIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "8px",
        background: "#5F259E",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "13px",
      }}
    >
      Pe
    </span>
  );
}

export function PaytmIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "8px",
        background: "#002E6E",
        color: "#00BAF2",
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "-0.03em",
      }}
    >
      Paytm
    </span>
  );
}

export function BhimIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "8px",
        background: "linear-gradient(135deg, #FF8B00 0%, #00875A 100%)",
        color: "#FFFFFF",
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
      }}
    >
      BHIM
    </span>
  );
}

export function CredIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 12,
        height: size + 12,
        borderRadius: "8px",
        background: "#09090B",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "9px",
        letterSpacing: "0.04em",
      }}
    >
      CRED
    </span>
  );
}

/* Clean, unified Bank Monogram Avatars */

export function HdfcBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#004C8F",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
      }}
    >
      HDFC
    </span>
  );
}

export function IciciBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#F37021",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
      }}
    >
      ICICI
    </span>
  );
}

export function SbiBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#00A5EC",
        color: "#FFFFFF",
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
      }}
    >
      SBI
    </span>
  );
}

export function AxisBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#97144D",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
      }}
    >
      AXIS
    </span>
  );
}

export function KotakBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#ED1C24",
        color: "#FFFFFF",
        fontWeight: 700,
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
      }}
    >
      KOTAK
    </span>
  );
}

export function PnbBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size + 10,
        height: size + 10,
        borderRadius: "6px",
        background: "#A20A3C",
        color: "#F9A825",
        fontWeight: 800,
        fontFamily: "var(--font-mono)",
        fontSize: "11px",
      }}
    >
      PNB
    </span>
  );
}

export function GenericBankIcon({ size = 20 }: { size?: number }) {
  return <Building2 size={size} />;
}
