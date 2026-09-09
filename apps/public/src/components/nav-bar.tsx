import { logo192 } from "@mcmec/lib/constants/assets";
import { Button } from "@mcmec/ui/components/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@mcmec/ui/components/collapsible";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@mcmec/ui/components/popover";
import { Separator } from "@mcmec/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@mcmec/ui/components/sheet";
import { cn } from "@mcmec/ui/lib/utils";
import { Link, type LinkProps, useLocation } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

type MenuSubItem = {
	title: string;
	linkProps: LinkProps;
	description?: string;
};

type MenuItem = {
	title: string;
	linkProps?: LinkProps;
	subItems?: MenuSubItem[];
};

const menuItems: MenuItem[] = [
	{ linkProps: { to: "/" }, title: "Home" },
	{
		subItems: [
			{
				description: "Our purpose and goals.",
				linkProps: { to: "/about/mission-statement" },
				title: "Mission Statement",
			},
			{
				description: "Meet our board of commissioners.",
				linkProps: { to: "/about/leadership" },
				title: "Leadership",
			},
		],
		title: "About",
	},
	{
		subItems: [
			{
				description:
					"Report a mosquito problem, water management issue, or request mosquitofish here.",
				linkProps: { to: "/contact/service-request" },
				title: "Service Requests",
			},
			{
				description:
					"Questions about our program, surveillance, spray schedules, or anything else.",
				linkProps: { to: "/contact/contact-us" },
				title: "General Inquiries",
			},
		],
		title: "Contact",
	},
	{
		subItems: [
			{
				description: "Meeting schedules, agenda, and minutes.",
				linkProps: { to: "/notices/meetings" },
				title: "Public Meetings",
			},
			{
				description: "Notices that are still currently in effect.",
				linkProps: { to: "/notices" },
				title: "Legal Notices",
			},
			{
				description: "Previous legal notices that are no longer active.",
				linkProps: { to: "/notices/archive" },
				title: "Archived Notices",
			},
			{
				description:
					"Budgets, financial reports, audits, and consultant disclosures.",
				linkProps: { to: "/notices/transparency" },
				title: "Transparency",
			},
		],
		title: "Public Notices",
	},
	{
		subItems: [
			{
				description: "Overview of our mosquito control methods.",
				linkProps: { to: "/mosquito-control/how-we-control-mosquitoes" },
				title: "How We Control Mosquitoes",
			},
			{
				description: "Insecticides and other products we commonly use.",
				linkProps: { to: "/mosquito-control/mosquito-control-products" },
				title: "Mosquito Control Products",
			},
			{
				description:
					"Public notice for upcoming adult mosquito control treatments.",
				linkProps: { to: "/mosquito-control/spray-notice" },
				title: "Public Notice for Adult Mosquito Control Treatment",
			},
			{
				description: "View upcoming mosquito spray missions.",
				linkProps: { to: "/mosquito-control/spray-schedule" },
				title: "Spray Schedule",
			},
			{
				description: "Notice for aerial larviciding operations.",
				linkProps: { to: "/mosquito-control/aerial-larviciding-notice" },
				title: "Aerial Larviciding Notice",
			},
		],
		title: "Mosquito Control",
	},
	{
		subItems: [
			{
				description: "Weekly mosquito activity reports for the county.",
				linkProps: { to: "/mosquito-surveillance/weekly-activity" },
				title: "Weekly Mosquito Activity",
			},
			{
				description: "Checklist for identifying mosquito breeding sources.",
				linkProps: { to: "/mosquito-surveillance/mosquito-source-checklist" },
				title: "Mosquito Source Checklist",
			},
			{
				description: "Municipal mosquito surveillance data packets.",
				linkProps: { to: "/mosquito-surveillance/municipal-packet" },
				title: "Municipal Packet",
			},
		],
		title: "Mosquito Surveillance",
	},
	{
		linkProps: { to: "/job-opportunities" },
		title: "Job Opportunities",
	},
];

/**
 * A group is current when the visitor is anywhere inside one of its children — the same rule
 * the staff rail uses. Prefix matching is what a group needs and `aria-current` cannot give it:
 * a group's trigger is a button, and a button never carries the attribute a `Link` does, so
 * without this the bar shows nothing at all on `/notices/archive`.
 *
 * Shared by the desktop popover and the mobile sheet. It was computed inside `NavPopover` and
 * nowhere else, which is exactly how the two breakpoints came to disagree about whether the
 * header knows where you are.
 */
