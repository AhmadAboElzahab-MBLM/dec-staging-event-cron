import type {
  CrmEvent,
  UmbracoEvent,
  CreateEventRequest,
} from "../types/events.types";

/**
 * Event Utilities for CRM to Umbraco Data Mapping
 *
 * This module handles the transformation of CRM event data to Umbraco's content structure.
 *
 * Key Features:
 * - UUID/GUID Generation: Uses generateGuid() to create unique identifiers for Umbraco elements
 * - Page Blocks Structure: Builds localized (en-US, ar) page blocks with event-specific and static content
 * - Social Networks: Dynamically generates social media links from CRM data
 *
 * UUID Format for Umbraco Elements:
 * - Generated using RFC 4122 version 4 UUID format (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
 * - Hyphens removed for Umbraco UDI format: umb://element/{guid-without-hyphens}
 *
 * Page Blocks Structure:
 * - English (en-US): 5 blocks total
 *   1. Hero Image (event-specific from CRM)
 *   2. Event Description with Organiser Info (event-specific from CRM)
 *   3-5. Static template blocks (Getting Here, Destination Dubai)
 *
 * - Arabic (ar): 6 blocks total
 *   1. Hero Image (event-specific from CRM)
 *   2. Event Description with Organiser Info (event-specific from CRM)
 *   3. Image Gallery (event-specific from CRM)
 *   4-6. Static template blocks (Getting Here, Destination Dubai in Arabic)
 */

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
    (event) =>
      event.eventVenues &&
      event.eventVenues.includes(venue) &&
      event.WebsiteStatus.toLowerCase() === "online"
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

/**
 * Build page blocks structure for both English and Arabic
 * First two blocks contain event-specific data, remaining blocks are static
 */
