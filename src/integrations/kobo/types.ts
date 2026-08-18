export type KoboAssetUid = string;

export type KoboSubmissionId = string | number;

export type KoboAssetReference = {
  assetUid: KoboAssetUid;

  deploymentStatus?: "draft" | "deployed" | "archived";

  versionUid?: string;

  syncedAt?: string;
};

export type KoboSubmissionReference = {
  assetUid: KoboAssetUid;

  submissionId: KoboSubmissionId;

  uuid?: string;

  submittedAt?: string;

  syncedAt?: string;
};

export type KoboSubmissionData = Record<
  string,
  string | number | boolean | null
>;

export type KoboConnectionStatus =
  | "unknown"
  | "connected"
  | "disconnected"
  | "error";
