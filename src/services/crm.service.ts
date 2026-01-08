import type { Env, CrmEvent, ServiceResponse } from "../types/events.types";

export async function fetchCrmEvents(
  env: Env
): Promise<ServiceResponse<CrmEvent[]>> {
  try {
    const response = await fetch(env.CRM_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": env.OCP_APIM_SUBSCRIPTION_KEY,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data: CrmEvent[] = await response.json();
    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("❌ Fetch failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}
