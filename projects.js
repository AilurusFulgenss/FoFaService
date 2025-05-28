// Configuration
const CONFIG = {
    STRAPI_URL: "http://10.20.60.45:1337",
    API_ENDPOINTS: {
        global: 'http://10.20.60.45:1337/api/global',
        projects: 'http://10.20.60.45:1337/api/project-and-activitie'
    }
};

// State management
let projectsData = null;

// Utility functions
const createElement = (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

const getElement = (id) => document.getElementById(id);

// API functions
async function fetchData() {
    try {
        showLoading();
        
        const [globalRes, projectsRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.projects)
        ]);

        if (!globalRes.ok || !projectsRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const globalData = await globalRes.json();
        const projectsDataResponse = await projectsRes.json();

        hideLoading();
        initializeWebsite(globalData.data, projectsDataResponse.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoading();
        showErrorMessage();
    }
}

function showLoading() {
    const loadingHTML = `
        <div class="loading">
            <span>Loading projects...</span>
        </div>
    `;
    
    for (let i = 1; i <= 4; i++) {
        const container = getElement(`projects-quarter-${i}`);
        if (container) {
            container.innerHTML = loadingHTML;
        }
    }
}

function hideLoading() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => el.remove());
}

function showErrorMessage() {
    const errorHTML = `
        <div style="text-align: center; padding: 3rem; color: #666; font-size: 1.6rem;">
            <p>ไม่สามารถโหลดข้อมูลโปรเจคได้ กรุณาลองใหม่อีกครั้ง</p>
        </div>
    `;
    
    for (let i = 1; i <= 4; i++) {
        const container = getElement(`projects-quarter-${i}`);
        if (container) {
            container.innerHTML = errorHTML;
        }
    }
}

// Initialize website
function initializeWebsite(globalData, projectsDataResponse) {
    projectsData = projectsDataResponse;
    
    renderHeader(globalData.Header);
    renderProjects(projectsDataResponse.Card);
    renderFooter(globalData.Footer);
}

// Render functions
function renderHeader(headerData) {
    const header = getElement("header");
    const navLinks = headerData.navItems
        .map(item => {
            let href = item.href;
            let activeClass = '';
            
            // Set active class for current page
            if (item.label.toLowerCase().includes('โครงการและกิจกรรม')) {
                activeClass = ' active';
                href = 'projects.html';
            }
            // Handle other navigation links
            else if (item.label.toLowerCase().includes('กิจกรรมบริการวิชาการแก่สังคม')) {
                href = 'activity-video.html';
            }
            else if (item.label.toLowerCase().includes('หน้าแรก')) {
                href = 'index.html';
            }
            else if (item.label.toLowerCase().includes('งานงบประมาณ')) {
                href = 'budget.html';
            }
            
            return `<a href="${href}" class="${activeClass.trim()}">${item.label}</a>`;
        })
        .join("");

    header.innerHTML = `
        <div class="header-container">
            <img src="${CONFIG.STRAPI_URL + headerData.Logo.Logo.url}" alt="Logo" class="logo">
            <nav class="navbar">${navLinks}</nav>
        </div>
    `;
}

function renderProjects(cardsData) {
    if (!cardsData || !Array.isArray(cardsData)) {
        console.error('Invalid projects data');
        return;
    }

    cardsData.forEach((quarterData, index) => {
        const quarterId = index + 1;
        const container = getElement(`projects-quarter-${quarterId}`);
        
        if (!container) return;

        // Update quarter title if available
        const quarterHeader = document.querySelector(`#quarter-${quarterId} .quarter-header h2`);
        if (quarterHeader && quarterData.Title && quarterData.Title.title) {
            quarterHeader.textContent = quarterData.Title.title;
        }

        // Render project cards
        if (quarterData.Card && Array.isArray(quarterData.Card)) {
            container.innerHTML = quarterData.Card.map(project => 
                createProjectCard(project)
            ).join("");
        } else {
            container.innerHTML = '<p style="text-align: center; color: #666; font-size: 1.6rem; padding: 3rem;">ไม่มีโปรเจคในไตรมาสนี้</p>';
        }
    });
}

