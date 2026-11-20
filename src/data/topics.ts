/** What the student can choose to write their argumentative text about. */
export type WritingTopic = {
  id: "school-start" | "phones" | "leisure";
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

export const topicStorageKey = "skrivcoach-argumenterande-topic";

/** The topic saved from an earlier visit, or the first one. */
export function readSavedTopic(storage: Pick<Storage, "getItem">): WritingTopic {
  const saved = storage.getItem(topicStorageKey);
  return writingTopics.find((topic) => topic.id === saved) ?? writingTopics[0];
}
