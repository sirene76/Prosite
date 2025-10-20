import { connectDB } from "@/lib/mongodb";
import Website from "@/models/Website";

export async function enqueueDeployJob(websiteId: string) {
  console.log(`[Queue] Enqueuing deploy job for website ${websiteId}`);
  // For now we simply mark a flag — actual worker comes later.
  await connectDB();
  await Website.findByIdAndUpdate(websiteId, { status: "deploying" });
  // Simulate queue record
  return { queued: true, websiteId };
}
