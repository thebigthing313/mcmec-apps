import { ErrorMessages } from "@mcmec/lib/constants/errors";
import { Lock, UserRoundX } from "lucide-react";
import type * as React from "react";
import { toast } from "sonner";
import { Button } from "../components/button";
import { Card, CardContent } from "../components/card";

/**
 * The shared frame for the two ways a staff application can correctly refuse someone.
 *
 * Deliberately not `ErrorDisplay`. That component opens with "Sorry about that!", puts the
 * message inside a destructive-red alert headed "An Error Has Occurred", and offers "Try Again"
 * as its primary action. Every one of those is wrong here: nothing went wrong, nothing is red,
 * and trying again re-runs the same permission check and refuses again — forever. An access
 * boundary is the system working, and it should look like a rule rather than a crash.
 *
 * So: no alert, no red, no retry. Ink on paper, a muted glyph, the reason stated plainly, and
 * the one action that actually moves the person forward.
 */
/**
 * Runs a sign-out handler that may be async without dropping its promise.
 *
 * Every call site passes an `async` arrow that awaits `signOut(...)` and then navigates. Called
 * bare from `onClick`, a rejection — an expired session, a network blip — became an unhandled
 * rejection, and the person sat on this screen with no feedback and no sign the click had done
 * anything. That matters most here: signing out is the only action on this screen that can change
 * the outcome.
 */
function runSignOut(onSignOut: () => void | Promise<void>) {
	void Promise.resolve(onSignOut()).catch(() => {
		toast.error(ErrorMessages.SERVER.INTERNAL_ERROR);
	});
}

function AccessNotice({
	actions,
	explanation,
	heading,
	icon,
	remedy,
}: {
	actions?: React.ReactNode;
	explanation: string;
	heading: string;
	icon: React.ReactNode;
	remedy: string;
}) {
	// Padded rather than viewport-centred. `min-h-screen` with centring puts the card in the middle
	// of the window, which at 200% zoom means scrolling down past an empty half-screen to reach the
	// only content on the page.
	return (
		<div className="flex justify-center p-6 pt-16">
			<Card className="w-full max-w-lg">
				<CardContent className="flex flex-col items-start gap-4">
					<span
						aria-hidden
						className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground [&>svg]:size-5"
					>
						{icon}
					</span>
					{/* h1: on these screens the notice is the entire page, not a section of one. */}
					<h1 className="font-semibold text-foreground text-xl leading-tight">
						{heading}
					</h1>
					<p className="text-base text-foreground leading-relaxed">
						{explanation}
					</p>
					<p className="text-muted-foreground text-sm leading-relaxed">
						{remedy}
					</p>
					{actions ? (
						<div className="flex flex-wrap gap-2 pt-2">{actions}</div>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}

/**
 * Shown when someone signed in successfully but lacks the App Role a staff application requires.
 *
 * The copy names the App Role rather than the underlying permission string, because "the Website
 * App Role" is the thing an administrator grants and `manage_website` is an implementation
 * detail the person reading this cannot act on. It also names who can grant it: a refusal that
 * does not say who to ask is a dead end with better manners.
 *
 * The primary action goes to the Self Service Portal rather than offering a retry, because it is
 * the one App every employee has, and it carries the switcher that lists the ones they can
 * actually open.
 *
 * The link is injected the way `Layout.Breadcrumb` injects it, so `@mcmec/ui` stays free of a
 * router: `central` passes its router `Link` and `to="/"`, and an app on another origin passes
 * no `LinkComponent` and an absolute `to`, which renders as a plain anchor.
 */
export function AppRoleRequired<
	TLinkProps extends { to: string; children?: React.ReactNode } = {
		to: string;
		children?: React.ReactNode;
	},
>({
	appName,
	LinkComponent,
	onSignOut,
	roleLabel,
	to,
}: {
	/** The App that refused, e.g. "Website Management". */
	appName: string;
	/** The router's link component. Omitted, the action is a plain `<a href={to}>`. */
	LinkComponent?: React.ComponentType<TLinkProps>;
	/**
	 * Offered alongside the Self Service Portal because the likeliest cause of this screen is the
	 * wrong account. Without it the only exit was the portal, which the same account also lands
	 * in — so someone signed in as the wrong person had no way back to a sign-in form.
	 */
	onSignOut?: () => void | Promise<void>;
	/** The App Role's user-facing label, e.g. "Website" — never the permission string. */
	roleLabel: string;
	/** Where the Self Service Portal is: `/` inside `central`, an absolute URL elsewhere. */
	to: string;
}) {
	const label = "Go to the Self Service Portal";
	return (
		<AccessNotice
			actions={
				<>
					<Button asChild>
						{LinkComponent ? (
							<LinkComponent {...({ to } as TLinkProps)}>{label}</LinkComponent>
						) : (
							<a href={to}>{label}</a>
						)}
					</Button>
					{onSignOut ? (
						<Button onClick={() => runSignOut(onSignOut)} variant="outline">
							Sign out
						</Button>
					) : null}
				</>
			}
			explanation={`${appName} requires the ${roleLabel} App Role, and your account does not have it.`}
			heading={`You do not have access to ${appName}`}
			icon={<Lock />}
			remedy="Someone with the Users App Role can grant it to you in Admin."
		/>
	);
}

/**
 * Shown when a sign-in succeeds but the account is not linked to an Employee record.
 *
 * Distinct from a missing App Role and worth its own screen: no role would help, because every
 * App reads the signed-in person off their Employee, so there is nothing to sign in as. Signing
 * out is the only action that can change the outcome from this side — the account may simply be
 * the wrong one — so it is the only action offered.
 */
export function EmployeeRequired({
	onSignOut,
}: {
	onSignOut?: () => void | Promise<void>;
}) {
	return (
		<AccessNotice
			actions={
				onSignOut ? (
					<Button onClick={() => runSignOut(onSignOut)} variant="outline">
						Sign out
					</Button>
				) : null
			}
			explanation="Your sign-in worked, but the account is not linked to an employee record yet, and nothing here can be opened without one."
			heading="Your account is not linked to an employee record"
			icon={<UserRoundX />}
			remedy="Someone with the Employees App Role can link it to you in HR."
		/>
	);
}
