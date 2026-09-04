// ============================================================
// 1. GLOBAL VARIABLES & GOOGLE SHEETS SETUP
// ============================================================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwi6wwEIB_jHWBWEwddNbNYPMgvN4A9JK8p8oeSg8RvnZGT-RDR9ABdXihRRclV9nBFVA/exec';
let bookedDateRanges = [];

// වෙබ් අඩවිය ලෝඩ් වෙද්දීම කලින් බුක් වුණු දින ටික ලබාගැනීම
fetchBookedDates();

function fetchBookedDates() {
    fetch(SCRIPT_URL)
        .then(response => response.json())
        .then(data => {
            bookedDateRanges = data.map(d => ({
                in: new Date(d.checkin),
                out: new Date(d.checkout)
            }));
            console.log("Booked dates loaded:", bookedDateRanges);
        })
        .catch(error => console.error("Error loading booked dates:", error));
}

// ============================================================
// 2. HOME PAGE LOGIC (Image Slider) 
// ============================================================
const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

function nextSlide() {
    slides.forEach(slide => slide.classList.remove('active'));
    currentSlide = (currentSlide + 1) % slides.length;
    if (slides[currentSlide]) slides[currentSlide].classList.add('active');
    syncSliderDots(); 
}

if (slides.length > 0) {
    setInterval(nextSlide, 5000);
}

// ============================================================
// 3. CONTACT PAGE LOGIC (Feedback Form)
// ============================================================
function submitFeedback() {
    const date = document.getElementById('fb-date').value;
    const name = document.getElementById('fb-name').value;
    const comment = document.getElementById('fb-comment').value;

    if (!date || !name || !comment) {
        alert("Please fill all the fields before submitting.");
        return;
    }

    const whatsappMessage = `*New Feedback for Hill Crest Bangalow*%0A%0A*Date:* ${date}%0A*Name:* ${name}%0A*Comment:* ${comment}`;
    const whatsappLink = `https://wa.me/94761727294?text=${whatsappMessage}`;
    window.open(whatsappLink, '_blank');
}

// ============================================================
// 4. ROOMS PAGE LOGIC (Modal, Booking, PDF, Apps Script) 
// ============================================================

function openModal(imageSrc) {
    document.getElementById("imageModal").style.display = "block";
    document.getElementById("zoomedImg").src = imageSrc;
}

function closeModal() {
    document.getElementById("imageModal").style.display = "none";
}

function isDateOverlapping(checkinStr, checkoutStr) {
    let cIn = new Date(checkinStr);
    let cOut = new Date(checkoutStr);
    
    for(let i = 0; i < bookedDateRanges.length; i++) {
        let bIn = bookedDateRanges[i].in;
        let bOut = bookedDateRanges[i].out;
        
        if(cIn < bOut && cOut > bIn) {
            return true;
        }
    }
    return false;
}

function calculateDays() {
    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;
    let days = 0;

    if (checkin && checkout) {
        if (isDateOverlapping(checkin, checkout)) {
            alert("Sorry, these dates are already booked! Please select different dates.");
            document.getElementById('checkin-date').value = "";
            document.getElementById('checkout-date').value = "";
            document.getElementById('sum-days').innerText = "0";
            updateSummary();
            return;
        }

        const inDate = new Date(checkin);
        const outDate = new Date(checkout);

        if (outDate <= inDate) {
            alert("Check-out date must be after Check-in date.");
            document.getElementById('checkout-date').value = "";
        } else {
            const diffTime = Math.abs(outDate - inDate);
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }
    document.getElementById('sum-days').innerText = days;
    updateSummary();
}

function updateSummary() {
    document.getElementById('sum-name').innerText = document.getElementById('cus-name').value || "-";
    document.getElementById('sum-email').innerText = document.getElementById('cus-email').value || "-";
    document.getElementById('sum-whatsapp').innerText = document.getElementById('cus-whatsapp').value || "-";
    document.getElementById('sum-contact').innerText = document.getElementById('cus-contact').value || "-";
    document.getElementById('sum-checkin').innerText = document.getElementById('checkin-date').value || "-";
    document.getElementById('sum-checkout').innerText = document.getElementById('checkout-date').value || "-";
    document.getElementById('sum-adults').innerText = document.getElementById('adults-count').value || "0";
    document.getElementById('sum-children').innerText = document.getElementById('children-count').value || "0";
    document.getElementById('sum-rooms').innerText = document.getElementById('rooms-count').value || "0";
}

function clearBookingForm() {
    document.getElementById('bookingForm').reset();
    document.getElementById('sum-days').innerText = "0";
    updateSummary();
}

function submitBooking() {
    const name = document.getElementById('cus-name').value;
    const email = document.getElementById('cus-email').value;
    const whatsapp = document.getElementById('cus-whatsapp').value;
    const contact = document.getElementById('cus-contact').value;
    const checkin = document.getElementById('checkin-date').value;
    const checkout = document.getElementById('checkout-date').value;
    const days = document.getElementById('sum-days').innerText;
    const adults = document.getElementById('adults-count').value;
    const children = document.getElementById('children-count').value;
    const rooms = document.getElementById('rooms-count').value;

    if (!name || !email || !whatsapp || !contact || !checkin || !checkout) {
        alert("Please fill all required details and select dates before confirming.");
        return;
    }

    if (isDateOverlapping(checkin, checkout)) {
        alert("Sorry, these dates were just booked by someone else. Please select different dates.");
        return;
    }

    const btn = document.querySelector('.book-btn');
    const originalText = btn.innerText;
    btn.innerText = "Please wait... Processing";
    btn.disabled = true;

    const formData = new URLSearchParams();
    formData.append("Name", name);
    formData.append("Email", email);
    formData.append("WhatsApp", whatsapp);
    formData.append("Contact", contact);
    formData.append("CheckIn", checkin);
    formData.append("CheckOut", checkout);
    formData.append("Days", days);
    formData.append("Rooms", rooms);
    formData.append("Adults", adults);
    formData.append("Children", children);

    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
    .then(response => {
        if (window.jspdf) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(22);
            doc.text("HILL CREST BANGALOW", 65, 20);
            doc.setFontSize(16);
            doc.text("Booking Confirmation Details", 65, 35);
            doc.setFontSize(12);
            doc.text(`Customer Name     : ${name}`, 20, 55);
            doc.text(`Email Address     : ${email}`, 20, 65);
            doc.text(`WhatsApp Number   : ${whatsapp}`, 20, 75);
            doc.text(`Contact Number    : ${contact}`, 20, 85);
            doc.text(`Check-In Date     : ${checkin}`, 20, 100);
            doc.text(`Check-Out Date    : ${checkout}`, 20, 110);
            doc.text(`Total Days of Stay: ${days} Days`, 20, 120);
            doc.text(`Number of Rooms   : ${rooms}`, 20, 130);
            doc.text(`Guests            : ${adults} Adults, ${children} Children`, 20, 140);
            doc.text("Thank you for choosing Hill Crest Bangalow. Have a great stay!", 20, 170);
            
            doc.save(`Booking_HillCrest_${name}.pdf`);
        }

        const message = `*New Booking Request - Hill Crest Bangalow*%0A%0A*Name:* ${name}%0A*Email:* ${email}%0A*WhatsApp:* ${whatsapp}%0A*Contact:* ${contact}%0A*Check-in:* ${checkin}%0A*Check-out:* ${checkout}%0A*Total Stay:* ${days} Days%0A*Rooms:* ${rooms}%0A*Guests:* ${adults} Adults, ${children} Children`;
        const waLink = `https://wa.me/94761727294?text=${message}`;
        setTimeout(() => { window.open(waLink, '_blank'); }, 1000);

        alert("Booking Successful!");
        fetchBookedDates(); 
        clearBookingForm();
        btn.innerText = originalText;
        btn.disabled = false;
    })
    .catch(error => {
        alert("Something went wrong. Please try again.");
        console.error('Error!', error.message);
        btn.innerText = originalText;
        btn.disabled = false;
    });
}

