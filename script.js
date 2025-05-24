// Configuration
const CONFIG = {
    STRAPI_URL: "http://localhost:1337",
    SLIDER_INTERVAL: 4000,
    API_ENDPOINTS: {
        global: 'http://localhost:1337/api/global',
        landing: 'http://localhost:1337/api/landing-page'
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

// API functions
async function fetchData() {
    try {
        const [globalRes, landingRes] = await Promise.all([
            fetch(CONFIG.API_ENDPOINTS.global),
            fetch(CONFIG.API_ENDPOINTS.landing)
        ]);

        if (!globalRes.ok || !landingRes.ok) {
            throw new Error('Failed to fetch data');
        }

        const globalData = await globalRes.json();
        const landingData = await landingRes.json();

        initializeWebsite(globalData.data, landingData.data);
    } catch (error) {
        console.error('Error fetching data:', error);
        // Show error message to user
        document.body.innerHTML = '<div style="text-align: center; padding: 5rem; font-size: 2rem; color: red;">Failed to load website data. Please try again later.</div>';
    }
}

// Initialize website
function initializeWebsite(globalData, landingData) {
    const blocks = landingData.blocks;
    
    renderHeader(globalData.Header);
    renderHero(findBlock(blocks, "blocks.hero"));
    renderSectionHeading(findBlock(blocks, "blocks.section-heading"));
    renderCards(findBlock(blocks, "blocks.card-grid"));
    renderYouTube(findBlock(blocks, "blocks.section-youtube"));
    renderCalendar(findBlock(blocks, "blocks.calendar"));
    renderFooter(globalData.Footer);
}

// Helper function to find blocks
function findBlock(blocks, component) {
    return blocks.find(block => block.__component === component);
}

// Render functions
function renderHeader(headerData) {
    const header = getElement("header");
    const navLinks = headerData.navItems
        .map(item => `<a href="${item.href}">${item.label}</a>`)
        .join("");

    header.innerHTML = `
        <div class="header-container">
            <img src="${CONFIG.STRAPI_URL + headerData.Logo.Logo.url}" alt="Logo" class="logo">
            <nav class="navbar">${navLinks}</nav>
        </div>
    `;
}

function renderHero(heroBlock) {
    if (!heroBlock) return;
    
    const container = getElement("hero-slider");
    const images = heroBlock.HeroPicture;

    // Add images
    images.forEach((img, index) => {
        const imgElement = createElement('img');
        imgElement.src = CONFIG.STRAPI_URL + img.Image.url;
        imgElement.alt = `Hero image ${index + 1}`;
        if (index === 0) imgElement.classList.add('active');
        container.appendChild(imgElement);
    });

    // Create indicators
    const indicatorsContainer = container.querySelector('.indicators');
    images.forEach((_, index) => {
        const indicator = createElement('span', index === 0 ? 'indicator active' : 'indicator');
        indicator.dataset.index = index;
        indicator.addEventListener('click', () => goToSlide(index));
        indicatorsContainer.appendChild(indicator);
    });

    // Add event listeners
    container.querySelector('.prev').addEventListener('click', () => changeSlide(-1));
    container.querySelector('.next').addEventListener('click', () => changeSlide(1));

    // Start auto-slider
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
    
    container.innerHTML = cardBlock.Card.map(card => `
        <div class="card">
            <img src="${CONFIG.STRAPI_URL + card.cardImage.url}" alt="${card.Heading}">
            <div class="card-content">
                <h3>${card.Heading}</h3>
                <p>${card.text}</p>
            </div>
        </div>
    `).join("");
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
    const cardWidth = container.querySelector(".card").offsetWidth + 20; // card width + gap
    
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

// const globalURL = 'http://localhost:1337/api/global';
// const landingURL = 'http://localhost:1337/api/landing-page';
// const STRAPI_URL = "http://localhost:1337";

// async function fetchData() {
//   const [globalRes, landingRes] = await Promise.all([
//     fetch(globalURL),
//     fetch(landingURL)
//   ]);
//   const globalData = await globalRes.json();
//   const landingData = await landingRes.json();

//   renderHeader(globalData.data.Header);
//   renderHero(landingData.data.blocks.find(b => b.__component === "blocks.hero"));
//   renderSectionHeading(landingData.data.blocks.find(b => b.__component === "blocks.section-heading"));
//   renderCards(landingData.data.blocks.find(b => b.__component === "blocks.card-grid").Card);
//   renderYouTube(landingData.data.blocks.find(b => b.__component === "blocks.section-youtube").Clip);
//   renderFooter(globalData.data.Footer);
// }

// function renderHeader(headerData) {
//   const header = document.getElementById("header");
//   const nav = headerData.navItems.map(item => `<a href="${item.href}">${item.label}</a>`).join(" | ");
//   header.innerHTML = `
//     <div class="header-container">
//       <img src="${STRAPI_URL + headerData.Logo.Logo.url}" alt="Logo" class="logo" />
//       <nav class="navbar">${nav}</nav>
//     </div>
//   `;
// }

// // *****************************************************************************************************
// // Hero Slider

// function renderHero(heroBlock) {
//   const container = document.getElementById("hero-slider");

//   // ใส่รูปภาพ
//   const imagesHTML = heroBlock.HeroPicture.map(img =>
//     `<img src="${STRAPI_URL + img.Image.url}" alt="hero" />`
//   ).join("");

//   container.insertAdjacentHTML("afterbegin", imagesHTML);

//   const images = container.querySelectorAll("img");
//   const indicatorsContainer = container.querySelector(".indicators");

//   // สร้าง indicators
//   indicatorsContainer.innerHTML = [...images].map((_, index) =>
//     `<span data-index="${index}"></span>`
//   ).join("");

//   const indicators = indicatorsContainer.querySelectorAll("span");
//   const prevBtn = container.querySelector(".prev");
//   const nextBtn = container.querySelector(".next");

//   let currentIndex = 0;
//   let interval;

//   function showSlide(index) {
//     images.forEach(img => img.classList.remove("active"));
//     indicators.forEach(dot => dot.classList.remove("active"));

//     images[index].classList.add("active");
//     indicators[index].classList.add("active");
//     currentIndex = index;
//   }

//   function nextSlide() {
//     showSlide((currentIndex + 1) % images.length);
//   }

//   function prevSlide() {
//     showSlide((currentIndex - 1 + images.length) % images.length);
//   }

//   // ตั้งค่าเริ่มต้น
//   showSlide(0);
//   interval = setInterval(nextSlide, 3000); // เปลี่ยนทุก 3 วิ

//   // Event listeners
//   nextBtn.addEventListener("click", () => {
//     nextSlide();
//     resetInterval();
//   });

//   prevBtn.addEventListener("click", () => {
//     prevSlide();
//     resetInterval();
//   });

//   indicators.forEach(dot => {
//     dot.addEventListener("click", () => {
//       const index = parseInt(dot.dataset.index);
//       showSlide(index);
//       resetInterval();
//     });
//   });

//   function resetInterval() {
//     clearInterval(interval);
//     interval = setInterval(nextSlide, 3000);
//   }
// }

// // *****************************************************************************************************
// // Section Heading

// function renderSectionHeading(headingBlock) {
//   document.getElementById("activity-heading").textContent = headingBlock.Heading;
//   document.getElementById("activity-subheading").textContent = headingBlock.subHeading;
// }

// function renderCards(cards) {
//   const container = document.getElementById("card-grid");
//   container.innerHTML = cards.map(card => `
//     <div class="card">
//       <img src="${STRAPI_URL + card.cardImage.url}" alt="${card.Heading}" />
//       <h3>${card.Heading}</h3>
//       <p>${card.text}</p>
//     </div>
//   `).join("");
// }

// function scrollCards(direction) {
//   const grid = document.getElementById("card-grid");
//   const cardWidth = grid.querySelector(".card").offsetWidth + 32; // card width + gap
//   grid.scrollBy({
//     left: direction * cardWidth * 2, // เลื่อนไปทีละ 2 ใบ
//     behavior: "smooth"
//   });
// }


// function renderYouTube(clips) {
//   const container = document.getElementById("youtube-section");
//   container.innerHTML = clips.map(clip => 
//     `<div>
//       <h3>${clip.Heading}</h3>
//       ${clip.clip[0].children[0].text}
//     </div>`
//   ).join("");
// }

// function renderFooter(footerData) {
//   const footer = document.getElementById("footer");
//   const icons = footerData.Icon.map(icon =>
//     `<a href="${icon.href}" target="_blank">
//     <img src="${STRAPI_URL + icon.Logo.url}" alt="${icon.label}" style="height: 30px;" />
//     </a>`
//   ).join(" ");

//   footer.innerHTML = `
//   <div class="footer-container">
//     <div class="footer-left">
//       <img src="${STRAPI_URL + footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo" />

//       <div class="footer-socials">
//         ${footerData.Icon.slice(1).map(icon => `
//           <a href="${icon.href}" target="_blank">
//             <img src="${STRAPI_URL + icon.Logo.url}" alt="${icon.label}" />
//           </a>
//         `).join("")}
//       </div>

//       <p class="footer-text">${footerData.text}</p>
//     </div>

//     <div class="footer-right">
//       ${footerData.map.map}
//     </div>
//   </div>
// `;

// }

// fetchData();
