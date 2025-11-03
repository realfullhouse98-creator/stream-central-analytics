
async tryAllProxies() {
        console.log('🎯 tryAllProxies CALLED - starting API fusion...');
        let topEmbedData = null;
        let streamedData = null;
        
        // Try to get data from BOTH APIs
        try {
            const topEmbedUrl = 'https://topembed.pw/api.php?format=json';
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(topEmbedUrl);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                topEmbedData = await response.json();
                console.log('✅ Tom data loaded:', Object.keys(topEmbedData.events || {}).length, 'days');
            }
        } catch (error) {
            console.log('❌ Tom failed, but continuing...');
        }
        
        try {
            streamedData = await this.fetchFromStreamed('all');
            console.log('✅ Sarah data loaded:', Object.keys(streamedData.events || {}).length, 'days');
        } catch (error) {
            console.log('❌ Sarah failed, but continuing...');
        }
        
        // FUSE THE DATA: Combine both sources
        return this.fuseAPIData(topEmbedData, streamedData);
    }
