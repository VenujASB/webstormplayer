export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');

    const watchPageUrl = "https://go.webcric.com/watch-west-indies-vs-sri-lanka-on-willow-live-cricket-streaming.htm";
    const requestOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://go.webcric.com/"
        }
    };

    // Hardcoded default fallback links from your script
    let streamLinkOne = "https://plu002.myturn1.top:8088/live/webcricwillow/playlist.m3u8?id=120375&pk=aa05930de864cc4a2578a0d8d0982a87fc91b81269359d598db2245365aece6873aaa083b2490736a4449e258896ac7ce056b9b8849ea643d3a8d98aea335962";
    let streamLinkTwo = "https://muc002.myturn1.top:8088/live/webcricwillow/playlist.m3u8?id=120375&pk=aa05930de864cc4a2578a0d8d0982a87fc91b81269359d598db2245365aece6873aaa083b2490736a4449e258896ac7ce056b9b8849ea643d3a8d98aea335962";

    try {
        const watchPageResponse = await fetch(watchPageUrl, requestOptions);
        if (watchPageResponse.ok) {
            const watchHtml = await watchPageResponse.text();
            const embedMatch = watchHtml.match(/embed\.php\?id=\d+/);
            const embedUrl = embedMatch ? `https://go.webcric.com/${embedMatch[0]}` : "https://go.webcric.com/embed.php?id=120375";

            const embedResponse = await fetch(embedUrl, requestOptions);
            if (embedResponse.ok) {
                const embedHtml = await embedResponse.text();
                const streamMatches = embedHtml.match(/(https?:\\?\/\\?\/[^\s"']+\.m3u8[^\s"']*)/g);
                
                if (streamMatches && streamMatches.length > 0) {
                    const scrapedUrl = streamMatches[0].replace(/\\/g, '');
                    
                    if (scrapedUrl.startsWith('http')) {
                        streamLinkOne = scrapedUrl;

                        if (scrapedUrl.includes('mut001')) {
                            streamLinkTwo = scrapedUrl.replace('mut001', 'mut002');
                        } else if (scrapedUrl.includes('plu001')) {
                            streamLinkTwo = scrapedUrl.replace('plu001', 'plu002');
                        } else {
                            streamLinkTwo = scrapedUrl.replace('001', '002');
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Sniffer routine fallback triggered:", error);
    }

    return res.status(200).json({
        streamLinkOne: streamLinkOne,
        streamLinkTwo: streamLinkTwo
    });
}
