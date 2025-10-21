import { deployWebsite } from "@/lib/deployWebsite";

export async function enqueueDeployJob(websiteId: string) {
  console.log(`[Queue] Processing deploy for ${websiteId}`);
  try {
    await deployWebsite(websiteId);
  } catch (err) {
    console.error("❌ Deploy error:", err);
  }
}
