import { ClosureEntry } from "@/components/public/ClosureNotice";
import { PublicShell } from "@/components/public/PublicShell";
import { RecruitmentClient } from "@/components/public/RecruitmentClient";

function WorkWithUsPage() {
  return (
    <PublicShell compactTypography={false}>
      <RecruitmentClient />
    </PublicShell>
  );
}

export default function Page() { return <ClosureEntry><WorkWithUsPage /></ClosureEntry>; }
