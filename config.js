// Application Configuration
module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        environment: process.env.NODE_ENV || 'development'
    },

    // arXiv API Configuration
    arxiv: {
        baseUrl: 'http://export.arxiv.org/api/query',
        maxResults: 10,
        timeout: 30000, // Increased to 30 seconds
        userAgent: 'arXiv-Fetcher/1.0 (https://github.com/your-repo)',
        cacheMaxAge: 300 // 5 minutes
    },

    // Valid arXiv Categories
    categories: {
        'Computer Science': {
            'cs.AI': 'Artificial Intelligence',
            'cs.CL': 'Computation and Language',
            'cs.CV': 'Computer Vision and Pattern Recognition',
            'cs.LG': 'Machine Learning',
            'cs.NE': 'Neural and Evolutionary Computing',
            'cs.RO': 'Robotics'
        },
        'Mathematics': {
            'math.AG': 'Algebraic Geometry',
            'math.AT': 'Algebraic Topology',
            'math.AP': 'Analysis of PDEs',
            'math.CT': 'Category Theory',
            'math.CA': 'Classical Analysis and ODEs'
        },
        'Physics': {
            'physics.acc-ph': 'Accelerator Physics',
            'physics.ao-ph': 'Atmospheric and Oceanic Physics',
            'physics.app-ph': 'Applied Physics',
            'quant-ph': 'Quantum Physics'
        },
        'Statistics': {
            'stat.ML': 'Machine Learning',
            'stat.TH': 'Statistics Theory'
        }
    },

    // Frontend Configuration
    frontend: {
        maxTitleLength: 100,
        maxSummaryLength: 300,
        apiBase: '/api'
    },

    // Error Messages
    messages: {
        errors: {
            categoryRequired: 'Category parameter is required',
            invalidCategory: 'Invalid category. Please select a valid category from the dropdown.',
            timeout: 'Request timeout. Please try again.',
            apiError: 'arXiv API error. Please try again later.',
            fetchError: 'Failed to fetch data from arXiv. Please try again later.',
            parseError: 'Failed to parse XML response from arXiv',
            noPapers: 'No papers found for this category.',
            paperNotFound: 'Paper details not found',
            networkError: 'Network error. Please check your internet connection and try again.'
        },
        success: {
            serverRunning: 'Server is running on http://localhost:',
            openBrowser: 'Open this URL in your browser to use the app.',
            environment: 'Environment:'
        }
    }
}; 