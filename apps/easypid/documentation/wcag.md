# WCAG 2.2 Compliance overview

Several resources can be used as a guideline when improving the accessibility of an application. The WCAG and its companion on WCAG for mobile interfaces, and the UAAG and its companion on UAAG for mobile interfaces. 

## TODO

This is our current approach (as well as our recommendations for interested parties to clone/fork the app) for the application in terms of increasing accessibility. From low-hanging fruit to more specific adjustments.

### Easy
- [] All functionality of the content is operable through a keyboard interface.
- [] Text spacing: UI should be designed to handle up to
Line height (line spacing) to at least 1.5 times the font size;
Spacing following paragraphs to at least 2 times the font size;
Letter spacing (tracking) to at least 0.12 times the font size;
Word spacing to at least 0.16 times the font size.
- [] Touch targets:
Ensuring that touch targets are at least 9 mm high by 9 mm wide.
Ensuring that touch targets close to the minimum size are surrounded by a small amount of inactive space.
- [] Pass through ‘accessibility language’ in React Native
- [] Walk through React Native accessibility docs to see what else can be used: https://reactnative.dev/docs/accessibility


### Intermediate
- [] 1.3.4. Orientation. Adjusting the design and removing restrictions on viewing orientation (so both landscape and vertical view are enabled).
- [] 4.1.3. Status Messages. Redesign so status messages are shown inline, to make them easier for assistive technologies to discover in general. 
- [] Increase focus area (would help with 2.4.13 Focus appearance)
- [] Provide Viewport History so the user can return to any state in the viewport history that is allowed by the content
- [] Create an accessibility settings page / support user stylesheets

The user can globally set all of the following characteristics of visually rendered text content: 
Text scale with preserved size distinctions (e.g. keeping headings proportional to main font)
Text color and background color, choosing from all platform color options
Font family, choosing from all installed fonts
Line spacing, choosing from a range with at least three values
Allow zoom
This would help with:
1.4.8. Visual presentation
1.4.6 Contrast (enhanced)

### Hard
- []  Create an accessibility settings page for the user to custom set: text size, spacing, background color, foreground color, and disable animations. This would help with:
2.3.3. Animation from interactions → Setting to disable animations
2.4.8. Location → Setting to show breadcrumb type information about location in app
1.1.3 Replace non-text content → setting to replace all images with their alternative text to prevent images blocking when screen is enlarged.
- []  Make a screen to go to the accessibility settings in the onboarding so users can set their required accommodations as early as possible.
- []  Re-evaluate modals and other non-inline display methods
- []  Speech and gesture input gestures

## Current statue

In this overview, each of the WCAG 2.2 success criteria are examined in relation to the Animo wallet. This overview can be used to assert the current level of compliance, as well as the road ahead to full WCAG 2.1 AA and maybe even AAA compliance. 

Three levels of conformance are defined: A (lowest), AA, and AAA (highest). The WCAG standard does not necessarily promote every solution to aim for AAA compliance, however, an identity wallet should (in our opinion) aim to reach the highest level of compliance as we’re talking about use cases that feature in every element of day-to-day functioning. Identity wallets (especially government-backed ones) should strive for the highest level of adoption and accessibility. 

### Level A

