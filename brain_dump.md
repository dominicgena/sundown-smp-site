Task: Smooth slideshow with crossfades on every page but the gallery page
1. After some thinking, the best approach seems to be *not* simply changing which image acts as the background image; but to contain the background images inside of 1 div that takes up the entire body. It should remain fixed so scrolling doesn't affect its position.
 a. Create a div (#background-slideshow) that is fixed to the viewport, covers the entire viewport (other than the header), and has a z-index of -1 to guarantee placement in the back of all other elements
 b. Inside that container, use two separate layers, with one containing the current image shown, and the other containing the next image to be shown. After every 60 seconds, the currently shown image will fade its opacity to transparency, and the background image will have its opacity faded to visibility at the same rate. I'm not sure if this is actually feasible, but some research will hopefully answer this question
2. Logic: Images and their alt-texts are stored in config.json. For an image to be present on the slideshow, both the file and its unique entry should be added to the config file.
 a. The script must implement an exclude rule for the gallery page. There's no sense in doing a slideshow of the gallery behind the page that's displaying the whole gallery in a grid format. This can be done simply by nesting the entire slideshow logic inside a confirmation that the user isn't in the /gallery/ directory
 b. A timer set to 60,000 ms (60s) will trigger the next image function upon its completion
 c. The fade will be a smooth fade taking 5 seconds to switch from one photo to the next
3. Challenges: These are high-resolution images (1920x1080). It's a heavy load to fetch more than maybe 3 at a time or have them constantly loaded (guestimate based on nothing except my intuition). The heavy load might cause the browser to fall behind and show a blank screen as the background until the next photo can be loaded
 solution: The javascript should pre-fetch the next image in the sequence 10-15 seconds before the transition kis scheduled to happen. This will make sure that the next photo is ready before the transition is attempted

4. Summary (I'm temporarily disregarding browser freezes caused by wait functions for simplicity, I will refine as needed)
    if(user.isOnGalleryPage = yes)
        return
    else // this else is implicit
        int iteration = 0
        config.load() // this probably will happen much earlier, and at one single point in the js file
        while(true)
            background = images[iteration]
            waitSeconds(48)  /* 48 seconds felt like a good compromise between 10 and 15, we don't want the image to be cached for longer than it needs to be, but we want even lower end browsers to be able to prepare the cache */

            boolean successfullyCached = cacheImage(images[iteration+1])// returns boolean of true if cache was successful

            if(successfullyCached)// this check safeguards race conditions, but I'm not sure this is really important in web design or not
                waitSeconds(10)// assuming it took 2 seconds to cache next image, because an exact wait of 60 seconds isn't really important.

                if(iteration+1 >= availableImages): iteration+1 = 0;// a separate variable will obviously be needed for the destination
                    dissolve(images[iteration], images[iteration+1])
                    if(dissolveSuccessful = true) then iteration+=1 // this check probably is also overkill, but it doesn't hurt in pseudocode

            // implicitly, if successfullyCached is false, the loop will return to the top with the iteration variable preserved. It risks one image being shown indefinitely, but that's completely fine


1/17/2026
    I am extremely happy that the transitions are working, but now there's a new problem: optimization. I think a good place to start is the fact that all the photos are png. A google search told me to either use avif or webp, with webp having slightly more support but avif having better compression. I tested this with the largest photo I have at 39072 kilobits (kb, i know my units :D). Webp was able to reduce the size to 7168 kb, and AVIF was able to reduce it to 2496 kb, which is pretty amazing. However I also need to consider the slightly inferior browser support for AVIF. I could implement an algorithm (much later) that prioritizes AVIF and fails over to webp for browsers that don't support AVIF, but I want to weigh the pros and cons first. The AI overview says these browsers don't support AVIF: older versions of Microsoft Edge, older versions of safari, legacy browsers such as safari 15 and earlier, internet explorer, and older versions of samsung internet. My current question is, what kind of (insert insulting but not too offensive word here) is using any of those ancient browsers? Plus, if they're interested in joining a Minecraft server, they must have a certain level of technical ability, so it comes down to how technically literate the demographic is. I don't want to fail to consider automated website ratings and search-engine optimization, so I will see if that is a factor. A few searches suggest that AVIF implementation can enhance SEO if used correctly, so I think that's the winner. I apologize to anyone who is using safari 15 or earlier, but I can't imagine you're really able to use that anyways.

    So, first on the list is an automated way to convert user uploaded files to AVIF. I think the easiest way to do this would be javascript that just converts all files in the uploads folder to AVIF as they show up, and allow users to upload png, jpg/jpeg, webp, avif, etc. 

    Number list format:
        1. Convert user uploads (contents of uploads folder) to AVIF, and only allow the slideshow implementation to act on AVIF files
         a. Create the javascript implementation, and test by git restoring the uploads folder as needed (because the javascript is going to modify all the files)
          - By create, I mean try to find someone else's implementation because I don't want to write that all myself. I'm seeing a lot of NodeJS tutorials related to it. I'd like to avoid that if possible, because I'll be learning NodeJS in a class a few weeks from now and I don't want to double my work, unless it's easy
          I found this git repository - https://github.com/joaquimnetocel/images-folder-optimizer - it looks promising, I'll just need to learn to use it for overwriting the uploads folder. It honestly looks pretty simple, I'll probably run into a few problems when setting it up, but I'll try.
          I chose both webp and avif as the destination formats, so we'll see if that makes both. If it does, it will be a lot easier to make an implementation failing over to webp, at the cost of a larger server directory file size
          Cannot find package "sharp", i probably need to install it.
          It's all working after some troubleshooting with working directories. It puts the avif files in the avif folder in the uploads directory. Now, I wonder if I can automate deleting the png files
          I need to delete all unoptimized folders, here's what I've found - https://stackoverflow.com/questions/27072866/how-to-remove-all-files-from-directory-without-removing-directory-in-node-js
          The implementation is finished! Now, I need to refactor the master js script to read from the optimized directories. Fortunately, I think ahead, so all the file paths are in the json file. I'm just going to remove webp from the implementation completely. If I notice issues on the sites deployment, I'll add it back, but I'm pretty confident that nobody is using internet explorer to look for a minecraft server to join.

    ------------------------------------------------------------Testing Optimization----------------------------------------------------------------------

    Time to test the optimization - the testing is performed in a virtual environment (ubuntu linux, firefox), with the test port forwarded on my router so I can simulate a throttled external connection originating from the test machine. The results assume a configuration of setInterval(transition, 10000) in the main script.The environment also assumes caching is disabled for all*
        - With a DL speed throttled at 50kbps and upload at 20kbps (upload doesn't really matter but I'll include anyway, ), the page fails to load within a reasonable amount of time; 30 seconds to start the slideshow but the loading spinner continued much longer for retrieving the page's favicon. I gave up after 120 seconds, not that the favicon is important anyways.
        - With a download speed throttled at 250kbps and an upload speed of 50kbps (Regular 2G in firefox throttling menu) and caching disabled, the page gets to its initially loaded state in 7 seconds, and after 12 seconds, the slideshow works perfectly with no latency, and with 1 1080p image shown every 10 seconds. There's some "catch-up" jumps where the transition is skipped; maybe one jump every 8 images, but it is perfect, and probably easy to remedy by increasing the transition interval to 30 seconds, which is probably what would be wanted anyway.
        - With Good 2G (450k down, 150k up), the whole page is loaded into a visible and usable state in 5 seconds. The transition to the first image happens immeditely after this 5 seconds. There's a small "catch-up" jump to the next image, but that is only caused by the optimization in index.html where the background is set to an initial source before javascript takes it over and the actual slideshow starts. I am very happy with this!
        - Regular 3G (DL 750kbps, UL 250kbps) - 3 seconds to load the page, initial jump to first slideshow image is still visible. This might be an issue, but could be fixed just by removing the default image (slight sacrifice in initial image loading, but it might be negligible). That could also be remedied in js by selecting the default image as the currentLayer all the time, sacrificing the uniqueness of the first selected image in the slideshow.
        * format: (DL speed/UL speed)
        - Good 3G (1536kbps/750kbps) - under 2 seconds. At this point, I'm experimenting with removing the default image. That makes connections from reg3G and above perfectly smooth, with no initial flash and satisfactory loading times. 
        - Regular 4g/LTE (4mbps/3mbps) (I think this will simulate connections performed over cellular) - Under 1 second
        - DSL (2mbps/1mbps) - Also under 1 second
        - Wi-Fi (30mbps/15mbps) - Under 1 second, but significantly faster than all other tests
        - No throttling (Ethernet, 200mbps/20mbps) - instantaneous, not noticeably different from Wi-Fi

        This presents me with the realization that for <3G connections, it's probably best to include the default image, so there's immediately something presented to the user and they won't have to wait for js to load the other images. I'm not sure if this is possible, so I'll think of what it would require. My first thought was load the default image in js, but that has the js overhead we're trying to avoid. I could have the default image hardcoded in the html and just have a css rule turn the display off for >=3G, but that would turn the display off for the entire layer. Before I go deeper into this brainstorming though, I want to get some data on the quality of people's internet infrastructure. If only 1% of the population uses <3G, I don't want to bother making further optimizations for them if the page already loads in a reasonable amount of time; unless that will significantly impact search engine optimization and engagement. In my earlier testing, I did perform the same test on YouTube.com and get similar results, so maybe the global web design standard has generally moved past arbitrarily slow speeds? YouTube didn't load at all with the highest throttling setting, and maybe the fact that they're willing to sacrifice that accessibility (or need to sacrifice it because of technical limitations) helps indicate what the web standard is? To be clear, I only tested the initial loading of the website and its thumbnail assets. I've gathered from worldpopulationreview.com that the mean download speed in the US (2024) is 162mpbs. However I'm struggling to find data about how this calculation happened (other than obvious sumAll/numElements); so I don't know how overwhelming the outliers are. If I had to make a guess, lower income areas. I think I'll just ignore these optimization plans for now, and see how the site's engagement data is upon its deployment. The more I think about it, the more complex this idea seems.

        I thought of making the slideshow slide duration variable depending on internet speed, but I just thought of a much better idea. Since many people might deal with motion sickness (I have no idea what this is like, so I don't know if this logic is sound at all or not), I can present them with a cog menu that allows them to customize the duration of each image on the slideshow. This would benefit (assuming my logic is correct) people who struggle with motion sickness by giving them the option to disable the slideshow entirely. This same benefit would apply to people who wish to manually disable the slideshow for connectivity speed reasons. JavaScript would entirely stop requesting downloads from the server (or just make requests at some arbitrarily large interval, but I'll have to consider the ethics of the slight white-lie in this situation, I also haven't yet thought about any affect this will have on resource usage for the client or server), setting the background as just the default bg color or the most recently cached image. I think my "ethical" concern is extremely negligible, but I really don't like to assume. I'm also a freak with environmental protection, and like to contribute even if it's a microscopic contribution. I've thought a little bit. If the user disables the slideshow transitions because of motion sickness, they aren't worried about bandwidth. If they disabled it to save bandwidth, the arbitrarily large delay for an inevitible server request is a breach of their trust, and unnecessary usage to resources choosing to wait a long time for something. If it's not absurdly difficult, I'll remove the transitions entirely in this scenario. But either way, I'm leaning towards a full clear anyways, even though the moral implications are probably negligible.

        So, the decision is to implement a cog allowing users to customize their motion and theme preferences. 

        Cog Project:
            A simple UI element on a corner of the screen, fixed and accessible regardless of scrolling location. The logic is that if somebody's motion sickness is being triggered, they shouldn't need to scroll to the top to relieve that; they should be able to do it from anywhere, on any page (except for the map because it's a literal redirect). The cog should not interfere with the content area of the image
            Upon click, the cog will open a dropdown menu giving users the option to enable/disable the slideshow transitions, and modify the interval at which images change. The minimum interval (and default) should be 10 seconds to allow the fixed transition delay of 5 seconds adequate time. The user will see a new picture every 10 seconds, obviously. 
            A question I had for a second was if they should be able to type the delay in, or select it from a list of radio buttons. Radio buttons would probably be the best move, so the user doesn't have to touch their keyboard. That also avoids the unexplored (for me) complexity of input validation; just one less thing I have to worry about.
            The radio buttons will have these ordered options: disabled 10 seconds (default), 15 seconds, 30 seconds, 45 seconds, 60 seconds, and disabled. As explained, there will be no "enable/disable" button, disabling will simply be done in the time selection menu. This makes the menu and logic simpler for the user and me.
            The first step is get a cog icon. I'd like there to be a spinning animation on the cog. I'm going to look and see if there are any implementations I can steal.
            I could not find any that are good, but I managed to make one entirely by accident (well, not really, my goal was to make one and it was successful much sooner than expected). All it is, is 2 thick-bordered cocentric circles touching, and the outer one has a dashed border. I am also very excited that I keep making accidental improvements to it, and managed to create something that is a lot simpler than any implementation I've been able to find.


1/24/2026
    Navigation Implementation Details
        Home:
            An introduction of the server and info about it
                - Welcome message
                - About message
                    - Contains button linked to rules page that is identical to the rules page in the navigation bar
                    - Contains another apply button triggering the join page the same way as the join option in the navigation bar
                    - Frequently asked questions

                - Gallery preview (manual slideshow with arrows to cycle images, preview of random images in the gallery underneath, arrows)
                    - Manual slideshow
                        - Arrows
                            - Cycle to next image and disable background slideshow (to save bandwidth and clutter, if clutter is a concern)
                        - Preview of random images in the gallery underneath
                - Server status
                - Player count
                - Reviews

            Apply Button (triggers join nav option press)
        
        Join:
            Toggle visibility of a container that provides instructions for joining the server
                How to apply:
                    https://discord.gg/mG9Nn7V954
                    When a user uses this specific invite link, they will be given the "Hasn't done SMP Application" rule that is configured to disappear after submitting an application. This will help us filter out very old members who have never joined despite using the link, removing them from the server if they are inactive (for security reasons)

        
        Map:
            Open a canvas of the server's bluemap page
        
        Vote:
            Display info about voting for the server, and sites they can vote on
        
        Gallery:
            Toggle visibility of a div that contains previews of all images in assets\data\config.json's gallery array

        Rules:
            Display rules
    
    Of course, it's more wise to populate the base page first. It's way too early to be thinking about optimization, but I'm already thinking about lazy loading and reusing images preloaded during the slideshow for the gallery. To clarify, I already planned on using the same images, but if the site is preloading images, I might as well also send them somewhere they can be accessed by the gallery container. I think I'm just most intimidated about the gallery functionality because I'm really not sure at all what I want to do there. I'd like an upload functionality for images built into the website, but I don't just want everybody uploading their images, especially if they could in some way damage the server's reputation, or are generally useless (I probably don't have to prioritize just yet, but I will if uploads begin to fill up storage excessively). I think the best solution for this would be some kind of discord integration, where the upload button sends the photo to a special channel in the discord server, where it awaits approval, then I can either upload the photo manually or have some kind of bot integration where I press the approve button and it gets uploaded. I'd need a way to verify that they are actually on the discord, which sounds intimidating on its own. I finished all my homework early, so I have all this time that I feel like must be put to good use. This brings me to the ultimate decision of whether I should work on the gallery now, or if I should work on everything else first. As anxious as I am, I think I'll work on the content first so I can have time to gather plans.

    Considering how often things will be appearing and disappearing upon selection of a navigation option, I really need to carefully consider the logic. There should be some main content on the home page that disappears when a user navigates to a different page. That page appears in place of the home content, while the logo and the global apply button (yet to be implemented) remain visible

    The best way to do this would be to have elements specific to the join page to be part of a "join" class, same with map, vote, gallery, and rules
    For the most part, each container is going to have common elements. One being the container of the content itself, for example: 
        The server's introduction will be in a <p> element contained by a div that is formatted in complement with the page
        The server introduction will be in the json file and fetched from there to populate the container


.content div {
    margin: calc(var(--logo-top-margin) + 116px), 25vw, 17vh, 25vw;
    display: grid;
    grid-template-rows: 3% 1fr 3%;/* Top 3% height, Content, Bottom 3% height */
    grid-template-columns: 3% 1fr 3%; /* Left 3% width, Content, Right 3% width */
}

.contend div p {
    grid-area: 2 / 2;/* Row 2, column 2 of the grid.  */
}

Here, the div's margins are dependent on the viewport's width. Also, the contents of the div are dependent on the size of the viewport. I've come to the observation that this structure might present distortions when the viewport size is smaller.
Better use clamp to make padding responsive and pretty.

