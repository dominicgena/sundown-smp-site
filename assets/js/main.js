async function initSite() {
    try {
        const response = await fetch('/assets/data/config.json');// fetch config
        const config = await response.json();

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

    } catch (error) {
        console.error("Error loading site configuration:", error);
        document.getElementById('server_title').innerText = "Sundown SMP";
    }
}


document.addEventListener('DOMContentLoaded', initSite);