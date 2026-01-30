import { Button } from "@mcmec/ui/components/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@mcmec/ui/components/collapsible";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@mcmec/ui/components/navigation-menu";
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
	{
		subItems: [
			{ linkProps: { to: "/mission" }, title: "Mission Statement" },
			{
				linkProps: { to: "/leadership" },
				title: "Leadership",
			},
		],
		title: "About",
	},
	{
		subItems: [
			{
				description: "Meeting schedules, agenda, and minutes.",
				linkProps: { to: "/meetings" },
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

function WebNavBar() {
	return (
		<div className="sticky top-0 z-50 flex h-30 flex-row items-center justify-start bg-primary py-2 drop-shadow-accent drop-shadow-xl">
			<div className="flex w-50 flex-row justify-center rounded-r-full bg-background">
				<Link to="/">
					<img
						alt="MCMEC Logo"
						className="m-4 h-26"
						src="/shared/logo512.png"
					/>
				</Link>
			</div>

			<div className="ml-8 flex flex-1 flex-row items-center justify-start gap-4">
				<NavigationMenu>
					<NavigationMenuList>
						{menuItems.map((item) =>
							item.subItems ? (
								<NavigationMenuItem key={item.title}>
									<NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
									<NavigationMenuContent>
										<ul className="grid w-50 gap-2">
											{item.subItems.map((subItem) => (
												<li key={subItem.title}>
													<NavigationMenuLink asChild>
														<Link to={subItem.linkProps.to}>
															<div className="font-semibold">
																{subItem.title}
															</div>
															{subItem.description && (
																<div className="text-muted-foreground">
																	{subItem.description}
																</div>
															)}
														</Link>
													</NavigationMenuLink>
												</li>
											))}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							) : (
								<NavigationMenuItem key={item.title}>
									<NavigationMenuLink
										asChild
										className={navigationMenuTriggerStyle()}
									>
										<Link to={item.linkProps?.to}>
											<span>{item.title}</span>
										</Link>
									</NavigationMenuLink>
								</NavigationMenuItem>
							),
						)}
					</NavigationMenuList>
				</NavigationMenu>
			</div>
		</div>
	);
}

function MobileNavBar() {
	const [open, setOpen] = useState(false);

	return (
		<div className="bg-primary px-2 py-2">
			<Sheet onOpenChange={setOpen} open={open}>
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
		</div>
	);
}
