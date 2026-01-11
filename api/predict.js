// api/predict.js

const { fetchWinGoData, parseResults } = require('../lib/dataFetcher');
const EnsemblePredictor = require('../lib/ensemblePredictor');

// Store for tracking predictions
const predictionStore = {
    lastPrediction: null,
    lastPeriod: null,
    stats: {
        totalPredictions: 0,
        wins: 0,
        losses: 0,
        currentStreak: 0,
        bestStreak: 0
    }
};

const predictor = new EnsemblePredictor();

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const startTime = Date.now();
        
        // Fetch latest data
        const rawData = await fetchWinGoData();
        const results = parseResults(rawData);
        
        if (results.length < 20) {
            throw new Error('Insufficient data for prediction');
        }

        const latestPeriod = results[0].period;
        const latestResult = results[0].bigSmall;
        
        let resultCheck = null;

        // Check previous prediction
        if (predictionStore.lastPrediction && predictionStore.lastPeriod) {
            // Find if the predicted period result is now available
            if (predictionStore.lastPeriod !== latestPeriod) {
                const predictedPeriodResult = results.find(r => r.period === predictionStore.lastPeriod);
                
                if (predictedPeriodResult) {
                    const isWin = predictionStore.lastPrediction === predictedPeriodResult.bigSmall;
                    
                    predictionStore.stats.totalPredictions++;
                    
                    if (isWin) {
                        predictionStore.stats.wins++;
                        predictionStore.stats.currentStreak++;
                        predictionStore.stats.bestStreak = Math.max(
                            predictionStore.stats.bestStreak, 
                            predictionStore.stats.currentStreak
                        );
                        
                        resultCheck = {
                            status: 'WIN',
                            message: '🎉 CONGRATULATIONS! Previous prediction WON!',
                            predictedPeriod: predictionStore.lastPeriod,
                            prediction: predictionStore.lastPrediction,
                            actualResult: predictedPeriodResult.bigSmall,
                            actualNumber: predictedPeriodResult.number
                        };
                    } else {
                        predictionStore.stats.losses++;
                        predictionStore.stats.currentStreak = 0;
                        
                        resultCheck = {
                            status: 'LOSS',
                            message: '❌ Previous prediction was LOSS. New optimized prediction ready!',
                            predictedPeriod: predictionStore.lastPeriod,
                            prediction: predictionStore.lastPrediction,
                            actualResult: predictedPeriodResult.bigSmall,
                            actualNumber: predictedPeriodResult.number
                        };
                    }
                }
            }
        }

        // Generate new prediction for next period
        const nextPeriod = generateNextPeriod(latestPeriod);
        const ensemblePrediction = await predictor.predict(results);
        
        // Store prediction
        predictionStore.lastPrediction = ensemblePrediction.finalPrediction;
        predictionStore.lastPeriod = nextPeriod;

        // Calculate win rate
        const winRate = predictionStore.stats.totalPredictions > 0 
            ? ((predictionStore.stats.wins / predictionStore.stats.totalPredictions) * 100).toFixed(2)
            : 0;

        // Get top algorithms
        const topAlgorithms = ensemblePrediction.individualPredictions
            .filter(p => p.prediction === ensemblePrediction.finalPrediction)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5)
            .map(p => ({
                method: p.method,
                confidence: Math.round(p.confidence * 100) / 100
            }));

        const responseTime = Date.now() - startTime;

        // Build response
        const response = {
            success: true,
            timestamp: new Date().toISOString(),
            responseTime: `${responseTime}ms`,
            
            // Previous result check
            previousResult: resultCheck,
            
            // Current period info
            currentPeriod: {
                period: latestPeriod,
                number: results[0].number,
                result: latestResult,
                color: results[0].color
            },
            
            // New prediction
            prediction: {
                period: nextPeriod,
                prediction: ensemblePrediction.finalPrediction,
                confidence: ensemblePrediction.confidence,
                agreementRatio: `${ensemblePrediction.agreementRatio}%`,
                algorithmsAgree: `${Math.round(ensemblePrediction.agreementRatio / 100 * ensemblePrediction.algorithmsUsed)}/${ensemblePrediction.algorithmsUsed}`,
                votes: ensemblePrediction.votes,
                topAlgorithms
            },
            
            // Statistics
            statistics: {
                totalPredictions: predictionStore.stats.totalPredictions,
                wins: predictionStore.stats.wins,
                losses: predictionStore.stats.losses,
                winRate: `${winRate}%`,
                currentWinStreak: predictionStore.stats.currentStreak,
                bestWinStreak: predictionStore.stats.bestStreak
            },
            
            // Recent history
            recentHistory: results.slice(0, 10).map(r => ({
                period: r.period,
                number: r.number,
                result: r.bigSmall,
                color: r.color
            })),
            
            // API Info
            apiInfo: {
                version: '2.0.0',
                algorithms: ensemblePrediction.algorithmsUsed,
                dataSource: 'WinGo 1 Minute',
                nextUpdate: 'Real-time on next request'
            }
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error('API Error:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            suggestion: 'Please try again in a few seconds'
        });
    }
};

function generateNextPeriod(currentPeriod) {
    // Parse current period and increment
    const periodStr = String(currentPeriod);
    const datePart = periodStr.slice(0, 8);
    const sequencePart = parseInt(periodStr.slice(8));
    
    // Each day has 1440 periods (1 per minute)
    if (sequencePart >= 1440) {
        // Next day
        const date = new Date(
            parseInt(datePart.slice(0, 4)),
            parseInt(datePart.slice(4, 6)) - 1,
            parseInt(datePart.slice(6, 8))
        );
        date.setDate(date.getDate() + 1);
        
        const newDatePart = date.toISOString().slice(0, 10).replace(/-/g, '');
        return newDatePart + '0001';
    }
    
    return datePart + String(sequencePart + 1).padStart(4, '0');
        }
