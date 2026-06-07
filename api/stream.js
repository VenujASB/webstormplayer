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
    let streamLinkOne = "https://plu001.myturn1.top:8088/live/webcricwillow/playlist.m3u8?id=120375&pk=b492b8a26cc718f90aaebf57bba20175f0399f7320faa530e542f2fd63bbcb570f11a2774d26748366815b720f13fa570e91a633b43a37b27283a47bac86c0b8";
    let streamLinkTwo = "https://muc001.myturn1.top:8088/live/webcricwillow/playlist.m3u8?id=120375&pk=b492b8a26cc718f90aaebf57bba20175f0399f7320faa530e542f2fd63bbcb570f11a2774d26748366815b720f13fa570e91a633b43a37b27283a47bac86c0b8";

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
