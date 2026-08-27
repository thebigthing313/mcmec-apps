import { Lock, UserRoundX } from "lucide-react";
import type * as React from "react";
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
 * The primary action goes to Central rather than offering a retry, because Central is the one
 * application every employee has, and it carries the switcher that lists the ones they can
 * actually open.
 */
export function AppRoleRequired({
	appName,
	centralUrl,
	onSignOut,
	roleLabel,
}: {
	/** The application that refused, e.g. "Website Management". */
	appName: string;
	/** Absolute URL of the Central app, from `@mcmec/lib/constants/apps`. */
	centralUrl: string;
	/**
	 * Offered alongside Central because the likeliest cause of this screen is the wrong account.
	 * Without it the only exit was Central, which the same account also lands in — so someone
	 * signed in as the wrong person had no way back to a sign-in form from inside the app.
	 */
	onSignOut?: () => void;
	/** The App Role's user-facing label, e.g. "Website" — never the permission string. */
	roleLabel: string;
}) {
	return (
		<AccessNotice
			actions={
				<>
					<Button asChild>
						<a href={centralUrl}>Go to Central</a>
					</Button>
					{onSignOut ? (
						<Button onClick={onSignOut} variant="outline">
							Sign out
						</Button>
					) : null}
				</>
			}
			explanation={`${appName} requires the ${roleLabel} App Role, and your account does not have it.`}
			heading={`You do not have access to ${appName}`}
			icon={<Lock />}
			remedy="Someone with the Users App Role can grant it to you in the Admin application."
		/>
	);
}

/**
 * Shown when a sign-in succeeds but the account is not linked to an Employee record.
 *
 * Distinct from a missing App Role and worth its own screen: no role would help, because the
 * applications read a person's name, title and permissions off the Employee, so there is nothing
 * to sign in as. Signing out is the only action that can change the outcome from this side —
 * the account may simply be the wrong one — so it is the only action offered.
 */
export function OnboardingRequired({ onSignOut }: { onSignOut?: () => void }) {
	return (
		<AccessNotice
			actions={
				onSignOut ? (
					<Button onClick={onSignOut} variant="outline">
						Sign out
					</Button>
				) : null
			}
			explanation="Your sign-in worked, but the account is not linked to an employee record yet. The staff applications read your name, title and permissions from that record."
			heading="Your account is not linked to an employee record"
			icon={<UserRoundX />}
			remedy="Someone with the Employees App Role can link it to you in the HR application."
		/>
	);
}
