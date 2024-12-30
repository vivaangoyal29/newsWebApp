// Constants
const NEWS_API_KEY = '83776e1904944ae09e8754f263f89284';
const sentimentAnalyzer = new Sentiment();

class CacheManager {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cacheExpiration = 30 * 60 * 1000;
    }

    setCachedArticles(category, articles) {
        const cacheItem = {
            timestamp: Date.now(),
            articles: articles
        };
        const cache = this.getAllCache();
        cache[category] = cacheItem;
        this.manageCache(cache);
        localStorage.setItem('newsCache', JSON.stringify(cache));
    }

    getCachedArticles(category) {
        const cache = this.getAllCache();
        const categoryCache = cache[category];
        
        if (!categoryCache) return null;
        
        const now = Date.now();
        if (now - categoryCache.timestamp > this.cacheExpiration) {
            delete cache[category];
            localStorage.setItem('newsCache', JSON.stringify(cache));
            return null;
        }
        
        return categoryCache.articles;
    }

    getAllCache() {
        return JSON.parse(localStorage.getItem('newsCache') || '{}');
    }

    manageCache(cache) {
        const categories = Object.keys(cache);
        if (categories.length > this.maxSize) {
            const sortedCategories = categories.sort((a, b) => 
                cache[a].timestamp - cache[b].timestamp
            );
            
            while (Object.keys(cache).length > this.maxSize) {
                const oldestCategory = sortedCategories.shift();
                delete cache[oldestCategory];
            }
        }
    }

    saveBookmark(article) {
        const bookmarks = this.getBookmarks();
        bookmarks.push({
            ...article,
            bookmarkedAt: Date.now()
        });
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    }

    getBookmarks() {
        return JSON.parse(localStorage.getItem('bookmarks') || '[]');
    }

    clearExpiredCache() {
        const cache = this.getAllCache();
        const now = Date.now();
        
        Object.keys(cache).forEach(category => {
            if (now - cache[category].timestamp > this.cacheExpiration) {
                delete cache[category];
            }
        });
        
        localStorage.setItem('newsCache', JSON.stringify(cache));
    }
}

class NewsManager {
    constructor() {
        this.articles = [];
        this.cacheManager = new CacheManager();
    }

    async fetchNews(category) {
        const cachedArticles = this.cacheManager.getCachedArticles(category);
        if (cachedArticles) {
            console.log(`Retrieved ${category} news from cache`);
            return cachedArticles;
        }

        const url = `https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${NEWS_API_KEY}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            this.cacheManager.setCachedArticles(category, data.articles);
            return data.articles;
        } catch (error) {
            console.error('Error fetching news:', error);
            return [];
        }
    }

    analyzeSentiment(text) {
        const result = sentimentAnalyzer.analyze(text);
        let sentiment;
        if (result.score > 0) {
            sentiment = 'positive';
        } else if (result.score < 0) {
            sentiment = 'negative';
        } else {
            sentiment = 'neutral';
        }
        
        return {
            sentiment: sentiment,
            positive: result.positive,
            negative: result.negative
        };
    }

    processArticles(articles) {
        const processedArticles = articles.map(article => {
            const text = article.title + ' ' + (article.description || '');
            const sentimentAnalysis = this.analyzeSentiment(text);
            return { 
                ...article, 
                sentiment: sentimentAnalysis,
                sentimentType: sentimentAnalysis.sentiment
            };
        });
        return processedArticles.sort((a, b) => {
            const sentimentOrder = { positive: 3, neutral: 2, negative: 1 };
            return sentimentOrder[b.sentimentType] - sentimentOrder[a.sentimentType];
        });
    }
}

class User {
    constructor(username, password, preferences) {
        this.username = username;
        this.password = password;
        this.preferences = preferences;
    }

    static validateUser(username, password) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        return users.find(user => user.username === username && user.password === password);
    }
}

class UIManager {
    constructor() {
        this.newsManager = new NewsManager();
    }

    createAuthForm() {
        const authHTML = `
            <div class="auth-container">
                <h2>News Aggregator</h2>
                <form id="authForm">
                    <input type="text" id="username" placeholder="Username" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                    <button type="button" id="signupBtn">Sign Up</button>
                </form>
            </div>
        `;
        app.innerHTML = authHTML;
        this.attachAuthListeners();
    }

    createPreferencesForm() {
        const categories = ['business', 'technology', 'sports', 'entertainment', 'health'];
        const preferencesHTML = `
            <div class="preferences-container">
                <h2>Select News Preferences</h2>
                <form id="preferencesForm">
                    ${categories.map(category => `
                        <label>
                            <input type="checkbox" name="category" value="${category}">
                            ${category.charAt(0).toUpperCase() + category.slice(1)}
                        </label>
                    `).join('')}
                    <button type="submit">Save Preferences</button>
                </form>
            </div>
        `;
        app.innerHTML = preferencesHTML;
        this.attachPreferencesListeners();
    }

    async displayNews(preferences) {
        app.innerHTML = '<div class="news-container"><h2>Loading news...</h2></div>';
        
        const articles = [];
        for (const category of preferences) {
            const categoryArticles = await this.newsManager.fetchNews(category);
            articles.push(...categoryArticles);
        }

        const processedArticles = this.newsManager.processArticles(articles);
        
        const newsHTML = `
            <div class="news-container">
                <h2>Your Personalized News</h2>
                <div class="articles">
                    ${processedArticles.map(article => `
                        <div class="article-card">
                            <h3>${article.title}</h3>
                            <p>${article.description || ''}</p>
                            <div class="sentiment-analysis">
                                <div class="sentiment-type">
                                    Sentiment: ${article.sentimentType}
                                </div>
                                <div class="sentiment-details">
                                    <span class="positive">Positive words: ${article.sentiment.positive.length}</span>
                                    <span class="negative">Negative words: ${article.sentiment.negative.length}</span>
                                </div>
                            </div>
                            <a href="${article.url}" target="_blank">Read More</a>
                            <button class="bookmark-btn" data-url="${article.url}">
                                Bookmark for Offline
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        app.innerHTML = newsHTML;
        this.attachNewsListeners();
    }

    attachAuthListeners() {
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (User.validateUser(username, password)) {
                this.createPreferencesForm();
            } else {
                alert('Invalid credentials');
            }
        });

        document.getElementById('signupBtn').addEventListener('click', () => {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            users.push(new User(username, password, []));
            localStorage.setItem('users', JSON.stringify(users));
            alert('Signup successful! Please login.');
        });
    }

    attachPreferencesListeners() {
        document.getElementById('preferencesForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedCategories = Array.from(
                document.querySelectorAll('input[name="category"]:checked')
            ).map(input => input.value);
            
            if (selectedCategories.length > 0) {
                this.displayNews(selectedCategories);
            } else {
                alert('Please select at least one category');
            }
        });
    }

    attachNewsListeners() {
        document.querySelectorAll('.bookmark-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const url = btn.dataset.url;
                const articles = this.newsManager.cacheManager.getAllCache();
                let article = null;
                
                Object.values(articles).some(categoryCache => {
                    article = categoryCache.articles.find(a => a.url === url);
                    return article;
                });
                
                if (article) {
                    this.newsManager.cacheManager.saveBookmark(article);
                    alert('Article bookmarked for offline reading');
                }
            });
        });
    }
}

const app = document.getElementById('app');
const uiManager = new UIManager();
uiManager.createAuthForm();