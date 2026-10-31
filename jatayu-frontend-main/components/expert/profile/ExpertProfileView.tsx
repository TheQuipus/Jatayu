"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle, RefreshCw } from "lucide-react";
import { getDigilockerKycStatus, type DigilockerKycStatusResponse } from "@/lib/api";
import {
  getFormatTitle,
  getSessionLengthLabel,
  formatFormatPriceDisplay,
} from "@/components/expert/onboarding/preferencesData";
import {
  formatPositionDates,
  getFilledEducationDegrees,
  getFilledEmploymentPositions,
  type EducationDegree,
  type EmploymentPosition,
} from "@/lib/expertEmployment";
import {
  fetchExpertProfileRecord,
  getBackendExpertEmail,
  mapBackendAvailability,
  mapBackendProfileToExpertData,
  type BackendExpertProfile,
} from "@/lib/expertProfileApi";
import { getSecondarySkills } from "@/lib/expertProfile";
import { parseCredentialsFromProfile } from "@/lib/expertAuth";
import { normalizeKycPhotos } from "@/lib/expertKycPhotos";
import type { GovernmentIdData } from "@/lib/expertApplicationSubmission";
import styles from "./ExpertProfileView.module.css";

type ProfileViewData = {
  record: BackendExpertProfile;
  profile: ReturnType<typeof mapBackendProfileToExpertData>;
  employmentPositions: EmploymentPosition[];
  educationDegrees: EducationDegree[];
  timezone: string;
  availability: ReturnType<typeof mapBackendAvailability>["slots"];
};

function mapProfileViewData(record: BackendExpertProfile): ProfileViewData {
  const credentials = parseCredentialsFromProfile(record.credentials);
  const availability = mapBackendAvailability(record);
  return {
    record,
    profile: mapBackendProfileToExpertData(record),
    employmentPositions: credentials.employmentPositions,
    educationDegrees: credentials.educationDegrees,
    timezone: availability.timezone,
    availability: availability.slots,
  };
}

function getLoadErrorMessage(loadError: unknown): string {
  return loadError instanceof Error
    ? loadError.message
    : "Unable to load your saved profile. Please try again.";
}

function getAudienceLabel(value: string): string {
  return value
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getMetadataItems(
  value: unknown,
  nameFields: string[],
  detailField: string,
): Array<{
  id: string;
  name: string;
  detail: string;
  fileName: string;
  fileSize: string;
  url: string;
}> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const name = nameFields
      .map((field) => record[field])
      .find((field): field is string => typeof field === "string" && Boolean(field.trim()))
      ?.trim();
    if (!name) return [];
    return [{
      id: typeof record.id === "string" && record.id ? record.id : `${name}-${index}`,
      name,
      detail: typeof record[detailField] === "string" ? record[detailField] : "",
      fileName: typeof record.fileName === "string" ? record.fileName : name,
      fileSize: typeof record.size === "string"
        ? record.size
        : typeof record.fileSize === "string" ? record.fileSize : "",
      url: typeof record.url === "string" ? record.url : "",
    }];
  });
}

function getGovernmentId(value: unknown): GovernmentIdData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const front = record.front;
  const back = record.back;
  if (
    typeof record.type !== "string"
    || !front
    || typeof front !== "object"
    || Array.isArray(front)
  ) return null;
  const frontRecord = front as Record<string, unknown>;
  if (typeof frontRecord.name !== "string") return null;
  const backRecord = back && typeof back === "object" && !Array.isArray(back)
    ? back as Record<string, unknown>
    : null;
  const documentType = ["aadhaar", "pan", "passport", "voter", "driving"].includes(record.type)
    ? record.type as GovernmentIdData["type"]
    : null;
  if (!documentType) return null;
  return {
    type: documentType,
    front: {
      name: frontRecord.name,
      size: typeof frontRecord.size === "string" ? frontRecord.size : "",
      ...(typeof frontRecord.url === "string" ? { url: frontRecord.url } : {}),
    },
    ...(backRecord && typeof backRecord.name === "string"
      ? {
          back: {
            name: backRecord.name,
            size: typeof backRecord.size === "string" ? backRecord.size : "",
            ...(typeof backRecord.url === "string" ? { url: backRecord.url } : {}),
          },
        }
      : {}),
  };
}

