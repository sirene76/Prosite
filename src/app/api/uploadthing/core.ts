import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth"; // ✅ simpler import
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  templateFiles: f({
    "image/png": { maxFileSize: "8MB" },
    "image/jpeg": { maxFileSize: "8MB" },
    "image/gif": { maxFileSize: "8MB" },
    "video/mp4": { maxFileSize: "64MB" },
    "video/webm": { maxFileSize: "64MB" },
    "text/html": { maxFileSize: "2MB" },
    "text/css": { maxFileSize: "2MB" },
    "application/json": { maxFileSize: "1MB" },
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
      console.log("✅ Uploaded:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
