async function initSite() {
    const config = await getConfig('/assets/data/config.json');
    setTitleData(config.web.title, config.server.version);
    let currentInterval = 10000;
    // cleaned so these functions don't need to access the whole config
    let slideshowTimer;
    startSlideshow(config.web.gallery_path.name, config.web.gallery, config.web.gallery_format.format, currentInterval, slideshowTimer);
    populateNavBar(config.web.navigation);
    initNavDropToggle();
    personalizationConfig();// turn customization changes into functions
    initFooter();
    populateStaff(config.web.staff);
}

async function getConfig(configFile) {
    try {
        const response = await fetch(configFile);
        if (!response.ok) { throw new Error(`HTTP Error. Status: ${response.status}`); }
        config = await response.json();
        return config;
    } catch (error) {
        console.error("Error loading site configuration:", error);
        throw error;
    }   
}

function setTitleData(title, version) {
    document.getElementById('server-title').innerText = title;
    document.getElementById('version').innerText = `Version ${version}`;
    document.title = title + " " + version;
}

function populateNavBar(navData) {
    const navList = document.getElementById('nav-list');// ul element
    navList.replaceChildren();// reinitialize navlist if reloaded
    navData.forEach(item => {
        const li = document.createElement('li');
        li.id = `${item.name}`.toLowerCase();
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.name;
        link.target = item.target;
        li.appendChild(link);
        navList.appendChild(li);
    });

    // more efficient than a unique event listener for each nav item
    navList.addEventListener('click', function (event) {
        const q = event.target.closest('li').id;
        if (event.target && event.target.nodeName === 'A'  && q != 'map') {// don't call if a redirect is happening
            if (typeof window[`handleNavClick`] === 'function') {
                window[`handleNavClick`](q);
            } else { console.warn(`Attempted to call handleNavClick, but it doesn't exist.`); }
        }
    });
}

function initNavDropToggle() {
    const navDrop = document.getElementById('navbar-drop');
    const navMenu = document.querySelector('.nav-menu ul');

    navDrop.addEventListener('click', () => {
        navMenu.classList.toggle('show');
        navDrop.classList.toggle('active');
    });
}

function handleNavClick(query) {
    const toggleables = document.getElementsByClassName('toggleable');
    for (const item of toggleables) {
        item.classList.add('invisible');
    }
    
    const element = document.getElementsByClassName(query)[0];
    if (element) {
        element.classList.remove('invisible');

        const contentChild = element.querySelector('.content');

        if (contentChild) {
            contentChild.animate([
                { backgroundColor: 'rgba(var(--scheme-bg-color), 0.5)' },
                { backgroundColor: 'rgba(var(--scheme-bg-color), .9)' }
            ], {
                duration: 500,
                easing: 'ease-out',
                fill: 'forwards'
            });
        }
    }

    if (query === 'join') {// if user clicked join,
        // simulate clicking on the rules button
        const rulesLink = element.querySelector('a[href="#rules"]');
        
        // check if the link exists and ensure we only attach the listener once
        if (rulesLink && !rulesLink.dataset.listenerAttached) {
            rulesLink.addEventListener('click', function(event) {
                event.preventDefault();
                
                const rulesNavItem = document.getElementById('rules');
                if (rulesNavItem) {
                    document.querySelector('#rules a').click();
                }
            });
            
            // Mark it so we don't add the listener again next time
            rulesLink.dataset.listenerAttached = "true";
        }
    }
}

function populateJoin() {
    const rulesLink = document.querySelector('.join a[href="#rules"]');
    rulesLink.addEventListener('click', function(event) {
        event.preventDefault();
        const rulesNavItem = document.getElementById('rules');
        if (rulesNavItem) {
            rulesNavItem.click(); 
        }
    });
}

