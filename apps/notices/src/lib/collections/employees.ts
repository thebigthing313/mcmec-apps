import {
	type EmployeesRowType,
	fetchEmployees,
} from "@mcmec/supabase/db/employees";
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { queryClient, supabase } from "../queryClient";

export const employees = createCollection(
	queryCollectionOptions<EmployeesRowType>({
		getKey: (item) => item.id,
		id: "employees",
		queryClient,
		queryFn: () => fetchEmployees(supabase),
		queryKey: ["employees"],
		staleTime: 1000 * 60 * 30,
		syncMode: "eager",
	}),
);
