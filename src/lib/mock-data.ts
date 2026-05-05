import type { Doc, Id } from "../../convex/_generated/dataModel";

function id(s: string) {
  return s as Id<never>;
}

export const MOCK_PEOPLE: Doc<"people">[] = [
  {
    _id: id("mock_pablo"),
    _creationTime: 0,
    clerkUserId: "dev",
    name: "Pablo García",
    relationship: "friend",
    interests: ["One Piece", "Senderismo", "Café"],
    notes: "Le encanta el café de especialidad.",
    budgetMin: 20,
    budgetMax: 60,
  },
  {
    _id: id("mock_maria"),
    _creationTime: 0,
    clerkUserId: "dev",
    name: "María López",
    relationship: "partner",
    interests: ["Euphoria", "Tops", "Experiencias", "Fotografía"],
    budgetMin: 50,
    budgetMax: 150,
  },
  {
    _id: id("mock_carlos"),
    _creationTime: 0,
    clerkUserId: "dev",
    name: "Carlos Molina",
    relationship: "family",
    interests: ["Fútbol", "Cocina"],
  },
  {
    _id: id("mock_lucia"),
    _creationTime: 0,
    clerkUserId: "dev",
    name: "Lucía Fernández",
    relationship: "coworker",
    interests: ["Yoga", "Libros", "Viajes", "Música", "Pintura"],
  },
  {
    _id: id("mock_ana"),
    _creationTime: 0,
    clerkUserId: "dev",
    name: "Ana Ruiz",
    relationship: "friend",
    interests: [],
  },
];

const today = new Date();

export const MOCK_UPCOMING: { date: Doc<"importantDates">; person: Doc<"people">; daysUntil: number }[] = [
  {
    date: {
      _id: id("mock_date_1"),
      _creationTime: 0,
      personId: id("mock_pablo"),
      label: "Cumpleaños",
      month: today.getMonth() + 1,
      day: today.getDate() + 5,
    },
    person: MOCK_PEOPLE[0],
    daysUntil: 5,
  },
  {
    date: {
      _id: id("mock_date_2"),
      _creationTime: 0,
      personId: id("mock_maria"),
      label: "Aniversario",
      month: today.getMonth() + 1,
      day: today.getDate() + 12,
    },
    person: MOCK_PEOPLE[1],
    daysUntil: 12,
  },
  {
    date: {
      _id: id("mock_date_3"),
      _creationTime: 0,
      personId: id("mock_carlos"),
      label: "Cumpleaños",
      month: today.getMonth() + 1,
      day: today.getDate() + 27,
    },
    person: MOCK_PEOPLE[2],
    daysUntil: 27,
  },
];
