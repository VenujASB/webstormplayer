export default async function handler(req, res) {
    // Enable cross-origin resource sharing for index.html frontend requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // WebCric primary access routing
    const targetBaseUrl = "https://go.webcric.com/";
    
    const requestOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://go.webcric.com/",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        }
    };

    try {
        // Step 1: Scan homepage to check current active paths
        const homeResponse = await fetch(targetBaseUrl, requestOptions);
        if (!homeResponse.ok) throw new Error("WebCric hub communication error");
        const homeHtml = await homeResponse.text();

        // Target dynamic live slug variations
        let dynamicSlug = "watch-west-indies-vs-sri-lanka-on-willow-live-cricket-streaming.htm";
        
        // Dynamic detection regex fallback if WebCric modifies page naming formats
        const slugRegex = /href=["'](watch-[^"']+\.htm)["']/i;
        const slugMatch = homeHtml.match(slugRegex);
        if (slugMatch && slugMatch[1]) {
            dynamicSlug = slugMatch[1];
        }

        const exactWatchUrl = targetBaseUrl + dynamicSlug;

        // Step 2: Fetch target stream source container
        const watchResponse = await fetch(exactWatchUrl, requestOptions);
        if (!watchResponse.ok) throw new Error("Target channel container unreachable");
        const watchHtml = await watchResponse.text();

        // Step 3: Find embedded video player key IDs
        let internalEmbedUrl = "https://go.webcric.com/embed.php?id=120375";
        const embedKeyRegex = /embed\.php\?id=\d+/i;
        const embedMatch = watchHtml.match(embedKeyRegex);
        if (embedMatch) {
            internalEmbedUrl = targetBaseUrl + embedMatch[0];
        }

        // Step 4: Extract current player source matrix
        const embedResponse = await fetch(internalEmbedUrl, requestOptions);
        if (!embedResponse.ok) throw new Error("Inner framework response failure");
        const embedHtml = await embedResponse.text();

        // Regex configuration scanning for active streaming media manifests
        const manifestHunter = /(https?:\\?\/\\?\/[^\s"']+\.m3u8[^\s"']*)/g;
        const extractedTokens = embedHtml.match(manifestHunter);

        if (extractedTokens && extractedTokens.length > 0) {
            let primaryLiveUrl = extractedTokens[0].replace(/\\/g, '');

            // Clean trailing code notation characters
            if (primaryLiveUrl.includes('"') || primaryLiveUrl.includes("'")) {
                primaryLiveUrl = primaryLiveUrl.split(/["']/)[0];
            }

            // Fallback string manipulation logic generating matching redundant link lines
            let secondaryBackupUrl = primaryLiveUrl;
            if (primaryLiveUrl.includes('mut001')) {
                secondaryBackupUrl = primaryLiveUrl.replace('mut001', 'mut002');
            } else if (primaryLiveUrl.includes('plu001')) {
                secondaryBackupUrl = primaryLiveUrl.replace('plu001', 'plu002');
            } else {
                secondaryBackupUrl = primaryLiveUrl.replace('001', '002');
            }

            return res.status(200).json({
                streamLinkOne: primaryLiveUrl,
                streamLinkTwo: secondaryBackupUrl
            });
        } else {
            throw new Error("No video paths found in stream frame source");
        }

    } catch (error) {
        console.error("Scraper Engine Log:", error.message);
        
        // Global safety line to prevent your app player layout from breaking completely
        return res.status(200).json({ 
            streamLinkOne: "https://mut001.myturn1.top:8088/live/webcrict10/playlist.m3u8?vidictid=206092993441&id=113947&pk=f5663d77383e406c10621257e598bb893e11664c8bd251a68d11e1a9c169f928f618b4f17dbca2c919c3a4672e5e32b3cbe6b3be4a15a24eba9fcfb2a56163b6", 
            streamLinkTwo: "https://plu001.myturn1.top:8088/live/webcricwillow/playlist.m3u8?vidictid=20610115721&id=120375&pk=dc8e81208bb10c8ff745085fa630e09b1b4007907fd0eb7fb3ceaa1862f89b54f618b4f17dbca2c919c3a4672e5e32b3cbe6b3be4a15a24eba9fcfb2a56163b6" 
        });
    }
}