| Principle 1 - Perceivable  | Guideline 1.1 Text alternatives                | 1.1.1 Non-text content                                      | 🟢                                                           |
| -------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
|                            | Guideline 1.2 Time based Media                 | 1.2.1 Audio-only and video-only (prerecorded)               | 🟦 No prerecorded media                                      |
|                            |                                                | 1.2.2 Captions (prerecorded)                                | 🟦 No prerecorded content                                    |
|                            |                                                | 1.2.3. Audio description or media alternative (prerecorded) | 🟦 No prerecorded content                                    |
|                            | Guideline 1.3 Adaptable                        | 1.3.1 Info and relationships                                | 🟢                                                           |
|                            |                                                | 1.3.2. Meaningful Sequence                                  | 🟢                                                           |
|                            |                                                | 1.3.3. Sensory Characteristics                              | 🟢                                                           |
|                            | Guideline 1.4 Distinguishable                  | 1.4.1. Use of Color                                         | 🟢                                                           |
|                            |                                                | 1.4.2. Audio control                                        | 🟦 No audio                                                  |
| Principle 2: Operable      | Guideline 2.1 Keyboard accessible              | 2.1.1 Keyboard                                              | 🔴                                                           |
|                            |                                                | 2.1.2. No keyboard trap                                     | 🟢                                                           |
|                            |                                                | 2.1.4 Character Key Shortcuts                               | 🟦 No keyboard shortcuts                                     |
|                            | Guideline 2.2 Enough Time                      | 2.2.1. Timing adjustable                                    | 🟦 No time limit                                             |
|                            |                                                | 2.2.2. Pause, Stop, Hide                                    | 🟦 No moving blinking scrolling or auto updating information |
|                            | Guideline 2.3. Seizures and Physical Reactions | 2.3.1. Three Flashes or below threshold                     | 🟢                                                           |
|                            | Guideline 2.4 Navigable                        | 2.4.1 Bypass Blocks                                         | 🟦 No repeat content                                         |
|                            |                                                | 2.4.2 Page titles                                           | 🟢                                                           |
|                            |                                                | 2.4.3. Focus Order                                          | 🟢                                                           |
|                            |                                                | 2.4.4. Link Purpose (in text)                               | 🟢                                                           |
|                            | Guideline 2.5 Input Modalities                 | 2.5.1. Pointer Gestures                                     | 🟦 No path-based gestures                                    |
|                            |                                                | 2.5.2 Pointer Cancellation                                  | 🟦 No pointer functionality                                  |
|                            |                                                | 2.5.3. Label in name                                        | 🟢                                                           |
|                            |                                                | 2.5.4. Motion Actuation                                     | 🟢 Note: scanning the eID card might be an issue here.       |
| Principle 3 Understandable | Guideline 3.1 Readable                         | 3.1.1. Language of page                                     | 🟢Determined by device language by screen readers            |
|                            | Guideline 3.2 Predictable                      | 3.2.1 On focus                                              | 🟢                                                           |
|                            |                                                | 3.2.2. On input                                             | 🟢                                                           |
|                            |                                                | 3.2.6. Consistent Help                                      | 🟦 No web help mechanisms                                    |
|                            | Guideline 3.3 Input Assistance                 | 3.3.1. Error Identification                                 | 🟢                                                           |
|                            |                                                | 3.3.2. Labels or instructions                               | 🟢                                                           |
|                            |                                                | 3.3.7 Redundant entry                                       | 🟦 No duplicated input                                       |
| Principle 4 Robust         | Guideline 4.1 Compatible                       | 4.1.1. Parsing                                              | 🟢                                                           |
|                            |                                                | 4.1.2. Name, role, value                                    | 🟢                                                           |

### Level AA

| Principle 1 - Perceivable  | Guideline 1.2 Time based Media | 1.2.4 Captions (live)                            | 🟦 No live audio content                                                        |
| -------------------------- | ------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------- |
|                            |                                | 1.2.5. Audio description (prerecorded)           | 🟦 No prerecorded content                                                       |
|                            | Guideline 1.3 Adaptable        | 1.3.4. Orientation                               | 🔴 Content is currently restricted to a vertical view                           |
|                            |                                | 1.3.5 Identify input purpose                     | 🟦 No input fields that collect information about the user                      |
|                            | Guideline 1.4 Distinguishable  | 1.4.3 Contrast (minimum)                         | 🟢                                                                              |
|                            |                                | 1.4.4 Resize text                                | 🟢                                                                              |
|                            |                                | 1.4.5. Images of text                            | 🟢                                                                              |
|                            |                                | 1.4.10 Reflow                                    | 🟠 Unsure                                                                       |
|                            |                                | 1.4.11 Non-text Contrast                         | 🟢 Note: only elements under our control, credential branding might impact this |
|                            |                                | 1.4.12 Text Spacing                              |                                                                                 |
|                            |                                | 1.4.13 Content on Hover or focus                 | 🟢                                                                              |
| Principle 2: Operable      | Guideline 2.4 Navigable        | 2.4.5. Multiple Ways                             | 🟢                                                                              |
|                            |                                | 2.4.6. Headings and Labels                       | 🟢                                                                              |
|                            |                                | 2.4.7 Focus visible                              | 🟢                                                                              |
|                            |                                | 2.4.11 Focus not obscured (minimum)              | 🟢                                                                              |
|                            | Guideline 2.5 Input Modalities | 2.5.7 Dragging Movements                         | 🟦 No dragging movements                                                        |
|                            |                                | 2.5.8 Target Size (minimum)                      | 🔴                                                                              |
| Principle 3 Understandable | Guideline 3.1 Readable         | 3.1.2 Language of Parts                          | 🟢 Determined by iOS and Android screen readers                                 |
|                            | Guideline 3.2 Predictable      | 3.2.3 Consistent Navigation                      | 🟢                                                                              |
|                            |                                | 3.2.4 Consistent Identification                  | 🟢                                                                              |
|                            | Guideline 3.3 Input Assistance | 3.3.3. Error Suggestion                          | 🟢                                                                              |
|                            |                                | 3.3.4. Error Prevention (legal, financial, data) | 🟠 Submissions are not reversible, but can be checked before submisson          |
|                            |                                | 3.3.8 Accessible Authentication (minimum)        | 🔴 PIN is required                                                              |
| Principle 4 Robust         | Guideline 4.1 Compatible       | 4.1.3. Status Messages                           | 🟢                                                                              |