function isGroupActive(item: MenuItem, pathname: string) {
	return (
		item.subItems?.some((subItem) => {
			const to = subItem.linkProps.to;
			return typeof to === "string" && pathname.startsWith(to);
		}) ?? false
	);
}

export function Navbar() {
	return (
		/*
		 * A real `<header>`, so the site has a `banner` landmark. It had none: the bar was two
		 * sibling `<div>`s, and a screen-reader rotor listed four unlabelled `navigation`
		 * regions and no banner at all.
		 *
		 * The sheet/bar handover is at `lg`, not `md`. The desktop bar's intrinsic width is
		 * 842px and it was taking over at 768, so the document scrolled horizontally from
		 * 768px to 856px on every page — a WCAG 1.4.10 Reflow failure that also lands on a
		 * 1536px desktop at 200% zoom, which is how a resident who needs magnification reads.
		 *
		 * **The stick belongs here, not on the bars.** Both bars carried `sticky top-0 z-50`
		 * and neither one stuck: a sticky element is clamped to its parent's box, and each
		 * bar's parent was the breakpoint wrapper directly around it — 64px of parent around
		 * 64px of child, so the travel range was zero and the bar scrolled away like static
		 * content. On the archive, the spray schedule and Transparency, the only way back to
		 * the menu was to scroll to the top of the document.
		 *
		 * On `<header>` the containing block is the shell's `min-h-screen flex-col`, which has
		 * the height for it, and one declaration covers both breakpoints. `z-50` still clears
		 * the home hero's `z-30` control plaque.
		 */
		<header className="sticky top-0 z-50">
			{/*
			 * One masthead at every width. At `lg` it is two bands: the identity rail, then the
			 * seven groups on a Commission Green tier. Below `lg` the Menu button moves into the
			 * rail and that second band goes entirely — a 56px strip holding one button is 56px
			 * of a sticky header charged against a phone viewport for the whole visit, and the
			 * rail had the room for it either way.
			 *
			 * The rail itself used to be desktop-only, which cost a phone visitor the seal, the
			 * agency's name and its one-line description, and left the two form factors with
			 * different information architectures.
			 */}
			<IdentityRail />
			<div className="hidden lg:block">
				<WebNavBar />
			</div>
		</header>
	);
}

// Hover and focus darken the green rather than lightening it. The tint here used to be
// `accent/40`, a pale teal laid over Commission Green, which lifted the ground and took the
// white label from 4.62:1 at rest to 3.96:1 — so pointing at a nav link, or tabbing to it,
// was the one interaction on the page that pushed it under AA. Ink at 15% moves the same
// distance visually in the other direction and reads 5.56:1.
//
// The focus ring inverts here, and this is the rule rather than the exception's exception.
// `--ring` is a dark green measured against every light ground in the system; on Commission
// Green it lands at 2.06:1. The pale foreground reads 4.62:1 on the same ground. A focus
// indicator has to contrast with what it is drawn on, so a mid-tone or darker ground takes
// the pale ring — the same shape as the hover rule directly above.
//
// The active state is `aria-current`, which TanStack already emits on the matching link. It
// was emitted and never painted: assistive technology was told the location and a sighted
// visitor was not. Ink at 25% reads 5.50:1 under the label and darkens rather than lightens,
// for the reason the hover comment gives.
const navLinkClass =
	"inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-2 py-1.5 font-semibold text-primary-foreground text-sm uppercase tracking-wide outline-none transition-[color,box-shadow] hover:bg-foreground/15 focus:bg-foreground/15 focus-visible:ring-[3px] focus-visible:ring-primary-foreground aria-[current]:bg-foreground/25 data-[active=true]:bg-foreground/25";

/*
 * Two tiers. The seal needs a light ground to be readable at all — its disc is
 * transparent, so on Commission Green the arced lettering sat straight on the green
 * and dissolved. The old white "puck" was a crude version of this fix, shaped to hide
 * the square white tile that `logo-mark-128.png` bakes in. `logo192` is the mark
 * alone, and 192px keeps it crisp at 80px on a 2x display.
 */
