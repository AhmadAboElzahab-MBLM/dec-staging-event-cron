import type {
  CrmEvent,
  UmbracoEvent,
  CreateEventRequest,
} from "../types/events.types";

/**
 * Remove surrounding quotes from a date string if present
 */
function normalizeDateString(dateString: string): string {
  return dateString.replace(/^"(.*)"$/, "$1");
}

export function filterEventsByVenue(
  events: CrmEvent[],
  venue: string
): CrmEvent[] {
  const filteredEvents = events.filter(
    (event) => event.eventVenues && event.eventVenues.includes(venue)
  );
  return filteredEvents;
}

export interface SyncResult {
  toUpdate: Array<{ umbracoEvent: UmbracoEvent; crmEvent: CrmEvent }>;
  toCreate: CrmEvent[];
}

export function compareEvents(
  crmEvents: CrmEvent[],
  umbracoEvents: UmbracoEvent[]
): SyncResult {
  const toUpdate: Array<{ umbracoEvent: UmbracoEvent; crmEvent: CrmEvent }> =
    [];
  const toCreate: CrmEvent[] = [];
  const umbracoMap = new Map<string, UmbracoEvent>();
  umbracoEvents.forEach((event) => {
    umbracoMap.set(event.eventId, event);
  });
  crmEvents.forEach((crmEvent) => {
    const crmEventId = crmEvent.eventId.toString();
    const umbracoEvent = umbracoMap.get(crmEventId);
    if (umbracoEvent) {
      const normalizedCrmDate = normalizeDateString(crmEvent.lastUpdatedDate);
      const normalizedUmbracoDate = normalizeDateString(
        umbracoEvent.lastUpdatedDate
      );
      if (normalizedCrmDate !== normalizedUmbracoDate) {
        toUpdate.push({ umbracoEvent, crmEvent });
      }
    } else {
      toCreate.push(crmEvent);
    }
  });

  return { toUpdate, toCreate };
}

/**
 * Build social networks block list structure for Umbraco
 */
function buildSocialNetworksBlockList(socialMedia: CrmEvent["socialMedia"]) {
  const contentData: any[] = [];
  const layout: any[] = [];

  // Only add social networks that have valid URLs from CRM data
  const socialNetworks = [
    {
      key: "facebook",
      name: "Facebook",
      url: socialMedia?.facebook,
    },
    {
      key: "linkedIn",
      name: "LinkedIn",
      url: socialMedia?.linkedIn,
    },
    {
      key: "instagram",
      name: "Instagram",
      url: socialMedia?.instagram,
    },
    {
      key: "youtube",
      name: "Youtube",
      url: socialMedia?.youtube,
    },
    {
      key: "tiktok",
      name: "TikTok",
      url: socialMedia?.tiktok,
    },
  ];

  socialNetworks.forEach((network) => {
    // Only add if URL exists and is not empty/whitespace
    if (network.url && network.url.trim() !== "") {
      const guid = generateGuid();
      const guidWithoutHyphens = guid.replace(/-/g, "");
      const udi = `umb://element/${guidWithoutHyphens}`;

      layout.push({ contentUdi: udi });
      contentData.push({
        contentTypeKey: "93f63d80-3828-4be7-9043-143bd100ca14",
        udi: udi,
        socialNetwork: [network.name],
        link: [
          {
            icon: "icon-link",
            name: null,
            nodeName: null,
            published: true,
            queryString: null,
            target: "_blank",
            trashed: false,
            udi: null,
            url: network.url,
          },
        ],
      });
    }
  });

  const blockListStructure = {
    layout: { "Umbraco.BlockList": layout },
    contentData,
    settingsData: [],
  };

  return blockListStructure;
}

/**
 * Generate a simple GUID for Umbraco element UDIs
 */
function generateGuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function mapCrmEventToUmbraco(
  crmEvent: CrmEvent,
  parentId?: string
): CreateEventRequest | Omit<CreateEventRequest, "parentId"> {
  const baseData = {
    name: {
      "en-US": crmEvent.title,
      ar: crmEvent.title,
    },
    contentTypeAlias: "decEvent",
    title: {
      "en-US": crmEvent.title,
      ar: crmEvent.title,
    },
    description: {
      "en-US": crmEvent.pageContent || "",
      ar: crmEvent.pageContent || "",
    },
    metadataTitle: {
      "en-US": crmEvent.title,
      ar: crmEvent.title,
    },
    metadataDescription: {
      "en-US": crmEvent.pageContent || "",
      ar: crmEvent.pageContent || "",
    },
    metadataKeywords: {
      "en-US": "",
      ar: "",
    },

    date: {
      $invariant: crmEvent.startDate,
    },
    category: {
      $invariant: crmEvent.eventType ? [crmEvent.eventType] : [],
    },
    endDate: {
      $invariant: crmEvent.endDate,
    },
    organiserName: {
      $invariant: crmEvent.eventOrganiser || "",
    },
    organiserWebsite: {
      $invariant: [
        {
          icon: "icon-link",
          name: crmEvent.websiteURL,
          nodeName: null,
          published: true,
          queryString: null,
          target: null,
          trashed: false,
          udi: null,
          url: crmEvent.websiteURL,
        },
      ],
    },
    organiserSocialNetworks: {
      $invariant: buildSocialNetworksBlockList(crmEvent.socialMedia),
    },
    eventId: {
      $invariant: crmEvent.eventId.toString(),
    },
    lastUpdatedDate: {
      $invariant: `"${crmEvent.lastUpdatedDate}"`,
    },
    location: {
      $invariant: crmEvent.location || null,
    },
    eventVenue: {
      $invariant: crmEvent.eventVenues || [],
    },
    newEventVenue: {
      $invariant: [],
    },
    audience: {
      $invariant: crmEvent.eventAudiences ? [crmEvent.eventAudiences] : [],
    },
    industry: {
      $invariant: crmEvent.eventSectors || [],
    },
  };

  if (parentId) {
    return { ...baseData, parentId };
  }

  return baseData;
}
