# Suno Import Tools — Get Your ~1000 Songs Into the Radio

Suno still does not offer official bulk export in 2026. These are the **best known, most reliable methods** used by thousands of creators.

## Recommended Path (Fastest + Highest Success)

### 1. Suno Manager (Easiest for most people)
- Chrome/Firefox extension: https://sunomanager.com/
- Scans your entire library or specific workspaces
- Downloads MP3 + WAV + lyrics + metadata + cover art
- Excellent folder organization and resume support
- Handles 20,000+ tracks without issues

**Strongly recommended** if you want covers and clean metadata.

### 2. Console Script + This Downloader (Zero extra permissions)
This is what many power users do:

1. Log into suno.com → go to your Library
2. Scroll/paginate until most or all songs are loaded (important)
3. Open DevTools → Console tab
4. Paste the extraction snippet below and press Enter

```js
// Suno Library URL extractor (2026)
(() => {
  const grids = document.querySelectorAll('[role="grid"]');
  let links = [];
  grids.forEach(grid => {
    try {
      const reactKey = Object.keys(grid).find(k => k.startsWith('__reactProps'));
      if (!reactKey) return;
      const data = grid[reactKey]?.children?.[0]?.props?.values?.[0]?.[1]?.collection || [];
      data.forEach(item => {
        if (item?.value?.audio_url) links.push(item.value.audio_url);
        if (item?.value?.video_url) links.push(item.value.video_url);
      });
    } catch (e) {}
  });
  const unique = [...new Set(links)];
  const blob = new Blob([unique.join('\n')], {type:'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'suno_urls.txt';
  a.click();
  console.log(`Extracted ${unique.length} URLs`);
})();
```

5. This downloads `suno_urls.txt`
6. Run the Python tool in this folder:

```bash
cd tools/suno-import
python download.py --urls ~/Downloads/suno_urls.txt --out ~/Music/suno-library
```

The script will:
- Download every file with progress + resume
- Clean filenames using the URL slug (Suno puts nice titles in them)
- Write sidecar `.json` with any available info
- Optionally tag the MP3s with mutagen

After it finishes, point your `suno-radio` `music/` volume at that folder and rescan.

## Other Excellent Tools (2026)

- **danny-englander/suno-ai-downloader** — Great CSV + parallel download + prompt sidecars
- **hartmark/SunoHarvester** — Playwright-based, very reliable metadata
- **DrummerSi/suno-downloader** — Nice Tauri desktop GUI

## After You Have the Files

```bash
# From the project root
mkdir -p music
# Copy or symlink your library
ln -s ~/Music/suno-library/* music/     # or just drop the files in

docker compose up -d
# Open http://localhost:8080
```

Then hit the **RESCAN** button (or the `/api/rescan` endpoint) in the UI.

## Tips for Best Results

- Paid Suno plans give WAV — the scanner handles them perfectly.
- If titles look bad, the radio has an in-app "Browse Catalog" where you can jump around; you can also improve filenames or add proper ID3 tags later.
- The radio only needs readable audio files. Everything else is bonus.

You now have a true personal non-stop Suno radio station.
