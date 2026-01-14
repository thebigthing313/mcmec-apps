import { Button } from "@mcmec/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@mcmec/ui/components/dialog";
import { Input } from "@mcmec/ui/components/input";
import { Label } from "@mcmec/ui/components/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@mcmec/ui/components/table";
import { Textarea } from "@mcmec/ui/components/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@mcmec/ui/components/tooltip";
import { count, eq, useLiveQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { notice_types } from "@/src/lib/collections/notice_types";
import { notices } from "@/src/lib/collections/notices";

export const Route = createFileRoute("/(app)/categories")({
	component: RouteComponent,
	loader: async () => {
		await Promise.all([notice_types.preload(), notices.preload()]);
		return { crumb: "Categories" };
	},
});

type Category = {
	id: string;
	name: string;
	description: string | null;
	notices: number;
};

function RouteComponent() {
	const { data: categories } = useLiveQuery((q) =>
		q
			.from({ notice_type: notice_types })
			.leftJoin({ notice: notices }, ({ notice_type, notice }) =>
				eq(notice_type.id, notice.notice_type_id),
			)
			.groupBy(({ notice_type }) => [
				notice_type.id,
				notice_type.name,
				notice_type.description,
			])
			.orderBy(({ notice_type }) => notice_type.name)
			.select(({ notice_type, notice }) => ({
				description: notice_type.description,
				id: notice_type.id,
				name: notice_type.name,
				notices: count(notice?.id),
			})),
	);

	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [editForm, setEditForm] = useState({ description: "", name: "" });
	const [isCreating, setIsCreating] = useState(false);
	const [createForm, setCreateForm] = useState({ description: "", name: "" });
	const [isDeleting, setIsDeleting] = useState(false);

	const handleEditClick = (category: Category) => {
		setEditingCategory(category);
		setEditForm({
			description: category.description || "",
			name: category.name,
		});
	};

	const handleEditSave = () => {
		if (!editingCategory) return;

		notice_types.update(editingCategory.id, (draft) => {
			draft.name = editForm.name;
			draft.description = editForm.description || null;
		});

		setEditingCategory(null);
	};

	const handleCreateClick = () => {
		setCreateForm({ description: "", name: "" });
		setIsCreating(true);
	};

	const handleCreateSave = () => {
		console.log("Creating category:", createForm);
		notice_types.insert({
			created_at: new Date(),
			created_by: null,
			description: createForm.description || null,
			id: crypto.randomUUID(),
			name: createForm.name,
			updated_at: new Date(),
			updated_by: null,
		});
		setIsCreating(false);
	};

	const handleDelete = (categoryId: string) => {
		setIsDeleting(true);
		try {
			notice_types.delete(categoryId);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<div className="container mx-auto py-6">
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h1 className="font-bold text-3xl">Categories</h1>
					<p className="text-muted-foreground">
						Manage notice categories and their descriptions.
					</p>
				</div>
				<Button onClick={handleCreateClick}>
					<Plus className="mr-2 h-4 w-4" />
					New Category
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Description</TableHead>
							<TableHead className="text-right">Notices</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{categories && categories.length > 0 ? (
							categories.map((category) => (
								<TableRow key={category.id}>
									<TableCell className="font-medium">{category.name}</TableCell>
									<TableCell className="text-muted-foreground">
										{category.description || "—"}
									</TableCell>
									<TableCell className="text-right">
										{category.notices}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												onClick={() => handleEditClick(category)}
												size="sm"
												variant="ghost"
											>
												<Edit2 className="h-4 w-4" />
											</Button>
											<Tooltip>
												<TooltipTrigger asChild>
													<span>
														<Button
															disabled={category.notices > 0 || isDeleting}
															onClick={() => handleDelete(category.id)}
															size="sm"
															variant="ghost"
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</span>
												</TooltipTrigger>
												{category.notices > 0 && (
													<TooltipContent>
														Cannot delete category with {category.notices}{" "}
														existing{" "}
														{category.notices === 1 ? "notice" : "notices"}
													</TooltipContent>
												)}
											</Tooltip>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									className="text-center text-muted-foreground"
									colSpan={4}
								>
									No categories found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog
				onOpenChange={(open) => !open && setEditingCategory(null)}
				open={editingCategory !== null}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Category</DialogTitle>
						<DialogDescription>
							Update the name and description for this category
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								onChange={(e) =>
									setEditForm({ ...editForm, name: e.target.value })
								}
								placeholder="Category name"
								value={editForm.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								onChange={(e) =>
									setEditForm({ ...editForm, description: e.target.value })
								}
								placeholder="Category description (optional)"
								rows={3}
								value={editForm.description}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setEditingCategory(null)} variant="outline">
							Cancel
						</Button>
						<Button disabled={!editForm.name.trim()} onClick={handleEditSave}>
							Save Changes
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				onOpenChange={(open) => !open && setIsCreating(false)}
				open={isCreating}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Category</DialogTitle>
						<DialogDescription>Add a new notice category</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="create-name">Name</Label>
							<Input
								id="create-name"
								onChange={(e) =>
									setCreateForm({ ...createForm, name: e.target.value })
								}
								placeholder="Category name"
								value={createForm.name}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="create-description">Description</Label>
							<Textarea
								id="create-description"
								onChange={(e) =>
									setCreateForm({ ...createForm, description: e.target.value })
								}
								placeholder="Category description (optional)"
								rows={3}
								value={createForm.description}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setIsCreating(false)} variant="outline">
							Cancel
						</Button>
						<Button
							disabled={!createForm.name.trim()}
							onClick={handleCreateSave}
						>
							Create Category
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
