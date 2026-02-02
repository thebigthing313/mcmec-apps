/// <reference types="vite/client" />
import appCss from "@mcmec/ui/styles/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";
import { Footer } from "../components/footer";
import { Navbar } from "../components/nav-bar";
import { seo } from "../lib/seo";

export interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	head: () => ({
		links: [
			{ href: appCss, rel: "stylesheet" },
			{ href: "/shared/favicon.ico", rel: "icon" },
			{
				href: "/shared/logo192.png",
				rel: "apple-touch-icon",
				sizes: "192x192",
			},
			{ href: "/shared/logo512.png", rel: "icon", sizes: "512x512" },
			// { href: "/site.webmanifest", rel: "manifest" },
			{ href: "/shared/favicon.ico", rel: "icon" },
		],
		meta: [
			{ charSet: "utf-8" },
			{ content: "width=device-width, initial-scale=1", name: "viewport" },
			...seo({
				description:
					"Official website of the Middlesex County Mosquito Extermination Commission (MCMEC). Providing information on mosquito control, public health, and community resources in Middlesex County, NJ.",
				title: "Middlesex County Mosquito Extermination Commission",
			}),
		],
	}),
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<div className="flex min-h-screen flex-col bg-background">
					<Navbar />

					<main className="my-8 flex-1" id="main-content">
						{children}
					</main>
					<Footer />
				</div>

				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools buttonPosition="bottom-left" />

				<Scripts />
			</body>
		</html>
	);
}
