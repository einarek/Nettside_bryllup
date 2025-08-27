window.addEventListener("DOMContentLoaded", () => {
  // === Countdown Timer ===
  const targetDate = new Date("2026-06-20T13:00:00").getTime();
  const countdownElement = document.querySelector(".countdown");

  const countdownFunction = setInterval(() => {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      clearInterval(countdownFunction);
      countdownElement.innerHTML = "Countdown finished!";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    countdownElement.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, 1000);

  // === Carousel Initialization ===
  const timePerImage = 4; // seconds
  const slide = document.getElementById("carouselSlide");
  const track = document.getElementById("carouselTrack");

  if (slide && track) {
    const duplicate = slide.cloneNode(true);
    track.appendChild(duplicate);

    const totalImages = slide.children.length * 2;
    const totalDuration = timePerImage * totalImages;

    const keyframes = `
      @keyframes scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = keyframes + `
      .carousel-track {
        animation: scroll ${totalDuration}s linear infinite;
      }
    `;
    document.head.appendChild(styleSheet);
  }
});
