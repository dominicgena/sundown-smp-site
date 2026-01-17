Task: Smooth slideshow with crossfades on every page but the gallery page
1. After some thinking, the best approach seems to be *not* simply changing which image acts as the background image; but to contain the background images inside of 1 div that takes up the entire body. It should remain fixed so scrolling doesn't affect its position.
 a. Create a div (#background-slideshow) that is fixed to the viewport, covers the entire viewport (other than the header), and has a z-index of -1 to guarantee placement in the back of all other elements
 b. Inside that container, use two separate layers, with one containing the current image shown, and the other containing the next image to be shown. After every 60 seconds, the currently shown image will fade its opacity to transparency, and the background image will have its opacity faded to visibility at the same rate. I'm not sure if this is actually feasible, but some research will hopefully answer this question
2. Logic: Images and their alt-texts are stored in config.json. For an image to be present on the slideshow, both the file and its unique entry should be added to the config file.
 a. The script must implement an exclude rule for the gallery page. There's no sense in doing a slideshow of the gallery behind the page that's displaying the whole gallery in a grid format. This can be done simply by nesting the entire slideshow logic inside a confirmation that the user isn't in the /gallery/ directory
 b. A timer set to 60,000 ms (60s) will trigger the next image function upon its completion
 c. The fade will be a smooth fade taking 5 seconds to switch from one photo to the next
3. Challenges: These are high-resolution images (1920x1080). It's a heavy load to fetch more than maybe 3 at a time or have them constantly loaded (guestimate based on nothing except my intuition). The heavy load might cause the browser to fall behind and show a blank screen as the background until the next photo can be loaded
 solution: The javascript should pre-fetch the next image in the sequence 10-15 seconds before the transition is scheduled to happen. This will make sure that the next photo is ready before the transition is attempted

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