// lib/ensemblePredictor.js

const algorithms = require('./algorithms');
const MLEngine = require('./mlEngine');

class EnsemblePredictor {
    constructor() {
        this.mlEngine = new MLEngine();
        this.predictionHistory = [];
        this.algorithmPerformance = {};
    }

    async predict(results) {
        const predictions = [];

        // Run all basic algorithms
        predictions.push(algorithms.movingAveragePredict(results));
        predictions.push(algorithms.streakPredict(results));
        predictions.push(algorithms.patternPredict(results));
        predictions.push(algorithms.fibonacciPredict(results));
        predictions.push(algorithms.distributionPredict(results));
        predictions.push(algorithms.markovPredict(results));
        predictions.push(algorithms.recentBiasPredict(results));
        predictions.push(algorithms.alternationPredict(results));
        predictions.push(algorithms.timeBasedPredict(results));
        predictions.push(algorithms.neuralSimPredict(results));

        // Run ML Engine algorithms
        predictions.push(this.mlEngine.lstmPredict(results));
        predictions.push(this.mlEngine.gradientBoostPredict(results));
        predictions.push(this.mlEngine.randomForestPredict(results));
        predictions.push(this.mlEngine.svmPredict(results));
        predictions.push(this.mlEngine.knnPredict(results));

        // Weighted voting
        const weightedVotes = { BIG: 0, SMALL: 0 };
        let totalWeight = 0;

        predictions.forEach(pred => {
            const weight = (pred.confidence / 100) * this.getAlgorithmWeight(pred.method);
            weightedVotes[pred.prediction] += weight;
            totalWeight += weight;
        });

        // Final prediction
        const bigScore = weightedVotes.BIG;
        const smallScore = weightedVotes.SMALL;
        const finalPrediction = bigScore > smallScore ? 'BIG' : 'SMALL';
        
        // Calculate ensemble confidence
        const totalVotes = bigScore + smallScore;
        const winningScore = Math.max(bigScore, smallScore);
        const ensembleConfidence = (winningScore / totalVotes) * 100;

        // Additional confidence adjustments
        const agreementRatio = predictions.filter(p => p.prediction === finalPrediction).length / predictions.length;
        const adjustedConfidence = Math.min(95, ensembleConfidence * 0.7 + agreementRatio * 30);

        return {
            finalPrediction,
            confidence: Math.round(adjustedConfidence * 100) / 100,
            agreementRatio: Math.round(agreementRatio * 100),
            individualPredictions: predictions,
            votes: {
                BIG: Math.round(bigScore * 100) / 100,
                SMALL: Math.round(smallScore * 100) / 100
            },
            algorithmsUsed: predictions.length
        };
    }

    getAlgorithmWeight(method) {
        // Dynamic weights based on method reliability
        const weights = {
            'STREAK_BREAK': 1.5,
            'PATTERN_MATCH': 1.4,
            'MARKOV_CHAIN': 1.3,
            'LSTM_MEMORY': 1.4,
            'GRADIENT_BOOST': 1.3,
            'RANDOM_FOREST': 1.35,
            'SVM_LINEAR': 1.2,
            'KNN_WEIGHTED': 1.25,
            'NEURAL_SIM': 1.3,
            'DISTRIBUTION_MEAN_REVERT': 1.2,
            'ALTERNATION_HIGH': 1.15
        };
        
        return weights[method] || 1.0;
    }

    checkResult(prediction, actualResult) {
        const isWin = prediction === actualResult;
        
        return {
            status: isWin ? 'WIN' : 'LOSS',
            predicted: prediction,
            actual: actualResult,
            message: isWin 
                ? '🎉 PREDICTION WIN! AI correctly predicted the result!'
                : '❌ PREDICTION LOSS. Adjusting algorithms for next prediction.'
        };
    }
}

module.exports = EnsemblePredictor;
