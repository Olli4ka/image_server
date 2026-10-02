const carousel = document.getElementById("imageCarousel");

if (carousel) {
    new bootstrap.Carousel(carousel, {
        interval: 3000,
        ride: "carousel",
    });
}
