# Youthwashing

A small Swedish-language resource about youthwashing.

Live site: [abdimannor.github.io/youthwashing](https://abdimannor.github.io/youthwashing/)

## The idea

Youthwashing is when a company, public body or organisation uses young people's language, look or engagement to appear modern and responsive, without sharing real responsibility, budget or decision-making power. Young people are in the pictures, on the panels and in the campaign, but the decisions behind it stay where they were.

Visibility can be worth something. The site does not treat every campaign with young faces as suspect. It tries to help the reader tell the difference between actual participation and symbolic presence, mostly by giving them better questions to ask: when were young people involved, what could they change, were they paid and supported, and did anyone tell them what happened to their input.

## Who it is for

People who plan or review work that involves young people: teachers and student councils, youth organisations and associations, communications and campaign staff, and municipal officials running consultations. It can also be used by young people themselves who want to judge whether an invitation to "take part" is worth their time.

## What is on each page

- `index.html` (Hem): a short definition, three warning signs, four levels of participation (decoration, consultation, co-creation, decision-making power), five questions to ask before a campaign is launched, and links to three Swedish youth organisations.
- `fall.html` (Exempel): constructed examples from a school, an association, a brand and a municipality. Each shows what symbolic participation could look like next to real participation, with questions to ask. The examples are hypothetical and labelled as such; they do not describe real organisations.
- `arbetsblad.html` (Arbetsblad): a printable A4 worksheet built from the checklist content on the site, with space to write.
- `om.html` (Om): why the site exists and the four review questions it is built around: timing, mandate, resources and feedback.
- `kontakt.html` (Kontakt): three ways to use the resource and a contact form.

## Using the worksheet in a workshop

1. Open `arbetsblad.html` and print it, or use the browser's "Save as PDF". Navigation and buttons are hidden in print and the layout is set up for A4.
2. Split participants into small groups and give each group one example. This can be one of the constructed cases on `fall.html` or something from their own setting, such as a recent campaign, a consultation or a council meeting.
3. Groups work through the sheet in order: describe the example, tick the warning signs they see, place it on one of the four levels, then answer the four review questions.
4. Finish with section 5, one concrete step that would move the example towards real influence, and compare answers across groups. Disagreement about which level an example belongs on tends to be a good starting point for discussion.

The fields can also be filled in on screen, but nothing is saved or sent anywhere.

## How it is built

Plain HTML and one CSS file (`main.css`). There is no build step, no framework and no JavaScript beyond the print button on the worksheet. The site is deployed to GitHub Pages by `.github/workflows/deploy.yml` on every push to `master`.

To run it locally, open `index.html` in a browser, or serve the folder so that links behave as they do online:

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

## What is still open

- The contact form on `kontakt.html` has no backend. It is a static prototype and submitting it does nothing. It needs a form service or a small backend before it can be used.
- The constructed examples and the worksheet copy are drafts awaiting review.
- The site is Swedish only.

## License

Released under the MIT License. See [LICENSE](LICENSE).
