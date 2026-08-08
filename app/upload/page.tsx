import { Page, PageBody, PageHeader } from "@/components/layout/Page";
import { UploadFlow } from "@/components/upload/UploadFlow";

export default function UploadPage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Upload"
        title="Import results"
        description="PDF, image or CSV. You review every extracted value before anything is saved — text-layer PDFs from a digital lab download work best, in Spanish or English."
      />
      <PageBody width="narrow">
        <UploadFlow />
        <p className="mt-10 text-xs text-muted">
          Uploaded files are sensitive health data. Authenticated uploads are
          stored under your user-scoped R2 key and linked to the saved report.
        </p>
      </PageBody>
    </Page>
  );
}
