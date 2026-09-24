"use strict";

/* =========================================================
شهر یاخته — کنترل کامل بازی
بدون ذخیره‌سازی دائمی
همه پیشرفت‌ها فقط تا زمان باز بودن صفحه باقی می‌مانند.
========================================================= */

/* =========================================================
وضعیت بازی
========================================================= */

const GameState = {
score: 0,

```
currentStage: 1,
currentQuestionIndex: 0,

stageAnswered: false,
stageDiscovered: false,

started: false,
finished: false,

currentQuestion: null,
questionPool: [],

mistakes: [],
answeredQuestions: [],
correctAnswers: [],

discovered: [],
achievements: [],

proteinStep: 0
```

};

/* =========================================================
ابزارهای عمومی
========================================================= */

function $(id) {
return document.getElementById(id);
}

function persianNumber(value) {
const digits = "۰۱۲۳۴۵۶۷۸۹";
return String(value).replace(/\d/g, digit => digits[digit]);
}

function getStageCount() {
if (typeof missions !== "undefined" && Array.isArray(missions)) {
return missions.length;
}

```
if (typeof stages !== "undefined" && Array.isArray(stages)) {
    return stages.length;
}

return 11;
```

}

function getMission(stageNumber) {
if (typeof getMissionForStage === "function") {
return getMissionForStage(stageNumber);
}

```
if (typeof missions !== "undefined" && Array.isArray(missions)) {
    return missions.find(mission =>
        Number(mission.stage) === Number(stageNumber)
    ) || null;
}

return null;
```

}

