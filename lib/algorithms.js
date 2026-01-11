// lib/algorithms.js

// Algorithm 1: Moving Average Analysis
function movingAveragePredict(results, window = 10) {
    const recent = results.slice(0, window);
    const bigCount = recent.filter(r => r.bigSmall === 'BIG').length;
    const smallCount = window - bigCount;
    
    const ratio = bigCount / window;
    
    // Contrarian approach with momentum
    if (ratio > 0.7) {
        return { prediction: 'SMALL', confidence: ratio * 100, method: 'MA_CONTRARIAN' };
    } else if (ratio < 0.3) {
        return { prediction: 'BIG', confidence: (1 - ratio) * 100, method: 'MA_CONTRARIAN' };
    }
    
    // Momentum following
    return { 
        prediction: bigCount > smallCount ? 'BIG' : 'SMALL', 
        confidence: Math.abs(0.5 - ratio) * 200,
        method: 'MA_MOMENTUM'
    };
}

// Algorithm 2: Streak Analysis
function streakPredict(results) {
    let currentStreak = 1;
    const first = results[0].bigSmall;
    
    for (let i = 1; i < results.length; i++) {
        if (results[i].bigSmall === first) {
            currentStreak++;
        } else {
            break;
        }
    }
    
    // Break streak prediction with dynamic threshold
    if (currentStreak >= 4) {
        return { 
            prediction: first === 'BIG' ? 'SMALL' : 'BIG', 
            confidence: Math.min(95, 60 + currentStreak * 8),
            method: 'STREAK_BREAK',
            streakLength: currentStreak
        };
    }
    
    // Continue short streak
    if (currentStreak <= 2) {
        return { 
            prediction: first, 
            confidence: 55 + currentStreak * 5,
            method: 'STREAK_CONTINUE',
            streakLength: currentStreak
        };
    }
    
    return { 
        prediction: first === 'BIG' ? 'SMALL' : 'BIG', 
        confidence: 50 + currentStreak * 5,
        method: 'STREAK_NEUTRAL',
        streakLength: currentStreak
    };
}

// Algorithm 3: Pattern Recognition (Deep)
function patternPredict(results, depth = 5) {
    const patterns = {};
    const recent = results.slice(0, 50);
    
    // Build pattern database
    for (let i = depth; i < recent.length; i++) {
        const pattern = recent.slice(i - depth, i).map(r => r.bigSmall).join('-');
        const next = recent[i - depth - 1]?.bigSmall;
        
        if (next) {
            if (!patterns[pattern]) {
                patterns[pattern] = { BIG: 0, SMALL: 0 };
            }
            patterns[pattern][next]++;
        }
    }
    
    // Current pattern
    const currentPattern = results.slice(0, depth).map(r => r.bigSmall).join('-');
    
    if (patterns[currentPattern]) {
        const { BIG, SMALL } = patterns[currentPattern];
        const total = BIG + SMALL;
        
        if (total > 0) {
            const prediction = BIG > SMALL ? 'BIG' : 'SMALL';
            const confidence = (Math.max(BIG, SMALL) / total) * 100;
            
            return { 
                prediction, 
                confidence: Math.min(90, confidence),
                method: 'PATTERN_MATCH',
                patternFound: currentPattern,
                occurrences: total
            };
        }
    }
    
    return { prediction: 'BIG', confidence: 50, method: 'PATTERN_DEFAULT' };
}

// Algorithm 4: Fibonacci Cycle Analysis
function fibonacciPredict(results) {
    const fibSequence = [1, 2, 3, 5, 8, 13, 21, 34];
    const recent = results.slice(0, 34);
    
    let bigScore = 0;
    let smallScore = 0;
    
    fibSequence.forEach((fib, idx) => {
        if (recent[fib - 1]) {
            const weight = (fibSequence.length - idx) / fibSequence.length;
            if (recent[fib - 1].bigSmall === 'BIG') {
                bigScore += weight;
            } else {
                smallScore += weight;
            }
        }
    });
    
    const total = bigScore + smallScore;
    const prediction = bigScore > smallScore ? 'SMALL' : 'BIG'; // Contrarian
    const confidence = (Math.abs(bigScore - smallScore) / total) * 100 + 50;
    
    return { 
        prediction, 
        confidence: Math.min(85, confidence),
        method: 'FIBONACCI_CYCLE'
    };
}

// Algorithm 5: Number Distribution Analysis
function distributionPredict(results) {
    const last20 = results.slice(0, 20);
    const numbers = last20.map(r => r.number);
    
    const avgNumber = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - avgNumber, 2), 0) / numbers.length;
    const stdDev = Math.sqrt(variance);
    
    // Mean reversion strategy
    if (avgNumber > 5.5) {
        return { 
            prediction: 'SMALL', 
            confidence: Math.min(85, 50 + (avgNumber - 4.5) * 10),
            method: 'DISTRIBUTION_MEAN_REVERT',
            average: avgNumber.toFixed(2),
            stdDev: stdDev.toFixed(2)
        };
    } else if (avgNumber < 3.5) {
        return { 
            prediction: 'BIG', 
            confidence: Math.min(85, 50 + (4.5 - avgNumber) * 10),
            method: 'DISTRIBUTION_MEAN_REVERT',
            average: avgNumber.toFixed(2),
            stdDev: stdDev.toFixed(2)
        };
    }
    
    return { 
        prediction: avgNumber > 4.5 ? 'SMALL' : 'BIG', 
        confidence: 55,
        method: 'DISTRIBUTION_NEUTRAL',
        average: avgNumber.toFixed(2)
    };
}