function personalizationConfig() {
    // a control center so the same event can handle logo and interval
    // change without conflict
    const cogBtn = document.querySelector('.btn-cog');
    const dropdown = document.querySelector('.cog-dropdown');

    // mark the dropdown as active when it's clicked
    cogBtn.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });

    // allows user to click outside config div to close
    window.addEventListener('click', (e) => {
        if (!cogBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    dropdown.addEventListener('change', (e) => {
        console.log(e.target);
        logoConfig(e.target);
        slideshowConfig(e.target);
    });
    populateLogoOptions(config.web.logo);
}

function populateLogoOptions(logoOptions) {
    const logoFrmName = 'sundown-logo';
    const logoSelectRoot = document.getElementById("logo-selection");
    logoOptions.forEach(item => {
    const isDuplicate = Array.from(logoSelectRoot.querySelectorAll('label'))
        .some(label => label.textContent.trim().includes(item.text.trim()));
        if (isDuplicate) return;

        const frmLabelElem = document.createElement('label');
        const frmInputElem = document.createElement('input');
        const frmSpanElem = document.createElement('span');

        frmLabelElem.setAttribute('for', item.id);
        frmLabelElem.appendChild(frmInputElem);
        frmLabelElem.appendChild(frmSpanElem);
        frmLabelElem.appendChild(document.createTextNode(` ${item.text}`));
        frmInputElem.id = item.id;
        frmInputElem.name = logoFrmName;
        frmInputElem.type = 'radio';
        frmInputElem.value = item.value;
        frmSpanElem.className = `radio-custom ${item.id}`;

        logoSelectRoot.appendChild(frmLabelElem);
        logoSelectRoot.appendChild(document.createElement('br'));

        if (item.value === document.querySelector('.logo img').getAttribute('src'))
            frmInputElem.checked = true;
    });
}

function logoConfig(target) {
    // translate the event into a command to change the logo
    if (target.checked && target.name == 'sundown-logo') document.querySelector('.logo img').src = target.value;
}

function slideshowConfig(target) {
    // translate the event into a command to start the slideshow
    if (target.checked && target.name == 'interval-rad') {
        const interval = target.value * 1000;// expected in ms
        const galleryPath = config.web.gallery_path.name;
        const galleryData = config.web.gallery;
        console.log(galleryPath);
        console.log(galleryData);
        const ext = config.web.gallery_format.format;
        startSlideshow(galleryPath, galleryData, ext, interval, slideshowTimer);
    }
}

function startSlideshow(imgPath, imgData, ext, interval, slideshowTimer) {
    // wrapper that ensures the existing slideshow timer is used
    // this makes sure selected interval is always used
    if(slideshowTimer){
        clearInterval(slideshowTimer);
        slideshowTimer = null;
    } slideshow(imgPath, imgData, ext, interval);
}

async function slideshow(imgPath, imgData, ext, interval){
    if(document.URL.includes("gallery"))return;
    const layerCurrent = document.getElementById('layer-current');
    const layerNext = document.getElementById('layer-next');

    let currentIndex = Math.floor(Math.random() * imgData.length);

    layerCurrent.src = `${imgPath}/${imgData[currentIndex].name}.${ext}`;
    layerCurrent.alt = imgData[currentIndex].alt_text;
    layerCurrent.style.opacity = 1;

    if (interval < 0) return;

    const transition = () => {
        let nextIndex;

        do { nextIndex = Math.floor(Math.random() * imgData.length); } while (nextIndex === currentIndex);

        const preloader = new Image();
        preloader.src = `${imgPath}/${imgData[nextIndex].name}.${ext}`;

        preloader.onload = () => {
            layerNext.src = preloader.src;
            layerNext.alt = imgData[nextIndex].alt_text;
            layerNext.style.opacity = 1;

            setTimeout(() => {
                layerCurrent.src = layerNext.src;
                layerCurrent.alt = layerNext.alt;
                layerNext.style.transition = 'none';
                layerNext.style.opacity = 0;
                layerNext.offsetHeight;
                layerNext.style.transition = 'opacity 5s ease-in-out';
                currentIndex = nextIndex;
            }, 5000);
        };
    };
    slideshowTimer = setInterval(transition, interval);
}

function initFooter() {
    const footer = document.querySelector('.main-footer');
    if (!footer) return;

    const staffContainer = document.createElement('div');
    staffContainer.className = "staff-list";
    
    const staffHeader = document.getElementById('staff-header');
    const expandBtn = document.createElement('button');
    expandBtn.className = 'staff-expand';
    expandBtn.title = "Toggle Staff List";
    expandBtn.innerHTML = `<svg width="16" height="8" viewBox="0 0 16 8"><g><path style="fill:rgb(92%,92%,92%);" d="M0.9 -0.1c0.9 0 1.3 0.4 1.9 1l0.3 0.3c0.2 0.2 0.3 0.3 0.5 0.4l0.2 0.2q0.6 0.5 1.2 1a76 76 0 0 1 1.2 1q0.1 0.1 0.3 0.2c0.2 0.1 0.3 0.3 0.5 0.4l0.2 0.2 0.2 0.2c0.2 0.2 0.4 0.3 0.7 0.4l0.3 -0.3c0.8 -0.7 1.5 -1.4 2.3 -2.1 0.4 -0.4 0.9 -0.8 1.3 -1.1 0.5 -0.5 1.1 -1 1.7 -1.4 0.3 -0.2 0.3 -0.2 0.5 -0.5 0.3 0 0.3 0 0.8 0l0.4 0c0.3 0.2 0.3 0.2 0.6 0.2a2.8 2.8 0 0 1 0 1.4c-0.4 0.5 -0.8 0.8 -1.3 1.1q-0.3 0.3 -0.7 0.6 -0.2 0.1 -0.3 0.3a27 27 0 0 0 -1.6 1.3c-0.6 0.5 -1.1 1 -1.7 1.5a29.5 29.5 0 0 0 -1 0.9q-0.2 0.1 -0.3 0.3a11 11 0 0 0 -0.5 0.5c-0.3 0.3 -0.7 0.5 -1.1 0.5 -0.9 0 -1.4 -0.8 -2 -1.4q-0.3 -0.3 -0.7 -0.6a27.5 27.5 0 0 1 -1.4 -1.1 32.5 32.5 0 0 0 -1.8 -1.5 33 33 0 0 1 -1.3 -1.2c-0.3 -0.2 -0.3 -0.2 -0.6 -0.4c-0.3 -0.2 -0.3 -0.2 -0.4 -0.5l0 -0.4c0 -0.1 0 -0.2 0 -0.4c0 -0.1 0.4 -0.1 0.9 -0.1"/></g></svg>`;

    staffHeader.appendChild(expandBtn);

    expandBtn.addEventListener('click', () => {
        expandBtn.classList.toggle('active');
    });

    footer.appendChild(staffContainer);
}

function populateStaff(members) {
    const staffDest = document.querySelector('.staff-list');
    if (!staffDest) return;

    for (let i = 0; i < members.length; i++) {
        const member = members[i];
        const memberDiv = document.createElement('div');
        memberDiv.className = "member";
        const nameField = document.createElement('h3');
        nameField.className = "name";
        const nameLink = document.createElement('a');
        nameLink.href = member.url;
        nameLink.className = 'discord-name-link';
        nameLink.textContent = member.name + ": ";
        const roleTitle = Object.keys(member.rank_roles[0])[0];
        const formattedRole = roleTitle.charAt(0).toUpperCase() + roleTitle.slice(1).toLowerCase();
        const roleSpan = document.createElement('span');
        roleSpan.className = 'featured-role';
        roleSpan.textContent = formattedRole;
        nameField.appendChild(nameLink);
        nameField.appendChild(roleSpan);
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-roles';
        expandBtn.title = "View all roles";
        expandBtn.innerHTML = `<svg width="16" height="8" viewBox="0 0 16 8"><g><path style="fill:rgb(92%,92%,92%);" d="M0.9 -0.1c0.9 0 1.3 0.4 1.9 1l0.3 0.3c0.2 0.2 0.3 0.3 0.5 0.4l0.2 0.2q0.6 0.5 1.2 1a76 76 0 0 1 1.2 1q0.1 0.1 0.3 0.2c0.2 0.1 0.3 0.3 0.5 0.4l0.2 0.2 0.2 0.2c0.2 0.2 0.4 0.3 0.7 0.4l0.3 -0.3c0.8 -0.7 1.5 -1.4 2.3 -2.1 0.4 -0.4 0.9 -0.8 1.3 -1.1 0.5 -0.5 1.1 -1 1.7 -1.4 0.3 -0.2 0.3 -0.2 0.5 -0.5 0.3 0 0.3 0 0.8 0l0.4 0c0.3 0.2 0.3 0.2 0.6 0.2a2.8 2.8 0 0 1 0 1.4c-0.4 0.5 -0.8 0.8 -1.3 1.1q-0.3 0.3 -0.7 0.6 -0.2 0.1 -0.3 0.3a27 27 0 0 0 -1.6 1.3c-0.6 0.5 -1.1 1 -1.7 1.5a29.5 29.5 0 0 0 -1 0.9q-0.2 0.1 -0.3 0.3a11 11 0 0 0 -0.5 0.5c-0.3 0.3 -0.7 0.5 -1.1 0.5 -0.9 0 -1.4 -0.8 -2 -1.4q-0.3 -0.3 -0.7 -0.6a27.5 27.5 0 0 1 -1.4 -1.1 32.5 32.5 0 0 0 -1.8 -1.5 33 33 0 0 1 -1.3 -1.2c-0.3 -0.2 -0.3 -0.2 -0.6 -0.4c-0.3 -0.2 -0.3 -0.2 -0.4 -0.5l0 -0.4c0 -0.1 0 -0.2 0 -0.4c0 -0.1 0.4 -0.1 0.9 -0.1"/></g></svg>`;
        const allRoleNames = member.rank_roles.flatMap(obj => Object.keys(obj));
        const rolesDisplay = allRoleNames.map(r => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase()).join(", ");
        const rolesField = document.createElement('div'); 
        rolesField.className = 'all-roles';
        rolesField.textContent = rolesDisplay;
        expandBtn.addEventListener('click', () => {
            expandBtn.classList.toggle('active');
        });

        memberDiv.appendChild(nameField);
        memberDiv.appendChild(expandBtn);
        memberDiv.appendChild(rolesField);
        staffDest.appendChild(memberDiv);
    }
}

document.addEventListener('DOMContentLoaded', initSite);