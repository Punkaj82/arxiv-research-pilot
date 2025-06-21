// Configuration
const CONFIG = {
    API_BASE: '/api',
    MAX_TITLE_LENGTH: 100,
    MAX_SUMMARY_LENGTH: 300
};

// Global variables
let currentPapers = [];
let selectedPaper = null;
let audioPlayer = null;

// DOM Elements
const elements = {
    categorySelect: document.getElementById('category'),
    startDateInput: document.getElementById('startDate'),
    endDateInput: document.getElementById('endDate'),
    searchBtn: document.getElementById('searchBtn'),
    loadingDiv: document.getElementById('loading'),
    errorMessageDiv: document.getElementById('errorMessage'),
    papersGrid: document.getElementById('papersGrid'),
    resultsCount: document.getElementById('resultsCount'),
    voiceSection: document.getElementById('voiceSection'),
    selectedPaperDiv: document.getElementById('selectedPaper'),
    paperInfoDiv: document.getElementById('paperInfo'),
    podcastBtn: document.getElementById('podcastBtn'),
    classroomBtn: document.getElementById('classroomBtn'),
    fullAudioBtn: document.getElementById('fullAudioBtn'),
    audioPlayerDiv: document.getElementById('audioPlayer'),
    audioElement: document.getElementById('audioElement'),
    audioInfoDiv: document.getElementById('audioInfo'),
    closePlayerBtn: document.getElementById('closePlayer'),
    downloadAudioBtn: document.getElementById('downloadAudio'),
    shareAudioBtn: document.getElementById('shareAudio'),
    statusMessage: document.getElementById('statusMessage')
};

// Application state
let papersData = [];

