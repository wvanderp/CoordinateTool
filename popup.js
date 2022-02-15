const googleDomains = [
    'https://www.google.com/maps',
    'https://www.google.nl/maps',
    'https://www.google.co.uk/maps'
]

const match = (url) => {
    if (url.includes('https://www.openstreetmap.org')) {
        return 'osm'
    }

    if (url.includes('https://www.mapillary.com/')) {
        return 'mapillary'
    }

    if (googleDomains.some((domain) => url.includes(domain))) {
        return 'google'
    }

    if (url.includes('https://wikimapia.org/')) {
        return 'wikimapia'
    }

    if (url.includes('https://www.windy.com/')) {
        return 'windy'
    }
};

const extractors = {
    osm: (url) => {
        const regex = /map=(\d+)\/([-\d.]+)\/([-\d.]+)/;
        const [_, zoom, lat, lon] = url.match(regex);
        return [zoom, lat, lon]
    },
    mapillary: (url) => {
        const regex = /lat=([-\d\.]+)&lng=([-\d\.]+)&z=([-\d\.]+)/;
        const [_, lat, lon, zoom] = url.match(regex);
        return [zoom, lat, lon]
    },
    google: (url) => {
        const zoomRegex = /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d+)+?z/;
        const meterRegex = /@(-?\d+\.\d+),(-?\d+\.\d+),(\d+\.?\d+)+?m/;
        if (zoomRegex.test(url)) {
            const [_, lat, lon, zoom] = url.match(zoomRegex);
            return [zoom, lat, lon]
        }

        const meterToZoom = (meter) => Math.round(26.3558 - 1.44248 * Math.log(meter))

        if (meterRegex.test(url)) {
            const [_, lat, lon, meter] = url.match(meterRegex);
            return [meterToZoom(meter), lat, lon, meter, meterToZoom(10)]
        }
    },
    wikimapia: (url) => {
        const regex = /lat=([-\d.]+)&lon=([-\d.]+)&z=([-\d.]+)/;
        const [_, lat, lon, zoom] = url.match(regex);
        return [zoom, lat, lon]
    },
    windy: (url) => {
        const regex = /\?(-?\d+\.\d+),(-?\d+\.\d+),(\d+)/;
        const [_, lat, lon, zoom] = url.match(regex);
        return [zoom, lat, lon]
    }
};

const urlFormat = {
    osm: (options) => {
        const [zoom, lat, lon] = options;
        return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lon}`
    },
    mapillary: (options) => {
        const [zoom, lat, lon] = options;
        return `https://www.mapillary.com/app/?lat=${lat}&lng=${lon}&z=${zoom}`
    },
    google: (options) => {
        const [zoom, lat, lon] = options;
        return `https://www.google.com/maps/@${lat},${lon},${zoom}z`
    },
    wikimapia: (options) => {
        const [zoom, lat, lon] = options;
        return `https://wikimapia.org/#lang=en&lat=${lat}&lon=${lon}&z=${zoom}&m=w`
    },
    bing: (options) => {
        const [zoom, lat, lon] = options;
        return `https://www.bing.com/maps?cp=${lat}~${lon}&lvl=${zoom}`
    },
    GeoHack: (options) => {
        const [zoom, lat, lon] = options;
        const ns = lat <= 0 ? 'S' : 'N';
        const we = lon <= 0 ? 'W' : 'E';
        return `https://tools.wmflabs.org/geohack/geohack.php?params=${Math.abs(lat)}_${ns}_${Math.abs(lon)}_${we}`
    },
    windy: (options) => {
        const [zoom, lat, lon] = options;
        return `https://www.windy.com/?${lat},${lon},${zoom}`
    },
};

const fillTable = (options) => {
    document.getElementById('osm').setAttribute('href', urlFormat.osm(options))
    document.getElementById('mapillary').setAttribute('href', urlFormat.mapillary(options))
    document.getElementById('google').setAttribute('href', urlFormat.google(options))
    document.getElementById('wikimapia').setAttribute('href', urlFormat.wikimapia(options))
    document.getElementById('osm').setAttribute('href', urlFormat.osm(options))
    document.getElementById('bing').setAttribute('href', urlFormat.bing(options))
    document.getElementById('GeoHack').setAttribute('href', urlFormat.GeoHack(options))
    document.getElementById('windy').setAttribute('href', urlFormat.windy(options))
};


chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
    const url = tabs[0].url;
    document.getElementById('url').innerText = url
    document.getElementById('log').innerText = JSON.stringify(extractors[match(url)](url))
    fillTable(extractors[match(url)](url))
});

const elements = document.getElementsByClassName('button');

const openUrl = (event) => {
    event.preventDefault();
    chrome.tabs.create({
        url: event.currentTarget + ""
    })
};

for (let i = 0; i < elements.length; i++) {
    // Here we have the same onclick
    elements.item(i).onclick = openUrl;
}