function getKycIssuedDocuments(value: unknown): Array<{ label: string; url: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const record = item as Record<string, unknown>;
    const label = [record.name, record.description, record.doctype, record.type]
      .find((field): field is string => typeof field === "string" && field.trim().length > 0);
    return label
      ? [{
          label,
          url: typeof record.uri === "string"
            ? record.uri
            : typeof record.document_uri === "string" ? record.document_uri : "",
        }]
      : [];
  });
}

function ValueList({ values, empty = "Not added yet" }: { values: string[]; empty?: string }) {
  if (values.length === 0) return <p className={styles.emptyValue}>{empty}</p>;
  return (
    <ul className={styles.valueList}>
      {values.map((value) => <li key={value}>{value}</li>)}
    </ul>
  );
}

export default function ExpertProfileView() {
  const [data, setData] = useState<ProfileViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kycStatus, setKycStatus] = useState<DigilockerKycStatusResponse | null>(null);
  const [kycStatusError, setKycStatusError] = useState("");
  const [kycStatusLoading, setKycStatusLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const record = await fetchExpertProfileRecord();
      setData(mapProfileViewData(record));
    } catch (loadError) {
      setError(getLoadErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchExpertProfileRecord()
      .then((record) => {
        if (active) setData(mapProfileViewData(record));
      })
      .catch((loadError: unknown) => {
        if (active) setError(getLoadErrorMessage(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    getDigilockerKycStatus()
      .then((status) => {
        if (active) setKycStatus(status);
      })
      .catch((statusError: unknown) => {
        if (active) {
          setKycStatusError(statusError instanceof Error
            ? statusError.message
            : "Unable to load verification status.");
        }
      })
      .finally(() => {
        if (active) setKycStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className={styles.status} role="status">Loading your saved profile…</p>;
  }

  if (error || !data) {
    return (
      <div className={styles.error} role="alert">
        <AlertCircle size={18} />
        <span>{error || "Your saved profile could not be loaded."}</span>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            setError("");
            void loadProfile();
          }}
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const { record, profile } = data;
  const employmentPositions = getFilledEmploymentPositions(data.employmentPositions);
  const educationDegrees = getFilledEducationDegrees(data.educationDegrees);
  const skills = getSecondarySkills(profile.category, profile.skills);
  const selectedFormats = record.selectedFormats ?? [];
  const formatPrices = record.formatPrices ?? {};
  const targetAudience = Array.isArray(record.targetAudience) ? record.targetAudience : [];
  const metadata = record.onboardingMetadata ?? {};
  const certificates = getMetadataItems(metadata.certificates, ["name", "fileName"], "issuer");
  const portfolioSamples = getMetadataItems(metadata.portfolioSamples, ["fileName", "name"], "description");
  const governmentId = getGovernmentId(metadata.governmentId);
  const kycPhotos = normalizeKycPhotos(metadata.kycPhotos);
  const verification = kycStatus?.kyc;
  const verificationStatus = kycStatusLoading
    ? "Loading verification status…"
    : kycStatusError
      ? "Unavailable"
      : verification && typeof verification.status === "string"
        ? verification.status.replaceAll("_", " ")
        : "Not started";
  const issuedDocuments = getKycIssuedDocuments(verification?.issuedDocuments);
  const identityDocumentName = typeof kycStatus?.governmentId?.name === "string"
    ? kycStatus.governmentId.name
    : typeof kycStatus?.governmentId?.type === "string"
      ? kycStatus.governmentId.type
      : "";
  const identityDocumentUri = typeof kycStatus?.governmentId?.uri === "string"
    ? kycStatus.governmentId.uri
    : "";
  const governmentIdDocuments = governmentId
    ? [governmentId.front, governmentId.back].flatMap((document) => document ? [document] : [])
    : [];
  const kycPhotoEntries = ([
    { pose: "left", photo: kycPhotos.left },
    { pose: "centre", photo: kycPhotos.centre },
    { pose: "right", photo: kycPhotos.right },
  ] as const).flatMap((entry) => typeof entry.photo === "string"
    ? [{ pose: entry.pose, photo: entry.photo }]
    : []);

  return (
    <div className={styles.profileView}>
      <section className={styles.identityCard} aria-labelledby="profile-identity-title">
        <div className={styles.avatar} aria-hidden="true">
          {profile.avatar && profile.avatar !== "/assets/img/profile-placeholder.svg" ? (
            <Image
              src={profile.avatar}
              alt=""
              width={76}
              height={76}
              unoptimized
              className={styles.avatarImage}
            />
          ) : (
            (profile.name.trim()[0] || "?").toUpperCase()
          )}
        </div>
        <div className={styles.identityText}>
          <p className={styles.eyebrow}>Expert profile</p>
          <h2 id="profile-identity-title">{profile.name || "Name not added"}</h2>
          <p className={styles.role}>{profile.role || "Professional title not added"}</p>
          {profile.location && <p className={styles.location}>{profile.location}</p>}
          {getBackendExpertEmail(record) && (
            <p className={styles.location}>{getBackendExpertEmail(record)}</p>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-identity-details">
        <h2 id="profile-identity-details">Profile Identity</h2>
        <div className={styles.twoColumn}>
          <div className={styles.field}>
            <h3>Tagline</h3>
            <p>{profile.tagLine || "Not added yet"}</p>
          </div>
          <div className={styles.field}>
            <h3>Brief Introduction</h3>
            <p>{profile.bio || "Not added yet"}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-skills-title">
        <h2 id="profile-skills-title">Skills &amp; Specializations</h2>
        <div className={styles.field}>
          <h3>Primary Skill</h3>
          <p>{profile.category || "Not added yet"}</p>
        </div>
        <div className={styles.field}>
          <h3>Core Skills</h3>
          <ValueList values={skills} />
        </div>
        <div className={styles.field}>
          <h3>Languages</h3>
          <ValueList values={profile.languages} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-experience-title">
        <h2 id="profile-experience-title">Work Experience &amp; Background</h2>
        <div className={styles.cardList}>
          {employmentPositions.map((position) => (
            <article className={styles.detailCard} key={position.id}>
              <h3>{position.jobTitle || "Position"}</h3>
              <p>{position.company}</p>
              <p>{formatPositionDates(position)}</p>
              {position.responsibilities && <p>{position.responsibilities}</p>}
            </article>
          ))}
          {educationDegrees.map((degree) => (
            <article className={styles.detailCard} key={degree.id}>
              <h3>{degree.degree || "Education"}</h3>
              <p>{degree.institution}</p>
              {degree.fieldOfStudy && <p>{degree.fieldOfStudy}</p>}
              {degree.graduationYear && <p>{degree.graduationYear}</p>}
            </article>
          ))}
          {employmentPositions.length === 0 && educationDegrees.length === 0 && (
            <p className={styles.emptyValue}>No work experience or education added yet</p>
          )}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-consultation-title">
        <h2 id="profile-consultation-title">Consultation Preferences</h2>
        <div className={styles.field}>
          <h3>Consultation formats</h3>
          {selectedFormats.length === 0 ? (
            <p className={styles.emptyValue}>Not selected yet</p>
          ) : (
            <ul className={styles.valueList}>
              {selectedFormats.map((format) => (
                <li key={format}>
                  {getFormatTitle(format)}{formatPrices[format]
                    ? ` · ${formatFormatPriceDisplay(formatPrices[format])}/min`
                    : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={styles.field}>
          <h3>Session lengths</h3>
          <ValueList values={(record.selectedLengths ?? []).map(getSessionLengthLabel)} />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-audience-title">
        <h2 id="profile-audience-title">Target Audience</h2>
        <ValueList values={targetAudience.map(getAudienceLabel)} />
      </section>

      <section className={styles.section} aria-labelledby="profile-links-title">
        <h2 id="profile-links-title">Professional Links</h2>
        <div className={styles.twoColumn}>
          <div className={styles.field}>
            <h3>LinkedIn</h3>
            <p>{typeof metadata.linkedin === "string"
              ? metadata.linkedin
              : "Not added yet"}</p>
          </div>
          <div className={styles.field}>
            <h3>Portfolio</h3>
            <p>{typeof metadata.portfolio === "string"
              ? metadata.portfolio
              : "Not added yet"}</p>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-credentials-title">
        <h2 id="profile-credentials-title">Credentials &amp; KYC Verification</h2>
        <div className={styles.twoColumn}>
          <div className={styles.field}>
            <h3>Government ID</h3>
            {governmentId ? (
              <div className={styles.cardList}>
                <article className={styles.detailCard}>
                  <h3>{identityDocumentName || governmentId.type.toUpperCase()}</h3>
                  <p>Document type: {governmentId.type.toUpperCase()}</p>
                  {governmentIdDocuments.map((document) => (
                    <p key={document.name}>
                      {document.name}{document.size ? ` (${document.size})` : ""}
                      {document.url && (
                        <> · <a href={document.url} target="_blank" rel="noreferrer">Open document</a></>
                      )}
                    </p>
                  ))}
                </article>
              </div>
            ) : (
              <p className={styles.emptyValue}>No government ID uploaded</p>
            )}
            <p className={styles.statusDetail}>
              Verification status: {verificationStatus}{kycStatus?.sandbox ? " (Sandbox)" : ""}
            </p>
            {kycStatusError && <p className={styles.statusError} role="status">{kycStatusError}</p>}
            {identityDocumentUri && (
              <p className={styles.statusDetail}>
                <a href={identityDocumentUri} target="_blank" rel="noreferrer">Open DigiLocker identity document</a>
              </p>
            )}
            {issuedDocuments.map((document, index) => (
              <p className={styles.statusDetail} key={`${document.label}-${index}`}>
                {document.label}
                {document.url && <> · <a href={document.url} target="_blank" rel="noreferrer">Open document</a></>}
              </p>
            ))}
          </div>
          <div className={styles.field}>
            <h3>Manual KYC Photos</h3>
            <div className={styles.kycPhotoGrid}>
              {kycPhotoEntries.map(({ pose, photo }) => (
                  <figure className={styles.kycPhoto} key={pose}>
                    <Image src={photo} alt={`KYC ${pose} photo`} width={180} height={135} unoptimized />
                    <figcaption>{pose === "centre" ? "Center" : pose}</figcaption>
                  </figure>
                ))}
            </div>
            {!kycPhotos.left && !kycPhotos.centre && !kycPhotos.right && (
              <p className={styles.emptyValue}>No manual KYC photos saved</p>
            )}
            {typeof metadata.kycVideoUrl === "string" && metadata.kycVideoUrl && (
              <a href={metadata.kycVideoUrl} target="_blank" rel="noreferrer">
                Open KYC verification video
              </a>
            )}
          </div>
        </div>
        <div className={styles.twoColumn}>
          <div className={styles.field}>
            <h3>Certifications &amp; Licenses</h3>
            <div className={styles.cardList}>
              {certificates.map((certificate) => (
                <article className={styles.detailCard} key={certificate.id}>
                  <h3>{certificate.name}</h3>
                  {certificate.detail && <p>Issuing organisation: {certificate.detail}</p>}
                  {certificate.fileName && <p>File: {certificate.fileName}</p>}
                  {certificate.fileSize && <p>Size: {certificate.fileSize}</p>}
                  {certificate.url && (
                    <a href={certificate.url} download={certificate.fileName} target="_blank" rel="noreferrer">
                      View or download certificate
                    </a>
                  )}
                </article>
              ))}
              {certificates.length === 0 && <p className={styles.emptyValue}>No certifications added</p>}
            </div>
          </div>
          <div className={styles.field}>
            <h3>Work Samples &amp; Artifacts</h3>
            <div className={styles.cardList}>
              {portfolioSamples.map((sample) => (
                <article className={styles.detailCard} key={sample.id}>
                  <h3>{sample.name}</h3>
                  {sample.detail && <p>{sample.detail}</p>}
                  {sample.fileSize && <p>Size: {sample.fileSize}</p>}
                  {sample.url && (
                    <a href={sample.url} download={sample.fileName} target="_blank" rel="noreferrer">
                      View or download file
                    </a>
                  )}
                </article>
              ))}
              {portfolioSamples.length === 0 && <p className={styles.emptyValue}>No work samples uploaded</p>}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="profile-availability-title">
        <h2 id="profile-availability-title">Availability Schedule</h2>
        {data.timezone && <p className={styles.timezone}>Timezone: {data.timezone}</p>}
        {data.availability.length === 0 ? (
          <p className={styles.emptyValue}>No availability added yet</p>
        ) : (
          <div className={styles.cardList}>
            {data.availability.map((slot, index) => (
              <article className={styles.detailCard} key={slot.id ?? `${slot.days.join("-")}-${index}`}>
                <h3>{slot.days.join(", ") || "Days not selected"}</h3>
                <p>{slot.from} – {slot.to}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