// Utility functions
const utils = {
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    showError(message) {
        elements.errorMessageDiv.textContent = message;
        elements.errorMessageDiv.style.display = 'block';
    },

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <strong>✅ Success:</strong> ${message}
        `;
        elements.papersGrid.parentNode.insertBefore(successDiv, elements.papersGrid);
        
        // Remove success message after 3 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    },

    showLoading(show = true) {
        elements.loadingDiv.style.display = show ? 'block' : 'none';
        elements.searchBtn.disabled = show;
        elements.searchBtn.textContent = show ? 'Fetching...' : 'Fetch Papers';
    },

    switchView(view) {
        if (view === 'list') {
            elements.papersGrid.style.display = 'grid';
            elements.voiceSection.style.display = 'none';
        } else if (view === 'details') {
            elements.papersGrid.style.display = 'none';
            elements.voiceSection.style.display = 'block';
        }
    },

    validateDates() {
        const startDate = elements.startDateInput.value;
        const endDate = elements.endDateInput.value;

        // Clear previous validation messages
        this.clearValidationMessages();

        if (startDate && endDate && startDate > endDate) {
            this.showValidationError('startDate', 'Start date cannot be after end date');
            return false;
        }

        const today = new Date().toISOString().split('T')[0];
        if (startDate && startDate > today) {
            this.showValidationError('startDate', 'Start date cannot be in the future');
            return false;
        }
        if (endDate && endDate > today) {
            this.showValidationError('endDate', 'End date cannot be in the future');
            return false;
        }

        return true;
    },

    showValidationError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'validation-error';
        errorDiv.textContent = message;
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '0.8em';
        errorDiv.style.marginTop = '2px';
        
        field.style.borderColor = '#dc3545';
        field.parentNode.appendChild(errorDiv);
    },

    clearValidationMessages() {
        const errors = document.querySelectorAll('.validation-error');
        errors.forEach(error => error.remove());
        
        [elements.startDateInput, elements.endDateInput].forEach(field => {
            field.style.borderColor = '#ddd';
        });
    },

    formatDateForDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    clearDates() {
        elements.startDateInput.value = '';
        elements.endDateInput.value = '';
        this.clearValidationMessages();
        this.showSuccess('Date range cleared');
    },

    updateDateRangeInfo() {
        const startDate = elements.startDateInput.value;
        const endDate = elements.endDateInput.value;
        
        let info = '';
        if (startDate && endDate) {
            const start = this.formatDateForDisplay(startDate);
            const end = this.formatDateForDisplay(endDate);
            info = `Searching papers from ${start} to ${end}`;
        } else if (startDate) {
            const start = this.formatDateForDisplay(startDate);
            info = `Searching papers from ${start} onwards`;
        } else if (endDate) {
            const end = this.formatDateForDisplay(endDate);
            info = `Searching papers up to ${end}`;
        } else {
            info = 'Searching all available papers';
        }
        
        // Update or create info display
        let infoDiv = document.getElementById('date-range-info');
        if (!infoDiv) {
            infoDiv = document.createElement('div');
            infoDiv.id = 'date-range-info';
            infoDiv.className = 'date-range-info';
            elements.papersGrid.parentNode.insertBefore(infoDiv, elements.papersGrid);
        }
        infoDiv.textContent = info;
    },

    showStatus(message, type = 'info') {
        elements.statusMessage.textContent = message;
        elements.statusMessage.className = `status-message ${type} show`;
        
        setTimeout(() => {
            elements.statusMessage.classList.remove('show');
        }, 4000);
    }
};

// API functions
const api = {
    async fetchPapers(category, startDate, endDate) {
        let url = `${CONFIG.API_BASE}/papers?category=${encodeURIComponent(category)}`;
        
        if (startDate) {
            url += `&startDate=${encodeURIComponent(startDate)}`;
        }
        if (endDate) {
            url += `&endDate=${encodeURIComponent(endDate)}`;
        }
        
        console.log('Fetching from:', url);
        
        const response = await fetch(url);
        
            if (!response.ok) {
            const errorData = await response.json().catch(function() { return {}; });
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.papers || [];
    },

    parseXmlData(xmlText) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
        // Check for parsing errors
        const parseError = xmlDoc.getElementsByTagName('parsererror');
        if (parseError.length > 0) {
            throw new Error('Failed to parse XML response from arXiv');
        }
        
        return xmlDoc;
    },

    extractPaperData(entry, index) {
        try {
            const titleElement = entry.getElementsByTagName('title')[0];
            const summaryElement = entry.getElementsByTagName('summary')[0];
            const publishedElement = entry.getElementsByTagName('published')[0];
            
            const title = titleElement && titleElement.textContent ? titleElement.textContent.trim() : 'No title';
            const summary = summaryElement && summaryElement.textContent ? summaryElement.textContent.trim() : 'No summary';
            const published = publishedElement && publishedElement.textContent ? publishedElement.textContent.trim() : '';
            
            const authors = Array.from(entry.getElementsByTagName('author'))
                .map(function(author) {
                    const nameElement = author.getElementsByTagName('name')[0];
                    return nameElement && nameElement.textContent ? nameElement.textContent : null;
                })
                .filter(function(name) { return name !== null; })
                .join(', ') || 'Unknown authors';
            
            const links = entry.getElementsByTagName('link');
            const pdfLink = (links[1] && links[1].getAttribute('href')) || 
                           (links[0] && links[0].getAttribute('href')) || '#';

            return {
                index: index,
                title: utils.truncateText(title, CONFIG.MAX_TITLE_LENGTH),
                summary: utils.truncateText(summary, CONFIG.MAX_SUMMARY_LENGTH),
                authors: authors,
                pdfLink: pdfLink,
                published: published
            };
        } catch (error) {
            console.error('Error extracting paper data:', error);
            return null;
        }
    }
};

// UI functions
const ui = {
    createPaperListItem(paper) {
                const listItem = document.createElement('li');
        listItem.dataset.index = paper.index;
        listItem.className = 'paper-item';
        
        const publishedDate = paper.published ? utils.formatDateForDisplay(paper.published) : '';
        
        listItem.innerHTML = `
            <div class="paper-header">
                <strong class="paper-title">${paper.title}</strong>
                <span class="paper-authors">${paper.authors}</span>
                ${publishedDate ? `<span class="paper-date">Published: ${publishedDate}</span>` : ''}
            </div>
        `;
        const self = this;
        listItem.addEventListener('click', function() {
            self.showPaperDetails(paper.index);
        });
        return listItem;
    },

    displayPapers(papers) {
        elements.papersGrid.innerHTML = '';
        
        if (papers.length === 0) {
            elements.papersGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No papers found</h3>
                    <p>Try adjusting your search criteria or date range.</p>
                </div>
            `;
            elements.resultsCount.textContent = '0 papers found';
            elements.voiceSection.style.display = 'none';
            return;
        }

        elements.resultsCount.textContent = `${papers.length} papers found`;
        
        const papersHTML = papers.map((paper, index) => `
            <div class="paper-card" data-index="${index}" onclick="selectPaper(${index})">
                <div class="paper-title">${paper.title}</div>
                <div class="paper-authors">${paper.authors}</div>
                <div class="paper-summary">${paper.summary}</div>
                <div class="paper-meta">
                    <span class="paper-date">${utils.formatDateForDisplay(paper.published)}</span>
                    <a href="${paper.pdfUrl}" target="_blank" class="paper-link" onclick="event.stopPropagation()">
                        <i class="fas fa-external-link-alt"></i> PDF
                    </a>
                </div>
            </div>
        `).join('');
        
        elements.papersGrid.innerHTML = papersHTML;
    },

    showPaperDetails(index) {
        const paper = papersData[index];
        if (!paper) {
            utils.showError('Paper details not found');
            return;
        }

        elements.paperInfoDiv.innerHTML = `
            <div><strong>Title:</strong> ${paper.title}</div>
            <div><strong>Authors:</strong> ${paper.authors}</div>
            <div><strong>Published:</strong> ${utils.formatDateForDisplay(paper.published)}</div>
            <div><strong>Category:</strong> ${paper.category}</div>
        `;

        utils.switchView('details');
    }
};

