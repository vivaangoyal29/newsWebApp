document.addEventListener("DOMContentLoaded", () => {
    const authPage = document.getElementById("authPage");
    const categoriesPage = document.getElementById("categoriesPage");
    const newsPage = document.getElementById("newsPage");
    const offlinePage = document.getElementById("offlinePage");

    const apiKey = "83776e1904944ae09e8754f263f89284"; // Replace with your NewsAPI key

    // Initialize Sentiment.js
    const sentiment = new Sentiment();

    // Switch Pages
    function showPage(page) {
        authPage.style.display = "none";
        categoriesPage.style.display = "none";
        newsPage.style.display = "none";
        offlinePage.style.display = "none";
        page.style.display = "block";
    }

    // Authorization
    document.getElementById("authForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        localStorage.setItem("user", JSON.stringify({ username, password }));
        showPage(categoriesPage);
    });

    // Categories
    document.getElementById("categoryForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const selectedCategories = Array.from(
            document.querySelectorAll('input[name="category"]:checked')
        ).map((checkbox) => checkbox.value);

        if (selectedCategories.length === 0) {
            alert("Please select at least one category.");
            return;
        }

        localStorage.setItem("categories", JSON.stringify(selectedCategories));
        fetchNews(selectedCategories);
    });

    // Fetch News
    function fetchNews(categories) {
        showPage(newsPage);
        const promises = categories.map((category) =>
            fetch(`https://newsapi.org/v2/top-headlines?category=${category}&apiKey=${apiKey}`)
                .then((response) => response.json())
        );

        Promise.all(promises).then((results) => {
            const articles = results.flatMap((result) => result.articles);
            analyzeAndSort(articles);
        });
    }

    // Analyze Sentiment
    function analyzeSentiment(text) {
        const result = sentiment.analyze(text);
        return result.score; // Sentiment score
    }

    // Analyze and Sort Articles
    function analyzeAndSort(articles) {
        articles.forEach((article) => {
            article.sentimentScore = analyzeSentiment(article.description || "");
        });
        articles.sort((a, b) => b.sentimentScore - a.sentimentScore);
        displayArticles(articles);
    }

    // Display Articles
    function displayArticles(articles) {
        const container = document.getElementById("newsContainer");
        container.innerHTML = "";
        articles.forEach((article) => {
            const articleElem = document.createElement("div");
            articleElem.className = "article";
            articleElem.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.description || "No description available"}</p>
                <a href="${article.url}" target="_blank">Read More</a>
                <p>Sentiment Score: ${article.sentimentScore}</p>
                <button class="saveOfflineBtn">Save Offline</button>
            `;
            container.appendChild(articleElem);
        });

        // Add event listeners to dynamically created buttons
        container.querySelectorAll('.saveOfflineBtn').forEach((button, index) => {
            button.addEventListener('click', () => {
                saveForOffline(articles[index]);
            });
        });
    }

    // Save for Offline
    function saveForOffline(article) {
        let offlineArticles = JSON.parse(localStorage.getItem("offlineArticles")) || [];
        offlineArticles.push(article);
        localStorage.setItem("offlineArticles", JSON.stringify(offlineArticles));
    }

    // View Offline Articles
    document.getElementById("offlineArticlesBtn").addEventListener("click", () => {
        showPage(offlinePage);
        const offlineArticles = JSON.parse(localStorage.getItem("offlineArticles")) || [];
        const container = document.getElementById("offlineContainer");
        container.innerHTML = "";
        offlineArticles.forEach((article) => {
            const articleElem = document.createElement("div");
            articleElem.className = "article";
            articleElem.innerHTML = `
                <h3>${article.title}</h3>
                <p>${article.description || "No description available"}</p>
                <a href="${article.url}" target="_blank">Read More</a>
            `;
            container.appendChild(articleElem);
        });
    });

    // Back to News
    document.getElementById("backToNews").addEventListener("click", () => {
        showPage(newsPage);
    });
});