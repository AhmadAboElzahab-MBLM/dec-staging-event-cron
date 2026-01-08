import * as XLSX from "xlsx";
import type { Env } from "../types/events.types";

interface EventDetails {
  title: string;
  eventId: number;
  startDate?: string;
  endDate?: string;
  location?: string | null;
  eventType?: string;
  eventOrganiser?: string;
}

interface SyncSummary {
  updatedEvents: EventDetails[];
  createdEvents: EventDetails[];
  failedEvents: Array<EventDetails & { error: string }>;
  syncDate: string;
}

function generateExcelAttachment(summary: SyncSummary): Uint8Array {
  const workbook = XLSX.utils.book_new();

  const summaryData = [
    ["CRM TO UMBRACO SYNC REPORT"],
    [""],
    ["Sync Date", summary.syncDate],
    [""],
    ["SUMMARY"],
    ["Metric", "Count"],
    ["Total Events Updated", summary.updatedEvents.length],
    ["Total Events Created", summary.createdEvents.length],
    [
      "Total Events Processed",
      summary.updatedEvents.length + summary.createdEvents.length,
    ],
    ["Total Failed Events", summary.failedEvents.length],
    [""],
    ["STATUS"],
    summary.failedEvents.length === 0
      ? ["Sync Status", "✓ All events synced successfully"]
      : ["Sync Status", `⚠ ${summary.failedEvents.length} event(s) failed`],
  ];

  if (summary.updatedEvents.length > 0) {
    summaryData.push([""], ["UPDATED EVENTS"]);
    summaryData.push(["Event Name"]);
    summary.updatedEvents.forEach((e) => {
      summaryData.push([e.title]);
    });
  }

  if (summary.createdEvents.length > 0) {
    summaryData.push([""], ["CREATED EVENTS"]);
    summaryData.push(["Event Name"]);
    summary.createdEvents.forEach((e) => {
      summaryData.push([e.title]);
    });
  }

  if (summary.failedEvents.length > 0) {
    summaryData.push([""], ["FAILED EVENTS"]);
    summaryData.push(["Event Name", "Event ID", "Error"]);
    summary.failedEvents.forEach((e) => {
      summaryData.push([e.title, e.eventId, e.error]);
    });
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  summarySheet["!cols"] = [{ wch: 40 }, { wch: 15 }, { wch: 20 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

  if (summary.updatedEvents.length > 0) {
    const updatedData = [
      [
        "Event Name",
        "Event ID",
        "Start Date",
        "End Date",
        "Location",
        "Event Type",
        "Organiser",
      ],
      ...summary.updatedEvents.map((e) => [
        e.title,
        e.eventId,
        e.startDate || "N/A",
        e.endDate || "N/A",
        e.location || "N/A",
        e.eventType || "N/A",
        e.eventOrganiser || "N/A",
      ]),
    ];
    const updatedSheet = XLSX.utils.aoa_to_sheet(updatedData);
    XLSX.utils.book_append_sheet(workbook, updatedSheet, "Updated Events");
  }

  if (summary.createdEvents.length > 0) {
    const createdData = [
      [
        "Event Name",
        "Event ID",
        "Start Date",
        "End Date",
        "Location",
        "Event Type",
        "Organiser",
      ],
      ...summary.createdEvents.map((e) => [
        e.title,
        e.eventId,
        e.startDate || "N/A",
        e.endDate || "N/A",
        e.location || "N/A",
        e.eventType || "N/A",
        e.eventOrganiser || "N/A",
      ]),
    ];
    const createdSheet = XLSX.utils.aoa_to_sheet(createdData);
    XLSX.utils.book_append_sheet(workbook, createdSheet, "Created Events");
  }

  if (summary.failedEvents.length > 0) {
    const failedData = [
      [
        "Event Name",
        "Event ID",
        "Start Date",
        "End Date",
        "Location",
        "Event Type",
        "Organiser",
        "Error Message",
      ],
      ...summary.failedEvents.map((e) => [
        e.title,
        e.eventId,
        e.startDate || "N/A",
        e.endDate || "N/A",
        e.location || "N/A",
        e.eventType || "N/A",
        e.eventOrganiser || "N/A",
        e.error,
      ]),
    ];
    const failedSheet = XLSX.utils.aoa_to_sheet(failedData);
    XLSX.utils.book_append_sheet(workbook, failedSheet, "Failed Events");
  }

  // Write to buffer
  const excelBuffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
  return new Uint8Array(excelBuffer);
}

export async function sendSyncNotificationEmail(
  env: Env,
  summary: SyncSummary
): Promise<void> {
  try {
    console.log("📧 Preparing to send notification email...");
    console.log(`📧 From: ${env.NOTIFICATION_FROM_EMAIL}`);
    console.log(`📧 To: ${env.NOTIFICATION_EMAIL}`);
    console.log(`📧 Mailgun URL: ${env.MAILGUN_API_BASE_URL}/messages`);

    const totalProcessed =
      summary.updatedEvents.length + summary.createdEvents.length;

    const emailBody = buildEmailBody(summary);
    console.log("📊 Generating Excel attachment...");
    const excelBuffer = generateExcelAttachment(summary);
    const excelBlob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const formData = new FormData();
    formData.append("from", env.NOTIFICATION_FROM_EMAIL);
    formData.append("to", env.NOTIFICATION_EMAIL);
    formData.append(
      "subject",
      `CRM to Umbraco Sync Report - ${totalProcessed} Events Processed`
    );
    formData.append("html", emailBody);
    formData.append(
      "attachment",
      excelBlob,
      `sync-report-${new Date().toISOString().split("T")[0]}.xlsx`
    );
    console.log("📧 Sending request to Mailgun...");
    const response = await fetch(`${env.MAILGUN_API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${env.MAILGUN_API_KEY}`)}`,
      },
      body: formData,
    });
    console.log(`📧 Mailgun response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`📧 Mailgun error response: ${errorText}`);
      throw new Error(`Mailgun API error: ${response.status} - ${errorText}`);
    }
    const responseData: any = await response.json();
    console.log("✅ Notification email sent successfully");
    console.log(`📧 Message ID: ${responseData.id}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Failed to send notification email:", errorMessage);
    throw error;
  }
}

function buildEmailBody(summary: SyncSummary): string {
  const totalProcessed =
    summary.updatedEvents.length + summary.createdEvents.length;
  const totalFailed = summary.failedEvents.length;

  let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #0066cc;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #0066cc;
    }
    .event-list {
      list-style: none;
      padding: 0;
    }
    .event-item {
      padding: 10px;
      margin: 5px 0;
      background-color: #f9f9f9;
      border-left: 3px solid #0066cc;
    }
    .event-item.created {
      border-left-color: #28a745;
    }
    .event-item.failed {
      border-left-color: #dc3545;
      background-color: #fff5f5;
    }
    .event-title {
      font-weight: bold;
    }
    .event-id {
      color: #666;
      font-size: 14px;
    }
    .error-message {
      color: #dc3545;
      font-size: 14px;
      margin-top: 5px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CRM to Umbraco Sync Report</h1>
    <p>Sync Date: ${summary.syncDate}</p>
  </div>

  <div class="summary">
    <h2>Summary</h2>
    <div class="summary-item">
      <span>Total Events Processed:</span>
      <strong>${totalProcessed}</strong>
    </div>
    <div class="summary-item">
      <span>Events Updated:</span>
      <strong>${summary.updatedEvents.length}</strong>
    </div>
    <div class="summary-item">
      <span>Events Created:</span>
      <strong>${summary.createdEvents.length}</strong>
    </div>
    ${
      totalFailed > 0
        ? `
    <div class="summary-item" style="color: #dc3545;">
      <span>Failed Events:</span>
      <strong>${totalFailed}</strong>
    </div>
    `
        : ""
    }
  </div>
`;

  if (summary.updatedEvents.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">Updated Events (${summary.updatedEvents.length})</div>
    <ul class="event-list">
`;
    summary.updatedEvents.forEach((event) => {
      html += `
      <li class="event-item">
        <div class="event-title">${event.title}</div>
        <div class="event-id">Event ID: ${event.eventId}</div>
      </li>
`;
    });
    html += `
    </ul>
  </div>
`;
  }

  if (summary.createdEvents.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">Created Events (${summary.createdEvents.length})</div>
    <ul class="event-list">
`;
    summary.createdEvents.forEach((event) => {
      html += `
      <li class="event-item created">
        <div class="event-title">${event.title}</div>
        <div class="event-id">Event ID: ${event.eventId}</div>
      </li>
`;
    });
    html += `
    </ul>
  </div>
`;
  }

  if (summary.failedEvents.length > 0) {
    html += `
  <div class="section">
    <div class="section-title">Failed Events (${summary.failedEvents.length})</div>
    <ul class="event-list">
`;
    summary.failedEvents.forEach((event) => {
      html += `
      <li class="event-item failed">
        <div class="event-title">${event.title}</div>
        <div class="event-id">Event ID: ${event.eventId}</div>
        <div class="error-message">Error: ${event.error}</div>
      </li>
`;
    });
    html += `
    </ul>
  </div>
`;
  }

  html += `
  <div class="footer">
    <p>This is an automated notification from the CRM to Umbraco sync service.</p>
  </div>
</body>
</html>
`;

  return html;
}
