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


