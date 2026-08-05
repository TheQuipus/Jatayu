import { Box, FileText, Shield, ShieldCheck, Smartphone } from "lucide-react";
import styles from "@/components/expert/onboarding/RegisterLeftPanel.module.css";

export default function AdminLoginLeftPanel() {
  return (
    <div className={styles.registerLeft}>
      <div className={styles.registerLeftContent}>
        <div className={styles.headerTitle}>
          <Box className={styles.headerIcon} />
          <span>Jatayu Admin</span>
        </div>

        <div className={styles.verifiedPill}>
          <Shield className={styles.verifiedIcon} size={14} />
          <span>Secure sign-in for authorized personnel</span>
        </div>

        <h1 className={`display ${styles.registerTitle}`}>
          <span className="t-muted">Welcome to the</span>
          <br />
          <span className="t-white">Admin Console</span>
        </h1>

        <p className={styles.registerDescription}>
          Manage the Jatayu marketplace — review expert applications, manage seeker, monitor platform
          health, and oversee operations from one secure place.
        </p>

        <div className={styles.registerFeaturesGrid}>
          <div className={styles.featureTag}>
            <ShieldCheck className={styles.featureIcon} size={16} />
            <span>SSL encrypted</span>
          </div>
          <div className={styles.featureTag}>
            <FileText className={styles.featureIcon} size={16} />
            <span>Audit logged</span>
          </div>
          <div className={styles.featureTag}>
            <Smartphone className={styles.featureIcon} size={16} />
            <span>2FA ready</span>
          </div>
          <div className={styles.featureTag}>
            <Shield className={styles.featureIcon} size={16} />
            <span>Restricted access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