// Main application logic
const app = {
    async fetchAndDisplayPapers(category, startDate, endDate) {
        try {
            utils.showLoading(true);
            utils.switchView('list');
            elements.papersGrid.innerHTML = '';

            // Fetch papers data
            const papers = await api.fetchPapers(category, startDate, endDate);
            
            // Debug logging
            console.log('Fetched papers:', papers);
            console.log('Papers length:', papers ? papers.length : 'undefined');
            
            if (!papers || !Array.isArray(papers)) {
                throw new Error('Invalid papers data received from server');
            }
            
            papersData = papers;

            // Display papers
            ui.displayPapers(papersData);
            
            // Show success message
            utils.showSuccess(`Found ${papersData.length} papers`);

        } catch (error) {
            console.error('Error fetching arXiv data:', error);
            utils.showError(error.message);
            
            // Show error in papers grid
            elements.papersGrid.innerHTML = `
                <div class="error-message" style="display: block; text-align: center; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #f44336; margin-bottom: 1rem;"></i>
                    <h3>Error Loading Papers</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="app.fetchAndDisplayPapers(elements.categorySelect.value, elements.startDateInput.value, elements.endDateInput.value)">
                        <i class="fas fa-refresh"></i> Try Again
                    </button>
                </div>
            `;
        } finally {
            utils.showLoading(false);
        }
    },

    init() {
        // Set default dates (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        elements.endDateInput.value = today.toISOString().split('T')[0];
        elements.startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];

        // Update date range info on load
        utils.updateDateRangeInfo();

        // Event listeners
        const self = this;
        elements.searchBtn.addEventListener('click', function() {
            const category = elements.categorySelect.value;
            const startDate = elements.startDateInput.value;
            const endDate = elements.endDateInput.value;
            
            if (!category) {
                utils.showError('Please select a category');
                return;
            }
            
            if (!utils.validateDates()) {
                return;
            }
            
            self.fetchAndDisplayPapers(category, startDate, endDate);
        });

        elements.startDateInput.addEventListener('change', utils.validateDates);
        elements.endDateInput.addEventListener('change', utils.validateDates);

        // New event listeners for voice features
        elements.podcastBtn.addEventListener('click', () => generateAudio('podcast'));
        elements.classroomBtn.addEventListener('click', () => generateAudio('classroom'));
        elements.fullAudioBtn.addEventListener('click', () => generateAudio('full'));
        elements.closePlayerBtn.addEventListener('click', closeAudioPlayer);
        elements.downloadAudioBtn.addEventListener('click', downloadAudio);
        elements.shareAudioBtn.addEventListener('click', shareAudio);

        // Initial fetch
        this.fetchAndDisplayPapers(elements.categorySelect.value, elements.startDateInput.value, elements.endDateInput.value);
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    app.init();
});