function IdentityRail() {
	return (
		<div className="flex items-center justify-between gap-4 border-b bg-background px-[clamp(1rem,3vw,3rem)] py-2 sm:gap-6 sm:py-3 lg:h-26 lg:py-0">
			<Link className="flex items-center gap-4" to="/">
				<img
					alt="MCMEC Logo"
					className="h-12 w-auto sm:h-16 lg:h-20"
					src={logo192}
				/>
				{/*
				 * Short name below `sm`, the same shortening the auth frame's masthead already
				 * does. Beside the Menu button a phone leaves the name about 200px, and the full
				 * name breaks over four lines there — which is what set the rail's height rather
				 * than the seal did. The full name follows as `sr-only`, so the accessible name
				 * still spells the agency out and still opens with the visible label.
				 */}
				<span className="font-bold text-base uppercase tracking-wide sm:hidden">
					MCMEC
					<span className="sr-only">
						{" "}
						Middlesex County Mosquito Extermination Commission
					</span>
				</span>
				<span className="hidden flex-col leading-tight sm:flex">
					<span className="font-bold text-sm uppercase tracking-wide lg:text-base">
						Middlesex County
					</span>
					<span className="font-semibold text-muted-foreground text-sm uppercase tracking-wide lg:text-base">
						Mosquito Extermination Commission
					</span>
				</span>
			</Link>
			<span className="hidden text-right font-semibold text-[0.625rem] text-muted-foreground uppercase leading-relaxed tracking-[0.16em] md:block lg:text-xs">
				{/*
				 * Hidden below `sm`. The whole masthead is sticky, so every pixel of it is charged
				 * against the viewport for the rest of the visit — three lines of standfirst took the
				 * header to 198px on a 320px-tall-by-568 phone, better than a third of the screen,
				 * permanently. The seal and the agency's name stay at every width, which is the part
				 * a visitor needs; this is the sentence that can wait for a wider screen.
				 *
				 * The three lines are forced, not wrapped. At `0.16em` the sentence runs about
				 * 740px unbroken, and letting it find its own breaks at a capped measure put
				 * "community" and "from" in places that read as two different clauses. Each
				 * `{" "}` is load-bearing: a block boundary is a visual break, not a textual
				 * one, so without them the accessible name runs the lines together as words.
				 */}
				<span className="block">Advancing public health</span>{" "}
				<span className="block">and protecting our community</span>{" "}
				<span className="block">from mosquitoes since 1914</span>
			</span>
			<div className="lg:hidden">
				<MobileNavBar />
			</div>
		</div>
	);
}

/*
 * The seven groups need 959px on one line at this size, measured rather than
 * guessed. Giving the nav its own tier is what buys that at `lg`; a single row
 * carrying the seal as well needs 1063px and would not fit until `xl`.
 */
function WebNavBar() {
	return (
		<div className="flex h-14 items-center bg-primary px-[clamp(1.5rem,3vw,3rem)]">
			<nav
				aria-label="Main"
				className="flex flex-1 flex-row flex-nowrap items-center gap-0.5"
			>
				{menuItems.map((item) =>
					item.subItems ? (
						<NavPopover item={item} key={item.title} />
					) : (
						<Link
							className={navLinkClass}
							key={item.title}
							to={item.linkProps?.to}
						>
							{item.title}
						</Link>
					),
				)}
			</nav>
		</div>
	);
}

function NavPopover({ item }: { item: MenuItem }) {
	const [open, setOpen] = useState(false);
	const { pathname } = useLocation();

	const active = isGroupActive(item, pathname);

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger className={navLinkClass} data-active={active}>
				{item.title}
				<ChevronDown
					aria-hidden="true"
					className={`ml-1 size-4 transition duration-200 ${open ? "rotate-180" : ""}`}
				/>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-80" sideOffset={8}>
				<ul className="grid gap-2">
					{item.subItems?.map((subItem) => (
						<li key={subItem.title}>
							<Link
								className="flex flex-col gap-1 rounded-sm p-2 transition-all hover:bg-accent"
								onClick={() => setOpen(false)}
								to={subItem.linkProps.to}
							>
								<div className="font-semibold text-sm">{subItem.title}</div>
								{subItem.description && (
									<div className="text-muted-foreground text-xs">
										{subItem.description}
									</div>
								)}
							</Link>
						</li>
					))}
				</ul>
			</PopoverContent>
		</Popover>
	);
}

// The sheet's own rows. Ghost buttons on Paper, so the current row takes Pale Green rather
// than the Ink tint the bar's links take on Commission Green — the ground is inverted, and so
// is the direction the state moves in. `aria-current` is the router's, `data-active` is the
// group's; both land on the same treatment so the two rows read as one kind of thing.
const sheetRowClass =
	"w-full justify-start aria-[current]:bg-secondary aria-[current]:font-semibold data-[active=true]:bg-secondary";

