import { Box, Shield, Globe, Zap, Compass } from "lucide-react";
import styles from "./RegisterLeftPanel.module.css";

type RegisterLeftPanelProps = {
  variant?: "register" | "login";
};

export default function RegisterLeftPanel({ variant = "register" }: RegisterLeftPanelProps) {
  const isLogin = variant === "login";

  return (
    <div className={styles.registerLeft}>
      <div className={styles.registerLeftContent}>
        <div className={styles.headerTitle}>
          <Compass className={styles.headerIcon} />
          <span>Jatayu</span>
        </div>

        <div className={styles.verifiedPill}>
          <Shield className={styles.verifiedIcon} size={14} />
          <span>
            {isLogin
              ? "Secure sign-in for users"
              : "Connect with top 1% experts in India"}
          </span>
        </div>

        <h1 className={`display ${styles.registerTitle}`}>
          {isLogin ? (
            <>
              <span className="t-muted">Welcome to the</span>
              <br />
              <span className="t-white">Seeker Panel</span>
            </>
          ) : (
            <>
              <span className="t-muted">Find Your</span>
              <br />
              <span className="t-white">Perfect Guide</span>
            </>
          )}
        </h1>

        <p className={styles.registerDescription}>
          {isLogin
            ? "Sign in to manage your matches, schedule calls, and review session notes."
            : "Create your seeker account to schedule calls, track expert matches, and access direct consultation channels."}
        </p>

        <div className={styles.registerFeaturesGrid}>
          <div className={styles.featureTag}>
            <Globe className={styles.featureIcon} size={16} />
            <span>10k+ Experts</span>
          </div>
          <div className={styles.featureTag}>
            <Zap className={styles.featureIcon} size={16} />
            <span>98% Accuracy</span>
          </div>
          <div className={styles.featureTag}>
            <Zap className={styles.featureIcon} size={16} />
            <span>Instant booking</span>
          </div>
          <div className={styles.featureTag}>
            <Shield className={styles.featureIcon} size={16} />
            <span>SSL Secured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
