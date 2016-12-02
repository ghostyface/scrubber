# Welcome to: Scrubber!

A fun little feature on our sites that I decided to clean up and turn into a jQuery plugin as an exercise.

## Overview

I work at a streaming-video site, and this is the front-end portion of a little preview feature we implemented several years ago. It's the product of 3 people collaborating to achieve the following goals:

- When a user moves their mouse ("scrubs") across a thumbnail image representing a video, they should see a preview from across that entire video
- The location of their mouse across the timeline should correspond to the action that takes place in the video at that point
- The preview should show them the timing of the action they are previewing within the video
- When the user clicks, they should be taken to a video-player page and the video should begin at the point in the video where they have clicked
- This functionality needs to perform well across browsers and regardless of the user's connection speed (within reason)

The pursuit of these goals quickly led us to the conclusion that retrieving an individual thumbnail for each possible portion of the video, despite having a thumb for every second of every video in our library, would not perform adequately. Thus some time was spent finding the right number of thumbnails to represent a video that could be grouped together in a sprite image small enough to download quickly. Other work had to be done to ensure that the player would start properly at the right point in the video, but that functionality existed and merely needed some refinement -- hence the rounding of timings so that timeline values are always expressed in whole seconds.

## Notes

- This is not really a good case for a jQuery plugin, since the scrubber expects many things: 
  - a duration and offset for every thumbnail
  - your ability to link to a video player page
  - that player's ability to start the video at the point expressed in seconds in the link
  - that you already have individual sprites created for every thumbnail
  - etc. etc.
- I decided to make it a plugin as a thought exercise, and as a way to discuss the project outside of the site where it resides.
- Despite the spiffiness of this technique, I have yet to see similar functionality on other video sites. I'm a little surprised, as it is a nice way for users to get a sense of whether they will enjoy a video without having to click through to the actual video to find out.
  - That being said, it lends itself best to videos featuring a variety of movement. A talking-head interview doesn't benefit much from the ability to scan across the action. 
   - One good use case is sports video: scanning across a football game to zero in on a specific play is delightful.

