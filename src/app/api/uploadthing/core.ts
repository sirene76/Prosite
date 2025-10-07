import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth"; // ✅ simpler import
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  templateAssets: f({
    image: { maxFileSize: "8MB" },
    video: { maxFileSize: "64MB" },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        console.error("❌ Unauthorized upload attempt");
        throw new Error("Unauthorized");
      }

      return { userId: session.user.email ?? "unknown" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("✅ File uploaded by:", metadata.userId);
      console.log("✅ File URL:", file.url);
      return { fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
