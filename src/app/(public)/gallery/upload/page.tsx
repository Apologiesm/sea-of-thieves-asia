import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-header";
import { UploadForm } from "@/components/content/UploadForm";
import { requireUser } from "@/lib/m8/auth";

export const metadata: Metadata = { title: "Upload to gallery" };

export default async function UploadPage() {
  if (!await requireUser()) redirect("/login");
  return (
    <>
      <PageHeader eyebrow="Gallery" title="Upload media" description="Uploads are private until a moderator approves them." />
      <Container><div className="max-w-2xl py-12"><Card><UploadForm /></Card></div></Container>
    </>
  );
}
