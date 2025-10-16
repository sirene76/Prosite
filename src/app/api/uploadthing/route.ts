import { createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  templateFiles: f({
    "text/html": { maxFileSize: "4MB" },
    "text/css": { maxFileSize: "4MB" },
    "application/javascript": { maxFileSize: "4MB" },
    "text/javascript": { maxFileSize: "4MB" },
    "application/json": { maxFileSize: "2MB" },
    "image/*": { maxFileSize: "10MB" },
  }).onUploadComplete(({ file }) => {
    if (!file.ufsUrl) {
      throw new Error("UploadThing did not return a file URL for template file");
    }
    console.log("✅ Uploaded template file:", file.ufsUrl);
    return { url: file.ufsUrl };
  }),
  // For template thumbnail or image fields
  templateImage: f({ image: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      if (!file.ufsUrl) {
        throw new Error("UploadThing did not return a file URL for image upload");
      }
      console.log("✅ Uploaded image:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),

  // For template preview or video fields
  templateVideo: f({ video: { maxFileSize: "50MB" } })
    .onUploadComplete(({ file }) => {
      if (!file.ufsUrl) {
        throw new Error("UploadThing did not return a file URL for video upload");
      }
      console.log("✅ Uploaded video:", file.ufsUrl);
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