function buildPageBlocks(crmEvent: CrmEvent) {
  // Generate GUIDs for English blocks
  const enHeroImageGuid = generateGuid().replace(/-/g, "");
  const enEventDescGuid = generateGuid().replace(/-/g, "");
  const enGettingHereGuid = generateGuid().replace(/-/g, "");
  const enDestinationDubaiListGuid = generateGuid().replace(/-/g, "");
  const enDestinationDubaiCardGuid = generateGuid().replace(/-/g, "");

  // Generate GUIDs for Arabic blocks
  const arHeroImageGuid = generateGuid().replace(/-/g, "");
  const arEventDescGuid = generateGuid().replace(/-/g, "");
  const arImageGalleryGuid = generateGuid().replace(/-/g, "");
  const arGettingHereGuid = generateGuid().replace(/-/g, "");
  const arDestinationDubaiListGuid = generateGuid().replace(/-/g, "");
  const arDestinationDubaiCardGuid = generateGuid().replace(/-/g, "");

  // Build social networks for event description block (reusing existing function)
  const socialNetworks = buildSocialNetworksBlockList(crmEvent.socialMedia);

  // English page blocks
  const englishBlocks = {
    layout: {
      "Umbraco.BlockList": [
        { contentUdi: `umb://element/${enHeroImageGuid}` },
        { contentUdi: `umb://element/${enEventDescGuid}` },
        { contentUdi: `umb://element/${enGettingHereGuid}` },
        { contentUdi: `umb://element/${enDestinationDubaiListGuid}` },
        { contentUdi: `umb://element/${enDestinationDubaiCardGuid}` },
      ],
    },
    contentData: [
      // Block 1: Hero Image (event-specific from CRM)
      {
        contentTypeKey: "fd8b22e5-6560-40ea-8f24-4da5ca390b91",
        udi: `umb://element/${enHeroImageGuid}`,
        image: [], // TODO: Map from crmEvent.featuredImage
      },
      // Block 2: Event Description with Organiser Info (event-specific from CRM)
      {
        contentTypeKey: "163c1761-234c-41f4-92e5-9d3d26186b79",
        udi: `umb://element/${enEventDescGuid}`,
        description: {
          markup: `<p>${crmEvent.pageContent || ""}</p>`,
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        organiserLogo: [], // TODO: Map from crmEvent.eventLogo if needed
        organiserName: crmEvent.eventOrganiser || "",
        ...(crmEvent.websiteURL && {
          organiserWebsite: [
            {
              icon: "icon-link",
              name: null,
              nodeName: null,
              published: true,
              queryString: null,
              target: null,
              trashed: false,
              udi: null,
              url: crmEvent.websiteURL,
            },
          ],
        }),
        socialNetworks: socialNetworks,
      },
      // Block 3: Getting Here (static template)
      {
        contentTypeKey: "c12716ad-f907-4621-b2e4-1b242d63974e",
        udi: `umb://element/${enGettingHereGuid}`,
        logo: [],
        title: "Getting Here",
        subtitle: {
          markup: "<p>Fastest, easiest route to the venue</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        description: {
          markup:
            "<p>Benefiting from Dubai South's world-class infrastructure, getting to Dubai Exhibition Centre is easy.</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        link: [
          {
            icon: "icon-article color-deep-purple",
            name: "Plan your visit",
            nodeName: "Getting Here",
            published: true,
            queryString: null,
            target: null,
            trashed: false,
            udi: "umb://document/e079f2d2051b43259dbebe3c82bef8cf",
            url: "/dec/getting-here/",
          },
        ],
        image: [
          {
            key: "d092581b-7712-4dd5-8bb0-ecf82ec05332",
            mediaKey: "c4651b2c-4ca5-4c99-9dbb-816542f6d793",
            crops: [],
            focalPoint: null,
          },
        ],
        video: "",
        leftImage: "1",
        locationTitle: "",
        locationItems: "",
      },
      // Block 4: Destination Dubai List (static template)
      {
        contentTypeKey: "f4965fd3-b550-41c3-997e-1fd7059fe015",
        udi: `umb://element/${enDestinationDubaiListGuid}`,
        title: "Destination Dubai",
        subtitle: "Explore what's happening around Dubai this month",
        description: "",
        displayNotch: "0",
        items: "",
      },
      // Block 5: Destination Dubai Card (static template)
      {
        contentTypeKey: "c12716ad-f907-4621-b2e4-1b242d63974e",
        udi: `umb://element/${enDestinationDubaiCardGuid}`,
        logo: [],
        title: "Destination Dubai",
        subtitle: {
          markup: "<p>Make the most of your time in Dubai<br><br></p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        description: {
          markup:
            "<p>Experience the best of Dubai, with top attractions, world-class dining, shopping, and entertainment within reach of Dubai Exhibition Centre.</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        link: [
          {
            icon: "icon-article color-deep-purple",
            name: "Find out more",
            nodeName: "Destination Dubai",
            published: true,
            queryString: null,
            target: null,
            trashed: false,
            udi: "umb://document/58a786fbf4ec4f9397dca699d4c74f01",
            url: "/dec/destination-dubai/",
          },
        ],
        image: [
          {
            key: "1d345bd4-ee7f-4a79-b3d0-1246a37e39dc",
            mediaKey: "aa57deab-5ea6-4a7e-a6ea-1afbc034cd2d",
            crops: [],
            focalPoint: null,
          },
        ],
        video: "",
        leftImage: "0",
        locationTitle: "",
        locationItems: "",
      },
    ],
    settingsData: [],
  };

  // Arabic page blocks (similar structure with Arabic content)
  const arabicBlocks = {
    layout: {
      "Umbraco.BlockList": [
        { contentUdi: `umb://element/${arHeroImageGuid}` },
        { contentUdi: `umb://element/${arEventDescGuid}` },
        { contentUdi: `umb://element/${arImageGalleryGuid}` },
        { contentUdi: `umb://element/${arGettingHereGuid}` },
        { contentUdi: `umb://element/${arDestinationDubaiListGuid}` },
        { contentUdi: `umb://element/${arDestinationDubaiCardGuid}` },
      ],
    },
    contentData: [
      // Block 1: Hero Image (event-specific from CRM)
      {
        contentTypeKey: "fd8b22e5-6560-40ea-8f24-4da5ca390b91",
        udi: `umb://element/${arHeroImageGuid}`,
        image: [], // TODO: Map from crmEvent.featuredImage
      },
      // Block 2: Event Description with Organiser Info (event-specific from CRM)
      {
        contentTypeKey: "163c1761-234c-41f4-92e5-9d3d26186b79",
        udi: `umb://element/${arEventDescGuid}`,
        description: {
          markup: `<p>${crmEvent.pageContent || ""}</p>`,
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        organiserLogo: [],
        organiserName: crmEvent.eventOrganiser || "",
        ...(crmEvent.websiteURL && {
          organiserWebsite: [
            {
              icon: "icon-link",
              name: null,
              nodeName: null,
              published: true,
              queryString: null,
              target: "_blank",
              trashed: false,
              udi: null,
              url: crmEvent.websiteURL,
            },
          ],
        }),
        socialNetworks: socialNetworks,
      },
      // Block 3: Image Gallery (static template)
      {
        contentTypeKey: "a56add81-856e-4004-8e61-30cc04962297",
        udi: `umb://element/${arImageGalleryGuid}`,
        images: [], // TODO: Map from crmEvent.imagesCarousel if needed
      },
      // Block 4: Getting Here (static template with Arabic content)
      {
        contentTypeKey: "c12716ad-f907-4621-b2e4-1b242d63974e",
        udi: `umb://element/${arGettingHereGuid}`,
        logo: [],
        title: "كيفية الوصول",
        subtitle: {
          markup: '<p class="p1">أسهل وأسرع الطرق للوصول إلى المركز</p>',
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        description: {
          markup:
            "<p>يمكن الوصول إلى مركز دبي للمعارض بمنتهى السهولة وذلك بفضل البنية التحتية المتطورة في دبي الجنوب.</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        link: [
          {
            icon: "icon-article color-deep-purple",
            name: "خططوا لزيارتكم",
            nodeName: "Getting Here",
            published: true,
            queryString: null,
            target: null,
            trashed: false,
            udi: "umb://document/e079f2d2051b43259dbebe3c82bef8cf",
            url: "/dec/getting-here/",
          },
        ],
        image: [
          {
            key: "a04adc53-cc3f-4924-b8b7-31174b403b46",
            mediaKey: "810c9d1c-cbaa-4e23-aa2c-e04d3c081a2f",
            crops: [],
            focalPoint: null,
          },
        ],
        video: "",
        leftImage: "1",
        locationTitle: "",
        locationItems: "",
      },
      // Block 5: Destination Dubai List (static template with Arabic content)
      {
        contentTypeKey: "f4965fd3-b550-41c3-997e-1fd7059fe015",
        udi: `umb://element/${arDestinationDubaiListGuid}`,
        title: "معالم دبي",
        subtitle: "تعرفوا على أبرز الفعاليات في دبي",
        description: "",
        displayNotch: "0",
        items: {
          layout: {
            "Umbraco.BlockList": [],
          },
          contentData: [],
          settingsData: [],
        },
      },
      // Block 6: Destination Dubai Card (static template with Arabic content)
      {
        contentTypeKey: "c12716ad-f907-4621-b2e4-1b242d63974e",
        udi: `umb://element/${arDestinationDubaiCardGuid}`,
        logo: [],
        title: "معالم دبي",
        subtitle: {
          markup: "<p>استمتعوا بكل لحظة من تجربة إقامتكم في دبي</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        description: {
          markup:
            "<p>توفر دبي لضيوفها أرقى التجارب والفعاليات، وتحتضن مجموعة من أبرز المعالم السياحية ووجهات تناول الطعام العالمية ومراكز التسوق والترفيه، جميعها على مقربة من مركز دبي للمعارض.</p>",
          blocks: {
            layout: null,
            contentData: [],
            settingsData: [],
          },
        },
        link: [
          {
            icon: "icon-article color-deep-purple",
            name: "استكشفوا المزيد",
            nodeName: "Destination Dubai",
            published: true,
            queryString: null,
            target: null,
            trashed: false,
            udi: "umb://document/58a786fbf4ec4f9397dca699d4c74f01",
            url: "/dec/destination-dubai/",
          },
        ],
        image: [
          {
            key: "1d345bd4-ee7f-4a79-b3d0-1246a37e39dc",
            mediaKey: "aa57deab-5ea6-4a7e-a6ea-1afbc034cd2d",
            crops: [],
            focalPoint: null,
          },
        ],
        video: "",
        leftImage: "0",
        locationTitle: "",
        locationItems: "",
      },
    ],
    settingsData: [],
  };

  return {
    "en-US": englishBlocks,
    ar: arabicBlocks,
  };
}

/**
 * Update existing page blocks with new CRM data
 * Preserves existing block structure and GUIDs, only updates event-specific content in block 2 (Event Description)
 *
 * @param existingPageBlocks - The current pageBlocks structure from Umbraco
 * @param crmEvent - New CRM event data
 * @returns Updated page blocks with preserved structure
 */
function updatePageBlocks(
  existingPageBlocks: { "en-US": any; ar: any },
  crmEvent: CrmEvent
) {
  // Build new social networks from CRM data
  const socialNetworks = buildSocialNetworksBlockList(crmEvent.socialMedia);

  // Deep clone existing page blocks to avoid mutations
  const updatedEnglishBlocks = JSON.parse(
    JSON.stringify(existingPageBlocks["en-US"])
  );
  const updatedArabicBlocks = JSON.parse(JSON.stringify(existingPageBlocks.ar));

  // Update English Block 2 (Event Description) - index 1 in contentData
  if (updatedEnglishBlocks.contentData && updatedEnglishBlocks.contentData[1]) {
    const eventDescBlock = updatedEnglishBlocks.contentData[1];

    // Update event-specific fields only
    eventDescBlock.description = {
      markup: `<p>${crmEvent.pageContent || ""}</p>`,
      blocks: {
        layout: null,
        contentData: [],
        settingsData: [],
      },
    };
    eventDescBlock.organiserName = crmEvent.eventOrganiser || "";
    if (crmEvent.websiteURL) {
      eventDescBlock.organiserWebsite = [
        {
          icon: "icon-link",
          name: null,
          nodeName: null,
          published: true,
          queryString: null,
          target: null,
          trashed: false,
          udi: null,
          url: crmEvent.websiteURL,
        },
      ];
    } else {
      delete eventDescBlock.organiserWebsite;
    }
    eventDescBlock.socialNetworks = socialNetworks;

    // Keep existing organiserLogo and other fields
    // Only update if you have new logo data from CRM
    // eventDescBlock.organiserLogo = ...; // TODO: Update if needed
  }

  // Update Arabic Block 2 (Event Description) - index 1 in contentData
  if (updatedArabicBlocks.contentData && updatedArabicBlocks.contentData[1]) {
    const eventDescBlock = updatedArabicBlocks.contentData[1];

    // Update event-specific fields only
    eventDescBlock.description = {
      markup: `<p>${crmEvent.pageContent || ""}</p>`,
      blocks: {
        layout: null,
        contentData: [],
        settingsData: [],
      },
    };
    eventDescBlock.organiserName = crmEvent.eventOrganiser || "";
    if (crmEvent.websiteURL) {
      eventDescBlock.organiserWebsite = [
        {
          icon: "icon-link",
          name: null,
          nodeName: null,
          published: true,
          queryString: null,
          target: "_blank",
          trashed: false,
          udi: null,
          url: crmEvent.websiteURL,
        },
      ];
    } else {
      delete eventDescBlock.organiserWebsite;
    }
    eventDescBlock.socialNetworks = socialNetworks;

    // Keep existing organiserLogo and other fields
    // Only update if you have new logo data from CRM
    // eventDescBlock.organiserLogo = ...; // TODO: Update if needed
  }

  return {
    "en-US": updatedEnglishBlocks,
    ar: updatedArabicBlocks,
  };
}

/**
 * Map CRM event to Umbraco format for CREATE operations
 * Generates completely new page blocks with new GUIDs
 */
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
    ...(crmEvent.websiteURL && {
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
    }),
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
    pageBlocks: buildPageBlocks(crmEvent),
  };

  if (parentId) {
    return { ...baseData, parentId };
  }

  return baseData;
}

/**
 * Map CRM event to Umbraco format for UPDATE operations
 * Preserves existing page blocks structure and only updates event-specific content
 *
 * @param crmEvent - New CRM event data
 * @param existingUmbracoEvent - Current event data from Umbraco (full response object)
 * @returns Partial update payload with preserved page blocks
 */
export function mapCrmEventForUpdate(
  crmEvent: CrmEvent,
  existingUmbracoEvent: any
): Partial<CreateEventRequest> {
  return {
    name: {
      "en-US": crmEvent.title,
      ar: crmEvent.title,
    },
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
    ...(crmEvent.websiteURL && {
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
    }),
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
    // Update page blocks while preserving existing structure and GUIDs
    pageBlocks: existingUmbracoEvent.pageBlocks
      ? updatePageBlocks(existingUmbracoEvent.pageBlocks, crmEvent)
      : buildPageBlocks(crmEvent), // Fallback to new blocks if none exist
  };
}
