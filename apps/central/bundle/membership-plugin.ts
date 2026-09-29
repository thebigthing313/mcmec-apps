import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { gzipSync } from "node:zlib";
import type { Plugin } from "vite";
import {
	type BundleMembership,
	type ChunkMembership,
	toRepoPath,
} from "./entry-closure";

/**
 * Writes which modules each output chunk holds, and which chunks it imports, for
 * `pnpm check-bundle` (see ./check-bundle.ts). Build only; dev and Vitest never run it.
 *
 * The file goes next to `dist/`, not in it: `dist/` is what `sirv` serves in production, and a
 * map of our source tree is nobody's business.
 */
export function bundleMembership(options: {
	/** Module ids are recorded relative to this, so the rule can match `apps/central/src/...`. */
	repoRoot: string;
	outFile: string;
}): Plugin {
	return {
		apply: "build",
		enforce: "post",
		name: "mcmec:bundle-membership",
		// writeBundle, not generateBundle: by now every plugin has finished rewriting the code,
		// so the gzip size is the size of the file that ships.
		writeBundle(_output, bundle) {
			const chunks: ChunkMembership[] = [];
			for (const output of Object.values(bundle)) {
				if (output.type !== "chunk") continue;
				chunks.push({
					dynamicImports: output.dynamicImports,
					fileName: output.fileName,
					gzipBytes: gzipSync(output.code).length,
					imports: output.imports,
					isEntry: output.isEntry,
					modules: Object.entries(output.modules).map(([id, info]) => ({
						id: toRepoPath(id, options.repoRoot),
						renderedLength: info.renderedLength,
					})),
				});
			}
			const membership: BundleMembership = { chunks };
			mkdirSync(dirname(options.outFile), { recursive: true });
			writeFileSync(
				options.outFile,
				`${JSON.stringify(membership, null, "\t")}\n`,
			);
		},
	};
}
