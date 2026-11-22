/** What the student can choose to write their argumentative text about. */
export type WritingTopic = {
  id: "school-start" | "phones" | "leisure" | "own";
  icon: string;
  label: string;
  /** The writing task shown above the student's text. */
  prompt: string;
};

export const writingTopics: WritingTopic[] = [
  {
    id: "school-start",
    icon: "⏰",
    label: "Skoldagen",
    prompt: "Ta ställning: Borde skoldagen börja senare för elever i högstadiet?",
  },
  {
    id: "phones",
    icon: "📱",
    label: "Mobilen i skolan",
    prompt: "Ta ställning: Borde mobiler vara förbjudna under hela skoldagen?",
  },
  {
    id: "leisure",
    icon: "⚽",
    label: "Fritiden",
    prompt: "Ta ställning: Borde alla ungdomar få en fritidsaktivitet gratis?",
  },
];

/** The student's own topic: the question is the student's own words. */
export function ownTopic(question: string): WritingTopic {
  return { id: "own", icon: "✏️", label: "Eget ämne", prompt: `Ta ställning: ${question.trim()}` };
}

/** Who the student wants to convince. A real reader gives the text a purpose. */
export const recipients = ["rektorn", "kommunens politiker", "skoltidningens läsare"];

export const maxOwnTopicLength = 120;
export const maxRecipientLength = 60;
export const topicStorageKey = "skrivcoach-argumenterande-topic";
export const recipientStorageKey = "skrivcoach-argumenterande-recipient";

/** What is saved for a topic: its id, or the student's own question. */
export function topicToSave(topic: WritingTopic): string {
  return topic.id === "own" ? `own:${topic.prompt.replace(/^Ta ställning: /u, "")}` : topic.id;
}

/** The topic saved from an earlier visit, or the first one. */
export function readSavedTopic(storage: Pick<Storage, "getItem">): WritingTopic {
  const saved = storage.getItem(topicStorageKey);
  if (saved?.startsWith("own:") && saved.length > 4 && saved.length <= maxOwnTopicLength + 4) return ownTopic(saved.slice(4));
  return writingTopics.find((topic) => topic.id === saved) ?? writingTopics[0];
}

/** The reader saved from an earlier visit, or the first one. */
export function readSavedRecipient(storage: Pick<Storage, "getItem">): string {
  const saved = storage.getItem(recipientStorageKey)?.trim();
  return saved && saved.length <= maxRecipientLength ? saved : recipients[0];
}
