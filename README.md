# Tally: Milestone 3 interactive prototype · Team Ringer Tea

CSEN 909 Human Computer Interaction · GUC · Winter 2026
Project: *AI-Powered Personalized Assessment and Learning Gap Detection for Children*

This is a clickable front-end of our interface. It covers the full workflow in the student and teacher views, plus the bonus parent view:
student upload → OCR → teacher checks the text (Stage 1) → AI grades the checked text → teacher checks the grades (Stage 2) → mistake types → learning gaps and red flags → release → the student and parent see the results.

All AI output (OCR readings, grades, mistake types, feedback) is mock data, as the Project Description allows. Nothing is sent to a server, and refreshing the page resets the demo.

## Run it locally

No build step and no dependencies.

1. Download or clone this repository.
2. Open `index.html` in Chrome, Edge, Firefox or Safari.
   - Or serve the folder: `python3 -m http.server 8000`, then open http://localhost:8000.
3. Fonts load from Google Fonts. Offline, the page falls back to system fonts.

## How to test it

Open the **Prototype guide** button (bottom right). It switches between the three views and starts each primary task from Milestone 2. The guide is a testing aid, not part of the product.

| Task (Milestone 2 HTA) | View | Screens |
|---|---|---|
| 1 · Omar uploads Math Quiz 3 | Student | Home → Take photos → Check pages → Send |
| 2 · Ms. Sara reviews the quiz | Teacher | Dashboard → Stage 1 (two lists, check first, compare) → Stage 2 → Release |
| 3 · Ms. Sara handles Omar's red flag | Teacher → Student | Dashboard → Student gaps → Confirm flag → Message with practice → Omar's messages |

Student sign-in: class code `5B-7421`, tap **Omar**, then the pictures **Cat, Ball, Fish**.
Teacher and parent sign-in: the email and password are filled in; press **Sign in**.

Run the tasks in order (1 → 2 → 3) to see each view update the others. For example, Omar's upload adds his paper to the teacher's review, and the teacher's release and confirmed red flag appear in Omar's results, progress and messages and in the parent view.

## Files

```
index.html        entry page
css/app.css       styles
js/icons.js       icons and the picture-password pictures
js/data.js        mock data (class 5B, Math Quiz 3, readings, marks)
js/i18n.js        English / German interface strings
js/core.js        state, routing, sign-in, toasts, read aloud, prototype guide
js/student.js     student view (screens 2–7)
js/teacher.js     teacher view (screens 8–15)
js/parent.js      parent view (screen 16, bonus)
```

Screen numbers and feature IDs (G1, S2, T4…) match our Milestone 2 submission. Turn on "Show feature IDs" in the Prototype guide to see them on the screens.
