import { auth } from "@/auth";
import GuestStarterForm from "@/components/start/GuestStarterForm";
import PlanStartForm from "@/components/start/PlanStartForm";
import { getSupportEmail } from "@/lib/paladin/env";
import { saveStarterIntent } from "@/app/start/actions";
import { getCheckoutUserContext } from "@/lib/stripe/checkout";

type StartStarterPageProps = {
  searchParams: Promise<{
    checkout?: string;
    error?: string;
  }>;
};

export default async function StartStarterPage({
  searchParams,
}: StartStarterPageProps) {
  const params = await searchParams;
  const session = await auth();
  const userContext = session?.user?.email
    ? await getCheckoutUserContext(session.user.email)
    : null;

  // Signed-in members with an organization keep the existing flow.
  if (userContext?.organization) {
    return (
      <PlanStartForm
        action={saveStarterIntent}
        contactEmail={userContext.user.email}
        errorMessage={getErrorMessage(params.error)}
        organizationName={userContext.organization.name}
        plan="starter"
        savedIntent={userContext.organization.acquisitionIntent}
      />
    );
  }

  // Everyone else buys as a guest; the account is created after payment.
  return (
    <GuestStarterForm
      canceled={params.checkout === "cancel"}
      supportEmail={getSupportEmail()}
    />
  );
}

function getErrorMessage(error: string | undefined) {
  if (error === "industry") {
    return "Select a valid industry or leave it blank.";
  }

  return "";
}
