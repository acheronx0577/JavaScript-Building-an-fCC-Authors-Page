const authorGrid = document.getElementById('author-grid');
const authorsContainer = document.getElementById('authors-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const refreshBtn = document.getElementById('refresh-btn');
const searchInput = document.getElementById('search');
const errorContainer = document.getElementById('error-container');

// Stats elements
const totalAuthors = document.getElementById('total-authors');
const displayedAuthors = document.getElementById('displayed-authors');
const avgBioLength = document.getElementById('avg-bio-length');
const statusElement = document.getElementById('status');
const connectionStatus = document.getElementById('connection-status');
const lastUpdate = document.getElementById('last-update');

let startingIndex = 0;
let endingIndex = 8;
let authorDataArr = [];
let filteredAuthors = [];
let isLoading = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateLastUpdate();
    loadAuthors();
    
    // Add keyboard shortcuts info
    console.log('Keyboard shortcuts:');
    console.log('Ctrl+R - Refresh data');
    console.log('/ or Ctrl+K - Focus search');
    console.log('Esc - Clear search');
});

function updateLastUpdate() {
    const now = new Date();
    lastUpdate.textContent = now.toLocaleTimeString();
}

function updateStats() {
    totalAuthors.textContent = authorDataArr.length;
    displayedAuthors.textContent = filteredAuthors.length;
    
    // Calculate average bio length
    if (authorDataArr.length > 0) {
        const totalBioLength = authorDataArr.reduce((sum, author) => sum + (author.bio ? author.bio.length : 0), 0);
        avgBioLength.textContent = Math.round(totalBioLength / authorDataArr.length);
    } else {
        avgBioLength.textContent = '0';
    }
}

function setStatus(status, isError = false) {
    statusElement.textContent = status;
    statusElement.style.color = isError ? 'var(--gradient-red)' : 'var(--gradient-blue)';
}

function loadAuthors() {
    if (isLoading) return;
    
    isLoading = true;
    setStatus('FETCHING_DATA...');
    errorContainer.classList.add('hide');
    
    authorGrid.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <div>CONNECTING_TO_API...</div>
        </div>
    `;

    fetch('https://cdn.freecodecamp.org/curriculum/news-author-page/authors.json')
        .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then((data) => {
            authorDataArr = data;
            filteredAuthors = data;
            startingIndex = 0;
            endingIndex = 8;
            
            updateStats();
            setStatus('LOADED');
            displayAuthors(filteredAuthors.slice(startingIndex, endingIndex));
            updateLastUpdate();
            
            // Reset load more button
            loadMoreBtn.disabled = false;
            loadMoreBtn.textContent = 'LOAD_MORE_AUTHORS';
            loadMoreBtn.style.cursor = 'pointer';
            
            connectionStatus.textContent = 'ESTABLISHED';
            connectionStatus.style.color = 'var(--text-dim)';
        })
        .catch((err) => {
            setStatus('ERROR', true);
            connectionStatus.textContent = 'DISCONNECTED';
            connectionStatus.style.color = 'var(--gradient-red)';
            
            errorContainer.innerHTML = `
                <strong>NETWORK_ERROR:</strong> Failed to load authors data<br>
                <small>Error: ${err.message}</small>
                <br><br>
                <button onclick="loadAuthors()" class="terminal-btn" style="margin-top: 8px;">RETRY_CONNECTION</button>
            `;
            errorContainer.classList.remove('hide');
            
            authorGrid.innerHTML = '';
        })
        .finally(() => {
            isLoading = false;
        });
}

const fetchMoreAuthors = () => {
    if (isLoading) return;
    
    startingIndex += 8;
    endingIndex += 8;

    const authorsToShow = filteredAuthors.slice(startingIndex, endingIndex);
    
    if (authorsToShow.length > 0) {
        displayAuthors(authorsToShow, true);
    }
    
    // Check if we've reached the end
    if (filteredAuthors.length <= endingIndex) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'NO_MORE_AUTHORS';
        loadMoreBtn.style.cursor = 'not-allowed';
    }
    
    updateStats();
};

const displayAuthors = (authors, append = false) => {
    if (!append) {
        authorGrid.innerHTML = '';
    }

    if (authors.length === 0) {
        authorGrid.innerHTML = `
            <div class="error-msg">
                NO_AUTHORS_FOUND
                ${searchInput.value ? ` for "${searchInput.value}"` : ''}
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();
    
    authors.forEach(({ author, image, url, bio }, index) => {
        const card = document.createElement('div');
        card.className = 'author-card';
        card.innerHTML = `
            <div class="author-header">
                <img class="author-avatar" src="${image}" alt="${author} avatar" loading="lazy" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjM1IiB5PSIzOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCI+QVZBVEFSPC90ZXh0Pgo8L3N2Zz4K'">
                <div class="author-name">${author}</div>
            </div>
            <div class="author-body">
                <p class="author-bio">${bio && bio.length > 120 ? bio.slice(0, 120) + '...' : bio || 'No biography available'}</p>
                <a class="author-link" href="${url}" target="_blank" rel="noopener noreferrer">VIEW_PROFILE →</a>
            </div>
        `;
        fragment.appendChild(card);
    });
    
    authorGrid.appendChild(fragment);
};

