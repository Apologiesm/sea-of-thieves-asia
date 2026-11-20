import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { GuideForm } from "@/components/content/GuideForm";
import { requireModerator } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Write a guide" };

export default async function NewGuidePage() {
  if (!await requireModerator()) redirect("/login");
  return (
    <>
      <PageHeader eyebrow="Knowledge base" title="Write a guide" description="Markdown is supported. All content is rendered safely as React elements." />
      <Container><div className="max-w-4xl py-12"><GuideForm /></div></Container>
    </>
  );
}
