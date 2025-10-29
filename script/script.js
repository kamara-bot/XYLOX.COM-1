document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const mobileToggle = document.querySelector('.mobile-toggle');
    const nav = document.querySelector('.nav');
    const menuItems = document.querySelectorAll('.menu-item');
    const searchBar = document.querySelector('.search-bar');
    const searchButton = document.querySelector('.button1');

    // Toggle mobile menu
    mobileToggle.addEventListener('click', function() {
        this.classList.toggle('active');
        nav.classList.toggle('active');
        console.log('Menu clicked'); // Debug line
    });

    // Handle dropdown toggles
    menuItems.forEach(item => {
        const toggle = item.querySelector('.dropdown-toggle');
        if (toggle) {
            toggle.addEventListener('click', function() {
                if (window.innerWidth <= 968) {
                    item.classList.toggle('active');
                }
            });
        }
    });

    // Search functionality
    const searchData = {
        'movies': {
            title: 'Movies',
            description: 'Watch your favorite movies and series',
            url: 'Movies.html',
            keywords: ['movies', 'films', 'cinema', 'entertainment', 'netflix', 'series', 'watch']
        },
        'graphics': {
            title: 'Graphics Design',
            description: 'Professional graphics design services',
            url: 'Graphics.html',
            keywords: ['graphics', 'design', 'logo', 'poster', 'artwork', 'creative', 'visual']
        },
        'plumbing': {
            title: 'Plumbing Services',
            description: 'Professional plumbing and pipe installation',
            url: 'plumbling.html',
            keywords: ['plumbing', 'pipes', 'water', 'installation', 'repair', 'maintenance', 'plumber']
        },
        'architectural': {
            title: 'Architectural Services',
            description: 'Professional architectural design and planning',
            url: 'architectural.html',
            keywords: ['architecture', 'design', 'building', 'construction', 'planning', 'engineer', 'ronnie']
        },
        'granite': {
            title: 'Granite & Marble Services',
            description: 'High-quality granite, marble and terrazzo services',
            url: 'Granite_marble_terrazzo.html',
            keywords: ['granite', 'marble', 'terrazzo', 'stone', 'installation', 'countertops', 'flooring']
        },
        'toilet': {
            title: 'Toilet Emptying',
            description: 'Professional septic tank and toilet emptying services',
            url: 'https://septictankempting.com/',
            keywords: ['toilet', 'emptying', 'septic', 'tank', 'cleaning', 'sanitation', 'waste']
        },
        'recharge': {
            title: 'Mobile Recharge',
            description: 'Airtime and data packages for mobile phones',
            url: 'recharge-and-stc-data_internet-packages.html',
            keywords: ['recharge', 'airtime', 'data', 'mobile', 'phone', 'internet', 'packages', 'simo']
        },
        'children': {
            title: 'Children\'s Home',
            description: 'Dream Uplift Uganda - Supporting children in need',
            url: 'Dream uplift uganda.html',
            keywords: ['children', 'home', 'dream', 'uplift', 'uganda', 'charity', 'kids', 'support']
        },
        'books': {
            title: 'Children\'s Books',
            description: 'Educational and entertaining books for children',
            url: '#',
            keywords: ['books', 'children', 'education', 'reading', 'stories', 'learning']
        }
    };

    function performSearch(query) {
        const results = [];
        const searchTerm = query.toLowerCase().trim();
        
        if (searchTerm === '') {
            return results;
        }

        // Search through all services
        Object.values(searchData).forEach(item => {
            // Check if search term matches title, description, or keywords
            const titleMatch = item.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = item.description.toLowerCase().includes(searchTerm);
            const keywordMatch = item.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchTerm)
            );

            if (titleMatch || descriptionMatch || keywordMatch) {
                results.push(item);
            }
        });

        return results;
    }

    function displaySearchResults(results, query) {
        // Remove existing search results
        const existingResults = document.querySelector('.search-results');
        if (existingResults) {
            existingResults.remove();
        }

        if (results.length === 0) {
            showNoResults(query);
            return;
        }

        // Create search results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        
        const resultsHTML = `
            <div class="search-results-header">
                <h3>Search Results for "${query}" (${results.length} found)</h3>
                <button class="close-search">×</button>
            </div>
            <div class="search-results-list">
                ${results.map(result => `
                    <div class="search-result-item">
                        <h4><a href="${result.url}" class="result-link">${result.title}</a></h4>
                        <p>${result.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
        
        // Insert results after header
        const header = document.querySelector('.header');
        header.insertAdjacentElement('afterend', resultsContainer);

        // Add close functionality
        const closeButton = resultsContainer.querySelector('.close-search');
        closeButton.addEventListener('click', () => {
            resultsContainer.remove();
        });

        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function showNoResults(query) {
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results';
        
        resultsContainer.innerHTML = `
            <div class="search-results-header">
                <h3>No results found for "${query}"</h3>
                <button class="close-search">×</button>
            </div>
            <div class="search-results-list">
                <div class="no-results">
                    <p>Sorry, we couldn't find any services matching your search.</p>
                    <p>Try searching for: movies, graphics, plumbing, architecture, granite, recharge, or books</p>
                </div>
            </div>
        `;
        
        const header = document.querySelector('.header');
        header.insertAdjacentElement('afterend', resultsContainer);

        const closeButton = resultsContainer.querySelector('.close-search');
        closeButton.addEventListener('click', () => {
            resultsContainer.remove();
        });

        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Search button click event
    searchButton.addEventListener('click', function(e) {
        e.preventDefault();
        const query = searchBar.value.trim();
        if (query) {
            const results = performSearch(query);
            displaySearchResults(results, query);
        }
    });

    // Search on Enter key press
    searchBar.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchBar.value.trim();
            if (query) {
                const results = performSearch(query);
                displaySearchResults(results, query);
            }
        }
    });

    // Live search suggestions (optional)
    searchBar.addEventListener('input', function() {
        const query = this.value.trim();
        if (query.length >= 2) {
            const results = performSearch(query);
            if (results.length > 0 && results.length <= 3) {
                showSearchSuggestions(results);
            } else {
                hideSearchSuggestions();
            }
        } else {
            hideSearchSuggestions();
        }
    });

    function showSearchSuggestions(results) {
        hideSearchSuggestions(); // Remove existing suggestions
        
        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.className = 'search-suggestions';
        
        suggestionsContainer.innerHTML = results.map(result => `
            <div class="suggestion-item" data-url="${result.url}">
                <strong>${result.title}</strong>
                <span>${result.description}</span>
            </div>
        `).join('');
        
        const searchContainer = document.querySelector('.search-container');
        searchContainer.appendChild(suggestionsContainer);
        
        // Add click handlers for suggestions
        suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                const url = this.dataset.url;
                if (url.startsWith('http')) {
                    window.open(url, '_blank');
                } else {
                    window.location.href = url;
                }
                hideSearchSuggestions();
            });
        });
    }

    function hideSearchSuggestions() {
        const suggestions = document.querySelector('.search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideSearchSuggestions();
        }
    });
});

  // side bar
        let button = document.querySelector('#Filter-btn');
        let sidebar = document.querySelector('#sidebar');
   
        button.addEventListener('click', () => {
           sidebar.classList.toggle('show');});
           
           button.addEventListener('click', () => {
            sidebar.classList.add('grow');});
