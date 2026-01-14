import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@mcmec/ui/components/navigation-menu";
import { Link } from "@tanstack/react-router";

export function Navbar() {
	return (
		<NavigationMenu>
			<NavigationMenuList>
				<NavMenuHome />
				<NavMenuNotices />
			</NavigationMenuList>
		</NavigationMenu>
	);
}
function NavMenuHome() {
	return (
		<NavigationMenuItem>
			<NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
				<Link to="/">
					<span>Home</span>
				</Link>
			</NavigationMenuLink>
		</NavigationMenuItem>
	);
}

function NavMenuNotices() {
	return (
		<NavigationMenuItem>
			<NavigationMenuTrigger>Notices</NavigationMenuTrigger>
			<NavigationMenuContent>
				<ul className="grid w-50 gap-4">
					<li>
						<NavigationMenuLink asChild>
							<Link to="/notices">
								<div className="font-semibold">Legal Notices</div>
								<div className="text-muted-foreground">
									Notices that are still currently in effect.
								</div>
							</Link>
						</NavigationMenuLink>
						<NavigationMenuLink asChild>
							<Link to="/archive">
								<div className="font-semibold">Archived Notices</div>
								<div className="text-muted-foreground">
									Previous legal notices that are no longer active.
								</div>
							</Link>
						</NavigationMenuLink>
					</li>
				</ul>
			</NavigationMenuContent>
		</NavigationMenuItem>
	);
}
