export interface UmbracoEvent {
  id: string;
  eventId: string;
  lastUpdatedDate: string;
  name: string;
}

export interface CrmEvent {
  title: string;
  featuredImage: string;
  pageContent: string;
  imagesCarousel: string;
  startDate: string;
  endDate: string;
  location: string | null;
  eventAudiences: string | null;
  eventSectors: string[];
  eventId: number;
  eventType: string;
  eventVenues: string[];
  eventOrganiser: string;
  websiteURL: string | null;
  dWTCEvent: boolean;
  eventLogo: string | null;
  socialMedia: {
    facebook: string;
    linkedIn: string;
    instagram: string;
    youtube: string;
    tiktok: string;
  };
  lastUpdatedDate: string;
  WebsiteStatus: string;
}

export interface Env {
  CRM_API_URL: string;
  OCP_APIM_SUBSCRIPTION_KEY: string;
  UMBRACO_PROJECT_ALIAS: string;
  API_KEY: string;
  UMBRACO_PARENT_ID: string;
  UMBRACO_BASE_URL: string;
  MAILGUN_API_KEY: string;
  MAILGUN_API_BASE_URL: string;
  NOTIFICATION_EMAIL: string;
  NOTIFICATION_FROM_EMAIL: string;
  CLOUDFLARE_WEBHOOK: string;
}

// Response types
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export type ServiceResponse<T> = SuccessResponse<T> | ErrorResponse;

// Umbraco Content API types
export interface LocalizedField<T = string> {
  "en-US": T;
  ar: T;
}

export interface InvariantField<T = string> {
  $invariant: T;
}

export interface SocialNetworkBlockItem {
  contentTypeKey: string;
  udi: string;
  socialNetwork: string[];
  link: Array<{
    icon: string;
    name: string | null;
    nodeName: string | null;
    published: boolean;
    queryString: string | null;
    target: string | null;
    trashed: boolean;
    udi: string | null;
    url: string;
  }>;
}

export interface BlockListStructure {
  layout: {
    "Umbraco.BlockList": Array<{
      contentUdi: string;
    }>;
  };
  contentData: SocialNetworkBlockItem[];
  settingsData: any[];
}

export interface CreateEventRequest {
  name: LocalizedField;
  contentTypeAlias: string;
  title: LocalizedField;
  subtitle?: LocalizedField;
  description: LocalizedField;
  featuredImage?: InvariantField<any[]>;
  metadataTitle?: LocalizedField;
  metadataDescription?: LocalizedField;
  metadataKeywords?: LocalizedField;
  disableSearchEngineIndexing?: InvariantField<string>;
  date: InvariantField;
  category?: InvariantField<string[]>;
  tags?: InvariantField<any[]>;
  showNotifications?: InvariantField<string>;
  endDate: InvariantField;
  organiserLogo?: InvariantField<any[]>;
  organiserName?: InvariantField<string>;
  organiserWebsite?: InvariantField<any[]>;
  organiserSocialNetworks?: InvariantField<BlockListStructure>;
  eventId: InvariantField<string>;
  lastUpdatedDate: InvariantField<string>;
  location: InvariantField<string | null>;
  eventVenue?: InvariantField<string[]>;
  newEventVenue?: InvariantField<string[]>;
  audience?: InvariantField<string[]>;
  industry?: InvariantField<string[]>;
  pageBlocks?: LocalizedField<any>;
  parentId: string;
}

export interface UmbracoContentResponse {
  _createDate: string;
  _id: string;
  _hasChildren: boolean;
  _level: number;
  parentId: string;
  sortOrder: number;
  contentTypeAlias: string;
  _currentVersionState: LocalizedField;
  name: LocalizedField;
  _updateDate: LocalizedField;
  rel: string;
  _links: {
    self: { href: string };
    root: { href: string; title: string };
    children: { href: string; title: string };
    publish: { href: string; title: string };
    unpublish: { href: string; title: string };
    contenttype: { href: string; title: string };
    parent: { href: string; title: string };
  };
  [key: string]: any;
}