// ============================================================
// 5. UI/UX ENHANCEMENTS & 6. MEDIUM ARTICLES AUTO-LOADER
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    const navbar = document.querySelector('.navbar');
    if (navbar) {
        const onScroll = () => {
            navbar.classList.toggle('scrolled', window.scrollY > 30);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    const navLinks = document.querySelector('.nav-links');
    if (navbar && navLinks) {
        const toggle = document.createElement('button');
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Toggle navigation menu');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.innerHTML = '<span></span><span></span><span></span>';
        navbar.appendChild(toggle);

        toggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            toggle.classList.toggle('open', isOpen);
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                toggle.classList.remove('open');
                toggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer && slides.length > 0) {
        const dotsWrap = document.createElement('div');
        dotsWrap.className = 'slider-dots';
        dotsWrap.setAttribute('role', 'tablist');
        dotsWrap.setAttribute('aria-label', 'Slide navigation');
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
            if (i === 0) dot.classList.add('active');
            dotsWrap.appendChild(dot);
        });
        sliderContainer.appendChild(dotsWrap);

        const cue = document.createElement('div');
        cue.className = 'scroll-cue';
        cue.textContent = 'Scroll';
        sliderContainer.appendChild(cue);
    }

    const revealTargets = document.querySelectorAll(
        '.category-card, .fac-card, .gallery-img, .discover-content, .discover-image, ' +
        '.info-box, .map-box, .feedback-box, .booking-form, .booking-summary, .room-info'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        revealTargets.forEach(el => io.observe(el));

        [document.querySelector('.areas-grid'), document.querySelector('.facilities-grid'), document.querySelector('.gallery-grid')]
            .filter(Boolean)
            .forEach(grid => {
                grid.classList.add('reveal-stagger');
                io.observe(grid);
                grid.addEventListener('transitionend', () => {}, { once: true });
                const gridObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('in-view');
                            gridObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.1 });
                gridObserver.observe(grid);
            });
    } else {
        revealTargets.forEach(el => el.classList.add('in-view'));
    }

    document.querySelectorAll('.submit-btn, .book-btn, .clear-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        });
    });

    // Medium Articles ලෝඩ් වෙන කෝඩ් එක
    loadMediumArticlesForHome();
});

function syncSliderDots() {
    const dots = document.querySelectorAll('.slider-dots button');
    if (!dots.length) return;
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

async function loadMediumArticlesForHome() {
    const track = document.getElementById('medium-articles-track');
    if (!track) return;

    const username = 'hillcrestvillahikkaduwa';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@${username}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.status === 'ok' && data.items.length > 0) {
            track.innerHTML = '';
            data.items.forEach(item => {
                let imageUrl = '';
                const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                }

                const card = document.createElement('a');
                card.href = item.link;
                card.target = '_blank';
                card.className = 'medium-card';

                card.innerHTML = `
                    ${imageUrl ? `<img src="${imageUrl}" alt="${item.title}">` : '<div style="height:160px; background:#ddd;"></div>'}
                    <div class="medium-card-content">
                        <h3>${item.title}</h3>
                        <span>Read on Medium →</span>
                    </div>
                `;
                track.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error fetching Medium articles:', error);
    }
}
