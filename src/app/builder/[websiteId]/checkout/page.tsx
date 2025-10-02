import { redirect } from "next/navigation";

export default function BuilderCheckoutRedirect({ params }: { params: { websiteId: string } }) {
  redirect(`/checkout/${params.websiteId}`);
}
