let slideshowTimer;
let currentInterval = 10000;

async function initSite() {
    try {
        const response = await fetch('/assets/data/config.json');// fetch config
        const config = await response.json();// config file

        document.getElementById('server-title').innerText = config.server.title;// populate title and version from json
        document.getElementById('version').innerText = `Version ${config.server.version}`;
        
        // Update browser tab title to include version
        // Simple title hardcoded for SEO, then js overwrites the title to be more descriptive
        document.title = config.web.title + " " + config.server.version;

        // building navMenu
        const navList = document.getElementById('nav-list');
        const navData = config.web.navigation;
        navList.replaceChildren();// more secure than innerHtml


        navData.forEach(item => {
            const li = document.createElement('li');
            
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.name;

            li.appendChild(link);
            navList.appendChild(li);
        });

        console.log("Sundown SMP: Navigation and config loaded successfully.");

        const delayRadios = document.getElementsByName('delay-rad');
        delayRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentInterval = parseInt(e.target.value) * 1000;

                console.log(`Intervaal changed to: ${currentInterval}ms`);
                startSlideshow(config, currentInterval);
            });
        });
        startSlideshow(config, currentInterval);

        // handle opening of the menu
        const cogBtn = document.querySelector('.btn-cog');
        const dropdown = document.querySelector('.cog-dropdown');

        cogBtn.addEventListener('click', () => {
            dropdown.classList.toggle('active');
        });

        // if user clicks outside the menu, close the menu
        window.addEventListener('click', (e) => {
            if (!cogBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // --------------------------------------------- Change logo logic --------------------------------------------- //

        // Add options to the form
        const logoOptions = config.web.logo;
        // const radioName = config.web.radioName;
        console.log("Logo options: ", logoOptions);
        const logoSelectRoot = document.getElementById("logo-selection");// the element to append all labels and inputs to
        const frmName = 'sundown-logo';

        

        // loop through logoOptions, and create and add a form entry for each object using the parameters defined in the json
        logoOptions.forEach(item => {

            const isDuplicate = Array.from(logoSelectRoot.querySelectorAll('label'))
                .some(label => label.textContent.trim().includes(item.text.trim()));

            if (isDuplicate) {
                console.log(`Skipping duplicate logo option: ${item.text}`);
                return; // Exit this iteration of the loop
            }

            const frmLabelElem = document.createElement('label');
            const frmInputElem = document.createElement('input');
            const frmSpanElem = document.createElement('span');

            frmInputElem.type = 'radio';
            frmInputElem.name = frmName;
            frmInputElem.id = item.id;
            frmInputElem.value = item.value; // file path of the selected image
            
            // check if item is the default (matching the current UI logo)
            const currentLogo = document.querySelector('.logo img').getAttribute('src');
            if (item.value === currentLogo) {
                frmInputElem.checked = true;
            }

            // span for custom CSS radio
            frmSpanElem.className = `radio-custom ${item.id}`;

            // assemble the Label
            frmLabelElem.setAttribute('for', item.id);// label's 'for' must represent what option it's for
            frmLabelElem.appendChild(frmInputElem);
            frmLabelElem.appendChild(frmSpanElem);

            frmLabelElem.appendChild(document.createTextNode(` ${item.text}`));

            // 4. Add Event Listener to change the logo and handle 'checked' state
            frmInputElem.addEventListener('change', (e) => {
                if (e.target.checked) {
                    document.querySelector('.logo img').src = e.target.value;
                    console.log(`Logo changed to: ${item.text}`);
                }
            });

            logoSelectRoot.appendChild(frmLabelElem);
            logoSelectRoot.appendChild(document.createElement('br')); // Optional spacing
        });



    } catch (error) {
        console.error("Error loading site configuration:", error);
        document.getElementById('server-title').innerText = "Sundown SMP";
    }

}


function startSlideshow(config, interval) {// wraper for clearing and starting. If radio button selection is enabled, clear the slideshow and start again with the new interval
    if(slideshowTimer){
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    }
    slideshow(config, interval);
}

async function slideshow(config, interval){
    if(document.URL.includes("/gallery/"))return;// don't do the slideshow if in gallery, because gallery should be displayed in a grid.
    const layerCurrent = document.getElementById('layer-current');
    const layerNext = document.getElementById('layer-next');

    // declare image root path as defined in config
    const imgPath = config.web.gallery_path.name;// root directory address of the images
    const imgData = config.web.gallery;// pointers to the image objects and alt texts
    const ext = config.web.gallery_format.format;// extension as defined in json
    // console.log("Extension: ", ext);
    // console.log("imgData: ", imgData);
    // sequence();

    let currentIndex = Math.floor(Math.random() * imgData.length);// random number between 0 and the number of images in the /assets/img/uploads/ folder
    // console.log("Current Index ", currentIndex, " chosen");

    // show the first image immediately
    layerCurrent.src = `${imgPath}/${imgData[currentIndex].name}.${ext}`;
    // console.log("layerCurrent.src: ", layerCurrent.src);
    // console.log("Path assigned to layerCurrent.src: ", `${imgPath}/${imgData[currentIndex].name}.${ext}`);
    layerCurrent.alt = imgData[currentIndex].alt_text;
    layerCurrent.style.opacity = 1;

    if (interval < 0) {
        console.log("Slideshow disabled. Static image set.");
        return;
    }

    const transition = () => {
        let nextIndex;

        do {// pick a different number for the next element
            nextIndex = Math.floor(Math.random() * imgData.length);
        } while (nextIndex === currentIndex);

        const preloader = new Image();// Create buffer for another image
        preloader.src = `${imgPath}/${imgData[nextIndex].name}.${ext}`;// set that buffer's source to the target source of the next image
        // console.log("Preloader path: ", preloader.src);

        preloader.onload = () => {// only execute after loading is confirmed finished
            layerNext.src = preloader.src;
            layerNext.alt = imgData[nextIndex].alt_text;

            layerNext.style.opacity = 1;// trigger transition

            setTimeout(() => {
                // move next image over to current slot
                layerCurrent.src = layerNext.src;
                layerCurrent.alt = layerNext.alt;

                // hide the "next" layer. This won't be seen by the user, because the Current layer has the same image
                layerNext.style.transition = 'none';
                layerNext.style.opacity = 0;// make invisible

                // re-enable transition for next cycle
                layerNext.offsetHeight;
                layerNext.style.transition = 'opacity 5s ease-in-out';

                currentIndex = nextIndex;

            }, 5000);
        };
    };
    slideshowTimer = setInterval(transition, interval);
}


document.addEventListener('DOMContentLoaded', initSite);