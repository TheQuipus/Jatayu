import {
  Shield,
  Compass,
  Sparkles,
  Target,
  MessageSquare,
  Calendar,
} from "lucide-react";
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

        {isLogin && (
          <div className={styles.verifiedPill}>
            <Shield className={styles.verifiedIcon} size={14} />
            <span>Secure sign-in for users</span>
          </div>
        )}

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
              <span className="t-white">Perfect<br/> Expert Guide</span>
            </>
          )}
        </h1>

        <p className={styles.registerDescription}>
          {isLogin
            ? "Sign in to manage your matches, schedule calls, and review session notes."
            : "Answer a few questions and we'll match you with verified experts tailored exactly to your needs."}
        </p>

        <div className={styles.registerFeaturesGrid}>
          <div className={styles.featureTag}>
            <Sparkles className={styles.featureIcon} size={16} />
            <span>
              Tell us your needs
            </span>
          </div>
          <div className={styles.featureTag}>
            <Target className={styles.featureIcon} size={16} />
            <span>Match with experts</span>
          </div>
          <div className={styles.featureTag}>
            <MessageSquare className={styles.featureIcon} size={16} />
            <span>Mode of Consultation</span>
          </div>
          <div className={styles.featureTag}>
            <Calendar className={styles.featureIcon} size={16} />
            <span>Book your session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
