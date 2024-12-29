/*
 * Sentiment implementation in JavaScript
 */
(function() {
    var root = this;
    var previous_sentiment = root.Sentiment;

    // Create the sentiment object
    var Sentiment = function(options) {
        if (!(this instanceof Sentiment)) {
            return new Sentiment(options);
        }

        // Initialize options and properties
        this.options = options || {};
        this.afinn = {
            // Positive words
            "good": 3,
            "great": 3,
            "excellent": 4,
            "amazing": 4,
            "wonderful": 4,
            "fantastic": 4,
            "best": 4,
            "brilliant": 4,
            "success": 3,
            "successful": 3,
            "positive": 2,
            "better": 2,
            "awesome": 4,
            "happy": 3,
            "win": 3,
            "winning": 3,
            "won": 3,
            "improved": 2,
            "improvement": 2,
            // Negative words
            "bad": -3,
            "terrible": -4,
            "awful": -4,
            "horrible": -4,
            "worst": -4,
            "failure": -3,
            "fail": -3,
            "failed": -3,
            "negative": -2,
            "worse": -2,
            "problem": -2,
            "problems": -2,
            "issue": -2,
            "issues": -2,
            "poor": -2,
            "mistake": -2,
            "mistakes": -2,
            "error": -2,
            "errors": -2
            // Add more words as needed
        };
    };

    Sentiment.prototype.analyze = function(text) {
        if (!text) return { score: 0, comparative: 0, positive: [], negative: [] };

        var words = text.toLowerCase().split(/[\s,.!?]+/);
        var score = 0;
        var positive = [];
        var negative = [];

        words.forEach((word) => {
            if (this.afinn.hasOwnProperty(word)) {
                score += this.afinn[word];
                if (this.afinn[word] > 0) {
                    positive.push(word);
                } else {
                    negative.push(word);
                }
            }
        });

        var comparative = words.length > 0 ? score / words.length : 0;

        return {
            score: score,
            comparative: comparative,
            positive: positive,
            negative: negative
        };
    };

    // Export the Sentiment object for **Node.js** and **"CommonJS"**, with
    // backwards compatibility for the old `require()` API.
    if (typeof exports !== 'undefined') {
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Sentiment;
        }
        exports.Sentiment = Sentiment;
    } else {
        root.Sentiment = Sentiment;
    }
}).call(this);