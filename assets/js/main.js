let slideshowTimer;
let currentInterval = 10000;

async function initSite() {
    try {
        const response = await fetch('/assets/data/config.json');                           // fetch config
        const config = await response.json();                                               // ****************************** SET VARIABLE FOR CONFIG ******************************
        document.getElementById('server-title').innerText = config.server.title;            // server title as defined in JSON
        document.getElementById('version').innerText = `Version ${config.server.version}`;  // version as defined in JSON
        document.title = config.web.title + " " + config.server.version;                    // Set the title (as appearing in the tab) to Sundown SMP x.x.x

        //                                                 // build the header
        const navList = document.getElementById('nav-list');    // navigation list
        const navData = config.web.navigation;                  // define what should be added to the navList
        navList.replaceChildren();                              // clear the navList (if user reloads, it may double otherwise)

        navData.forEach(item => {                   // header navigation
            const li = document.createElement('li');    // CREATE the list item ELEMENT
            const link = document.createElement('a');   // CREATE the link ELEMENT
            link.href = item.url;                       // Set url for this specific element. Only affects gallery page bc it's the only page with a different html
            link.textContent = item.name;               // Name as defined in the JSON
            li.appendChild(link);                       // ADD the link element as a child of the list item
            navList.appendChild(li);                    // ADD the list item as a child of the navigation list
        });

        const intervalRadios = document.getElementsByName('interval-rad');  // Fetch the radio buttons for setting slideshow interval
        intervalRadios.forEach(radio => {                                   
            radio.addEventListener('change', (e) => {                       // when a different radio button is selected
                currentInterval = parseInt(e.target.value) * 1000;          // multiply the radio's corresponding value by 1000 to get milliseconds
                startSlideshow(config, currentInterval);                    // execute wrapper at new interval
            });
        });
        startSlideshow(config, currentInterval);                            // Initialize the slideshow immediately, when the page first loads. 10s interval = default

        // handle opening of the menu
        const cogBtn = document.querySelector('.btn-cog');                  // all items in class btn-cog       -> cogBtn
        const dropdown = document.querySelector('.cog-dropdown');           // all items in class cog-dropdown  -> dropDown

        cogBtn.addEventListener('click', () => {                            // execute THIS arrow function when user selects a dropdown item
            dropdown.classList.toggle('active');                            // toggle the dropdown's visibility prerequisite on
        });

        //                                                                     // if user clicks outside the menu, close the menu
        window.addEventListener('click', (e) => {                                   // on click, materialize event object to act on in arrow function
            if (!cogBtn.contains(e.target) && !dropdown.contains(e.target)) {       // if clicked location is outside of cogBtn and dropdown
                dropdown.classList.remove('active');                                // toggle dropdown's visibility prerequisite off
            }
        });

        // ------------------------------------------------------------------------- Change logo logic ------------------------------------------------------------------------- //

        const logoOptions = config.web.logo;                                // add options to the form per JSON
        const logoSelectRoot = document.getElementById("logo-selection");   // the element to append all labels and inputs to
        const frmName = 'sundown-logo';                                     // set name of form object

        logoOptions.forEach(item => {// loop through logoOptions, and create and add a form entry for each object using the parameters defined in the json
            const isDuplicate = Array.from(logoSelectRoot.querySelectorAll('label'))
                .some(label => label.textContent.trim().includes(item.text.trim()));// test if duplicate. Patch to a bug causing duplicat named items in form
            if (isDuplicate) return;

            const frmLabelElem = document.createElement('label');// create label that is parent of input radio button
            const frmInputElem = document.createElement('input');// create the radio button
            const frmSpanElem = document.createElement('span');//   for custom radio button texture

            frmLabelElem.setAttribute('for', item.id);// label's 'for' must represent what option it's for
            frmLabelElem.appendChild(frmInputElem);
            frmLabelElem.appendChild(frmSpanElem);
            frmLabelElem.appendChild(document.createTextNode(` ${item.text}`));
            frmInputElem.id = item.id;
            frmInputElem.name = frmName;
            frmInputElem.type = 'radio';
            frmInputElem.value = item.value; // file path of the selected image
            
            frmSpanElem.className = `radio-custom ${item.id}`;// for css targeting
            if (item.value === document.querySelector('.logo img').getAttribute('src'))
                frmInputElem.checked = true;// check the default

            frmInputElem.addEventListener('change', (e) => {
                if (e.target.checked) document.querySelector('.logo img').src = e.target.value;// if 'change' event is a check event, set it to the chosen option's value  
            });
            logoSelectRoot.appendChild(frmLabelElem);
            logoSelectRoot.appendChild(document.createElement('br'));
        });// end logoOptions loop for populating form

        // ----------------------------------------------------------------------- END Change logo logic ----------------------------------------------------------------------- //

        

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
    const layerCurrent = document.getElementById('layer-current');// GET layer-current element
    const layerNext = document.getElementById('layer-next');      // GET layer-next    element

    //                                               //declare image root path per config
    const imgPath = config.web.gallery_path.name;       // root directory address of the images
    const imgData = config.web.gallery;                 // pointers to the image objects and alt texts
    const ext = config.web.gallery_format.format;       // extension as defined in json

    let currentIndex = Math.floor(Math.random() * imgData.length);// random number between 0 and the number of images in the /assets/img/uploads/ folder

    layerCurrent.src = `${imgPath}/${imgData[currentIndex].name}.${ext}`;// show the first image immediately
    layerCurrent.alt = imgData[currentIndex].alt_text;                      // populate alt text of image
    layerCurrent.style.opacity = 1;                                         // set current layer to fully visible

    if (interval < 0) return;

    const transition = () => {                                          // determine and preload next image, then run preloader.onload with the result
        let nextIndex;                                                      // declare early to prevent screen flash on interval change

        // pick a different number for the next element
        do { nextIndex = Math.floor(Math.random() * imgData.length); } while (nextIndex === currentIndex);

        const preloader = new Image();                                      // Create buffer for another image
        preloader.src = `${imgPath}/${imgData[nextIndex].name}.${ext}`;     // set that buffer's source to the target source of the next image

        preloader.onload = () => {                                          // only execute after loading is confirmed finished
            layerNext.src = preloader.src;                                      // set next image source
            layerNext.alt = imgData[nextIndex].alt_text;                        // set next image alt-text
            layerNext.style.opacity = 1;                                        // trigger transition

            setTimeout(() => {                                                  // run the following at a 5 second interval (transition takes 5 seconds)
                layerCurrent.src = layerNext.src;                                   // move next image to current slot
                layerCurrent.alt = layerNext.alt;                                   // set alt text of current img
                layerNext.style.transition = 'none';                                // hide "next" layer. won't be seen by user, bc Current layer has same image
                layerNext.style.opacity = 0;                                        // make next image invisible
                layerNext.offsetHeight;
                layerNext.style.transition = 'opacity 5s ease-in-out';              // trigger transition
                currentIndex = nextIndex;                                           // overwrite the current image with the next image
            }, 5000);
        };
    };
    slideshowTimer = setInterval(transition, interval);
}

document.addEventListener('DOMContentLoaded', initSite);