// New functions for voice features
async function generateAudio(type) {
    if (!selectedPaper) {
        utils.showError('Please select a paper first');
        return;
    }
    
    utils.showLoading(true);
    utils.showStatus(`Generating ${type} audio...`, 'info');
    
    try {
        const response = await fetch('/api/generate-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                paper: selectedPaper,
                type: type
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Play the generated audio (demo mode)
        playAudio(data.audioUrl, type, data.note);
        utils.showStatus(`${type} audio generated successfully! (Demo mode)`, 'success');
        
    } catch (error) {
        console.error('Error generating audio:', error);
        utils.showStatus(`Failed to generate ${type} audio: ${error.message}`, 'error');
    } finally {
        utils.showLoading(false);
    }
}

function playAudio(audioUrl, type, note = '') {
    // For demo mode, we'll show the text content instead of playing audio
    const typeLabels = {
        'podcast': '5-Minute Podcast Summary',
        'classroom': 'Classroom Lecture',
        'full': 'Full Paper Audio'
    };
    
    elements.audioInfoDiv.innerHTML = `
        <h4>${typeLabels[type]}</h4>
        <p><strong>Paper:</strong> ${selectedPaper.title}</p>
        <p><strong>Duration:</strong> ${type === 'podcast' ? '~5 minutes' : type === 'classroom' ? '~15 minutes' : '~45 minutes'}</p>
        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #2196f3;">
            <p style="margin: 0; color: #1976d2; font-weight: 600;">📝 Demo Mode</p>
            <p style="margin: 5px 0 0 0; color: #555; font-size: 0.9rem;">${note || 'This is a demonstration. In production, this would generate actual audio files using text-to-speech.'}</p>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.8rem;">The audio content has been generated as a text file. Click "Download" to view the content.</p>
        </div>
    `;
    
    // Hide the audio element in demo mode
    elements.audioElement.style.display = 'none';
    
    elements.audioPlayerDiv.style.display = 'block';
    elements.audioPlayerDiv.scrollIntoView({ behavior: 'smooth' });
}

function closeAudioPlayer() {
    elements.audioPlayerDiv.style.display = 'none';
    elements.audioElement.pause();
    elements.audioElement.currentTime = 0;
    elements.audioElement.style.display = 'block'; // Reset for next time
}

function downloadAudio() {
    if (elements.audioInfoDiv.querySelector('h4')) {
        const link = document.createElement('a');
        link.href = '/api/download-audio/paper_' + Date.now() + '.txt';
        link.download = `paper_audio_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        utils.showStatus('Audio content downloaded! (Text file)', 'success');
    }
}

function shareAudio() {
    if (navigator.share) {
        navigator.share({
            title: selectedPaper.title,
            text: `Listen to: ${selectedPaper.title}`,
            url: window.location.href
        }).then(() => {
            utils.showStatus('Shared successfully!', 'success');
        }).catch(error => {
            console.log('Share failed:', error);
            utils.showStatus('Share feature not available', 'error');
        });
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            utils.showStatus('URL copied to clipboard!', 'success');
        }).catch(() => {
            utils.showStatus('Share feature not available', 'error');
        });
    }
}

// Global function for paper selection (needed for onclick handlers)
function selectPaper(index) {
    // Remove previous selection
    const previousSelected = document.querySelector('.paper-card.selected');
    if (previousSelected) {
        previousSelected.classList.remove('selected');
    }
    
    // Add selection to clicked card
    const selectedCard = document.querySelector(`[data-index="${index}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    selectedPaper = papersData[index];
    
    // Update selected paper info
    elements.paperInfoDiv.innerHTML = `
        <div><strong>Title:</strong> ${selectedPaper.title}</div>
        <div><strong>Authors:</strong> ${selectedPaper.authors}</div>
        <div><strong>Published:</strong> ${utils.formatDateForDisplay(selectedPaper.published)}</div>
        <div><strong>Category:</strong> ${selectedPaper.category}</div>
    `;
    
    // Show voice section
    elements.voiceSection.style.display = 'block';
    elements.voiceSection.scrollIntoView({ behavior: 'smooth' });
    
    utils.showStatus('Paper selected! Choose your audio format.', 'info');
}

// Add some CSS for no-results
const style = document.createElement('style');
style.textContent = `
    .no-results {
        text-align: center;
        padding: 60px 20px;
        color: #666;
        grid-column: 1 / -1;
    }
    
    .no-results i {
        display: block;
        margin-bottom: 20px;
    }
    
    .no-results h3 {
        margin-bottom: 10px;
        color: #333;
    }
`;
document.head.appendChild(style);

// Feature functions
function showDiscoveryTips() {
    const tips = [
        "💡 Use specific categories to narrow down your search",
        "📅 Set date ranges to find recent research",
        "🔍 Try different categories to discover related fields",
        "📊 Check paper citations and references for more papers",
        "⭐ Save interesting papers for later reading"
    ];
    
    const tipsHTML = tips.map(tip => `<li>${tip}</li>`).join('');
    
    utils.showStatus(`
        <div style="text-align: left;">
            <h4><i class="fas fa-lightbulb"></i> Discovery Tips:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                ${tipsHTML}
            </ul>
        </div>
    `, 'info');
}

function showReadingMode() {
    utils.showStatus(`
        <div style="text-align: left;">
            <h4><i class="fas fa-book-open"></i> Reading Mode Features:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>📖 Read paper abstracts and summaries</li>
                <li>📄 Access full PDF papers directly</li>
                <li>🔍 Search within paper content</li>
                <li>📝 Take notes while reading</li>
                <li>💾 Save papers for offline reading</li>
            </ul>
            <p style="margin-top: 10px;"><strong>Tip:</strong> Click on any paper card to view details and access the PDF.</p>
        </div>
    `, 'info');
}

function showAudioOptions() {
    utils.showStatus(`
        <div style="text-align: left;">
            <h4><i class="fas fa-headphones"></i> Audio Options:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>🎙️ <strong>Podcast Summary:</strong> 5-minute concise overview</li>
                <li>🎓 <strong>Classroom Lecture:</strong> Educational format with explanations</li>
                <li>📖 <strong>Full Audio:</strong> Complete paper narration</li>
            </ul>
            <p style="margin-top: 10px;"><strong>How to use:</strong> Select a paper first, then choose your preferred audio format.</p>
        </div>
    `, 'info');
} 