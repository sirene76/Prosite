import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  templateMedia: f({ image: { maxFileSize: "8MB" }, video: { maxFileSize: "50MB" } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session) throw new Error("Unauthorized");
      return { userId: session.user?.email || "unknown" };
    })
    .onUploadComplete(({ file, metadata }) => {
      console.log("Uploaded file", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
