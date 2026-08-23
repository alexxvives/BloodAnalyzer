import { HomeView } from "@/components/home/HomeView";
import { Page, PageBody, PageHeader } from "@/components/layout/Page";

export default function AppHomePage() {
  return (
    <Page>
      <PageHeader
        eyebrow="Home"
        title="Your biomarkers"
        description="Progress across every confirmed blood analytic"
      />
      <PageBody>
        <HomeView />
      </PageBody>
    </Page>
  );
}
