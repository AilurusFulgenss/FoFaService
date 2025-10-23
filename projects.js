// Configuration
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
        projects: 'https://healing-deer-4066e16ac3.strapiapp.com/api/project-and-activitie',
        // --- NEW: API สำหรับดึงยอดรวมวิว ---
        globalView: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global-view'
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
        
        // NEW: ดึง Global View พร้อมกัน
        const [globalRes, projectsRes, globalViewRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.projects),
            fetch(CONFIG.API_ENDPOINTS.globalView)
        ]);

        if (!globalRes.ok || !projectsRes.ok || !globalViewRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const globalData = await globalRes.json();
        const projectsDataResponse = await projectsRes.json();
        const globalViewData = await globalViewRes.json();

        hideLoading();
        // NEW: ส่ง globalViewData เข้าไปใน initializeWebsite
        initializeWebsite(globalData.data, projectsDataResponse.data, globalViewData.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoading();
        showErrorMessage();
    }
}

function showLoading() {
    const loadingHTML = `
        <div class="loading">
            <span>กำลังโหลด...</span>
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
function initializeWebsite(globalData, projectsDataResponse, globalViewData) {
    projectsData = projectsDataResponse;
    
    renderHeader(globalData.Header);
    renderProjects(projectsDataResponse.Card);
    renderFooter(globalData.Footer, globalViewData);
}

// Render functions
function renderHeader(headerData) {
    const header = getElement("header");
    const navLinks = headerData.navItems
        .map(item => {
            let href = item.href;
            
            // Navigation logic
            if (item.label.toLowerCase().includes('หน้าแรก')) {
                href = 'index.html';
            }
            else if (item.label.toLowerCase().includes('กิจกรรมบริการวิชาการแก่สังคม')) {
                href = 'activity-video.html';
            }
            else if (item.label.toLowerCase().includes('โครงการและกิจกรรม')) {
                href = 'projects.html';
            }
            else if (item.label.toLowerCase().includes('งานงบประมาณ')) {
                href = 'budget.html';
            }
            
            // Add active class for current page
            const activeClass = href === 'projects.html' ? ' active' : '';
            
            return `<a href="${href}" class="${activeClass.trim()}">${item.label}</a>`;
        })
        .join("");

    header.innerHTML = `
        <div class="header-container">
            <img src="${headerData.Logo.Logo.url}" alt="Logo" class="logo">
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

        const quarterHeader = document.querySelector(`#quarter-${quarterId} .quarter-header h2`);
        if (quarterHeader && quarterData.Title && quarterData.Title.title) {
            quarterHeader.textContent = quarterData.Title.title;
        }

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
        imageSection = `
            <div class="project-images single-image">
                <div style="width: 100%; height: 100%; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 1.4rem;">
                    ไม่มีรูปภาพ
                </div>
            </div>
        `;
    } else if (images.length === 1) {
        imageSection = `
            <div class="project-images single-image">
                <img src="${images[0].url}" alt="${project.Heading}" loading="lazy">
            </div>
        `;
    } else {
        const displayImages = images.slice(0, 4);
        const hasMoreImages = images.length > 4;
        
        imageSection = `
            <div class="project-images multi-image">
                ${displayImages.map((img, index) => {
                    if (index === 3 && hasMoreImages) {
                        return `
                            <div style="position: relative;">
                                <img src="${img.url}" alt="${project.Heading}" loading="lazy">
                                <div class="see-more-overlay">
                                    +${images.length - 3} more
                                </div>
                            </div>
                        `;
                    }
                    return `<img src="${img.url}" alt="${project.Heading}" loading="lazy">`;
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

// **!!! EDITED: ปรับปรุง renderFooter เพื่อแสดงยอดวิว !!!**
// **!! NEW: ปรับปรุง renderFooter ให้อ่านค่าจาก data.totalViews โดยตรง !!**
function renderFooter(footerData, globalViewData = null) {
    const footer = getElement("footer");
    const socialIcons = footerData.Icon.slice(1).map(icon => `
        <a href="${icon.href}" target="_blank">
            <img src="${icon.Logo.url}" alt="${icon.label}">
        </a>
    `).join("");

    // เปลี่ยนจาก .attributes.totalViews เป็น .totalViews
    const totalViews = globalViewData?.totalViews ?? 'N/A'; 
    
    const viewCounterHTML = `
        <div class="view-counter" style="
            text-align: center; 
            margin-top: 2rem; 
            padding-top: 1rem; 
            border-top: 1px solid #ccc;
            font-size: 1.4rem; 
            color: #555;
            width: 100%;
        ">
            <i class="fas fa-eye"></i> จำนวนผู้เข้าชม: 
            <span style="font-weight: 700; color: var(--brown);">${totalViews}</span>
        </div>
    `;

    footer.innerHTML = `
        <div class="footer-container">
            <div class="footer-left">
                <img src="${footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo">
                <div class="footer-socials">${socialIcons}</div>
                <p class="footer-text">${footerData.text}</p>
            </div>
            <div class="footer-right">
                ${footerData.map?.map || ''}
            </div>
        </div>
        ${viewCounterHTML}
    `;
    
    if (footer) {
        const style = document.createElement('style');
        style.textContent = `
            .view-counter i { margin-right: 0.5rem; color: #8A411B; }
            .footer-container { margin-bottom: 2rem; }
        `;
        document.head.appendChild(style); 
    }
}

// Scrolling functions
function scrollProjects(quarterId, direction) {
    const container = getElement(`projects-${quarterId}`);
    if (!container) return;
    
    const cardWidth = 400; 
    const gap = 30; 
    const scrollAmount = (cardWidth + gap) * 2; 
    
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
    });
}
function openProjectModal(projectId) {
    window.location.href = `activity-detail.html?id=${projectId}`;
}

// Error handling for images
function handleImageError(img) {
    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuC5hOC4oeC5iOC4oeC4teC4o+C4ueC4m+C4oDwvdGV4dD48L3N2Zz4=';
    img.alt = 'ไม่มีรูปภาพ';
}

// Add global error handler for images
document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            handleImageError(e.target);
        }
    }, true);
    
    fetchData();
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