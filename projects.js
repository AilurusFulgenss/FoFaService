// Configuration
const CONFIG = {
    STRAPI_URL: "http://10.20.60.48:1337",
    API_ENDPOINTS: {
        global: 'http://10.20.60.48:1337/api/global',
        projects: 'http://10.20.60.48:1337/api/project-and-activitie'
    }
};

// Utility functions
const createElement = (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

const getElement = (id) => document.getElementById(id);

// Empty mock data - will use API data instead

// API functions
async function fetchData() {
    try {
        // Show loading state
        showLoadingState();
        
        // Fetch global data (header and footer)
        const globalRes = await fetch(CONFIG.API_ENDPOINTS.global);
        if (!globalRes.ok) {
            throw new Error('Failed to fetch global data');
        }
        const globalData = await globalRes.json();

        // Fetch projects data from API
        const projectsRes = await fetch(CONFIG.API_ENDPOINTS.projects);
        if (!projectsRes.ok) {
            throw new Error('Failed to fetch projects data');
        }
        const projectsData = await projectsRes.json();

        initializeWebsite(globalData.data, projectsData.data);
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 5rem; font-size: 2rem; color: red;">Failed to load website data. Please check API connection.</div>';
    }
}

function showLoadingState() {
    const containers = ['projects-quarter-1', 'projects-quarter-2', 'projects-quarter-3', 'projects-quarter-4'];
    containers.forEach(containerId => {
        const container = getElement(containerId);
        if (container) {
            container.innerHTML = '<div class="loading">Loading projects...</div>';
        }
    });
}

// Initialize website
function initializeWebsite(globalData, projectsData) {
    if (globalData) {
        renderHeader(globalData.Header);
        renderFooter(globalData.Footer);
    } else {
        // Fallback header and footer
        renderFallbackHeader();
        renderFallbackFooter();
    }
    renderProjects(projectsData);
}

// Render functions
function renderHeader(headerData) {
    const header = getElement("header");
    if (!header || !headerData) return;

    const navLinks = headerData.navItems
        .map(item => {
            const isActive = item.label.toLowerCase().includes('project') ? 'active' : '';
            return `<a href="${item.url}" class="${isActive}">${item.label}</a>`;
        })
        .join('');

    header.innerHTML = `
        <div class="header-container">
            <img src="${CONFIG.STRAPI_URL}${headerData.logo.url}" alt="Logo" class="logo">
            <nav class="navbar">
                ${navLinks}
            </nav>
        </div>
    `;
}

function renderFallbackHeader() {
    const header = getElement("header");
    if (!header) return;

    header.innerHTML = `
        <div class="header-container">
            <div class="logo-placeholder" style="width: 150px; height: 80px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: var(--brown); font-weight: bold;">FOFA</div>
            <nav class="navbar">
                <a href="index.html">Home</a>
                <a href="projects.html" class="active">Projects & Activities</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </nav>
        </div>
    `;
}

function renderProjects(projectsData) {
    if (!projectsData) {
        console.error('No projects data available');
        return;
    }

    // Handle different possible data structures from API
    let quarters = [];
    
    if (Array.isArray(projectsData)) {
        // If projectsData is an array, group by quarter
        quarters = groupProjectsByQuarter(projectsData);
    } else if (projectsData.quarters) {
        // If data has quarters structure
        quarters = projectsData.quarters;
    } else {
        // Try to extract quarters from API response
        quarters = extractQuartersFromAPI(projectsData);
    }

    quarters.forEach((quarter, index) => {
        const containerId = `projects-quarter-${index + 1}`;
        const container = getElement(containerId);
        
        if (!container) return;

        if (!quarter.projects || quarter.projects.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #666;">ไม่มีโครงการในไตรมาสนี้</div>';
            return;
        }

        const projectCards = quarter.projects.map(project => createProjectCard(project)).join('');
        container.innerHTML = projectCards;
    });
}

// Helper function to group projects by quarter if they come as a flat array
function groupProjectsByQuarter(projects) {
    const quarters = [
        { id: 1, title: "ไตรมาสที่ 1", projects: [] },
        { id: 2, title: "ไตรมาสที่ 2", projects: [] },
        { id: 3, title: "ไตรมาสที่ 3", projects: [] },
        { id: 4, title: "ไตรมาสที่ 4", projects: [] }
    ];

    projects.forEach(project => {
        const quarterIndex = (project.quarter || 1) - 1;
        if (quarters[quarterIndex]) {
            quarters[quarterIndex].projects.push(project);
        }
    });

    return quarters;
}

// Helper function to extract quarters from different API structures
function extractQuartersFromAPI(data) {
    // This function should be customized based on your actual API response structure
    // For now, return empty quarters that will show "no projects" message
    return [
        { id: 1, title: "ไตรมาสที่ 1", projects: [] },
        { id: 2, title: "ไตรมาสที่ 2", projects: [] },
        { id: 3, title: "ไตรมาสที่ 3", projects: [] },
        { id: 4, title: "ไตรมาสที่ 4", projects: [] }
    ];
}

function createProjectCard(project) {
    // Handle different possible image structures from API
    let images = [];
    
    if (project.images && Array.isArray(project.images)) {
        images = project.images;
    } else if (project.image) {
        images = [project.image];
    } else if (project.media) {
        images = Array.isArray(project.media) ? project.media : [project.media];
    }
    
    let imageContent = '';
    
    if (images.length === 0) {
        imageContent = `
            <div class="project-images single-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">
                    No Image Available
                </div>
            </div>
        `;
    } else if (images.length === 1) {
        const imageUrl = images[0].url || images[0].src || images[0];
        imageContent = `
            <div class="project-images single-image">
                <img src="${CONFIG.STRAPI_URL}${imageUrl}" alt="${project.title || 'Project'}" loading="lazy">
            </div>
        `;
    } else {
        const displayImages = images.slice(0, 4);
        const hasMore = images.length > 4;
        
        imageContent = `
            <div class="project-images multi-image">
                ${displayImages.slice(0, 3).map(img => {
                    const imageUrl = img.url || img.src || img;
                    return `<img src="${CONFIG.STRAPI_URL}${imageUrl}" alt="${project.title || 'Project'}" loading="lazy">`;
                }).join('')}
                <div style="position: relative;">
                    ${(() => {
                        const img = displayImages[3] || displayImages[0];
                        const imageUrl = img.url || img.src || img;
                        return `<img src="${CONFIG.STRAPI_URL}${imageUrl}" alt="${project.title || 'Project'}" loading="lazy">`;
                    })()}
                    ${hasMore ? `<div class="see-more-overlay">+${images.length - 3} more</div>` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="project-card" onclick="openProjectModal(${project.id || 0})">
            ${imageContent}
            <div class="project-content">
                <h3>${project.title || 'Untitled Project'}</h3>
                <p>${project.description || 'No description available'}</p>
            </div>
        </div>
    `;
}

function renderFooter(footerData) {
    const footer = getElement("footer");
    if (!footer || !footerData) return;

    const socialLinks = footerData.socialLinks
        .map(social => `<img src="${CONFIG.STRAPI_URL}${social.icon.url}" alt="${social.platform}">`)
        .join('');

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <img src="${CONFIG.STRAPI_URL}${footerData.logo.url}" alt="Footer Logo" class="footer-logo">
                <div class="footer-socials">
                    ${socialLinks}
                </div>
                <p class="footer-text">${footerData.description}</p>
            </div>
            <div class="footer-right">
                <p class="footer-text">${footerData.contactInfo}</p>
            </div>
        </div>
    `;
}

function renderFallbackFooter() {
    const footer = getElement("footer");
    if (!footer) return;

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <div class="footer-logo" style="width: 120px; height: 60px; background: var(--brown); border-radius: 5px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">FOFA</div>
                <div class="footer-socials">
                    <div style="width: 35px; height: 35px; background: #ddd; border-radius: 50%;"></div>
                    <div style="width: 35px; height: 35px; background: #ddd; border-radius: 50%;"></div>
                    <div style="width: 35px; height: 35px; background: #ddd; border-radius: 50%;"></div>
                </div>
                <p class="footer-text">Faculty of Fine Arts - Showcasing creativity and artistic excellence.</p>
            </div>
            <div class="footer-right">
                <p class="footer-text">Contact us for more information about our programs and activities.</p>
            </div>
        </div>
    `;
}

// Scroll functionality
function scrollProjects(quarterId, direction) {
    const container = getElement(`projects-${quarterId}`);
    if (!container) return;

    const scrollAmount = 400; // Width of one card + gap
    const currentScroll = container.scrollLeft;
    const newScroll = currentScroll + (direction * scrollAmount);

    container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
    });
}

// Modal functionality (placeholder)
function openProjectModal(projectId) {
    console.log('Opening project modal for ID:', projectId);
    // Implement modal functionality here
    alert(`Project ID: ${projectId}\nModal functionality can be implemented here.`);
}

// Smooth scroll behavior for navigation
function smoothScrollTo(element) {
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    fetchData();
    
    // Add smooth scroll behavior to anchor links
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.getAttribute('href').startsWith('#')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1);
            const targetElement = getElement(targetId);
            smoothScrollTo(targetElement);
        }
    });
});

// Handle window resize
window.addEventListener('resize', function() {
    // Recalculate scroll positions if needed
    const containers = document.querySelectorAll('.projects-container');
    containers.forEach(container => {
        // Reset scroll position on resize to prevent UI issues
        if (container.scrollLeft > 0) {
            container.scrollTo({ left: 0, behavior: 'smooth' });
        }
    });
});