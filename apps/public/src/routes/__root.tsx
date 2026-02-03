/// <reference types="vite/client" />

import { Toaster } from "@mcmec/ui/components/sonner";
import appCss from "@mcmec/ui/styles/globals.css?url";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
	ClientOnly,
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
			{ href: "/favicon.ico", rel: "icon", type: "image/x-icon" },
			{
				href: "/logo192.png",
				rel: "apple-touch-icon",
				sizes: "192x192",
			},
			{ href: "/logo512.png", rel: "icon", sizes: "512x512" },
			// { href: "/site.webmanifest", rel: "manifest" },
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
		scripts: [
			{
				defer: true,
				src: "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
			},
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
					<ClientOnly>
						<Toaster />
						<TanStackRouterDevtools position="bottom-right" />
						<ReactQueryDevtools buttonPosition="bottom-left" />
					</ClientOnly>
				</div>

				<Scripts />
			</body>
		</html>
	);
}
