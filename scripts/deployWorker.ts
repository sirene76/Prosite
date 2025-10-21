import { deployWebsite } from "@/lib/deployWebsite";

const websiteId = process.argv[2];

if (!websiteId) {
  console.error("Usage: pnpm tsx scripts/deployWorker.ts <websiteId>");
  process.exit(1);
}

deployWebsite(websiteId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Deploy failed:", err);
    process.exit(1);
  });
