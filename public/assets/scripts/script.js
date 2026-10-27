// salin
function salin(btn, msg = 'Tersalin', timeout = 1500) {
    navigator.clipboard.writeText(btn.getAttribute('data-ayat'));

    let tmp = btn.innerHTML;
    btn.innerHTML = msg;
    btn.disabled = true;

    let clear = null;
    clear = setTimeout(function () {
        btn.innerHTML = tmp;
        btn.disabled = false;
        btn.focus();

        clearTimeout(clear);
        clear = null;
        return;
    }, timeout);
}

function playMusic(ayahNumber) {
    // Mendapatkan elemen audio dan ayat berdasarkan ID ayat
    let audio = document.getElementById('myAudio' + ayahNumber);
    let ayatElement = document.getElementById('ayat' + ayahNumber);
    let changeIcon = document.querySelector("#musicButton" + ayahNumber + " i");
    let changeSmalltext = document.querySelector("#musicButton" + ayahNumber + " small");

    // Mematikan semua audio yang sedang diputar
    let allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(function (element) {
        if (element !== audio) {
            element.pause();
            element.currentTime = 0; // Mengembalikan waktu ke awal
            // Ganti ikon dan teks tombol kembali ke "Play" jika diperlukan
            let buttonId = element.id.replace('myAudio', 'musicButton');
            let icon = document.querySelector("#" + buttonId + " i");
            let smallText = document.querySelector("#" + buttonId + " small");
            icon.classList.remove('ri-pause-circle-line');
            smallText.innerHTML = "Play";
            icon.classList.add('ri-play-circle-line');
        }
    });

    // Memainkan atau menghentikan audio
    if (audio.paused) {
        audio.play();
        changeIcon.classList.remove('ri-play-circle-line')
        changeSmalltext.innerHTML = "Pause"
        changeIcon.classList.add('ri-pause-circle-line')

        // Menambahkan event listener untuk mendeteksi ketika audio selesai
        audio.addEventListener('ended', function () {
            // Audio selesai, lanjutkan ke ayat berikutnya (jika ada)
            let nextayahNumber = parseInt(ayahNumber) + 1;
            let nextAudio = document.getElementById('myAudio' + nextayahNumber);
            if (nextAudio) {
                playMusic(nextayahNumber.toString());
            }
            // Gulir ke elemen ayat yang sedang diputar
            ayatElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    } else {
        audio.pause();
        changeIcon.classList.remove('ri-pause-circle-line')
        changeSmalltext.innerHTML = "Play"
        changeIcon.classList.add('ri-play-circle-line')
    }

}

function updateHeight() {
    let textarea = document.getElementById('question');
    textarea.style.height = 'auto'; // Set tinggi kembali ke otomatis
    textarea.style.height = (textarea.scrollHeight) + 'px'; // Atur tinggi sesuai dengan kontennya
    textarea.style.marginBottom = 20+'px';
}
document.addEventListener('DOMContentLoaded', function () {
    const selectedAyatBtn = document.getElementById('selectedAyatBtn');
    const ayatDropdownItems = document.querySelectorAll('#DropDownAyat .dropdown-item');

    ayatDropdownItems.forEach(item => {
        item.addEventListener('click', function () {
            const selectedAyatNumber = this.getAttribute('data-ayat-number');
            selectedAyatBtn.textContent = `Ayat ${selectedAyatNumber}`;
        });
    });
});
