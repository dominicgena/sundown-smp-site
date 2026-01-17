async function initSite() {
    try {
        const response = await fetch('/assets/data/config.json');// fetch config
        const config = await response.json();// config file

        document.getElementById('server_title').innerText = config.server.title;// populate title and version from json
        document.getElementById('version').innerText = `Version ${config.server.version}`;
        
        // Update browser tab title to include version
        // Simple title hardcoded for SEO, then js overwrites the title to be more descriptive
        document.title = config.web.title + " " + config.server.version;

        // building navMenu
        const navList = document.getElementById('navList');
        const navData = config.web.navigation;
        navList.innerHTML = ''; 

        navData.forEach(item => {
            const li = document.createElement('li');
            
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.name;

            li.appendChild(link);
            navList.appendChild(li);
        });

        console.log("Sundown SMP: Navigation and config loaded successfully.");
        slideshow(config);

    } catch (error) {
        console.error("Error loading site configuration:", error);
        document.getElementById('server_title').innerText = "Sundown SMP";
    }
}

async function slideshow(config){
    const delay = 5000;
    if(document.URL.includes("/gallery/"))return;// don't do the slideshow if in gallery, because gallery should be displayed in a grid.
    const layerCurrent = document.getElementById('layer-current');
    const layerNext = document.getElementById('layer-next');
    const imgPath = config.web.gallery_path.name;
    const imgData = config.web.gallery;
    // console.log("imgData: ", imgData);
    // sequence();

    const sequence = () => {
        let choiceCurrent = Math.floor(Math.random() * imgData.length);// random number between 0 and the number of images in the /assets/img/uploads/ folder

        // pick a different number for the next element
        do {
            choiceNext = Math.floor(Math.random() * imgData.length);
        } while (choiceNext === choiceCurrent);

        console.log("Selected image index ", choiceCurrent, " as current image.");
        console.log("Selected image index ", choiceNext, " as next image.");
        layerCurrent.src = `${imgPath}/${imgData[choiceCurrent].name}`;
        layerCurrent.alt = `${imgData[choiceCurrent].alt_text}`;
        layerNext.src = `${imgPath}/${imgData[choiceNext].name}`;
        layerNext.alt = `${imgData[choiceNext].alt_text}`;
    };
    sequence();// prepare with first image
    setInterval(sequence, delay);
}


document.addEventListener('DOMContentLoaded', initSite);