// lib/dataFetcher.js
const fetch = require('node-fetch');

const API_URL = 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json';

// Cache for storing data
let dataCache = {
    data: null,
    timestamp: 0,
    ttl: 5000 // 5 seconds cache
};

async function fetchWinGoData() {
    const now = Date.now();
    
    // Return cached data if valid
    if (dataCache.data && (now - dataCache.timestamp) < dataCache.ttl) {
        return dataCache.data;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache'
            },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        // Update cache
        dataCache.data = data;
        dataCache.timestamp = now;
        
        return data;
    } catch (error) {
        console.error('Fetch Error:', error.message);
        throw error;
    }
}

function parseResults(data) {
    if (!data || !data.data || !data.data.list) {
        throw new Error('Invalid data format');
    }

    return data.data.list.map(item => {
        const number = parseInt(item.number);
        return {
            period: item.issueNumber,
            number: number,
            bigSmall: number >= 5 ? 'BIG' : 'SMALL',
            oddEven: number % 2 === 0 ? 'EVEN' : 'ODD',
            color: getColor(number),
            timestamp: item.openTime || Date.now()
        };
    });
}

function getColor(num) {
    if (num === 0) return 'VIOLET-RED';
    if (num === 5) return 'VIOLET-GREEN';
    if ([1, 3, 7, 9].includes(num)) return 'GREEN';
    return 'RED';
}

module.exports = { fetchWinGoData, parseResults };
