import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@mcmec/ui/components/select";

interface SprayScheduleFiltersProps {
	municipalities: Array<{ id: string; name: string }>;
	selectedMunicipality: string;
	onMunicipalityChange: (value: string) => void;
	selectedStatus: string;
	onStatusChange: (value: string) => void;
}

const STATUS_OPTIONS = [
	{ label: "All Statuses", value: "all" },
	{ label: "Scheduled", value: "scheduled" },
	{ label: "Delayed", value: "delayed" },
	{ label: "Cancelled", value: "cancelled" },
	{ label: "Completed", value: "completed" },
];

export function SprayScheduleFilters({
	municipalities,
	selectedMunicipality,
	onMunicipalityChange,
	selectedStatus,
	onStatusChange,
}: SprayScheduleFiltersProps) {
	return (
		<div className="flex flex-wrap gap-4">
			<Select onValueChange={onMunicipalityChange} value={selectedMunicipality}>
				<SelectTrigger className="w-60">
					<SelectValue placeholder="All Municipalities" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Municipalities</SelectItem>
					{municipalities.map((m) => (
						<SelectItem key={m.id} value={m.id}>
							{m.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select onValueChange={onStatusChange} value={selectedStatus}>
				<SelectTrigger className="w-48">
					<SelectValue placeholder="All Statuses" />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
