import PlanStartForm from "@/components/start/PlanStartForm";
import { getStartFlowContext } from "@/lib/paladin/startFlow";
import { saveStarterIntent } from "@/app/start/actions";

type StartStarterPageProps = {
  searchParams: Promise<{
    error?: string;
    hipaa?: string;
  }>;
};

export default async function StartStarterPage({
  searchParams,
}: StartStarterPageProps) {
  const { organization, user } = await getStartFlowContext("/start/starter");
  const params = await searchParams;

  return (
    <PlanStartForm
      action={saveStarterIntent}
      contactEmail={user.email}
      errorMessage={getErrorMessage(params.error)}
      initialHipaaEnabled={params.hipaa === "1"}
      organizationName={organization.name}
      plan="starter"
      savedIntent={organization.acquisitionIntent}
    />
  );
}

function getErrorMessage(error: string | undefined) {
  if (error === "industry") {
    return "Select a valid industry or leave it blank.";
  }

  return "";
}