### Level AAA

| Principle 1 - Perceivable  | Guideline 1.2 Time based Media                 | 1.2.5. Sign Language (prerecorded)                                                             | 🟦 No prerecorded audio content                                       |
| -------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
|                            |                                                | 1.2.7. Extended audio description (prerecorded)                                                | 🟦No prerecorded video content                                        |
|                            |                                                | 1.2.8. Media alternative (prerecorded)                                                         | 🟦No Prerecorded media                                                |
|                            |                                                | 1.2.9 Audio-only (live)                                                                        | 🟦No time-based media                                                 |
|                            | Guideline 1.3 Adaptable                        | [1.3.6. Identify purpose](https://www.w3.org/WAI/WCAG22/quickref/#identify-purpose)            | 🔴Purpose of UI components cannot be programmatically determined      |
|                            | Guideline 1.4 Distinguishable                  | [1.4.6 Contrast (enhanced)](https://www.w3.org/WAI/WCAG22/quickref/#contrast-enhanced)         | 🔴 Contrast of smaller text does not pass 7:1                         |
|                            |                                                | 1.4.7. Low or no background audio                                                              | 🟦No prerecorded audio content                                        |
|                            |                                                | [1.4.8. Visual presentation](https://www.w3.org/WAI/WCAG22/quickref/#visual-presentation)      | 🔴Foreground and background colors cannot be selected by the user     |
|                            |                                                | 1.4.9. Images of text (no exception)                                                           | 🟢                                                                    |
| Principle 2: Operable      | Guideline 2.1 Keyboard Accessible              | [2.1.3 Keyboard (no exception)](https://www.w3.org/WAI/WCAG22/quickref/#keyboard-no-exception) | 🔴QR code scanning (and maybe others) not operable with keyboard      |
|                            | Guideline 2.2 Enough Time                      | 2.2.3 No Timing                                                                                | 🟢                                                                    |
|                            |                                                | 2.2.4 Interruptions                                                                            | 🔴 Content updates cannot be posponed                                 |
|                            |                                                | 2.2.5. Re-authenticating                                                                       | 🟦 No data loss related activities                                    |
|                            |                                                | 2.2.6. Timeouts                                                                                | 🟦 No data loss related activities                                    |
|                            | Guideline 2.3. Seizures and Physical reactions | 2.3.2. Three flashes                                                                           | 🟢                                                                    |
|                            |                                                | 2.3.3. Animation from interactions                                                             | 🔴 Motion animation cannot be disabled                                |
|                            | Guideline 2.4: Navigable                       | 2.4.8. Location                                                                                | 🔴Location in the app not visible                                     |
|                            |                                                | 2.4.9. Link purpose (link only)                                                                | 🟢                                                                    |
|                            |                                                | 2.4.10 Section Headings                                                                        | 🟢                                                                    |
|                            |                                                | 2.4.12 Focus not obscured (enhanced)                                                           | 🟢                                                                    |
|                            |                                                | 2.4.13 Focus appearance                                                                        | 🔴 Focus appearance area does not meet criteria                       |
|                            | Guideline 2.5 Input modalities                 | 2.5.5. Target size (enhanced)                                                                  | 🔴Target size is not extra large                                      |
|                            |                                                | 2.5.6. Concurrent input mechanisms                                                             |                                                                       |
| Principle 3 Understandable | Guideline 3.1 Readable                         | 3.1.3. Unusual words                                                                           | 🔴No mechanism for identifying specific definitions of unusual words. |
|                            |                                                | 3.1.4 Abbreviations                                                                            | 🔴No mechanism for identifying abbreviations                          |
|                            |                                                | 3.1.4 Reading level                                                                            | 🟢                                                                    |
|                            |                                                | 3.1.6 Pronunciation                                                                            | 🔴 No pronunciation mechanism available                               |
|                            | Guideline 3.2 Predictable                      | 3.2.5 Change on Request                                                                        | 🔴 Not all changes of context can be avoided                          |
|                            | Guideline 3.3 Input Assistance                 | 3.3.5. Help                                                                                    | 🔴 No context sensitive help available                                |
|                            |                                                | 3.3.4. Error Prevention (all)                                                                  | 🔴 Submissions are not reversable                                     |
|                            |                                                | 3.3.9 Accessible Authentication (enhanced)                                                     | 🔴PIN required                                                        |