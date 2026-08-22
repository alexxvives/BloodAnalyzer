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
      </PageBody>
    </Page>
  );
}
