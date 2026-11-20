import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { GuideForm } from "@/components/content/GuideForm";
import { getGuide } from "@/lib/m8/queries";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Edit guide" };

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!await requireModerator()) redirect("/login");
  const guide = await getGuide(id);
  if (!guide) notFound();

  return (
    <>
      <PageHeader eyebrow="Knowledge base" title="Edit guide" description="Changes are server-authorized and audit-logged." />
      <Container><div className="max-w-4xl py-12"><GuideForm guide={guide} /></div></Container>
    </>
  );
}
