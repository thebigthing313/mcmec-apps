import { useIsMobile } from "@mcmec/ui/hooks/use-mobile";
import { cn } from "@mcmec/ui/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { ConciergeBell, Newspaper, Users } from "lucide-react";

export const Route = createFileRoute("/")({
	component: RouteComponent,
});

function RouteComponent() {
	const isMobile = useIsMobile();
	const navigate = Route.useNavigate();

	return (
		<div className="-my-8 w-full">
			{/* h-[calc(100vh-152px)] = 100vh - navbar(~120px) - sliver(32px) */}
			<div className="relative h-[calc(100vh-152px)] w-full overflow-hidden">
				<img
					alt="Woodbridge River cleanup project"
					className="absolute inset-0 h-full w-full object-cover"
					fetchPriority="high"
					src={isMobile ? "hero-mobile.avif" : "hero.avif"}
				/>

				{/* Dark gradient overlay */}
				<div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />

				{/* Bottom gradient for smooth transition */}
				<div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/60 to-transparent" />

				{/* Content Centering Wrapper */}
				<div className="absolute inset-0 flex flex-col gap-8 p-6 md:p-12">
					<GlassCard className="max-w-xl">
						<h2
							className={cn(
								"mb-4 font-semibold leading-snug tracking-tight",
								isMobile ? "text-2xl" : "text-3xl",
							)}
						>
							Middlesex County Mosquito Extermination Commission
						</h2>
						<p
							className={cn(
								"font-light italic tracking-wide",
								isMobile ? "text-lg" : "text-xl",
							)}
						>
							Protecting the health and comfort of Middlesex County residents
							and visitors since 1914.
						</p>
					</GlassCard>
					<GlassCard className="flex max-w-xl flex-col items-center">
						<h2
							className={cn(
								"mb-4 text-center font-semibold leading-snug tracking-tight",
								isMobile ? "text-2xl" : "text-3xl",
							)}
						>
							How Can We Help You Today?
						</h2>
						<div
							className={cn(
								"flex flex-wrap gap-4",
								isMobile ? "flex-col" : "flex-row",
							)}
						>
							<GlassButton
								icon={<ConciergeBell />}
								label="Request Service"
								onClick={() => {
									navigate({ to: "/contact/service-request" });
								}}
							/>
							<GlassButton
								icon={<Newspaper />}
								label="Public Notices"
								onClick={() => {
									navigate({ to: "/notices" });
								}}
							/>
							<GlassButton
								icon={<Users />}
								label="Public Meetings"
								onClick={() => {
									navigate({ to: "/contact/service-request" });
								}}
							/>
							<GlassButton
								icon={<Newspaper />}
								label="Public Notices"
								onClick={() => {
									navigate({ to: "/notices" });
								}}
							/>
						</div>
					</GlassCard>
				</div>
			</div>
		</div>
	);
}

interface GlassCardProps {
	className?: string;
	children: React.ReactNode;
}
function GlassCard({ children, className }: GlassCardProps) {
	return (
		<div
			className={`max-h-[90%] w-full overflow-y-auto rounded-xl border border-white/20 bg-black/30 p-6 text-white shadow-2xl backdrop-blur-md md:ml-12 md:p-10 ${className}`}
		>
			{children}
		</div>
	);
}

interface GlassButtonProps {
	icon?: React.ReactNode;
	label: string;
	onClick: () => void;
}
function GlassButton({ label, icon, onClick }: GlassButtonProps) {
	const isMobile = useIsMobile();
	return (
		<button
			className={cn(
				"flex gap-2 rounded-xl border border-white/20 bg-black/30 p-6 backdrop-blur-md transition-all duration-200 ease-linear hover:scale-115 hover:bg-black/40",
				isMobile
					? "h-8 w-full flex-row-reverse items-center justify-between"
					: "w-36 flex-col items-center",
			)}
			onClick={onClick}
			type="button"
		>
			{icon}
			<span className="font-light text-lg uppercase tracking-wide">
				{label}
			</span>
		</button>
	);
}
