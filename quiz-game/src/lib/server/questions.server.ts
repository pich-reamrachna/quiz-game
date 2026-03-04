import type { Question } from "$lib/types";

export const QUESTIONS: Question[] = [
  {
    id: "q1",
    promptEn: "Are you okay?",
    choices: [
      { key: "A", text: "大丈夫ですか？", isCorrect: true },
      { key: "B", text: "どうですか？", isCorrect: false },
      { key: "C", text: "気分が悪い？", isCorrect: false },
    ]
  },
  {
    id: "q2",
    promptEn: "Good morning.",
    choices: [
      { key: "A", text: "おはようございます", isCorrect: true },
      { key: "B", text: "こんばんは", isCorrect: false },
      { key: "C", text: "こんにちは", isCorrect: false },
    ]
  },
  {
    id: "q3",
    promptEn: "I forgot to bring my umbrella.",
    choices: [
      { key: "A", text: "傘を持ってくるのを忘れました。", isCorrect: true },
      { key: "B", text: "傘を持ってきました。", isCorrect: false },
      { key: "C", text: "傘が壊れました。", isCorrect: false },
    ]
  },
  {
    id: "q4",
    promptEn: "This book is easy to read.",
    choices: [
      { key: "A", text: "この本は読みやすいです。", isCorrect: true },
      { key: "B", text: "この本は読みにくいです。", isCorrect: false },
      { key: "C", text: "この本は読まれます。", isCorrect: false },
    ]
  },
  {
    id: "q5",
    promptEn: "He seems to be busy.",
    choices: [
      { key: "A", text: "彼は忙しそうです。", isCorrect: true },
      { key: "B", text: "彼は忙しいです。", isCorrect: false },
      { key: "C", text: "彼は忙しくなります。", isCorrect: false },
    ]
  },
  {
    id: "q6",
    promptEn: "You don't have to come tomorrow.",
    choices: [
      { key: "A", text: "明日来なくてもいいです。", isCorrect: true },
      { key: "B", text: "明日来なければなりません。", isCorrect: false },
      { key: "C", text: "明日来てはいけません。", isCorrect: false },
    ]
  },
  {
    id: "q7",
    promptEn: "I was surprised to hear the news.",
    choices: [
      { key: "A", text: "そのニュースを聞いて驚きました。", isCorrect: true },
      { key: "B", text: "そのニュースを聞くと驚きます。", isCorrect: false },
      { key: "C", text: "そのニュースを聞いたら驚きます。", isCorrect: false },
    ]
  },
  {
    id: "q8",
    promptEn: "I forgot to turn off the lights.",
    choices: [
      { key: "A", text: "電気を消すのを忘れました。", isCorrect: true },
      { key: "B", text: "電気をつけるのを忘れました。", isCorrect: false },
      { key: "C", text: "電気を消しました。", isCorrect: false },
    ]
  },
  {
    id: "q9",
    promptEn: "He told me to wait here.",
    choices: [
      { key: "A", text: "彼はここで待つように言いました。", isCorrect: true },
      { key: "B", text: "彼はここで待ちます。", isCorrect: false },
      { key: "C", text: "彼はここで待ちたいです。", isCorrect: false },
    ]
  },
  {
    id: "q10",
    promptEn: "I was made to apologize.",
    choices: [
      { key: "A", text: "謝らされました。", isCorrect: true },
      { key: "B", text: "謝りました。", isCorrect: false },
      { key: "C", text: "謝られました。", isCorrect: false },
    ]
  },
  {
    id: "q11",
    promptEn: "I fell in love with him at first sight.",
    choices: [
      { key: "A", text: "一目ぼれしました。", isCorrect: true },
      { key: "B", text: "失恋しました。", isCorrect: false },
      { key: "C", text: "仲直りしました。", isCorrect: false },
    ]
  },
  {
    id: "q12",
    promptEn: "We decided to break up.",
    choices: [
      { key: "A", text: "別れることにしました。", isCorrect: true },
      { key: "B", text: "結婚することにしました。", isCorrect: false },
      { key: "C", text: "付き合うことにしました。", isCorrect: false },
    ]
  },
  {
    id: "q13",
    promptEn: "We started dating last month.",
    choices: [
      { key: "A", text: "先月から付き合い始めました。", isCorrect: true },
      { key: "B", text: "先月まで付き合っていました。", isCorrect: false },
      { key: "C", text: "先月に付き合っています。", isCorrect: false },
    ]
  },
  {
    id: "q14",
    promptEn: "I was happy when he praised me.",
    choices: [
      { key: "A", text: "彼にほめられて嬉しかったです。", isCorrect: true },
      { key: "B", text: "彼にほめられて困りました。", isCorrect: false },
      { key: "C", text: "彼をほめて嬉しかったです。", isCorrect: false },
    ]
  },
  {
    id: "q15",
    promptEn: "It's hard to forget my ex.",
    choices: [
      { key: "A", text: "元恋人を忘れるのは難しいです。", isCorrect: true },
      { key: "B", text: "元恋人に会うのは難しいです。", isCorrect: false },
      { key: "C", text: "元恋人を褒めるのは難しいです。", isCorrect: false },
    ]
  },
  {
    id: "q16",
    promptEn: "I get jealous easily.",
    choices: [
      { key: "A", text: "私はすぐ嫉妬してしまいます。", isCorrect: true },
      { key: "B", text: "私はすぐ感謝してしまいます。", isCorrect: false },
      { key: "C", text: "私はすぐ安心してしまいます。", isCorrect: false },
    ]
  },
  {
    id: "q17",
    promptEn: "I was late for work because the train was delayed.",
    choices: [
      { key: "A", text: "電車が遅れたので仕事に遅れました。", isCorrect: true },
      { key: "B", text: "電車が来たので仕事に遅れました。", isCorrect: false },
      { key: "C", text: "電車が止まったけど遅れませんでした。", isCorrect: false },
    ]
  },
  {
    id: "q18",
    promptEn: "My boss told me to redo it.",
    choices: [
      { key: "A", text: "上司にやり直すように言われました。", isCorrect: true },
      { key: "B", text: "上司にやり直しました。", isCorrect: false },
      { key: "C", text: "上司がやり直しました。", isCorrect: false },
    ]
  },
  {
    id: "q19",
    promptEn: "I am used to working overtime.",
    choices: [
      { key: "A", text: "残業するのに慣れています。", isCorrect: true },
      { key: "B", text: "残業しています。", isCorrect: false },
      { key: "C", text: "残業したいです。", isCorrect: false },
    ]
  },
  {
    id: "q20",
    promptEn: "The meeting was postponed.",
    choices: [
      { key: "A", text: "会議は延期されました。", isCorrect: true },
      { key: "B", text: "会議は始まりました。", isCorrect: false },
      { key: "C", text: "会議は終わりました。", isCorrect: false },
    ]
  },
  {
    id: "q21",
    promptEn: "I'm planning to change jobs next year.",
    choices: [
      { key: "A", text: "来年転職する予定です。", isCorrect: true },
      { key: "B", text: "来年転職しました。", isCorrect: false },
      { key: "C", text: "来年転職しています。", isCorrect: false },
    ]
  },
  {
    id: "q22",
    promptEn: "This task is too difficult for me.",
    choices: [
      { key: "A", text: "この仕事は私には難しすぎます。", isCorrect: true },
      { key: "B", text: "この仕事は簡単すぎます。", isCorrect: false },
      { key: "C", text: "この仕事は難しくなります。", isCorrect: false },
    ]
  },
  {
    id: "q23",
    promptEn: "I was busy preparing for the presentation.",
    choices: [
      { key: "A", text: "プレゼンの準備で忙しかったです。", isCorrect: true },
      { key: "B", text: "プレゼンを終わらせました。", isCorrect: false },
      { key: "C", text: "プレゼンを見ました。", isCorrect: false },
    ]
  },
  {
    id: "q24",
    promptEn: "I was transferred to another department.",
    choices: [
      { key: "A", text: "別の部署に異動になりました。", isCorrect: true },
      { key: "B", text: "別の部署を辞めました。", isCorrect: false },
      { key: "C", text: "別の部署を始めました。", isCorrect: false },
    ]
  },
  {
    id: "q25",
    promptEn: "I want to go somewhere cool.",
    choices: [
      { key: "A", text: "涼しいところに行きたいです。", isCorrect: true },
      { key: "B", text: "暑いところに行きたいです。", isCorrect: false },
      { key: "C", text: "寒いところに行きたいです。", isCorrect: false },
    ]
  },
  {
    id: "q26",
    promptEn: "I opened the fridge and forgot why.",
    choices: [
      { key: "A", text: "冷蔵庫を開けたのに、理由を忘れてしまいました。", isCorrect: true },
      { key: "B", text: "冷蔵庫を開けたから、理由を忘れました。", isCorrect: false },
      { key: "C", text: "冷蔵庫を開けると、理由を忘れました。", isCorrect: false },
    ]
  },
  {
    id: "q27",
    promptEn: "I said just one more episode… and watched five.",
    choices: [
      { key: "A", text: "『あと1話だけ』と言いながら、5話も見てしまいました。", isCorrect: true },
      { key: "B", text: "『あと1話だけ』と言ったら、5話見ました。", isCorrect: false },
      { key: "C", text: "『あと1話だけ』と言ったので、5話見ました。", isCorrect: false },
    ]
  },
  {
    id: "q28",
    promptEn: "I forgot someone's name right after they told me.",
    choices: [
      { key: "A", text: "名前を聞いたばかりなのに、すぐ忘れてしまいました。", isCorrect: true },
      { key: "B", text: "名前を聞いたから、すぐ忘れました。", isCorrect: false },
      { key: "C", text: "名前を聞くと、すぐ忘れました。", isCorrect: false },
    ]
  },
  {
    id: "q29",
    promptEn: "Even though I was tired, I stayed up late.",
    choices: [
      { key: "A", text: "疲れていたのに、夜遅くまで起きていました。", isCorrect: true },
      { key: "B", text: "疲れていたから、夜遅くまで起きていました。", isCorrect: false },
      { key: "C", text: "疲れていると、夜遅くまで起きました。", isCorrect: false },
    ]
  },
  {
    id: "q30",
    promptEn: "It seems that he forgot.",
    choices: [
      { key: "A", text: "彼は忘れたようです。", isCorrect: true },
      { key: "B", text: "彼は忘れられました。", isCorrect: false },
      { key: "C", text: "彼は忘れそうです。", isCorrect: false },
    ]
  },

  
];