// Algorithm 6: Markov Chain Prediction
function markovPredict(results) {
    const transitions = {
        'BIG': { 'BIG': 0, 'SMALL': 0 },
        'SMALL': { 'BIG': 0, 'SMALL': 0 }
    };
    
    // Build transition matrix
    for (let i = 0; i < results.length - 1; i++) {
        const current = results[i].bigSmall;
        const next = results[i + 1].bigSmall;
        transitions[next][current]++;
    }
    
    const lastResult = results[0].bigSmall;
    const bigProb = transitions[lastResult]['BIG'];
    const smallProb = transitions[lastResult]['SMALL'];
    const total = bigProb + smallProb;
    
    if (total > 0) {
        const prediction = bigProb > smallProb ? 'BIG' : 'SMALL';
        const confidence = (Math.max(bigProb, smallProb) / total) * 100;
        
        return { 
            prediction, 
            confidence: Math.min(88, confidence),
            method: 'MARKOV_CHAIN',
            transitionFrom: lastResult
        };
    }
    
    return { prediction: 'BIG', confidence: 50, method: 'MARKOV_DEFAULT' };
}

// Algorithm 7: Weighted Recent Bias
function recentBiasPredict(results) {
    let weightedBig = 0;
    let weightedSmall = 0;
    let totalWeight = 0;
    
    const weights = [10, 8, 6, 5, 4, 3, 2, 1.5, 1, 0.5];
    
    for (let i = 0; i < Math.min(10, results.length); i++) {
        const weight = weights[i];
        if (results[i].bigSmall === 'BIG') {
            weightedBig += weight;
        } else {
            weightedSmall += weight;
        }
        totalWeight += weight;
    }
    
    const bigRatio = weightedBig / totalWeight;
    
    // Contrarian on extreme bias
    if (bigRatio > 0.65) {
        return { 
            prediction: 'SMALL', 
            confidence: bigRatio * 100,
            method: 'RECENT_BIAS_CONTRARIAN'
        };
    } else if (bigRatio < 0.35) {
        return { 
            prediction: 'BIG', 
            confidence: (1 - bigRatio) * 100,
            method: 'RECENT_BIAS_CONTRARIAN'
        };
    }
    
    return { 
        prediction: bigRatio > 0.5 ? 'BIG' : 'SMALL', 
        confidence: 50 + Math.abs(0.5 - bigRatio) * 100,
        method: 'RECENT_BIAS_FOLLOW'
    };
}

// Algorithm 8: Alternation Pattern
function alternationPredict(results) {
    let alternations = 0;
    const checkLength = 10;
    
    for (let i = 0; i < Math.min(checkLength - 1, results.length - 1); i++) {
        if (results[i].bigSmall !== results[i + 1].bigSmall) {
            alternations++;
        }
    }
    
    const alternationRate = alternations / (checkLength - 1);
    const lastResult = results[0].bigSmall;
    
    // High alternation - predict opposite
    if (alternationRate > 0.7) {
        return { 
            prediction: lastResult === 'BIG' ? 'SMALL' : 'BIG', 
            confidence: alternationRate * 95,
            method: 'ALTERNATION_HIGH'
        };
    }
    
    // Low alternation - predict same
    if (alternationRate < 0.3) {
        return { 
            prediction: lastResult, 
            confidence: (1 - alternationRate) * 80,
            method: 'ALTERNATION_LOW'
        };
    }
    
    return { 
        prediction: lastResult === 'BIG' ? 'SMALL' : 'BIG', 
        confidence: 55,
        method: 'ALTERNATION_NEUTRAL'
    };
}

// Algorithm 9: Time-based Pattern
function timeBasedPredict(results) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Analyze historical performance by time segments
    const timeScore = ((hour * 60 + minute) % 120) / 120;
    
    const last5 = results.slice(0, 5);
    const bigCount = last5.filter(r => r.bigSmall === 'BIG').length;
    
    // Complex time-based logic
    if (timeScore > 0.5) {
        return { 
            prediction: bigCount > 2 ? 'SMALL' : 'BIG', 
            confidence: 60 + timeScore * 20,
            method: 'TIME_BASED_HIGH'
        };
    }
    
    return { 
        prediction: bigCount <= 2 ? 'BIG' : 'SMALL', 
        confidence: 55 + (1 - timeScore) * 20,
        method: 'TIME_BASED_LOW'
    };
}

// Algorithm 10: Neural Pattern Simulation
function neuralSimPredict(results) {
    // Simulate neural network weights
    const inputLayer = results.slice(0, 15).map((r, i) => ({
        value: r.bigSmall === 'BIG' ? 1 : 0,
        weight: Math.exp(-i * 0.2)
    }));
    
    // Hidden layer simulation
    let hiddenSum = 0;
    inputLayer.forEach(neuron => {
        hiddenSum += neuron.value * neuron.weight;
    });
    
    const totalWeight = inputLayer.reduce((sum, n) => sum + n.weight, 0);
    const activation = hiddenSum / totalWeight;
    
    // Sigmoid-like activation
    const sigmoid = 1 / (1 + Math.exp(-(activation - 0.5) * 5));
    
    const prediction = sigmoid > 0.5 ? 'BIG' : 'SMALL';
    const confidence = Math.abs(sigmoid - 0.5) * 200;
    
    return { 
        prediction, 
        confidence: Math.min(90, 50 + confidence),
        method: 'NEURAL_SIM',
        activation: sigmoid.toFixed(4)
    };
}

module.exports = {
    movingAveragePredict,
    streakPredict,
    patternPredict,
    fibonacciPredict,
    distributionPredict,
    markovPredict,
    recentBiasPredict,
    alternationPredict,
    timeBasedPredict,
    neuralSimPredict
};
