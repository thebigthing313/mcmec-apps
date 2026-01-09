import { Button } from "@mcmec/ui/components/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@mcmec/ui/components/card";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@mcmec/ui/components/tooltip";
import { Edit, LucideDelete } from "lucide-react";

interface NoticeTypeCardProps {
	name: string;
	description?: string;
	children?: React.ReactNode;
}
export function NoticeTypeCard({
	name,
	description,
	children,
}: NoticeTypeCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{name}</CardTitle>
				<CardAction>
					<div className="flex flex-row gap-0">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon">
									<Edit />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Edit</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon">
									<LucideDelete />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Delete</TooltipContent>
						</Tooltip>
					</div>
				</CardAction>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
