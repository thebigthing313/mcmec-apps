// @vitest-environment happy-dom
/**
 * The Staff Event form's cross-field rules show as field errors, and a fix clears them: Save must
 * not stay disabled behind an error the user has already corrected.
 */
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StaffEventFormValues } from "./staff-event-details";
import { StaffEventForm } from "./staff-event-form";

afterEach(cleanup);

const VALID: StaffEventFormValues = {
	all_day: false,
	description: "",
	end_time: "15:00",
	ends_on: null,
	location: "",
	start_time: "13:00",
	starts_on: "2026-10-21",
	title: "Recertification webinar",
	url: "",
};

function renderForm(values: Partial<StaffEventFormValues>) {
	const onSubmit = vi.fn();
	render(
		<StaffEventForm
			defaultValues={{ ...VALID, ...values }}
			onSubmit={onSubmit}
			submitLabel="Save"
		/>,
	);
	const save = screen.getByRole("button", { name: "Save" });
	return { onSubmit, save };
}

const submit = (button: HTMLElement) =>
	act(async () => {
		fireEvent.click(button);
	});

describe("StaffEventForm", () => {
	it("submits a valid Staff Event", async () => {
		const { onSubmit, save } = renderForm({});

		await submit(save);

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
	});

	it("puts a single-day end time before its start on the end time, and clears it once fixed", async () => {
		const { onSubmit, save } = renderForm({ end_time: "12:00" });

		await submit(save);

		expect(
			await screen.findByText(
				"On a one-day Staff Event the end time has to be after the start time.",
			),
		).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();

		fireEvent.change(screen.getByLabelText(/End time/), {
			target: { value: "16:00" },
		});
		await waitFor(() =>
			expect(
				screen.queryByText(
					"On a one-day Staff Event the end time has to be after the start time.",
				),
			).toBeNull(),
		);
		await waitFor(() =>
			expect((save as HTMLButtonElement).disabled).toBe(false),
		);

		await submit(save);
		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
	});

	it("asks for a start time when All day is not ticked", async () => {
		const { onSubmit, save } = renderForm({ end_time: "", start_time: "" });

		await submit(save);

		expect(
			await screen.findByText("Pick a start time, or tick All day."),
		).toBeTruthy();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("needs no times on an all-day Staff Event", async () => {
		const { onSubmit, save } = renderForm({
			all_day: true,
			end_time: "",
			start_time: "",
		});

		await submit(save);

		await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
	});

	it("lets the Date picker reach next year", async () => {
		renderForm({});

		await act(async () => {
			fireEvent.click(screen.getByLabelText(/^Date/));
		});

		const years = screen
			.getAllByRole("combobox")
			.flatMap((select) =>
				[...(select as HTMLSelectElement).options].map((o) => o.text),
			);
		expect(years).toContain(String(new Date().getFullYear() + 1));
	});
});