// Search functionality
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredAuthors = authorDataArr;
    } else {
        filteredAuthors = authorDataArr.filter(author => 
            author.author.toLowerCase().includes(searchTerm) ||
            (author.bio && author.bio.toLowerCase().includes(searchTerm))
        );
    }
    
    startingIndex = 0;
    endingIndex = 8;
    loadMoreBtn.disabled = false;
    loadMoreBtn.textContent = 'LOAD_MORE_AUTHORS';
    loadMoreBtn.style.cursor = 'pointer';
    
    // Update load more button visibility
    if (filteredAuthors.length <= 8) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'NO_MORE_AUTHORS';
        loadMoreBtn.style.cursor = 'not-allowed';
    }
    
    displayAuthors(filteredAuthors.slice(startingIndex, endingIndex));
    updateStats();
}

// Debounced search
let searchTimeout;
searchInput.addEventListener('input', function(e) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSearch, 300);
});

// Event listeners
loadMoreBtn.addEventListener('click', fetchMoreAuthors);

refreshBtn.addEventListener('click', function() {
    if (isLoading) return;
    
    startingIndex = 0;
    endingIndex = 8;
    searchInput.value = '';
    connectionStatus.textContent = 'ESTABLISHED';
    connectionStatus.style.color = 'var(--text-dim)';
    loadAuthors();
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+R or F5 to refresh
    if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault();
        refreshBtn.click();
    }
    
    // / or Ctrl+K to focus search
    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // Escape to clear search
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        performSearch();
    }
    
    // Enter to load more when search is focused
    if (e.key === 'Enter' && document.activeElement === searchInput) {
        performSearch();
    }
});

// Auto-refresh every 5 minutes if visible
setInterval(() => {
    if (document.visibilityState === 'visible' && !isLoading) {
        const lastUpdateTime = new Date().getTime() - new Date(lastUpdate.textContent).getTime();
        // Only auto-refresh if data is more than 5 minutes old
        if (lastUpdateTime > 300000) {
            loadAuthors();
        }
    }
}, 60000); // Check every minute

// Handle visibility change
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        connectionStatus.textContent = 'ACTIVE';
        connectionStatus.style.color = 'var(--gradient-blue)';
    } else {
        connectionStatus.textContent = 'BACKGROUND';
        connectionStatus.style.color = 'var(--text-dim)';
    }
});

// Handle window controls (visual only)
document.querySelector('.control.close').addEventListener('click', function() {
    if (confirm('Close application?')) {
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; color: white; font-family: 'Geist Mono', monospace;">
                <div style="text-align: center;">
                    <div style="font-size: 2em; margin-bottom: 20px;">APPLICATION_CLOSED</div>
                    <div style="color: var(--text-dim);">Refresh page to restart</div>
                </div>
            </div>
        `;
    }
});

document.querySelector('.control.minimize').addEventListener('click', function() {
    document.body.style.opacity = '0.7';
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 1000);
});

document.querySelector('.control.maximize').addEventListener('click', function() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
});

// Handle image loading errors
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG' && e.target.classList.contains('author-avatar')) {
        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjM1IiB5PSIzOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtZmFtaWx5PSJBcmlhbCI+QVZBVEFSPC90ZXh0Pgo8L3N2Zz4K';
    }
}, true);

// Export functions for global access (for retry button)
window.loadAuthors = loadAuthors;
window.performSearch = performSearch;

// Initialize tooltips
searchInput.title = "Press / or Ctrl+K to focus";
refreshBtn.title = "Press Ctrl+R to refresh";
loadMoreBtn.title = "Load 8 more authors";