# Hero masters

The full-resolution originals behind the six `hero-*.avif` files one directory up. They are
kept beside their derivatives so a future re-crop starts from the photograph rather than from
a 1400px re-encode, and they are **not served**: `assetsRouter` reads `../assets` with a
non-recursive `readdirSync`, so this directory arrives as the extensionless name `hero`, finds
no content type, and is skipped.

Derived with:

    ffmpeg -i hero/<name>.avif \
      -vf "scale='if(gt(iw,ih),min(1400,iw),-2)':'if(gt(iw,ih),-2,min(1400,ih))':flags=lanczos" \
      -c:v libaom-av1 -still-picture 1 -crf 34 -cpu-used 3 -pix_fmt yuv420p hero-<name>.avif

1400px on the long edge covers roughly 1.75x the widest the home page's hero plate is ever
painted. Served filenames are `immutable` for a year, so a re-crop needs a NEW filename here
and in `packages/lib/src/constants/assets.ts` — never an overwrite in place.
