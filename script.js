let wordList = [];
let remainingWords = [];
let currentGuess = "";

function loadWords() {
  return fetch("wordle_possibles.txt")
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to load word list");
      }
      return response.text();
    })
    .then(data => {
      wordList = data.split("\n").map(word => word.trim()).filter(word => word.length === 5);
      remainingWords = [...wordList];
      console.log("Total words loaded:", wordList.length);
      initializeGame();
    })
    .catch(error => {
      console.error("Error loading words:", error);
    });
}

function getFeedback(guess, actual) {
  let feedback = [];
  for (let i = 0; i < 5; i++) {
    if (guess[i] === actual[i]) {
      feedback[i] = "g";
    } else if (actual.includes(guess[i])) {
      feedback[i] = "y";
    } else {
      feedback[i] = "x";
    }
  }
  return feedback.join('');
}

function filterWords(guess, feedback, words) {
  return words.filter(word => {
    const actualLetterCount = {};
    const greenLetters = new Set(); // To track letters that are green

    // First pass: Check for greens and count letters for yellows
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      if (feedback[i] === "g") {
        if (word[i] !== letter) return false; // Green check
        greenLetters.add(letter); // Track green letters
      } else {
        actualLetterCount[letter] = (actualLetterCount[letter] || 0) + 1; // Count letters for yellow check
      }
    }

    // Second pass: Check for yellows and grays
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      if (feedback[i] === "y") {
        if (word[i] === letter || (word.split(letter).length - 1 < actualLetterCount[letter])) {
          return false; // Yellow check
        }
      } else if (feedback[i] === "x") {
        if (greenLetters.has(letter)) {
          continue; // Skip gray check for letters that are green
        }
        if (word.includes(letter)) {
          return false; // Gray check
        }
      }
    }

    return true; // If all checks pass, the word is valid
  });
}

function calculateInformationGain(guess, remainingWords) {
  const feedbackCounts = {};
  remainingWords.forEach(word => {
    const feedback = getFeedback(guess, word);
    feedbackCounts[feedback] = (feedbackCounts[feedback] || 0) + 1;
  });

  let infoGain = 0;
  const totalWords = remainingWords.length;
  for (const count of Object.values(feedbackCounts)) {
    const probability = count / totalWords;
    infoGain -= probability * Math.log2(probability);
  }
  return infoGain;
}

function calculateEntropy(guess, remainingWords) {
  const feedbackCounts = {};
  remainingWords.forEach(word => {
    const feedback = getFeedback(guess, word);
    feedbackCounts[feedback] = (feedbackCounts[feedback] || 0) + 1;
  });

  let entropy = 0;
  const totalWords = remainingWords.length;
  for (const count of Object.values(feedbackCounts)) {
    const probability = count / totalWords;
    if (probability > 0) {
      entropy -= probability * Math.log2(probability);
    }
  }
  return entropy;
}

function suggestBestGuess(remainingWords) {
  let bestGuess = "";
  let maxInfoGain = -Infinity;
  let maxEntropy = -Infinity;

  remainingWords.forEach(guess => {
    const infoGain = calculateInformationGain(guess, remainingWords);
    const entropy = calculateEntropy(guess, remainingWords);

    if (infoGain > maxInfoGain) {
      maxInfoGain = infoGain;
      bestGuess = guess;
    }

    if (entropy > maxEntropy) {
      maxEntropy = entropy;
      bestGuess = guess;
    }
  });

  return bestGuess;
}

function initializeGame() {
  currentGuess = "crane"; // Default initial guess
  document.getElementById("suggested-word").innerText = currentGuess;

  document.getElementById("next-guess-button").addEventListener("click", () => {
    const feedbackElements = document.querySelectorAll(".feedback-letter");
    const feedback = Array.from(feedbackElements).map(el => el.value.trim().toLowerCase());

    if (feedback.length !== 5 || !feedback.every(f => ["g", "y", "x"].includes(f))) {
      alert("Invalid feedback! Use 'g' for green, 'y' for yellow, and 'x' for gray.");
      return;
    }

    remainingWords = filterWords(currentGuess, feedback.join(''), remainingWords);

    if (remainingWords.length === 1) {
      const solution = remainingWords[0];
      document.getElementById("suggested-word").innerText = `The answer is: ${solution}`;
      return;
    }

    if (remainingWords.length === 0) {
      document.getElementById("suggested-word").innerText = "No words match the feedback!";
      return;
    }

    currentGuess = suggestBestGuess(remainingWords);
    document.getElementById("suggested-word").innerText = currentGuess;
  });
}

// Load words and initialize the game
loadWords();