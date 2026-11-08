import type { ToeResultId } from "@shared/game-content";

/* ---------- Patriarchy Bingo ---------- */

export const BINGO_SQUARES = [
  "\"Not all men\"",
  "Meeting could've been an email",
  "Man explains your own job to you",
  "\"You're so bossy\"",
  "\"Have you tried smiling?\"",
  "Pink version costs more",
  "\"I'm not a feminist, but...\"",
  "Interrupted mid-sentence",
  "Pockets: fake",
  "\"Calm down\"",
  "Girlboss slogan on a tote bag",
  "Man takes credit for your idea",
  "\"Who's watching the kids?\"",
  "Panel of 6 men on women's health",
  "\"Can you take notes?\"",
  "Handed the office cake duty",
  "\"You'd be so pretty if...\"",
  "\"Actually...\"",
  "Salad for the girls, steak for the boys",
  "Lean in (no childcare provided)",
  "Told to \"just ask nicely\"",
  "Manager says \"we're a family\"",
  "\"Prove it\" (you already did)",
  "Unsolicited LinkedIn DM",
  "Thanked for \"being so helpful\"",
];

const LINES = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20],
];

export function bingoLines(marked: boolean[]): number {
  return LINES.filter((l) => l.every((i) => marked[i])).length;
}

/* ---------- Headline Roulette ---------- */

export const HEADLINE_SUBJECTS = [
  "Local Man",
  "Area Husband",
  "Nation's CEOs",
  "Exhausted Woman",
  "Group of Coworkers",
  "Man Who Said 'Well, Actually'",
  "Entire Group Chat",
  "Local Cat",
  "Brand-New Intern",
  "The Patriarchy",
];

export const HEADLINE_VERBS = [
  "Heroically Explains",
  "Bravely Announces Plans to Fix",
  "Cannot Believe They Were Asked to Do",
  "Congratulates Self for Noticing",
  "Quietly Takes Credit for",
  "Sends Thoughts and Prayers About",
  "Schedules Meeting About",
  "Discovers",
  "Launches Podcast About",
  "Reluctantly Admits to",
];

export const HEADLINE_OBJECTS = [
  "Women's Pockets",
  "Wage Gap, Citing 'Choices'",
  "Basic Dishwasher Loading",
  "Whole Entire Feminism Thing",
  "Woman's Perfectly Good Idea",
  "the Pink Tax on Razors",
  "the Concept of Consent Forms for Brunch",
  "Her Own Name Spelled Correctly",
  "Mandatory Fun Friday",
  "a Very Small Toe Injury",
];

export const HEADLINE_TAILS = [
  "Experts Say Nothing Will Change",
  "Women Have Been Saying This for Decades",
  "'We Did It,' Says Man Who Did Not",
  "Pinky Toe Hardest Hit",
  "Sources Confirm: It Was Her Idea",
  "Everyone Else Already Knew",
  "Follow-up Meeting Scheduled",
  "Wait Until He Hears About Tuesday",
];

/* ---------- Which Toe Are You? ---------- */

export interface ToeResult {
  id: ToeResultId;
  name: string;
  emoji: string;
  blurb: string;
}

export const TOE_RESULTS: ToeResult[] = [
  {
    id: "pinky",
    name: "The Pinky Toe",
    emoji: "🦶",
    blurb:
      "Small, underestimated and the first thing to find the coffee table in the dark. You will be remembered, mostly with swearing.",
  },
  {
    id: "big",
    name: "The Big Toe",
    emoji: "👑",
    blurb:
      "You're in charge, in every group project, and nobody voted for it. Please delegate before you become a bunion.",
  },
  {
    id: "middle",
    name: "The Middle Toe",
    emoji: "🫠",
    blurb: "Unsung peacekeeper holding the whole foot together while everyone else gets the credit. Overdue for a spa day.",
  },
  {
    id: "stubbed",
    name: "The Stubbed Toe",
    emoji: "💥",
    blurb: "Raw emotions, zero filter. You say what everyone is thinking, and then you hop around while they catch up.",
  },
];

export interface QuizQuestion {
  q: string;
  answers: { text: string; toe: ToeResult["id"] }[];
}

export const TOE_QUIZ: QuizQuestion[] = [
  {
    q: "A man in a meeting repeats your idea louder. You…",
    answers: [
      { text: "Say \"Great, thanks for backing my idea\" with a smile that could cut glass.", toe: "pinky" },
      { text: "Take over the meeting. It's now your meeting.", toe: "big" },
      { text: "Make sure the notes show who said it first.", toe: "middle" },
      { text: "Say it out loud. All of it.", toe: "stubbed" },
    ],
  },
  {
    q: "Your ideal Saturday is…",
    answers: [
      { text: "Wine, a very small dog, and no obligations.", toe: "pinky" },
      { text: "Organizing everyone else's Saturday.", toe: "big" },
      { text: "Hosting brunch for people who all cancelled.", toe: "middle" },
      { text: "A protest, then a nap, then another protest.", toe: "stubbed" },
    ],
  },
  {
    q: "Pick a piece of corporate jargon to defeat forever.",
    answers: [
      { text: "\"Circle back.\"", toe: "pinky" },
      { text: "\"Per my last email.\"", toe: "big" },
      { text: "\"We're a family here.\"", toe: "middle" },
      { text: "\"Let's take this offline.\"", toe: "stubbed" },
    ],
  },
  {
    q: "Your superpower would be…",
    answers: [
      { text: "Being underestimated until it's too late.", toe: "pinky" },
      { text: "Making a spreadsheet for anything.", toe: "big" },
      { text: "Knowing exactly what everybody needs.", toe: "middle" },
      { text: "Never apologizing for taking up space.", toe: "stubbed" },
    ],
  },
  {
    q: "Someone says \"You're so emotional.\" You say…",
    answers: [
      { text: "\"Yes. Emotionally, I'm planning your downfall.\"", toe: "pinky" },
      { text: "\"And you're so predictable.\"", toe: "big" },
      { text: "\"Let's talk about it,\" then you cry in the stairwell.", toe: "middle" },
      { text: "Nothing. The look says it.", toe: "stubbed" },
    ],
  },
];
