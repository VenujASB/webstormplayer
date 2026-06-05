export default async function handler(req, res) {
    // 1. Set explicit streaming headers to prevent CORS blocking issues
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl'); // Standard HLS playlist MIME type

    const watchPageUrl = "https://go.webcric.com/watch-west-indies-vs-sri-lanka-on-willow-live-cricket-streaming.htm";
    const requestOptions = {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://go.webcric.com/"
        }
    };

    try {
        // 2. Fetch the WebCric document markup layout
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

            // Extract the base host path of WebCric's server (e.g., https://mut001.myturn1.top:8088/live/webcrict10/)
            const urlTokens = realLiveUrl.split('/');
            urlTokens.pop(); 
            const streamBaseUrl = urlTokens.join('/') + '/';

            // 3. Download the actual live playlist manifest file data
            const streamResponse = await fetch(realLiveUrl, { headers: { "Referer": "https://go.webcric.com/" } });
            const rawManifestText = await streamResponse.text();

            // 4. THE PATH-FIXING REWRITE LOOP
            // This reads every line of the manifest text and rewrites relative links to absolute links
            let resolvedManifest = rawManifestText.split('\n').map(line => {
                let cleanLine = line.trim();
                if (cleanLine.length > 0 && !cleanLine.startsWith('#') && !cleanLine.startsWith('http')) {
                    // Turn relative paths like "chunk_01.ts" into absolute paths
                    return streamBaseUrl + cleanLine;
                }
                return line;
            }).join('\n');

            return res.status(200).send(resolvedManifest);
        } else {
            throw new Error("Stream Offline");
        }

    } catch (error) {
        // Safe placeholder loop: Plays a sample video clip if the match goes offline
        const safePlaceholder = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:5\n#EXTINF:5.0,\nhttps://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;
        return res.status(200).send(safePlaceholder);
    }
}
