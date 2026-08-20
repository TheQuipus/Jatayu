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

/* Scalable Official Brand Vector SVGs */

export function VisaBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#1434CB" />
      <path
        d="M14.887 16.924h-2.383l1.488-9.198h2.383l-1.488 9.198zm7.568-9.014c-.476-.179-1.218-.372-2.146-.372-2.366 0-4.032 1.258-4.049 3.064-.017 1.332 1.189 2.074 2.096 2.518.932.456 1.246.749 1.241 1.157-.008.626-.752.914-1.448.914-1.077 0-1.654-.162-2.541-.553l-.36-.169-.387 2.392c.646.297 1.838.553 3.068.566 2.513 0 4.148-1.241 4.171-3.161.015-1.053-.628-1.859-2.008-2.518-.836-.425-1.348-.709-1.348-1.141.008-.39.429-.806 1.365-.806.777-.015 1.343.166 1.777.352l.213.1.416-2.497zm6.758 9.014h2.083l-1.815-9.198h-2.208c-.496 0-.916.292-1.103.738l-3.9 9.198h2.505l.498-1.378h3.062l.288 1.378zm-2.658-3.327l1.258-3.466.726 3.466h-1.984zm-14.739-5.871l-2.348 6.273-.254-1.282c-.443-1.503-1.826-3.133-3.376-3.948l2.188 8.147h2.531l3.771-9.19h-2.512z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MastercardBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#0A0A0A" />
      <circle cx="13.5" cy="12" r="7" fill="#EB001B" />
      <circle cx="22.5" cy="12" r="7" fill="#F79E1B" fillOpacity="0.92" />
      <path
        d="M18 6.942a6.974 6.974 0 0 1 2.5 5.058A6.974 6.974 0 0 1 18 17.058 6.974 6.974 0 0 1 15.5 12 6.974 6.974 0 0 1 18 6.942Z"
        fill="#FF5F00"
      />
    </svg>
  );
}

export function AmexBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#006FCF" />
      <path
        d="M4.5 16.5l.9-2.3h2.2l.9 2.3h1.8l-2.8-7h-2l-2.8 7h1.8zm1.5-3.7l.6-1.6.6 1.6h-1.2zm6.2 3.7v-7h-1.6v7h1.6zm6.8 0v-7h-3.4v7h1.6v-2.4h1.4v-1.4h-1.4v-1.8h1.8v-1.4h-3.4v7h3.4zm4.8 0l-1.3-2.1-1.3 2.1h-1.8l2.2-3.5-2.1-3.5h1.8l1.2 2 1.2-2h1.8l-2.1 3.5 2.2 3.5h-1.8z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function DinersBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#004B87" />
      <circle cx="18" cy="12" r="7.5" fill="#FFFFFF" fillOpacity="0.2" />
      <circle cx="18" cy="12" r="7" stroke="#FFFFFF" strokeWidth="1.5" />
      <path d="M15 6.5A7 7 0 0 0 15 17.5V6.5zM21 6.5v11a7 7 0 0 0 0-11z" fill="#FFFFFF" />
    </svg>
  );
}

export function MaestroBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#003B64" />
      <circle cx="13.5" cy="12" r="7" fill="#006699" />
      <circle cx="22.5" cy="12" r="7" fill="#CC0000" />
      <path
        d="M18 6.942a6.974 6.974 0 0 1 2.5 5.058A6.974 6.974 0 0 1 18 17.058 6.974 6.974 0 0 1 15.5 12 6.974 6.974 0 0 1 18 6.942Z"
        fill="#734BA1"
      />
    </svg>
  );
}

export function DiscoverBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#231F20" />
      <rect x="2" y="2" width="32" height="20" rx="2" fill="#FFFFFF" />
      <text x="4" y="15" fill="#231F20" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.5">DISC</text>
      <circle cx="21" cy="12" r="3.5" fill="#F4821E" />
      <text x="25.5" y="15" fill="#231F20" fontFamily="sans-serif" fontWeight="900" fontSize="7.5" letterSpacing="-0.5">VER</text>
    </svg>
  );
}

export function RupayBadge({ height = 20 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 36 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="36" height="24" rx="4" fill="#002C6C" />
      <text x="4" y="16" fill="#FFFFFF" fontFamily="sans-serif" fontWeight="900" fontStyle="italic" fontSize="10">RuPay</text>
      <path d="M28 8l3 4-3 4h2.5l3-4-3-4H28z" fill="#F26522" />
      <path d="M30.5 8l3 4-3 4h2.5l3-4-3-4h-2.5z" fill="#00A74D" />
    </svg>
  );
}

export function UpiLogoBadge({ height = 22 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 52 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      <rect width="52" height="24" rx="4" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
      <path d="M8 5.5L14 12L8 18.5H11.5L17.5 12L11.5 5.5H8Z" fill="#7A2828" />
      <path d="M12.5 5.5L18.5 12L12.5 18.5H16L22 12L16 5.5H12.5Z" fill="#0F766E" />
      <path d="M25 6H28V15C28 16.5 27 17.5 25.5 17.5C24 17.5 23 16.5 23 15V6H25Z" fill="#0F172A" />
      <path d="M30 6H34.5C36.2 6 37.5 7.1 37.5 8.7C37.5 10.3 36.2 11.4 34.5 11.4H32V18H30V6ZM32 9.6H34.3C35.1 9.6 35.6 9.2 35.6 8.7C35.6 8.2 35.1 7.8 34.3 7.8H32V9.6Z" fill="#0F172A" />
      <path d="M39.5 6H41.5V18H39.5V6Z" fill="#0F172A" />
    </svg>
  );
}

