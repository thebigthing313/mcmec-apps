import type {
	Database,
	Tables,
	TablesInsert,
	TablesUpdate,
} from "./database.types";

type TransformDate<U> = U extends string
	? Date
	: U extends string | null
		? Date | null
		: U extends string | undefined
			? Date | undefined
			: U extends string | null | undefined
				? Date | null | undefined
				: U;

export type Table = keyof Database["public"]["Tables"];
export type View = keyof Database["public"]["Views"];

export type Row<T extends Table> = {
	[K in keyof Tables<T>]: K extends `${string}_at` | `${string}_date`
		? TransformDate<Tables<T>[K]>
		: Tables<T>[K];
};
export type InsertRow<T extends Table> = {
	[K in keyof TablesInsert<T>]: K extends `${string}_at` | `${string}_date`
		? TransformDate<TablesInsert<T>[K]>
		: TablesInsert<T>[K];
};
export type UpdateRow<T extends Table> = {
	[K in keyof TablesUpdate<T>]: K extends `${string}_at` | `${string}_date`
		? TransformDate<TablesUpdate<T>[K]>
		: TablesUpdate<T>[K];
};

export type AssertEqual<T, Expected> = T extends Expected
	? Expected extends T
		? true
		: false
	: false;
