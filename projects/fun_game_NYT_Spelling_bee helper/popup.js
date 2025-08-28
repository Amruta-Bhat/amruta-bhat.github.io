async function getLettersFromPage() {
  // Execute script on the active tab (NYT Spelling Bee page) to extract letters
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        reject("No active tab");
        return;
      }
      chrome.scripting.executeScript({
  target: { tabId: tabs[0].id },
  func: () => {
    const hive = document.querySelector('div.hive');
    if (!hive) return null;
    const centerSVG = hive.querySelector('svg.hive-cell.center');
    const centerLetter = centerSVG?.querySelector('text.cell-letter')?.textContent?.trim().toLowerCase();
    if (!centerLetter) return null;
    const outerSVGs = [...hive.querySelectorAll('svg.hive-cell.outer')];
    const outerLetters = outerSVGs
      .map(svg => svg.querySelector('text.cell-letter')?.textContent?.trim().toLowerCase())
      .filter(Boolean);
    if (outerLetters.length !== 6) return null;
    return { center: centerLetter, outerLetters };
  }
}, (results) => {
  if (chrome.runtime.lastError || !results || !results[0].result) {
    reject("Could not get letters from page.");
    return;
  }
  resolve(results[0].result);
});
    });
  });
}

function isValidWord(word, letters, center) {
  if (word.length < 4) return false;
  if (!word.includes(center)) return false;
  for (const ch of word) {
    if (!letters.includes(ch)) return false;
  }
  return true;
}

function isPangram(word, letters) {
  return letters.every(letter => word.includes(letter));
}

async function loadWords() {
  const response = await fetch(chrome.runtime.getURL("words.json"));
  return response.json();
}

async function main() {
  try {
    const lettersData = await getLettersFromPage();
    if (!lettersData) throw new Error("Letters not found");

    const { center, outerLetters } = lettersData;
    const allLetters = [center, ...outerLetters];

    document.getElementById("letters").textContent = `Letters: ${center.toUpperCase()} + ${outerLetters.map(l => l.toUpperCase()).join(", ")}`;

    const wordList = await loadWords();

    const validWords = wordList.filter(word => isValidWord(word, allLetters, center));
    const pangrams = validWords.filter(word => isPangram(word, allLetters));

    document.getElementById("pangrams").textContent = pangrams.length ? pangrams.join(", ") : "No pangrams found.";
    document.getElementById("words").textContent = validWords.length ? validWords.join(", ") : "No valid words found.";

  } catch (err) {
    document.getElementById("letters").textContent = "Error loading letters";
    document.getElementById("pangrams").textContent = "";
    document.getElementById("words").textContent = "";
    console.error(err);
  }
}

main();
