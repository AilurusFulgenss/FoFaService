const globalURL = 'http://localhost:1337/api/global';
const landingURL = 'http://localhost:1337/api/landing-page';
const STRAPI_URL = "http://localhost:1337";

async function fetchData() {
  const [globalRes, landingRes] = await Promise.all([
    fetch(globalURL),
    fetch(landingURL)
  ]);
  const globalData = await globalRes.json();
  const landingData = await landingRes.json();

  renderHeader(globalData.data.Header);
  renderHero(landingData.data.blocks.find(b => b.__component === "blocks.hero"));
  renderSectionHeading(landingData.data.blocks.find(b => b.__component === "blocks.section-heading"));
  renderCards(landingData.data.blocks.find(b => b.__component === "blocks.card-grid").Card);
  renderYouTube(landingData.data.blocks.find(b => b.__component === "blocks.section-youtube").Clip);
  renderFooter(globalData.data.Footer);
}

function renderHeader(headerData) {
  const header = document.getElementById("header");
  const nav = headerData.navItems.map(item => `<a href="${item.href}">${item.label}</a>`).join(" | ");
  header.innerHTML = `
    <div class="header-container">
      <img src="${STRAPI_URL + headerData.Logo.Logo.url}" alt="Logo" class="logo" />
      <nav class="navbar">${nav}</nav>
    </div>
  `;
}

// *****************************************************************************************************
// Hero Slider

function renderHero(heroBlock) {
  const container = document.getElementById("hero-slider");

  // ใส่รูปภาพ
  const imagesHTML = heroBlock.HeroPicture.map(img =>
    `<img src="${STRAPI_URL + img.Image.url}" alt="hero" />`
  ).join("");

  container.insertAdjacentHTML("afterbegin", imagesHTML);

  const images = container.querySelectorAll("img");
  const indicatorsContainer = container.querySelector(".indicators");

  // สร้าง indicators
  indicatorsContainer.innerHTML = [...images].map((_, index) =>
    `<span data-index="${index}"></span>`
  ).join("");

  const indicators = indicatorsContainer.querySelectorAll("span");
  const prevBtn = container.querySelector(".prev");
  const nextBtn = container.querySelector(".next");

  let currentIndex = 0;
  let interval;

  function showSlide(index) {
    images.forEach(img => img.classList.remove("active"));
    indicators.forEach(dot => dot.classList.remove("active"));

    images[index].classList.add("active");
    indicators[index].classList.add("active");
    currentIndex = index;
  }

  function nextSlide() {
    showSlide((currentIndex + 1) % images.length);
  }

  function prevSlide() {
    showSlide((currentIndex - 1 + images.length) % images.length);
  }

  // ตั้งค่าเริ่มต้น
  showSlide(0);
  interval = setInterval(nextSlide, 3000); // เปลี่ยนทุก 3 วิ

  // Event listeners
  nextBtn.addEventListener("click", () => {
    nextSlide();
    resetInterval();
  });

  prevBtn.addEventListener("click", () => {
    prevSlide();
    resetInterval();
  });

  indicators.forEach(dot => {
    dot.addEventListener("click", () => {
      const index = parseInt(dot.dataset.index);
      showSlide(index);
      resetInterval();
    });
  });

  function resetInterval() {
    clearInterval(interval);
    interval = setInterval(nextSlide, 3000);
  }
}

// *****************************************************************************************************
// Section Heading

function renderSectionHeading(headingBlock) {
  document.getElementById("activity-heading").textContent = headingBlock.Heading;
  document.getElementById("activity-subheading").textContent = headingBlock.subHeading;
}

function renderCards(cards) {
  const container = document.getElementById("card-grid");
  container.innerHTML = cards.map(card => `
    <div class="card">
      <img src="${STRAPI_URL + card.cardImage.url}" alt="${card.Heading}" />
      <h3>${card.Heading}</h3>
      <p>${card.text}</p>
    </div>
  `).join("");
}

function scrollCards(direction) {
  const grid = document.getElementById("card-grid");
  const cardWidth = grid.querySelector(".card").offsetWidth + 32; // card width + gap
  grid.scrollBy({
    left: direction * cardWidth * 2, // เลื่อนไปทีละ 2 ใบ
    behavior: "smooth"
  });
}


function renderYouTube(clips) {
  const container = document.getElementById("youtube-section");
  container.innerHTML = clips.map(clip => 
    `<div>
      <h3>${clip.Heading}</h3>
      ${clip.clip[0].children[0].text}
    </div>`
  ).join("");
}

function renderFooter(footerData) {
  const footer = document.getElementById("footer");
  const icons = footerData.Icon.map(icon =>
    `<a href="${icon.href}" target="_blank">
    <img src="${STRAPI_URL + icon.Logo.url}" alt="${icon.label}" style="height: 30px;" />
    </a>`
  ).join(" ");

  footer.innerHTML = `
  <div class="footer-container">
    <div class="footer-left">
      <img src="${STRAPI_URL + footerData.Icon[0].Logo.url}" alt="Website Logo" class="footer-logo" />

      <div class="footer-socials">
        ${footerData.Icon.slice(1).map(icon => `
          <a href="${icon.href}" target="_blank">
            <img src="${STRAPI_URL + icon.Logo.url}" alt="${icon.label}" />
          </a>
        `).join("")}
      </div>

      <p class="footer-text">${footerData.text}</p>
    </div>

    <div class="footer-right">
      ${footerData.map.map}
    </div>
  </div>
`;

}

fetchData();
