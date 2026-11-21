# Youthwashing

Live: [abdimannor.github.io/youthwashing](https://abdimannor.github.io/youthwashing/) (Swedish) and [/en/](https://abdimannor.github.io/youthwashing/en/) (English)

A small resource about youthwashing, written in Swedish with an English version. It exists to help people who plan or review work with young people tell real participation apart from symbolic presence.

## The idea

Youthwashing is when a company, public body or organisation uses young people's language, look or engagement to appear modern and responsive, without sharing real responsibility, budget or decision-making power. Young people are in the pictures, on the panels and in the campaign, but the decisions behind it stay where they were.

Visibility can be worth something. The site does not treat every campaign with young faces as suspect. It tries to give the reader better questions to ask: when were young people involved, what could they change, were they paid and supported, and did anyone tell them what happened to their input.

## Who it is for

Teachers and student councils, youth organisations and associations, communications and campaign staff, and municipal officials running consultations. Young people can also use it to judge whether an invitation to "take part" is worth their time.

## What you can do with it

- **Check a real case in two minutes.** The section "Hur verkligt är inflytandet?" on the home page is a short self-assessment built only from the site's own criteria: the four review questions, the three warning signs and the four levels. It runs in the browser and sends nothing anywhere.
- **Run a workshop from a projector.** `workshop.html` shows the material one slide at a time: the four levels, the three warning signs and the four review questions. Arrow keys, space or PageUp/PageDown move, Home/End jump, Esc ends the show. Without JavaScript the slides read as a plain document.
- **Print a worksheet.** `arbetsblad.html` is an A4 worksheet built from the checklist, with space to write. Navigation and buttons are hidden in print.
- **Discuss constructed examples.** `fall.html` sets symbolic participation next to real participation in a school, an association, a brand and a municipality. The examples are hypothetical and labelled as such.

## The pages

- `index.html` (Hem): a short definition, three warning signs, four levels of participation (decoration, consultation, co-creation, decision-making power), the self-assessment, five questions to ask before a campaign is launched, and links to three Swedish youth organisations.
- `fall.html` (Exempel): the constructed examples, each with questions to ask.
- `workshop.html` (Workshopläge): the slide mode described above.
- `arbetsblad.html` (Arbetsblad): the printable worksheet.
- `om.html` (Om): why the site exists and the four review questions it is built around: timing, mandate, resources and feedback.
- `kontakt.html` (Kontakt): three ways to use the resource and a contact form.

`en/` holds English versions of all six pages, with the script strings in `en/i18n.js`.

## Using the worksheet in a workshop

1. Open `arbetsblad.html` and print it, or use the browser's "Save as PDF".
2. Split participants into small groups and give each group one example: one of the cases on `fall.html` or something from their own setting, such as a recent campaign, a consultation or a council meeting.
3. Groups work through the sheet in order: describe the example, tick the warning signs they see, place it on one of the four levels, then answer the four review questions.
4. Finish with section 5, one concrete step that would move the example towards real influence, and compare answers across groups. Disagreement about which level an example belongs on tends to be a good starting point for discussion.

The fields can also be filled in on screen, but nothing is saved or sent anywhere.

## How it is built

Plain HTML and one stylesheet (`main.css`), organised in cascade layers (`reset, tokens, base, layout, components, utilities, print`) with design tokens as custom properties for light and dark schemes. No framework and no build step. The scripts are small and optional:

- `assess.js`: the self-assessment (its section stays hidden without JavaScript)
- `workshop.js` and `workshop.css`: slide mode
- `worksheet.js`: the print button
- `motion.js`: the pause button. Motion is on by default; turning it off is remembered.

`tests/motion.mjs` checks the motion switch. The site deploys to GitHub Pages through `.github/workflows/deploy.yml` on every push to `master`.

To run it locally:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## What it does not do

- The contact form has no backend. Submitting it does nothing until a form service or a small backend is added.
- The self-assessment is a prompt for discussion, not a rating of any organisation.
- The constructed examples and the worksheet copy are drafts awaiting review.

## License

Released under the MIT License. See [LICENSE](LICENSE).
