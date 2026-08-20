import { Box, Shield, Globe, Zap, Wallet } from "lucide-react";
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
          <Box className={styles.headerIcon} />
          <span>Expertjourney</span>
        </div>

        <div className={styles.verifiedPill}>
          <Shield className={styles.verifiedIcon} size={14} />
          <span>
            {isLogin
              ? "Secure sign-in for verified experts"
              : "Applications are reviewed within 24-48 hours"}
          </span>
        </div>

        <h1 className={`display ${styles.registerTitle}`}>
          {isLogin ? (
            <>
              <span className="t-muted">Welcome to the</span>
              <br />
              <span className="t-white">Expert Network</span>
            </>
          ) : (
            <>
              <span className="t-muted">Welcome to the</span>
              <br />
              <span className="t-white">Expert Network</span>
            </>
          )}
        </h1>

        <p className={styles.registerDescription}>
          {isLogin
            ? "Sign in to access your professional dashboard, manage consultations, monitor earnings, and update your profile."
            : "Join a curated community of professionals. Build your profile, set your rates, and start offering consultations."}
        </p>

        <div className={styles.registerFeaturesGrid}>
          <div className={styles.featureTag}>
            <Globe className={styles.featureIcon} size={16} />
            <span>Indian audience</span>
          </div>
          <div className={styles.featureTag}>
            <Zap className={styles.featureIcon} size={16} />
            <span>100% Secure</span>
          </div>
          <div className={styles.featureTag}>
            <Zap className={styles.featureIcon} size={16} />
            <span>Quick setup</span>
          </div>
          <div className={styles.featureTag}>
            <Wallet className={styles.featureIcon} size={16} />
            <span>Quick earnings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
