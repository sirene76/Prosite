import { createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  templateFiles: f({
    "text/html": { maxFileSize: "2MB" },
    "text/css": { maxFileSize: "2MB" },
    "text/javascript": { maxFileSize: "2MB" },
    "application/json": { maxFileSize: "1MB" },
    "image/*": { maxFileSize: "5MB" },
  }).onUploadComplete(({ file }) => {
    console.log("✅ Uploaded template file:", file.ufsUrl ?? file.url);
    return { url: file.ufsUrl ?? file.url };
  }),
  // For template thumbnail or image fields
  templateImage: f({ image: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      console.log("✅ Uploaded image:", file.ufsUrl ?? file.url);
      return { url: file.ufsUrl ?? file.url };
    }),

  // For template preview or video fields
  templateVideo: f({ video: { maxFileSize: "50MB" } })
    .onUploadComplete(({ file }) => {
      console.log("✅ Uploaded video:", file.ufsUrl ?? file.url);
      return { url: file.ufsUrl ?? file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
