import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth"; // ✅ simpler import
import { authOptions } from "@/lib/auth";

const f = createUploadthing({ access: "public" });

export const ourFileRouter = {
  templatePreview: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "50MB" },
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