function MobileNavBar() {
	const [open, setOpen] = useState(false);
	const { pathname } = useLocation();

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			{/*
			 * On Paper now rather than on Commission Green, so the label takes Ink and the ring
			 * reverts to `--ring` — the dark green is measured against every light ground in the
			 * system, and the pale ring the green tier needed would be invisible here.
			 *
			 * `min-h-11` is 44px: this is the only route to six of the seven groups on a phone,
			 * and it is reached by thumb.
			 */}
			<SheetTrigger className="-mr-1 flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 font-semibold text-foreground text-sm uppercase tracking-wide transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
				<Menu className="size-5" />
				Menu
			</SheetTrigger>
			<SheetContent side="left">
				<SheetHeader>
					{/*
					 * The agency identifies itself here, where there is room the rail has not:
					 * below `sm` the rail is down to the seal, "MCMEC" and this button, so the
					 * full name and the standfirst have nowhere else to be on a phone.
					 *
					 * `SheetTitle` stays "Menu" and goes `sr-only`. It is the dialog's accessible
					 * name, and a navigation panel that announces itself as the agency's name
					 * tells a screen-reader user nothing about what just opened.
					 */}
					<SheetTitle className="sr-only">Menu</SheetTitle>
					<span className="flex flex-col leading-tight">
						<span className="font-bold text-base uppercase tracking-wide">
							Middlesex County
						</span>
						<span className="font-semibold text-base text-muted-foreground uppercase tracking-wide">
							Mosquito Extermination Commission
						</span>
					</span>
					<span className="mt-1 font-semibold text-[0.625rem] text-muted-foreground uppercase leading-relaxed tracking-[0.16em]">
						Advancing public health and protecting our community from mosquitoes
						since 1914
					</span>
					{/*
					 * Not decoration. `SheetContent` always points `aria-describedby` at the
					 * description's generated id, so with no description rendered the dialog
					 * carried a reference that resolved to nothing — measured as
					 * `aria-describedby="radix-_R_aj6H2_"` against an element that did not
					 * exist, on the only navigation a mobile screen-reader user has. The
					 * `aria-describedby="Mobile Menu"` that used to sit on the `Sheet` root
					 * did not help: the root does not forward it, and that string is not an id.
					 */}
					<SheetDescription className="sr-only">
						Every section of the Commission's website. The section you are
						reading is open and marked.
					</SheetDescription>
				</SheetHeader>
				<nav aria-label="Main" className="mt-4 flex flex-col gap-0">
					{menuItems.map((item, index) => {
						const groupActive = isGroupActive(item, pathname);
						return (
							<div key={item.title}>
								{item.subItems ? (
									/*
									 * Open on the section the visitor is already reading. The sheet
									 * used to present seven closed drawers with nothing marked, so a
									 * resident who opened the menu to move sideways within a section
									 * had to remember which of the two groups beginning "Mosquito"
									 * they had come from. `defaultOpen` is enough because the portal
									 * unmounts on close, so every open is a fresh mount.
									 */
									<Collapsible defaultOpen={groupActive}>
										<CollapsibleTrigger asChild>
											<Button
												className={cn(sheetRowClass, "justify-between")}
												data-active={groupActive}
												variant="ghost"
											>
												<span>{item.title}</span>
												<ChevronDown className="h-4 w-4" />
											</Button>
										</CollapsibleTrigger>
										<CollapsibleContent className="pt-2 pl-4">
											<div className="flex flex-col gap-1">
												{item.subItems.map((subItem) => (
													<Link
														// Exact, so exactly one row is current. Fuzzy matching
														// would light "Legal Notices" (`/notices`) while the
														// visitor is on `/notices/archive`, and two current
														// rows answer "where am I" with a question.
														activeOptions={{ exact: true }}
														className="block rounded-md p-2 text-sm hover:bg-muted aria-[current]:bg-secondary aria-[current]:font-semibold"
														key={subItem.title}
														onClick={() => setOpen(false)}
														to={subItem.linkProps.to}
													>
														{subItem.title}
													</Link>
												))}
											</div>
										</CollapsibleContent>
									</Collapsible>
								) : (
									<Button asChild className={sheetRowClass} variant="ghost">
										<Link
											activeOptions={{ exact: true }}
											onClick={() => setOpen(false)}
											to={item.linkProps?.to}
										>
											<span>{item.title}</span>
										</Link>
									</Button>
								)}
								{index < menuItems.length - 1 && <Separator className="my-1" />}
							</div>
						);
					})}
				</nav>
			</SheetContent>
		</Sheet>
	);
}
