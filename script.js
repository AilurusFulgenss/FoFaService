// Configuration
const CONFIG = {
    STRAPI_URL: "https://healing-deer-4066e16ac3.strapiapp.com",
    SLIDER_INTERVAL: 4000,
    API_ENDPOINTS: {
        global: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global',
        landing: 'https://healing-deer-4066e16ac3.strapiapp.com/api/landing-page',
        // --- NEW: API สำหรับติดตามและนับวิว ---
        viewTracker: 'https://healing-deer-4066e16ac3.strapiapp.com/api/views-tracker/track',
        globalView: 'https://healing-deer-4066e16ac3.strapiapp.com/api/global-view' 
    }
};

// State management
let sliderInterval;
let currentSlideIndex = 0;

// Utility functions
const createElement = (tag, className, innerHTML) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
};

const getElement = (id) => document.getElementById(id);

// Helper function to find blocks
function findBlock(blocks, component) {
    return blocks.find(block => block.__component === component);
}

// **!!! NEW: ฟังก์ชันสำหรับสั่งนับวิว !!!**
async function trackPageView() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINTS.viewTracker, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            console.warn(`View tracking failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error tracking page view:', error);
    }
}

// API functions
async function fetchData() {
    try {
        // NEW: ดึง Global View พร้อมกัน
        const [globalRes, landingRes, globalViewRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.landing),
            fetch(CONFIG.API_ENDPOINTS.globalView)
        ]);

        if (!globalRes.ok || !landingRes.ok || !globalViewRes.ok) {
            throw new Error('Failed to fetch primary data'); 
        }

        const globalData = await globalRes.json();
        const landingData = await landingRes.json();
        const globalViewData = await globalViewRes.json();

        // ส่งยอดวิวรวมเข้าไปใน initializeWebsite
        initializeWebsite(globalData.data, landingData.data, globalViewData.data);
        
        // **!!! NEW: สั่งนับวิวทันทีหลังจากโหลดข้อมูลเสร็จ !!!**
        trackPageView(); 
        
    } catch (error) {
        console.error('Error fetching data:', error);
        document.body.innerHTML = '<div style="text-align: center; padding: 5rem; font-size: 2rem; color: red;">Failed to load website data. Please try again later.</div>';
    }
}

// Initialize website
function initializeWebsite(globalData, landingData, globalViewData) {
    const blocks = landingData.blocks;
    
    renderHeader(globalData.Header);
    renderHero(findBlock(blocks, "blocks.hero"));
    renderSectionHeading(findBlock(blocks, "blocks.section-heading"));
    renderCards(findBlock(blocks, "blocks.card-grid"));
    renderYouTube(findBlock(blocks, "blocks.section-youtube"));
    renderCalendar(findBlock(blocks, "blocks.calendar"));
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
            const activeClass = href === 'index.html' ? ' active' : '';
            
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

function renderHero(heroBlock) {
    if (!heroBlock) return;
    
    const container = getElement("hero-slider");
    const images = heroBlock.HeroPicture;

    images.forEach((img, index) => {
        const imgElement = createElement('img');
        imgElement.src = img.Image.url;
        imgElement.alt = `Hero image ${index + 1}`;
        if (index === 0) imgElement.classList.add('active');
        container.appendChild(imgElement);
    });

    const indicatorsContainer = container.querySelector('.indicators');
    images.forEach((_, index) => {
        const indicator = createElement('span', index === 0 ? 'indicator active' : 'indicator');
        indicator.dataset.index = index;
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    container.querySelector('.prev').addEventListener('click', () => changeSlide(-1));
    container.querySelector('.next').addEventListener('click', () => changeSlide(1));

    startSlider(images.length);
}

function renderSectionHeading(headingBlock) {
    if (!headingBlock) return;
    
    getElement("activity-heading").textContent = headingBlock.Heading;
    getElement("activity-subheading").textContent = headingBlock.subHeading;
}

function renderCards(cardBlock) {
    if (!cardBlock || !cardBlock.Card) return;

    const container = getElement("cards-container");

    container.innerHTML = cardBlock.Card.map(card => {
        const imageUrl = card.cardImage?.[0]?.url 
            ? card.cardImage[0].url 
            : 'placeholder.jpg'; 

        return `
            <div class="card">
                <img src="${imageUrl}" alt="${card.Heading}">
                <div class="card-content">
                    <h3>${card.Heading}</h3>
                    <p>${card.text}</p>
                </div>
            </div>
        `;
    }).join("");
}


function renderYouTube(youtubeBlock) {
    if (!youtubeBlock || !youtubeBlock.Clip) return;
    
    const container = getElement("youtube-section");
    
    container.innerHTML = youtubeBlock.Clip.map(clip => `
        <h3>${clip.Heading}</h3>
        <div class="youtube-container">
            ${clip.clip[0].children[0].text}
        </div>
    `).join("");
}

function renderCalendar(calendarBlock) {
    if (!calendarBlock) return;
    
    const container = getElement("calendar-section");
    
    container.innerHTML = `
        <h3>${calendarBlock.Title}</h3>
        <div class="calendar-container">
            ${calendarBlock.Calendar[0].children[0].text}
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

// Slider functions
function startSlider(totalSlides) {
    sliderInterval = setInterval(() => {
        changeSlide(1);
    }, CONFIG.SLIDER_INTERVAL);
}

function changeSlide(direction) {
    const images = document.querySelectorAll('#hero-slider img');
    const indicators = document.querySelectorAll('#hero-slider .indicator');
    
    currentSlideIndex = (currentSlideIndex + direction + images.length) % images.length;
    
    images.forEach(img => img.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));
    
    images[currentSlideIndex].classList.add('active');
    indicators[currentSlideIndex].classList.add('active');
    
    resetSliderInterval();
}

function goToSlide(index) {
    const images = document.querySelectorAll('#hero-slider img');
    const indicators = document.querySelectorAll('#hero-slider .indicator');
    
    images.forEach(img => img.classList.remove('active'));
    indicators.forEach(ind => ind.classList.remove('active'));
    
    images[index].classList.add('active');
    indicators[index].classList.add('active');
    
    currentSlideIndex = index;
    resetSliderInterval();
}

function resetSliderInterval() {
    clearInterval(sliderInterval);
    const images = document.querySelectorAll('#hero-slider img');
    if (images.length > 0) {
        startSlider(images.length);
    }
}

// Card scrolling
function scrollCards(direction) {
    const container = getElement("cards-container");
    const cardWidth = container.querySelector(".card").offsetWidth + 20; 
    
    container.scrollBy({
        left: direction * cardWidth * 2,
        behavior: "smooth"
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', fetchData);

// Handle page visibility for slider
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(sliderInterval);
    } else {
        const images = document.querySelectorAll('#hero-slider img');
        if (images.length > 0) {
            startSlider(images.length);
        }
    }
});