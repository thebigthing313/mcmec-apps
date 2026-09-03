/// <reference types="vite/client" />

import { favicon, logo192, logo512 } from "@mcmec/lib/constants/assets";
import { SkipLink } from "@mcmec/ui/blocks/skip-link";
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
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type * as React from "react";
import { Footer } from "../components/footer";
import { Navbar } from "../components/nav-bar";
import { NotFound } from "../components/not-found";
import { seo } from "../lib/seo";

export interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootComponent,
	notFoundComponent: NotFound,
	head: () => ({
		links: [
			{ href: appCss, rel: "stylesheet" },
			{ href: favicon, rel: "icon", type: "image/x-icon" },
			{
				href: logo192,
				rel: "apple-touch-icon",
				sizes: "192x192",
			},
			{ href: logo512, rel: "icon", sizes: "512x512" },
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
				src: "https://challenges.cloudflare.com/turnstile/v0/api.js",
			},
		],
	}),
});

function RootComponent() {
	const location = useLocation();
	const isHome = location.pathname === "/";
	return (
		<RootDocument>
			<div className={!isHome ? "mx-auto flex w-full max-w-7xl p-4" : ""}>
				<Outlet />
			</div>
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
					{/*
					 * WCAG 2.4.1, Level A. Seven nav groups and their popovers sat between a
					 * keyboard user and the page on every navigation: the target id below has
					 * been here all along with nothing pointing at it.
					 */}
					<SkipLink />
					<Navbar />

					{/*
					 * tabIndex={-1} so the jump actually lands — a container is not focusable
					 * on its own and the skip link would otherwise move nothing but the URL.
					 */}
					<main className="my-8 flex-1" id="main-content" tabIndex={-1}>
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
