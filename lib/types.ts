export type UseCaseStatus = "active" | "beta" | "planned" | "retired";

/** Contract for `use-cases/<slug>/usecase.json`. Validated by `npm run validate`. */
export interface UseCaseManifest {
  slug: string;
  title: string;
  summary: string;
  status: UseCaseStatus;
  owner: string;
  tags: string[];
  /** Shared-resource ids from `shared-resources/resources.json`. */
  resources: string[];
  /**
   * Groups the use case in the dashboard's category rail. The rail is built
   * from the categories actually in use, so adding a new one needs no code.
   */
  category?: string;
  /** Icon name from components/icons.tsx. Falls back to a generic glyph. */
  icon?: string;
  /** Tile colour: navy, burgundy, emerald, bronze, teal, or plum. */
  accent?: string;
  api?: {
    enabled: boolean;
    /** Env var holding the backend base URL, e.g. `DOCUMENT_INTELLIGENCE_API_URL`. */
    baseUrlEnv?: string;
  };
  links?: { label: string; href: string }[];
}

export interface ResourceEnvVar {
  name: string;
  required: boolean;
  secret: boolean;
  example: string;
  description: string;
}

/** Contract for entries in `shared-resources/resources.json`. */
export interface SharedResource {
  id: string;
  name: string;
  category: string;
  summary: string;
  docs: string;
  env: ResourceEnvVar[];
}

export interface SharedResourceStatus {
  resource: SharedResource;
  configured: boolean;
  missing: string[];
  /** Variables present in the pod environment (values are never exposed). */
  environmentVariables: string[];
  /** Variables present in the Kubernetes settings Secret (names only). */
  storedVariables: string[];
}
