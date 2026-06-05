export default async function handler(req, res) {
    // Enable CORS headers so your index.html frontend can read the data smoothly
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const watchPageUrl = "https://go.webcric.com/watch-west-indies-vs-sri-lanka-on-willow-live-cricket-streaming.htm";

    // Set up stealth headers to fool WebCric into thinking we are a real human browser
    const requestOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://go.webcric.com/"
        }
    };

    try {
        // Step 1: Fetch the main WebCric watch page
        const watchResponse = await fetch(watchPageUrl, requestOptions);
        if (!watchResponse.ok) throw new Error("Could not load WebCric main page");
        const watchHtml = await watchResponse.text();

        // Step 2: Use regex to extract the inner embed player link ID
        let embedUrl = "https://go.webcric.com/embed.php?id=120375"; // Default backup ID context structure
        const embedMatch = watchHtml.match(/embed\.php\?id=\d+/);
        if (embedMatch) {
            embedUrl = "https://go.webcric.com/" + embedMatch[0];
        }

        // Step 3: Fetch the source code of that inner embed frame
        const embedResponse = await fetch(embedUrl, requestOptions);
        if (!embedResponse.ok) throw new Error("Could not load WebCric embed frame");
        const embedHtml = await embedResponse.text();

        // Step 4: Use regular expressions to sniff out any raw streaming (.m3u8) links
        const streamRegex = /(https?:\\?\/\\?\/[^\s"']+\.m3u8[^\s"']*)/g;
        const detectedStreams = embedHtml.match(streamRegex);

        // If a real live link was successfully sniffed out
        if (detectedStreams && detectedStreams.length > 0) {
            // Clean up any JSON backslashes (\/) from the response string
            let scrapedUrl = detectedStreams[0].replace(/\\/g, '');

            // Dynamically generate the secondary alternate backup path by mirroring the server endpoint cluster
            let alternativeUrl = scrapedUrl;
            if (scrapedUrl.includes('mut001')) {
                alternativeUrl = scrapedUrl.replace('mut001', 'mut002');
            } else if (scrapedUrl.includes('plu001')) {
                alternativeUrl = scrapedUrl.replace('plu001', 'plu002');
            } else {
                alternativeUrl = scrapedUrl.replace('001', '002');
            }

            // Return the dynamically sniffed links instantly to your index.html player
            return res.status(200).json({
                streamLinkOne: scrapedUrl,
                streamLinkTwo: alternativeUrl
            });
        } else {
            // No links found in WebCric's source code at this specific moment
            return res.status(404).json({ 
                error: "No active stream links detected. Broadcasting might be offline." 
            });
        }

    } catch (error) {
        console.error("Scraper Engine Error:", error.message);
        return res.status(500).json({ 
            error: "Streaming automation server encountered a reading problem." 
        });
    }
}
