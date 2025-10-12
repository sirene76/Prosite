import { createRouteHandler, createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // For template thumbnail or image fields
  templateImage: f({ image: { maxFileSize: "8MB" } })
    .onUploadComplete(({ file }) => {
      console.log("✅ Uploaded image:", file.url);
      return { url: file.url };
    }),

  // For template preview or video fields
  templateVideo: f({ video: { maxFileSize: "50MB" } })
    .onUploadComplete(({ file }) => {
      console.log("✅ Uploaded video:", file.url);
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
