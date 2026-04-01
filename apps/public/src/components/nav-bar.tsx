import { logo512 } from "@mcmec/lib/constants/assets";
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
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@mcmec/ui/components/sheet";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { Link, type LinkProps } from "@tanstack/react-router";
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
				linkProps: { to: "/about/mission" },
				title: "Mission Statement",
			},
			{
				description: "Meet our board of commissioners.",
				linkProps: { to: "/about/leadership" },
				title: "Leadership",
			},
			{
				description: "Overview of our mosquito control methods.",
				linkProps: { to: "/about/how-we-control-mosquitoes" },
				title: "How We Control Mosquitoes",
			},
			{
				description: "Insecticides and other products we commonly use.",
				linkProps: { to: "/about/mosquito-control-products" },
				title: "Mosquito Control Products",
			},
			{
				description: "View current job openings at MCMEC.",
				linkProps: { to: "/about/job-opportunities" },
				title: "Job Opportunities",
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
				description: "For general inquiries and support.",
				linkProps: { to: "/contact/contact-us" },
				title: "Contact Us",
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
];

export function Navbar() {
	const isMobile = useIsMobile();
	if (isMobile) {
		return <MobileNavBar />;
	} else {
		return <WebNavBar />;
	}
}

const navLinkClass =
	"inline-flex h-12 items-center justify-center rounded-md px-4 py-2 text-2xl text-primary-foreground font-bold uppercase tracking-wider hover:bg-accent/40 focus:bg-accent/40 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px]";

function WebNavBar() {
	return (
		<div className="sticky top-0 z-50 flex h-30 flex-row items-center justify-start bg-primary py-2 drop-shadow-accent drop-shadow-xl">
			<div className="flex w-50 flex-row justify-center rounded-r-full bg-background">
				<Link to="/">
					<img alt="MCMEC Logo" className="m-4 h-26" src={logo512} />
				</Link>
			</div>

			<nav className="ml-8 flex flex-1 flex-row items-center justify-start gap-1">
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

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger className={navLinkClass}>
				{item.title}
				<ChevronDown
					aria-hidden="true"
					className={`ml-1 size-4 transition duration-200 ${open ? "rotate-180" : ""}`}
				/>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-100" sideOffset={8}>
				<ul className="grid gap-2">
					{item.subItems?.map((subItem) => (
						<li key={subItem.title}>
							<Link
								className="flex flex-col gap-1 rounded-sm p-2 transition-all hover:bg-accent"
								onClick={() => setOpen(false)}
								to={subItem.linkProps.to}
							>
								<div className="font-semibold text-xl">{subItem.title}</div>
								{subItem.description && (
									<div className="text-muted-foreground">
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

function MobileNavBar() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex h-15 flex-row items-center justify-between bg-primary py-2 pl-2">
			<Sheet aria-describedby="Mobile Menu" onOpenChange={setOpen} open={open}>
				<SheetTrigger>
					<div className="flex flex-row items-center gap-2 text-primary-foreground">
						<Menu />
						<span className="text-2xl uppercase tracking-tight">Menu</span>
					</div>
				</SheetTrigger>
				<SheetContent side="left">
					<SheetHeader>
						<SheetTitle>Menu</SheetTitle>
					</SheetHeader>
					<div className="mt-4 flex flex-col gap-0">
						{menuItems.map((item, index) => (
							<div key={item.title}>
								{item.subItems ? (
									<Collapsible>
										<CollapsibleTrigger asChild>
											<Button
												className="w-full justify-between"
												variant="ghost"
											>
												<span>{item.title}</span>
												<ChevronDown className="h-4 w-4" />
											</Button>
										</CollapsibleTrigger>
										<CollapsibleContent className="pt-2 pl-4">
											<div className="flex flex-col gap-2">
												{item.subItems.map((subItem) => (
													<Link
														className="block rounded-md p-2 hover:bg-accent"
														key={subItem.title}
														onClick={() => setOpen(false)}
														to={subItem.linkProps.to}
													>
														<div className="font-semibold">{subItem.title}</div>
														{subItem.description && (
															<div className="text-muted-foreground text-xs">
																{subItem.description}
															</div>
														)}
													</Link>
												))}
											</div>
										</CollapsibleContent>
									</Collapsible>
								) : (
									<Button
										asChild
										className="w-full justify-start"
										variant="ghost"
									>
										<Link
											onClick={() => setOpen(false)}
											to={item.linkProps?.to}
										>
											<span>{item.title}</span>
										</Link>
									</Button>
								)}
								{index < menuItems.length - 1 && <Separator className="my-2" />}
							</div>
						))}
					</div>
				</SheetContent>
			</Sheet>
			<div className="flex w-24 flex-row justify-center rounded-l-full bg-background">
				<Link to="/">
					<img alt="MCMEC Logo" className="m-4 h-15" src={logo512} />
				</Link>
			</div>
		</div>
	);
}
