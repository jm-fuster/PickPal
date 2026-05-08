import { redirect } from "next/navigation";

export default async function EditPersonRedirect({
  params,
}: {
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  redirect(`/seres-queridos/${personId}`);
}
