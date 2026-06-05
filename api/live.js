export default async function handler(req, res) {
    // 1. Enable cross-origin requests so your index.html can load the feed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/x-mpegURL'); 

    const watchPageUrl = "https://go.webcric.com/watch-west-indies-vs-sri-lanka-on-willow-live-cricket-streaming.htm";
    const requestOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://go.webcric.com/"
        }
    };

    try {
        // 2. Fetch the WebCric page layout dynamically
        const watchResponse = await fetch(watchPageUrl, requestOptions);
        const watchHtml = await watchResponse.text();

        let embedUrl = "https://go.webcric.com/embed.php?id=120375";
        const embedMatch = watchHtml.match(/embed\.php\?id=\d+/);
        if (embedMatch) embedUrl = "https://go.webcric.com/" + embedMatch[0];

        const embedResponse = await fetch(embedUrl, requestOptions);
        const embedHtml = await embedResponse.text();

        const streamRegex = /(https?:\\?\/\\?\/[^\s"']+\.m3u8[^\s"']*)/g;
        const detectedStreams = embedHtml.match(streamRegex);

        if (detectedStreams && detectedStreams.length > 0) {
            let realLiveUrl = detectedStreams[0].replace(/\\/g, '');
            if (realLiveUrl.includes('"') || realLiveUrl.includes("'")) {
                realLiveUrl = realLiveUrl.split(/["']/)[0];
            }

            // Extract the base path of the stream server (e.g., https://mut001.myturn1.top:8088/live/webcrict10/)
            const urlTokens = realLiveUrl.split('/');
            urlTokens.pop(); 
            const streamBaseUrl = urlTokens.join('/') + '/';

            // 3. Fetch the live manifest playlist directly from WebCric
            const streamResponse = await fetch(realLiveUrl, { headers: { "Referer": "https://go.webcric.com/" } });
            let manifestText = await streamResponse.text();

            // 4. Resolve relative paths so Clappr knows where to download the video segments (.ts chunks)
            let fixedManifest = manifestText.split('\n').map(line => {
                if (line.trim() && !line.startsWith('#') && !line.startsWith('http')) {
                    return streamBaseUrl + line.trim();
                }
                return line;
            }).join('\n');

            return res.status(200).send(fixedManifest);
        } else {
            throw new Error("Stream Link Not Found");
        }

    } catch (error) {
        // Fallback: If offline or expired, serve a stable placeholder playlist loop
        const stablePlaceholder = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:5\n#EXTINF:5.0,\nhttps://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;
        return res.status(200).send(stablePlaceholder);
    }
}
