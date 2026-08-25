"use client";

import { useCallback } from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useLinkedinAuth } from "@/hooks/useLinkedinAuth";
import type { AuthResponse } from "@/lib/api";
import styles from "./RegisterStep.module.css";

type ExpertSocialAuthProps = {
  onSuccess: (response: AuthResponse) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export default function ExpertSocialAuth({
  onSuccess,
  onError,
  disabled = false,
}: ExpertSocialAuthProps) {
  const handleError = useCallback(
    (message: string) => {
      onError?.(message);
    },
    [onError],
  );

  const {
    signInWithGoogle,
    isLoading: isGoogleLoading,
    isAvailable: isGoogleAvailable,
  } = useGoogleAuth({ onSuccess, onError: handleError });

  const {
    signInWithLinkedin,
    isLoading: isLinkedinLoading,
    isAvailable: isLinkedinAvailable,
  } = useLinkedinAuth({ onSuccess, onError: handleError });

  const isBusy = disabled || isGoogleLoading || isLinkedinLoading;

  if (!isGoogleAvailable && !isLinkedinAvailable) return null;

  return (
    <>
      <div className={styles.registerDivider}>
        <span className={styles.registerDividerLine} />
        <span className={styles.registerDividerText}>Or continue with</span>
        <span className={styles.registerDividerLine} />
      </div>

      <div className={styles.socialButtonsRow}>
        {isGoogleAvailable ? <button
          type="button"
          className={styles.socialButton}
          onClick={signInWithGoogle}
          disabled={isBusy}
          aria-label="Continue with Google"
          title="Continue with Google"
        >
          <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.97 7.29C4.678 5.163 6.662 3.58 9 3.58z" />
          </svg>
        </button> : null}
        {isLinkedinAvailable ? <button
          type="button"
          className={styles.socialButton}
          onClick={signInWithLinkedin}
          disabled={isBusy}
          aria-label="Continue with LinkedIn"
          title="Continue with LinkedIn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#0A66C2"
              d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.063 2.063 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
            />
          </svg>
        </button> : null}
      </div>

    </>
  );
}
