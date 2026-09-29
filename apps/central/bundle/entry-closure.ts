export type ChunkMembership = {
	fileName: string;
	isEntry: boolean;
	imports: string[];
	dynamicImports: string[];
	gzipBytes: number;
	modules: { id: string; renderedLength: number }[];
};

export type BundleMembership = { chunks: ChunkMembership[] };

export type ClosureChunk = ChunkMembership & { via: string[] };

export type Violation = {
	module: string;
	chunk: string;
	reason: string;
	via: string[];
};

export type EntryClosureResult = {
	closure: ClosureChunk[];
	violations: Violation[];
	/** Sum of the closure's chunks, each gzipped on its own as a browser would fetch it. */
	gzipBytes: number;
	ceilingBytes: number;
	overCeiling: boolean;
};

const APP_MODULE = /^apps\/central\/src\/apps\/[^/]+\//;
// A table is `tables/<name>.ts` or a folder `tables/<name>/...`.
const TABLE_MODULE =
	/^apps\/central\/src\/lib\/collections\/tables\/([^/.]+)[./]/;

/** Why a module may not be in the entry closure, or null when it may. */
function forbiddenReason(moduleId: string): string | null {
	if (APP_MODULE.test(moduleId)) return "App code";
	const table = TABLE_MODULE.exec(moduleId)?.[1];
	if (table && table !== "employees") return `the "${table}" table`;
	return null;
}

/**
 * A Rollup module id as a repo-relative, forward-slash path, which is what the rule matches.
 * Workspace packages resolve to their real path (`packages/ui/src/...`), not through
 * node_modules. A virtual wrapper around a repo file (`\0<path>?commonjs-module`) maps to that
 * file; a purely virtual module (`\0vite/...`) and anything outside the repo are returned as is.
 */
export function toRepoPath(moduleId: string, repoRoot: string): string {
	const id = moduleId
		.replace(/^\0/, "")
		.replace(/\\/g, "/")
		.replace(/\?.*$/, "");
	const root = `${repoRoot.replace(/\\/g, "/").replace(/\/+$/, "")}/`;
	// Case-insensitive because Windows drive letters arrive in either case.
	return id.toLowerCase().startsWith(root.toLowerCase())
		? id.slice(root.length)
		: moduleId;
}

/** Breadth-first from the entry, so each chunk's `via` is the shortest static-import chain. */
function walkClosure(membership: BundleMembership): ClosureChunk[] {
	const byName = new Map(membership.chunks.map((c) => [c.fileName, c]));
	const closure: ClosureChunk[] = [];
	const seen = new Set<string>();
	const queue: ClosureChunk[] = membership.chunks
		.filter((c) => c.isEntry)
		.map((c) => ({ ...c, via: [c.fileName] }));
	if (queue.length === 0)
		throw new Error(
			"the bundle membership has no entry chunk — was it written by a central build?",
		);
	for (const c of queue) seen.add(c.fileName);
	while (queue.length > 0) {
		const current = queue.shift() as ClosureChunk;
		closure.push(current);
		for (const name of current.imports) {
			if (seen.has(name)) continue;
			seen.add(name);
			const next = byName.get(name);
			if (next) queue.push({ ...next, via: [...current.via, name] });
		}
	}
	return closure;
}

export function checkEntryClosure(
	membership: BundleMembership,
	{ ceilingBytes }: { ceilingBytes: number },
): EntryClosureResult {
	// A NaN ceiling would compare false against everything and pass any size silently.
	if (!Number.isFinite(ceilingBytes) || ceilingBytes <= 0)
		throw new Error(
			`the ceiling must be a positive number of bytes, got ${ceilingBytes}`,
		);
	const closure = walkClosure(membership);
	const violations: Violation[] = [];
	for (const c of closure) {
		for (const m of c.modules) {
			// Rollup lists a module it tree-shook to nothing with renderedLength 0: it ships no code.
			if (m.renderedLength === 0) continue;
			const reason = forbiddenReason(m.id);
			if (reason)
				violations.push({
					chunk: c.fileName,
					module: m.id,
					reason,
					via: c.via,
				});
		}
	}
	const gzipBytes = closure.reduce((sum, c) => sum + c.gzipBytes, 0);
	return {
		ceilingBytes,
		closure,
		gzipBytes,
		overCeiling: gzipBytes > ceilingBytes,
		violations,
	};
}

const kB = (bytes: number) => `${(bytes / 1000).toFixed(1)} kB`;

/** What `pnpm check-bundle` prints: the verdict, each offending module, and the size. */
export function formatReport(result: EntryClosureResult): string {
	const lines: string[] = [];
	const size = `central entry closure: ${result.closure.length} chunk(s), ${kB(result.gzipBytes)} gzip (ceiling ${kB(result.ceilingBytes)})`;

	if (result.violations.length > 0) {
		lines.push(
			`✗ ${result.violations.length} module(s) in central's entry closure must load lazily:`,
			"",
		);
		for (const v of result.violations) {
			lines.push(
				`  ${v.module}`,
				`    forbidden: ${v.reason} may not load up front`,
				`    in chunk:  ${v.chunk}`,
				`    via:       ${v.via.join(" -> ")}`,
				"",
			);
		}
		lines.push(
			"  Something that main.tsx, the root route, or a route's beforeLoad / validateSearch /",
			"  loader imports statically reaches these modules. Move what a route option needs into a",
			"  component-free module outside src/routes/, and reach App code and tables only through",
			"  `await import()` or context.collections.use(...).",
			"",
		);
	}

	if (result.overCeiling) {
		lines.push(
			`✗ ${size}`,
			`  ${kB(result.gzipBytes - result.ceilingBytes)} over. Find what grew, or raise the ceiling in`,
			"  apps/central/bundle/budget.json with a one-line reason in the PR description.",
		);
	} else {
		lines.push(`${result.violations.length > 0 ? " " : "✓"} ${size}`);
	}

	return lines.join("\n");
}