function createProjectCard(project) {
    const images = project.cardImage || [];
    const hasMultipleImages = images.length > 1;
    
    let imageSection = '';
    
    if (images.length === 0) {
        // No images - show placeholder
        imageSection = `
            <div class="project-images single-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 1.4rem;">
                    ไม่มีรูปภาพ
                </div>
            </div>
        `;
    } else if (images.length === 1) {
        // Single image
        imageSection = `
            <div class="project-images single-image">
                <img src="${CONFIG.STRAPI_URL + images[0].url}" alt="${project.Heading}" loading="lazy">
            </div>
        `;
    } else {
        // Multiple images (show first 4, with "see more" overlay on 4th if more than 4)
        const displayImages = images.slice(0, 4);
        const hasMoreImages = images.length > 4;
        
        imageSection = `
            <div class="project-images multi-image">
                ${displayImages.map((img, index) => {
                    if (index === 3 && hasMoreImages) {
                        return `
                            <div style="position: relative;">
                                <img src="${CONFIG.STRAPI_URL + img.url}" alt="${project.Heading}" loading="lazy">
                                <div class="see-more-overlay">
                                    +${images.length - 3} more
                                </div>
                            </div>
                        `;
                    }
                    return `<img src="${CONFIG.STRAPI_URL + img.url}" alt="${project.Heading}" loading="lazy">`;
                }).join("")}
            </div>
        `;
    }

    return `
        <div class="project-card" onclick="openProjectModal('${project.id}')">
            ${imageSection}
            <div class="project-content">
                <h3>${project.Heading || 'ไม่มีหัวข้อ'}</h3>
                <p>${project.text || 'ไม่มีรายละเอียด'}</p>
            </div>
        </div>
    `;
}

function renderFooter(footerData) {
    const footer = getElement("footer");
    const socialIcons = footerData.Icon.slice(1).map(icon => `
        <a href="${icon.href}" target="_blank">
            <img src="${CONFIG.STRAPI_URL + icon.Logo.url}" alt="${icon.label}">
        </a>
    `).join("");

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <img src="${CONFIG.STRAPI_URL + footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo">
                <div class="footer-socials">${socialIcons}</div>
                <p class="footer-text">${footerData.text}</p>
            </div>
            <div class="footer-right">
                ${footerData.map?.map || ''}
            </div>
        </div>
    `;
}

// Scrolling functions
function scrollProjects(quarterId, direction) {
    const container = getElement(`projects-${quarterId}`);
    if (!container) return;
    
    const cardWidth = 400; // Fixed card width from CSS
    const gap = 30; // Gap between cards
    const scrollAmount = (cardWidth + gap) * 2; // Scroll 2 cards at a time
    
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
    });
}

// Modal functions (for future enhancement)
function openProjectModal(projectId) {
    // This function can be enhanced to show a modal with full project details
    console.log('Opening project modal for ID:', projectId);
    
    // For now, just show an alert
    // In the future, you can create a modal to display all images and full project details
    alert('คลิกเพื่อดูรายละเอียดโปรเจค (ฟีเจอร์นี้จะพัฒนาในอนาคต)');
}

// Navigation helper functions
function navigateToHome() {
    window.location.href = 'index.html';
}

function navigateToActivities() {
    window.location.href = 'activity-video.html';
}

// Error handling for images
function handleImageError(img) {
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuC5hOC4oeC5iOC4oeC4teC4o+C4ueC4m+C4oDwvdGV4dD48L3N2Zz4=';
    img.alt = 'ไม่มีรูปภาพ';
}

// Add global error handler for images
document.addEventListener('DOMContentLoaded', () => {
    // Add error handling for dynamically loaded images
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            handleImageError(e.target);
        }
    }, true);
    
    // Initialize the website
    fetchData();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any animations or intervals when page is hidden
        console.log('Page hidden - pausing activities');
    } else {
        // Resume when page is visible
        console.log('Page visible - resuming activities');
    }
});

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Responsive scroll button visibility
function updateScrollButtons() {
    for (let i = 1; i <= 4; i++) {
        const container = getElement(`projects-quarter-${i}`);
        const wrapper = container?.parentElement;
        
        if (container && wrapper) {
            const prevBtn = wrapper.querySelector('.scroll-btn.prev');
            const nextBtn = wrapper.querySelector('.scroll-btn.next');
            
            if (prevBtn && nextBtn) {
                // Check if scrolling is needed
                const needsScrolling = container.scrollWidth > container.clientWidth;
                
                if (!needsScrolling) {
                    prevBtn.style.display = 'none';
                    nextBtn.style.display = 'none';
                } else {
                    prevBtn.style.display = 'block';
                    nextBtn.style.display = 'block';
                    
                    // Update button states based on scroll position
                    prevBtn.style.opacity = container.scrollLeft > 0 ? '1' : '0.5';
                    nextBtn.style.opacity = 
                        container.scrollLeft < (container.scrollWidth - container.clientWidth) ? '1' : '0.5';
                }
            }
        }
    }
}

// Update scroll buttons on scroll and resize
window.addEventListener('resize', updateScrollButtons);
document.addEventListener('scroll', updateScrollButtons);