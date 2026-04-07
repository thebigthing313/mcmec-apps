import { hero, heroMobile } from "@mcmec/lib/constants/assets";
import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	CalendarDays,
	ConciergeBell,
	FileText,
	Info,
	Newspaper,
	Users,
} from "lucide-react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isMobile = useIsMobile();

	return (
		<div className="-my-8 w-full">
			{/* Hero Banner */}
			<div className="relative h-[60vh] min-h-80 w-full overflow-hidden">
				<img
					alt="Woodbridge River cleanup project"
					className="absolute inset-0 h-full w-full object-cover"
					fetchPriority="high"
					src={isMobile ? heroMobile : hero}
				/>
				<div className="absolute inset-0 bg-linear-to-r from-primary/70 via-primary/40 to-transparent" />
				<div className="absolute inset-0 flex items-center">
					<div className="mx-auto w-full max-w-7xl px-6 md:px-12">
						<h1 className="max-w-2xl font-bold text-2xl text-white leading-tight tracking-tight md:text-4xl">
							Middlesex County Mosquito Extermination Commission
						</h1>
						<p className="mt-3 max-w-xl text-base text-white/90 md:text-lg">
							Protecting the health and comfort of Middlesex County residents
							and visitors since 1914.
						</p>
					</div>
				</div>
			</div>

			{/* Quick Actions */}
			<section className="bg-background py-10 md:py-14">
				<div className="mx-auto max-w-7xl px-6 md:px-12">
					<h2 className="mb-6 text-center font-semibold text-foreground text-lg md:text-xl">
						How Can We Help You Today?
					</h2>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						<ActionCard
							description="Report a mosquito problem or request mosquitofish."
							href="/contact/service-request"
							icon={<ConciergeBell className="size-6 text-primary" />}
							title="Request Service"
						/>
						<ActionCard
							description="View current legal notices and announcements."
							href="/notices"
							icon={<Newspaper className="size-6 text-primary" />}
							title="Public Notices"
						/>
						<ActionCard
							description="Meeting schedules, agendas, and minutes."
							href="/notices/meetings"
							icon={<Users className="size-6 text-primary" />}
							title="Public Meetings"
						/>
						<ActionCard
							description="View upcoming mosquito spray missions."
							href="/mosquito-control/spray-schedule"
							icon={<CalendarDays className="size-6 text-primary" />}
							title="Spray Schedule"
						/>
						<ActionCard
							description="Weekly mosquito activity reports for the county."
							href="/mosquito-surveillance/weekly-activity"
							icon={<FileText className="size-6 text-primary" />}
							title="Weekly Mosquito Activity"
						/>
						<ActionCard
							description="Tips on mosquito protection and prevention."
							external
							href="https://middlesexmosquito.sharepoint.com/:b:/g/IQCLzJFwXLQLSaGsaq3XvsZeAUmMrM-lZmc8Bg5lBTX4MIE?e=LJshK5"
							icon={<Info className="size-6 text-primary" />}
							title="Mosquito Fact Sheet"
						/>
					</div>
				</div>
			</section>
		</div>
	);
}

function ActionCard({
	title,
	description,
	icon,
	href,
	external,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	href: string;
	external?: boolean;
}) {
	const className =
		"flex flex-col gap-3 rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md";

	if (external) {
		return (
			<a
				className={className}
				href={href}
				rel="noopener noreferrer"
				target="_blank"
			>
				{icon}
				<h3 className="font-semibold text-base text-foreground">{title}</h3>
				<p className="text-muted-foreground text-sm">{description}</p>
			</a>
		);
	}

	return (
		<Link className={className} to={href}>
			{icon}
			<h3 className="font-semibold text-base text-foreground">{title}</h3>
			<p className="text-muted-foreground text-sm">{description}</p>
		</Link>
	);
}