function getStageQuestions(stageNumber) {
if (typeof getQuestionsForStage === "function") {
const result = getQuestionsForStage(stageNumber);

```
    if (Array.isArray(result)) {
        return result;
    }
}

if (typeof questions !== "undefined" && Array.isArray(questions)) {
    return questions.filter(question =>
        Number(question.stage) === Number(stageNumber) ||
        Number(question.stageId) === Number(stageNumber)
    );
}

return [];
```

}

function cloneQuestionSafe(question) {
if (typeof cloneQuestion === "function") {
return cloneQuestion(question);
}

```
return JSON.parse(JSON.stringify(question));
```

}

function shuffleSafe(array) {
if (typeof shuffleArray === "function") {
return shuffleArray([...array]);
}

```
const result = [...array];

for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
}

return result;
```

}

/* =========================================================
امتیاز
========================================================= */

function updateScore() {
const scoreElement = $("score");

```
if (!scoreElement) {
    return;
}

scoreElement.textContent = persianNumber(GameState.score);

scoreElement.classList.remove("score-pop");

void scoreElement.offsetWidth;

scoreElement.classList.add("score-pop");
```

}

function addScore(amount) {
const safeAmount = Number(amount) || 0;

```
GameState.score += safeAmount;

updateScore();
```

}

/* =========================================================
پیام
========================================================= */

let messageTimer = null;

function showMessage(message) {
const element = $("game-message");

```
if (!element) {
    return;
}

element.textContent = message;
element.classList.remove("hidden");

clearTimeout(messageTimer);

messageTimer = setTimeout(() => {
    element.classList.add("hidden");
}, 4000);
```

}

/* =========================================================
صداهای ساده
========================================================= */

let audioContext = null;

function playTone(type = "correct") {
try {
if (!audioContext) {
const AudioContext =
window.AudioContext || window.webkitAudioContext;

```
        if (!AudioContext) {
            return;
        }

        audioContext = new AudioContext();
    }

    if (audioContext.state === "suspended") {
        audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const settings = {
        correct: {
            frequency: 620,
            duration: 0.13,
            volume: 0.045
        },

        wrong: {
            frequency: 190,
            duration: 0.2,
            volume: 0.035
        },

        discover: {
            frequency: 440,
            duration: 0.16,
            volume: 0.04
        },

        finish: {
            frequency: 740,
            duration: 0.3,
            volume: 0.05
        }
    };

    const selected = settings[type] || settings.correct;

    oscillator.frequency.value = selected.frequency;
    oscillator.type = "sine";

    gain.gain.setValueAtTime(
        selected.volume,
        audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + selected.duration
    );

    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + selected.duration
    );

} catch (error) {
    /* صدا اختیاری است و نباید باعث توقف بازی شود. */
}
```

}

/* =========================================================
پیشرفت شهر
========================================================= */

function updateProgress() {
const total = getStageCount();

```
const progress =
    Math.min(
        100,
        Math.max(
            0,
            ((GameState.currentStage - 1) / Math.max(total - 1, 1)) * 100
        )
    );

const fill = $("progress-fill");

if (fill) {
    fill.style.width = `${Math.max(progress, 9)}%`;
}

const text = $("progress-text");

if (text) {
    text.textContent =
        `مرحله ${persianNumber(GameState.currentStage)} از ${persianNumber(total)}`;
}
```

}

/* =========================================================
نمایش مرحله
========================================================= */

function updateStageInterface() {

```
const mission = getMission(GameState.currentStage);

if (!mission) {
    return;
}

const stageIcon = $("stage-icon");

if (stageIcon) {
    stageIcon.textContent = mission.icon || getDefaultStageIcon(GameState.currentStage);
}

const stageNumber = $("stage-number");

if (stageNumber) {
    stageNumber.textContent =
        `مرحله ${persianNumber(GameState.currentStage)}`;
}

const stageTitle = $("stage-title");

if (stageTitle) {
    stageTitle.textContent =
        mission.title || `مرحله ${GameState.currentStage}`;
}

const missionTitle = $("mission-title");

if (missionTitle) {
    missionTitle.textContent =
        mission.title || "مأموریت شهر";
}

const description = $("mission-description");

if (description) {
    description.textContent =
        mission.description || "";
}

const objective = $("mission-objective");

if (objective) {
    objective.textContent =
        mission.objective || "";
}

const story = $("mission-story");

if (story) {
    story.textContent =
        mission.story || "";
}

const reward = $("mission-reward");

if (reward) {
    const rewardValue =
        Number(mission.reward) || 0;

    reward.textContent =
        `+${persianNumber(rewardValue)} امتیاز`;
}

updateProgress();
updateCityMap();

const discoverButton = $("discover-button");

if (discoverButton) {
    discoverButton.disabled =
        GameState.stageDiscovered;

    discoverButton.textContent =
        GameState.stageDiscovered
            ? "✅ این بخش کشف شده است"
            : "🔎 کشف این بخش از شهر";
}
```

}

/* =========================================================
آیکون پیش‌فرض مراحل
========================================================= */

function getDefaultStageIcon(stage) {

```
const icons = [
    "🚪",
    "🧠",
    "🏭",
    "🌐",
    "🕸️",
    "📦",
    "⚡",
    "♻️",
    "🧭",
    "🛡️",
    "🚨"
];

return icons[stage - 1] || "🏙️";
```

}

/* =========================================================
کشف مرحله
========================================================= */

function discoverCurrentStage() {

```
if (GameState.stageDiscovered) {
    showQuestion();
    return;
}

GameState.stageDiscovered = true;

if (!GameState.discovered.includes(GameState.currentStage)) {
    GameState.discovered.push(GameState.currentStage);
}

const mission = getMission(GameState.currentStage);

const reward =
    mission && Number(mission.reward) > 0
        ? Number(mission.reward)
        : 5;

addScore(reward);

playTone("discover");

updateStageInterface();

updateAchievements();

showMessage(
    `🎉 بخش «${mission?.title || "شهر یاخته"}» کشف شد! +${persianNumber(reward)} امتیاز`
);

setTimeout(() => {
    showQuestion();
}, 550);
```

}

/* =========================================================
آماده‌سازی سؤال‌های مرحله
========================================================= */

function prepareQuestionPool() {

```
const rawQuestions =
    getStageQuestions(GameState.currentStage);

GameState.questionPool =
    shuffleSafe(rawQuestions)
        .map(question => cloneQuestionSafe(question));

GameState.currentQuestionIndex = 0;
```

}

/* =========================================================
پیدا کردن پاسخ صحیح
========================================================= */

function getCorrectIndex(question) {

```
if (!question) {
    return -1;
}

if (
    Number.isInteger(question.correctIndex) &&
    question.correctIndex >= 0
) {
    return question.correctIndex;
}

if (
    Number.isInteger(question.correctAnswer) &&
    question.correctAnswer >= 0
) {
    return question.correctAnswer;
}

if (
    Number.isInteger(question.answer) &&
    question.answer >= 0
) {
    return question.answer;
}

if (
    Number.isInteger(question.correct) &&
    question.correct >= 0
) {
    return question.correct;
}

if (typeof question.correctAnswer === "string") {

    const index =
        question.options?.indexOf(question.correctAnswer);

    if (index >= 0) {
        return index;
    }
}

if (typeof question.answer === "string") {

    const index =
        question.options?.indexOf(question.answer);

    if (index >= 0) {
        return index;
    }
}

if (typeof question.correct === "string") {

    const index =
        question.options?.indexOf(question.correct);

    if (index >= 0) {
        return index;
    }
}

return -1;
```

}

/* =========================================================
ساخت گزینه‌ها با حفظ شماره اصلی
========================================================= */

function buildShuffledOptions(question) {

```
const options = Array.isArray(question.options)
    ? question.options
    : [];

return shuffleSafe(
    options.map((text, originalIndex) => ({
        text,
        originalIndex
    }))
);
```

}

/* =========================================================
نمایش سؤال
========================================================= */

function showQuestion(question = null) {

```
if (!GameState.started) {
    return;
}

if (!GameState.stageDiscovered) {
    return;
}

if (!question) {

    if (!GameState.questionPool.length) {
        prepareQuestionPool();
    }

    if (!GameState.questionPool.length) {
        showMessage("برای این مرحله هنوز سؤالی ثبت نشده است.");
        return;
    }

    question =
        GameState.questionPool[
            GameState.currentQuestionIndex
        ];
}

if (!question) {
    return;
}

GameState.currentQuestion =
    cloneQuestionSafe(question);

GameState.stageAnswered = false;

const card = $("question-card");

if (card) {
    card.classList.remove("hidden");
}

const number = $("question-number");

if (number) {
    number.textContent =
        `سؤال ${persianNumber(GameState.currentQuestionIndex + 1)}`;
}

const text = $("question-text");

if (text) {
    text.textContent =
        question.question ||
        question.text ||
        question.title ||
        "";
}

const difficulty = $("difficulty-text");

if (difficulty) {
    difficulty.textContent =
        question.difficulty || "متوسط";
}

const optionsContainer = $("answer-options");

if (!optionsContainer) {
    return;
}

optionsContainer.innerHTML = "";

const shuffledOptions =
    buildShuffledOptions(question);

shuffledOptions.forEach((option, index) => {

    const button =
        document.createElement("button");

    button.type = "button";

    button.className = "answer-option";

    button.dataset.originalIndex =
        String(option.originalIndex);

    const numberElement =
        document.createElement("span");

    numberElement.className =
        "option-number";

    numberElement.textContent =
        persianNumber(index + 1);

    const textElement =
        document.createElement("span");

    textElement.textContent =
        option.text;

    button.appendChild(numberElement);
    button.appendChild(textElement);

    button.addEventListener(
        "click",
        () => answerQuestion(option.originalIndex, button)
    );

    optionsContainer.appendChild(button);
});

hideFeedback();

const nextButton = $("next-question");

if (nextButton) {
    nextButton.disabled = true;
}

updateQuestionButtons();
```

}

/* =========================================================
بررسی پاسخ
========================================================= */

function isAnswerCorrect(question, originalIndex, selectedText) {

```
const correctIndex =
    getCorrectIndex(question);

if (
    correctIndex >= 0 &&
    Number(originalIndex) === Number(correctIndex)
) {
    return true;
}

if (
    typeof question.correctAnswer === "string" &&
    question.correctAnswer === selectedText
) {
    return true;
}

if (
    typeof question.answer === "string" &&
    question.answer === selectedText
) {
    return true;
}

if (
    typeof question.correct === "string" &&
    question.correct === selectedText
) {
    return true;
}

if (typeof checkAnswer === "function") {

    try {
        return Boolean(
            checkAnswer(
                question,
                selectedText,
                originalIndex
            )
        );
    } catch (error) {
        /* بررسی جایگزین بالا استفاده می‌شود. */
    }
}

return false;
```

}

/* =========================================================
ثبت اشتباه
========================================================= */

function registerMistake(question) {

```
if (!question) {
    return;
}

const id =
    question.id ??
    question.question ??
    question.text;

const alreadyExists =
    GameState.mistakes.some(item =>
        String(item.id) === String(id)
    );

if (!alreadyExists) {

    GameState.mistakes.push({
        id,
        question: question.question || question.text || "",
        explanation:
            question.explanation ||
            question.reason ||
            "این سؤال را دوباره مرور کن."
    });
}

updateMistakesLab();
```

}

/* =========================================================
ثبت پاسخ
========================================================= */

function answerQuestion(originalIndex, clickedButton) {

```
if (GameState.stageAnswered) {
    return;
}

const question =
    GameState.currentQuestion;

if (!question) {
    return;
}

const options =
    Array.isArray(question.options)
        ? question.options
        : [];

const selectedText =
    options[originalIndex];

const correct =
    isAnswerCorrect(
        question,
        originalIndex,
        selectedText
    );

const buttons =
    document.querySelectorAll(".answer-option");

buttons.forEach(button => {
    button.disabled = true;
});

GameState.stageAnswered = true;

const questionId =
    question.id ??
    question.question ??
    question.text ??
    Math.random();

if (!GameState.answeredQuestions.includes(questionId)) {
    GameState.answeredQuestions.push(questionId);
}

if (correct) {

    clickedButton?.classList.add("correct");

    GameState.correctAnswers.push(questionId);

    const reward =
        Number(question.reward) ||
        Number(question.points) ||
        10;

    addScore(reward);

    playTone("correct");

    showFeedback(
        true,
        question.explanation ||
        "آفرین! پاسخ تو درست بود."
    );

    showMessage(
        `🎉 درست جواب دادی! +${persianNumber(reward)} امتیاز`
    );

    document
        .getElementById("question-card")
        ?.classList.add("correct-flash");

} else {

    clickedButton?.classList.add("wrong");

    registerMistake(question);

    playTone("wrong");

    revealCorrectOption(question);

    showFeedback(
        false,
        question.explanation ||
        "این پاسخ درست نبود. نکته‌ی سؤال را مرور کن."
    );

    showMessage(
        "💡 اشکالی ندارد! توضیح را بخوان و دوباره یاد بگیر."
    );
}

updateAchievements();
updateQuestionButtons();
```

}

/* =========================================================
نشان دادن پاسخ صحیح
========================================================= */

function revealCorrectOption(question) {

```
const correctIndex =
    getCorrectIndex(question);

const buttons =
    document.querySelectorAll(".answer-option");

buttons.forEach(button => {

    const originalIndex =
        Number(button.dataset.originalIndex);

    if (
        correctIndex >= 0 &&
        originalIndex === correctIndex
    ) {
        button.classList.add("reveal-correct");
    }
});
```

}

/* =========================================================
بازخورد
========================================================= */

function showFeedback(correct, explanation) {

```
const box = $("answer-feedback");

if (!box) {
    return;
}

box.classList.remove("hidden");

const icon =
    box.querySelector(".feedback-icon");

const title =
    box.querySelector(".feedback-title");

const text =
    box.querySelector(".feedback-text");

if (correct) {

    if (icon) {
        icon.textContent = "✅";
    }

    if (title) {
        title.textContent = "پاسخ درست!";
    }

} else {

    if (icon) {
        icon.textContent = "💡";
    }

    if (title) {
        title.textContent = "این یکی اشتباه بود؛ نکته را یاد بگیر!";
    }
}

if (text) {
    text.textContent = explanation;
}
```

}

function hideFeedback() {

```
const box = $("answer-feedback");

if (!box) {
    return;
}

box.classList.add("hidden");

const icon =
    box.querySelector(".feedback-icon");

const title =
    box.querySelector(".feedback-title");

const text =
    box.querySelector(".feedback-text");

if (icon) {
    icon.textContent = "";
}

if (title) {
    title.textContent = "";
}

if (text) {
    text.textContent = "";
}
```

}

/* =========================================================
کنترل سؤال
========================================================= */

function updateQuestionButtons() {

```
const previous =
    $("previous-question");

const next =
    $("next-question");

if (previous) {
    previous.disabled =
        GameState.currentQuestionIndex <= 0;
}

if (next) {
    next.disabled =
        !GameState.stageAnswered;
}
```

}

function nextQuestion() {

```
if (!GameState.stageAnswered) {
    showMessage("اول به سؤال پاسخ بده تا ادامه بدهی.");
    return;
}

const nextIndex =
    GameState.currentQuestionIndex + 1;

if (
    nextIndex <
    GameState.questionPool.length
) {

    GameState.currentQuestionIndex =
        nextIndex;

    showQuestion();

    return;
}

const total =
    getStageCount();

if (GameState.currentStage < total) {

    nextStage();

} else {

    finishGame();
}
```

}

function previousQuestion() {

```
if (GameState.currentQuestionIndex <= 0) {
    return;
}

GameState.currentQuestionIndex--;

showQuestion();
```

}

/* =========================================================
مرحله بعد و قبل
========================================================= */

function nextStage() {

```
const total =
    getStageCount();

if (GameState.currentStage >= total) {
    finishGame();
    return;
}

GameState.currentStage++;

GameState.stageDiscovered =
    GameState.discovered.includes(
        GameState.currentStage
    );

GameState.stageAnswered = false;

GameState.currentQuestion = null;

prepareQuestionPool();

updateStageInterface();

const card = $("question-card");

if (card) {
    card.classList.add("hidden");
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});

showMessage(
    `🚀 وارد مرحله ${persianNumber(GameState.currentStage)} شدی!`
);
```

}

function previousStage() {

```
if (GameState.currentStage <= 1) {
    return;
}

GameState.currentStage--;

GameState.stageDiscovered =
    GameState.discovered.includes(
        GameState.currentStage
    );

GameState.stageAnswered = false;

GameState.currentQuestion = null;

prepareQuestionPool();

updateStageInterface();

const card = $("question-card");

if (card) {
    card.classList.add("hidden");
}

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
```

}

/* =========================================================
نقشه شهر
========================================================= */

function updateCityMap() {

```
const buildings =
    document.querySelectorAll(".mini-building");

buildings.forEach(building => {

    const stage =
        Number(building.dataset.stage);

    building.classList.remove(
        "unlocked",
        "current"
    );

    if (
        GameState.discovered.includes(stage) ||
        stage <= GameState.currentStage
    ) {
        building.classList.add("unlocked");
    }

    if (
        stage === GameState.currentStage
    ) {
        building.classList.add("current");
    }
});
```

}

function setupCityMap() {

```
const buildings =
    document.querySelectorAll(".mini-building");

buildings.forEach(building => {

    building.addEventListener(
        "click",
        () => {

            const stage =
                Number(building.dataset.stage);

            if (
                !GameState.discovered.includes(stage) &&
                stage > GameState.currentStage
            ) {
                showMessage(
                    "🔒 هنوز این بخش از شهر را کشف نکرده‌ای."
                );

                return;
            }

            GameState.currentStage = stage;

            GameState.stageDiscovered =
                GameState.discovered.includes(stage);

            GameState.stageAnswered = false;

            prepareQuestionPool();

            updateStageInterface();

            const card = $("question-card");

            if (card) {
                card.classList.add("hidden");
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    );
});
```

}

/* =========================================================
آزمایشگاه اشتباهات
========================================================= */

function updateMistakesLab() {

```
const container =
    $("mistakes-content");

if (!container) {
    return;
}

if (!GameState.mistakes.length) {

    container.innerHTML = `
        <div class="empty-state">
            <span>🧪</span>
            <p>هنوز اشتباهی ثبت نشده؛ ادامه بده!</p>
        </div>
    `;

    return;
}

container.innerHTML = "";

GameState.mistakes.forEach((mistake, index) => {

    const item =
        document.createElement("div");

    item.className = "mistake-item";

    const content =
        document.createElement("div");

    const question =
        document.createElement("p");

    question.textContent =
        mistake.question;

    content.appendChild(question);

    const button =
        document.createElement("button");

    button.type = "button";

    button.className =
        "mistake-review-button";

    button.textContent =
        "🔍 مرور";

    button.addEventListener(
        "click",
        () => reviewMistake(index)
    );

    item.appendChild(content);
    item.appendChild(button);

    container.appendChild(item);
});
```

}

function reviewMistake(index) {

```
const mistake =
    GameState.mistakes[index];

if (!mistake) {
    return;
}

const allQuestions =
    typeof questions !== "undefined" &&
    Array.isArray(questions)
        ? questions
        : [];

const original =
    allQuestions.find(question => {

        const id =
            question.id ??
            question.question ??
            question.text;

        return String(id) === String(mistake.id);
    });

if (!original) {
    showMessage("سؤال اصلی پیدا نشد.");
    return;
}

GameState.currentQuestion =
    cloneQuestionSafe(original);

GameState.stageDiscovered = true;

showQuestion(GameState.currentQuestion);

document
    .getElementById("question-card")
    ?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
```

}

/* =========================================================
دستاوردها
========================================================= */

function unlockAchievement(index) {

```
if (GameState.achievements.includes(index)) {
    return;
}

GameState.achievements.push(index);

const cards =
    document.querySelectorAll(".achievement-card");

const card = cards[index];

if (card) {

    card.classList.remove("locked");
    card.classList.add("unlocked");

    showMessage(
        `🏆 نشان جدید باز شد: ${card.querySelector("h3")?.textContent || "دستاورد"}`
    );
}
```

}

function updateAchievements() {

```
if (
    GameState.discovered.length >= 1
) {
    unlockAchievement(0);
}

if (
    GameState.discovered.includes(2)
) {
    unlockAchievement(1);
}

if (
    GameState.discovered.includes(7)
) {
    unlockAchievement(2);
}

if (GameState.finished) {
    unlockAchievement(3);
}
```

}

/* =========================================================
شروع بازی
========================================================= */

function startGame() {

```
GameState.score = 0;
GameState.currentStage = 1;
GameState.currentQuestionIndex = 0;

GameState.stageAnswered = false;
GameState.stageDiscovered = false;

GameState.started = true;
GameState.finished = false;

GameState.currentQuestion = null;
GameState.questionPool = [];

GameState.mistakes = [];
GameState.answeredQuestions = [];
GameState.correctAnswers = [];

GameState.discovered = [];
GameState.achievements = [];

GameState.proteinStep = 0;

updateScore();
updateMistakesLab();

const welcome =
    $("welcome-screen");

const game =
    $("game-screen");

if (welcome) {
    welcome.classList.remove("active-screen");
}

if (game) {
    game.classList.add("active-screen");
}

prepareQuestionPool();

updateStageInterface();

const card =
    $("question-card");

if (card) {
    card.classList.add("hidden");
}

showMessage(
    "🚀 شهر یاخته آماده است! اولین بخش را کشف کن."
);

window.scrollTo({
    top: 0,
    behavior: "smooth"
});
```

}

/* =========================================================
پایان بازی
========================================================= */

function finishGame() {

```
if (GameState.finished) {
    return;
}

GameState.finished = true;

playTone("finish");

updateAchievements();

const finalScore =
    $("final-score");

if (finalScore) {
    finalScore.textContent =
        persianNumber(GameState.score);
}

const totalQuestions =
    GameState.answeredQuestions.length;

const correct =
    GameState.correctAnswers.length;

const description =
    $("final-description");

if (description) {

    description.textContent =
        `تو ${persianNumber(correct)} پاسخ درست از ${persianNumber(totalQuestions)} پاسخ ثبت‌شده داشتی و تمام مراحل شهر را پشت سر گذاشتی.`;
}

const modal =
    $("final-modal");

if (modal) {
    modal.classList.remove("hidden");
}
```

}

/* =========================================================
شروع دوباره
========================================================= */

function restartGame() {

```
const modal =
    $("final-modal");

if (modal) {
    modal.classList.add("hidden");
}

startGame();
```

}

/* =========================================================
راهنما
========================================================= */

function openHelp() {

```
const modal =
    $("help-modal");

if (modal) {
    modal.classList.remove("hidden");
}
```

}

function closeHelp() {

```
const modal =
    $("help-modal");

if (modal) {
    modal.classList.add("hidden");
}
```

}

/* =========================================================
مأموریت مسیر پروتئین
========================================================= */

const proteinRoute = [
{
icon: "🏭",
title: "رناتن",
text: "در شهر یاخته، رناتن محل ساخت پروتئین است."
},
{
icon: "🕸️",
title: "شبکه آندوپلاسمی زبر",
text: "بخشی از رناتن‌ها روی سطح شبکه آندوپلاسمی زبر قرار دارند و در مسیر ساخت و جابه‌جایی پروتئین‌ها نقش دارند."
},
{
icon: "📦",
title: "دستگاه گلژی",
text: "دستگاه گلژی مواد را دریافت، تغییر، مرتب و بسته‌بندی می‌کند."
},
{
icon: "📨",
title: "ریزکیسه",
text: "ریزکیسه‌ها در جابه‌جایی مواد درون یاخته نقش دارند."
},
{
icon: "🎯",
title: "مقصد",
text: "حالا مسیر کلی یک پروتئین را از ساخت تا جابه‌جایی در شهر یاخته دیدی!"
}
];

function openProteinRoute() {

```
GameState.proteinStep = 0;

updateProteinRoute();

const modal =
    $("protein-modal");

if (modal) {
    modal.classList.remove("hidden");
}
```

}

function updateProteinRoute() {

```
const step =
    proteinRoute[GameState.proteinStep];

if (!step) {
    return;
}

const icon =
    $("protein-step-icon");

const title =
    $("protein-step-title");

const text =
    $("protein-step-text");

const fill =
    $("protein-progress-fill");

const next =
    $("protein-next");

if (icon) {
    icon.textContent = step.icon;
}

if (title) {
    title.textContent = step.title;
}

if (text) {
    text.textContent = step.text;
}

if (fill) {

    const percentage =
        ((GameState.proteinStep + 1) /
            proteinRoute.length) * 100;

    fill.style.width =
        `${percentage}%`;
}

if (next) {

    next.textContent =
        GameState.proteinStep >= proteinRoute.length - 1
            ? "🏁 پایان مأموریت"
            : "مرحله بعد ➜";
}
```

}

function nextProteinStep() {

```
if (
    GameState.proteinStep >=
    proteinRoute.length - 1
) {

    addScore(10);

    showMessage(
        "🧬 مسیر پروتئین را کامل کردی! +۱۰ امتیاز"
    );

    const modal =
        $("protein-modal");

    if (modal) {
        modal.classList.add("hidden");
    }

    return;
}

GameState.proteinStep++;

updateProteinRoute();
```

}

/* =========================================================
بستن مودال با کلیک بیرون
========================================================= */

function setupModalOutsideClick() {

```
document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener(
        "click",
        event => {

            if (event.target === modal) {
                modal.classList.add("hidden");
            }
        }
    );
});
```

}

/* =========================================================
اتصال دکمه‌ها
========================================================= */

function setupButtons() {

```
$("start-game")?.addEventListener(
    "click",
    startGame
);

$("help-button")?.addEventListener(
    "click",
    openHelp
);

$("help-button-game")?.addEventListener(
    "click",
    openHelp
);

$("close-help")?.addEventListener(
    "click",
    closeHelp
);

$("close-help-bottom")?.addEventListener(
    "click",
    closeHelp
);

$("discover-button")?.addEventListener(
    "click",
    discoverCurrentStage
);

$("next-question")?.addEventListener(
    "click",
    nextQuestion
);

$("previous-question")?.addEventListener(
    "click",
    previousQuestion
);

$("next-stage")?.addEventListener(
    "click",
    nextStage
);

$("previous-stage")?.addEventListener(
    "click",
    previousStage
);

$("restart-game")?.addEventListener(
    "click",
    restartGame
);

$("final-restart")?.addEventListener(
    "click",
    restartGame
);

$("final-close")?.addEventListener(
    "click",
    () => {
        $("final-modal")?.classList.add("hidden");
    }
);

$("protein-route-button")?.addEventListener(
    "click",
    openProteinRoute
);

$("protein-close")?.addEventListener(
    "click",
    () => {
        $("protein-modal")?.classList.add("hidden");
    }
);

$("protein-next")?.addEventListener(
    "click",
    nextProteinStep
);
```

}

/* =========================================================
آغاز برنامه
========================================================= */

function initializeGame() {

```
updateScore();
updateProgress();

updateMistakesLab();

updateCityMap();

setupButtons();
setupCityMap();
setupModalOutsideClick();

const game =
    $("game-screen");

const welcome =
    $("welcome-screen");

if (game) {
    game.classList.remove("active-screen");
}

if (welcome) {
    welcome.classList.add("active-screen");
}
```

}

/* =========================================================
اجرای اولیه
========================================================= */

document.addEventListener(
"DOMContentLoaded",
initializeGame
);
