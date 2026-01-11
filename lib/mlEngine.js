// lib/mlEngine.js

class MLEngine {
    constructor() {
        this.history = [];
        this.accuracy = { correct: 0, total: 0 };
        this.lastPrediction = null;
    }

    // Advanced LSTM-like Memory
    lstmPredict(results) {
        const cellState = [];
        const hiddenState = [];
        
        // Initialize states
        for (let i = 0; i < 10; i++) {
            cellState.push(0);
            hiddenState.push(0);
        }
        
        // Process sequence
        results.slice(0, 20).forEach((result, idx) => {
            const input = result.bigSmall === 'BIG' ? 1 : -1;
            const forgetGate = this.sigmoid(input * 0.5 + hiddenState[idx % 10] * 0.3);
            const inputGate = this.sigmoid(input * 0.7 - hiddenState[idx % 10] * 0.2);
            const candidate = Math.tanh(input * 0.9);
            
            cellState[idx % 10] = forgetGate * cellState[idx % 10] + inputGate * candidate;
            hiddenState[idx % 10] = Math.tanh(cellState[idx % 10]);
        });
        
        // Output
        const output = hiddenState.reduce((a, b) => a + b, 0) / 10;
        
        return {
            prediction: output > 0 ? 'BIG' : 'SMALL',
            confidence: Math.min(92, 50 + Math.abs(output) * 50),
            method: 'LSTM_MEMORY'
        };
    }

    // Gradient Boosting Simulation
    gradientBoostPredict(results) {
        const weakLearners = [];
        
        // Create weak learners
        for (let i = 0; i < 5; i++) {
            const window = results.slice(i * 4, (i + 1) * 4);
            const bigCount = window.filter(r => r.bigSmall === 'BIG').length;
            weakLearners.push({
                vote: bigCount > 2 ? 1 : -1,
                weight: 1 / (i + 1)
            });
        }
        
        // Aggregate predictions
        let totalVote = 0;
        let totalWeight = 0;
        
        weakLearners.forEach(learner => {
            totalVote += learner.vote * learner.weight;
            totalWeight += learner.weight;
        });
        
        const finalVote = totalVote / totalWeight;
        
        // Contrarian for extremes
        const prediction = Math.abs(finalVote) > 0.7 
            ? (finalVote > 0 ? 'SMALL' : 'BIG')
            : (finalVote > 0 ? 'BIG' : 'SMALL');
        
        return {
            prediction,
            confidence: Math.min(88, 55 + Math.abs(finalVote) * 40),
            method: 'GRADIENT_BOOST'
        };
    }

    // Random Forest Simulation
    randomForestPredict(results) {
        const numTrees = 7;
        const votes = { BIG: 0, SMALL: 0 };
        
        for (let tree = 0; tree < numTrees; tree++) {
            // Random sampling with replacement
            const sampleSize = 8 + (tree % 5);
            const startIdx = tree % 3;
            const sample = results.slice(startIdx, startIdx + sampleSize);
            
            // Decision based on sample
            const bigRatio = sample.filter(r => r.bigSmall === 'BIG').length / sample.length;
            
            // Different decision rules per tree
            let vote;
            switch (tree % 4) {
                case 0: vote = bigRatio > 0.5 ? 'BIG' : 'SMALL'; break;
                case 1: vote = bigRatio > 0.6 ? 'SMALL' : 'BIG'; break;
                case 2: vote = bigRatio < 0.4 ? 'BIG' : 'SMALL'; break;
                default: vote = sample[0].bigSmall === 'BIG' ? 'SMALL' : 'BIG';
            }
            
            votes[vote]++;
        }
        
        const prediction = votes.BIG > votes.SMALL ? 'BIG' : 'SMALL';
        const confidence = (Math.max(votes.BIG, votes.SMALL) / numTrees) * 100;
        
        return {
            prediction,
            confidence: Math.min(90, confidence),
            method: 'RANDOM_FOREST',
            votes
        };
    }

    // Support Vector Machine Simulation
    svmPredict(results) {
        // Create feature vectors
        const features = results.slice(0, 20).map((r, i) => ({
            x: r.bigSmall === 'BIG' ? 1 : -1,
            y: i / 20,
            label: r.bigSmall
        }));
        
        // Simple linear SVM boundary
        let sumX = 0;
        let sumY = 0;
        
        features.forEach(f => {
            sumX += f.x * (1 - f.y);
            sumY += f.y;
        });
        
        const decision = sumX / features.length;
        
        // Support vectors influence
        const marginVotes = features.slice(0, 5).reduce((acc, f) => {
            return acc + (f.x * Math.exp(-f.y * 2));
        }, 0);
        
        const finalDecision = decision + marginVotes * 0.3;
        
        return {
            prediction: finalDecision > 0 ? 'BIG' : 'SMALL',
            confidence: Math.min(87, 50 + Math.abs(finalDecision) * 25),
            method: 'SVM_LINEAR'
        };
    }

    // K-Nearest Neighbors
    knnPredict(results, k = 5) {
        // Current state vector
        const current = results.slice(0, 3).map(r => r.bigSmall === 'BIG' ? 1 : 0);
        
        // Find similar patterns in history
        const distances = [];
        
        for (let i = 3; i < results.length - 1; i++) {
            const pattern = results.slice(i, i + 3).map(r => r.bigSmall === 'BIG' ? 1 : 0);
            const next = results[i - 1].bigSmall;
            
            // Euclidean distance
            let dist = 0;
            for (let j = 0; j < 3; j++) {
                dist += Math.pow(current[j] - pattern[j], 2);
            }
            dist = Math.sqrt(dist);
            
            distances.push({ dist, next });
        }
        
        // Sort and get k nearest
        distances.sort((a, b) => a.dist - b.dist);
        const nearest = distances.slice(0, k);
        
        const votes = { BIG: 0, SMALL: 0 };
        nearest.forEach(n => {
            const weight = 1 / (n.dist + 0.1);
            votes[n.next] += weight;
        });
        
        const prediction = votes.BIG > votes.SMALL ? 'BIG' : 'SMALL';
        const total = votes.BIG + votes.SMALL;
        
        return {
            prediction,
            confidence: Math.min(89, (Math.max(votes.BIG, votes.SMALL) / total) * 100),
            method: 'KNN_WEIGHTED'
        };
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
}

module.exports = MLEngine;
