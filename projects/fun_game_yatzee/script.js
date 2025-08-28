document.addEventListener("DOMContentLoaded", () => {
  const diceContainer = document.getElementById("dice");
  const rollButton = document.getElementById("rollBtn");
  const rollsLeftDisplay = document.getElementById("rollsLeft");
  const turnIndicator = document.getElementById("turnIndicator");
  const newGameButton = document.getElementById("newGameBtn");
  const totalScoreDisplay = document.getElementById("totalScore");
  const highScoreDisplay = document.getElementById("highScore");
  const gameTitle = document.getElementById("gameTitle");
  const upperTotalDisplay = document.getElementById("bonus");
  
  let gameCompleted = false;  // Track game completion status
  
  if (!diceContainer) {
    console.warn("Dice container (#dice) not found. Aborting script.");
    return;
  }

  let dice = [null, null, null, null, null];
  let held = [false, false, false, false, false];
  let rollsLeft = 3;
  let upperBonusGiven = false;
  let scores = {
    aces: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
    threeKind: null, fourKind: null, fullHouse: null, smallStraight: null,
    largeStraight: null, yahtzee: null, chance: null
  };
  const categoryIds = Object.keys(scores);
  
   
  // Reset the game state to its initial values
  function startNewGame() {
	//Apply random color to game title
	applyRandomTitleColor();
	
    // Reset dice and rolls
    dice = [null, null, null, null, null];
    held = [false, false, false, false, false];
    rollsLeft = 3;
    rollsLeftDisplay.textContent = rollsLeft;

    // Reset the scores to 0
    categoryIds.forEach(category => {
      scores[category] = null;  // Reset each category's score to 0
      document.getElementById(category).textContent = "-";  // Reset the score cell in the table
      document.getElementById(category + "-dice").textContent = "";  // Reset dice state display
    });
	
	// Reset the upper section bonus indicator (if relevant)
    upperBonusGiven = false;
    document.getElementById("bonus").textContent = "-";
	
	// Reset total score display
    updateTotalScore();
	//update the uppertotal to 0
	upperTotalDisplay.textContent = "-";

    // Clear the UI for dice and turn indicator
    turnIndicator.style.display = "block";
    turnIndicator.textContent = "🎲 New Turn!";
    setTimeout(() => (turnIndicator.style.display = "none"), 1400);

    // Re-render the dice
    renderDice();
	
	// Re-enable clickability on the score cells
    enableScoreCellClickability();
  }
  
  function applyRandomTitleColor() {
  const colors = ["#1B60BB","#D44A00","#e74c3c", "#2ecc71", "#3498db", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#ff69b4"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  gameTitle.style.color = randomColor;
  }
 
  function renderDice() {
    diceContainer.innerHTML = "";
    dice.forEach((val, i) => {
      const d = document.createElement("div");
      d.className = "die" + (held[i] ? " held" : "");
      d.textContent = val === null ? "-" : String(val);
      d.onclick = () => toggleHold(i);
      diceContainer.appendChild(d);
    });
  }
  // Function to handle dice hold
  function toggleHold(index) {
    if (rollsLeft === 3) return; // can't hold before first roll
    if (dice[index] === null) return;
    held[index] = !held[index];
    renderDice();
  }

  function updateDiceDisplay() {
    const diceElements = diceContainer.children;
    for (let i = 0; i < dice.length; i++) {
      diceElements[i].textContent = dice[i] === null ? "-" : dice[i];
    }
  }

  function animateDiceRoll(callback) {
    let animationCount = 0;
    const maxAnimations = 8;
    const interval = setInterval(() => {
      for (let i = 0; i < dice.length; i++) {
        if (!held[i]) {
          const tempValue = Math.floor(Math.random() * 6) + 1;
          diceContainer.children[i].textContent = tempValue;
          diceContainer.children[i].classList.add("rolling");
        }
      }
      animationCount++;
      if (animationCount >= maxAnimations) {
        clearInterval(interval);
        Array.from(diceContainer.children).forEach(die => die.classList.remove("rolling"));
        callback();
      }
    }, 80);
  }

  function rollDice() {
    if (rollsLeft <= 0) return;
    animateDiceRoll(() => {
      for (let i = 0; i < dice.length; i++) {
        if (!held[i]) {
          dice[i] = Math.floor(Math.random() * 6) + 1;
        }
      }
      rollsLeft--;
      rollsLeftDisplay.textContent = rollsLeft;
      updateDiceDisplay();
    });
  }

  rollButton.addEventListener("click", rollDice);
  newGameButton.addEventListener("click", startNewGame);

  function startNewTurn() {
    rollsLeft = 3;
    held = [false, false, false, false, false];
    dice = [null, null, null, null, null];
    rollsLeftDisplay.textContent = rollsLeft;
    renderDice();
    turnIndicator.textContent = "🎲 New Turn!";
    turnIndicator.style.display = "block";
    setTimeout(() => (turnIndicator.style.display = "none"), 1400);
  }

  // Initialize game UI
  startNewTurn();
  const scoreCells = document.querySelectorAll("td[id]");
scoreCells.forEach(cell => {
  const category = cell.id;
  cell.addEventListener("click", () => handleScoreClick(category, cell));
});
	function handleScoreClick(category, cell) {
  // Prevent overwriting score
  if (scores[category] !== null || rollsLeft === 3) return;

  const counts = Array(7).fill(0); // 0 index unused
  dice.forEach(val => counts[val]++);

  let score = 0;

  switch (category) {
    case "aces":
      score = counts[1] * 1; break;
    case "twos":
      score = counts[2] * 2; break;
    case "threes":
      score = counts[3] * 3; break;
    case "fours":
      score = counts[4] * 4; break;
    case "fives":
      score = counts[5] * 5; break;
    case "sixes":
      score = counts[6] * 6; break;

    case "threeKind":
      score = counts.some(c => c >= 3) ? sumDice() : 0; break;
    case "fourKind":
      score = counts.some(c => c >= 4) ? sumDice() : 0; break;
    case "fullHouse":
      score = counts.includes(3) && counts.includes(2) ? 25 : 0; break;
    case "smallStraight":
      score = hasSmallStraight(dice) ? 30 : 0; break;
    case "largeStraight":
      score = hasLargeStraight(dice) ? 40 : 0; break;
    case "yahtzee":
      score = counts.includes(5) ? 50 : 0; break;
    case "chance":
      score = sumDice(); break;
  }
  // Update score for this category
  scores[category] = score;
  cell.textContent = score;
  cell.style.pointerEvents = "none";
  cell.style.backgroundColor = "#ddd";
  
  //Set Dice State column
  const diceCell = document.getElementById(`${category}-dice`);
  if (diceCell) {
    diceCell.textContent = dice.join(", ");
  }
  
  // Update the running total
  updateTotalScore();
  
  //update the upper category total
  updateUpperSectionTotal();
  
  // Check if the game is completed (all categories filled)
  gameCompleted = Object.values(scores).every(score => score !== null);

  if (gameCompleted) {
    calculateUpperSectionBonus();

  // Check and update high score
  const finalScore = parseInt(document.getElementById("totalScore").textContent, 10);
  const storedHighScore = parseInt(localStorage.getItem("yahtzeeHighScore") || "0", 10);

  if (finalScore > storedHighScore) {
    localStorage.setItem("yahtzeeHighScore", finalScore);
    highScoreDisplay.textContent = finalScore;
    alert(`🎉 New High Score: ${finalScore}!`);
  } else {
    alert(`Game Over! Your Score: ${finalScore}`);
  }
	
  }

  // Start a new turn if the game isn't over
  if (!gameCompleted) {
    startNewTurn();
	
	
  }
}
function sumDice() {
  return dice.reduce((a, b) => a + b, 0);
}

function hasSmallStraight(dice) {
  const unique = [...new Set(dice)].sort();
  const str = unique.join('');
  return /1234|2345|3456/.test(str);
}

function hasLargeStraight(dice) {
  const unique = [...new Set(dice)].sort().join('');
  return unique === '12345' || unique === '23456';
}

function re() {
  const totalScore = Object.values(scores).reduce((sum, score) => {
    return score !== null ? sum + score : sum;
  }, 0);

  // Update the total score in the table
  document.getElementById("totalScore").textContent = totalScore;
}

function calculateUpperSectionBonus() {
  const upperSectionTotal = [
    scores.aces, scores.twos, scores.threes, scores.fours, scores.fives, scores.sixes
  ].reduce((sum, score) => sum + (score || 0), 0); // Sum of upper section scores

  const bonus = upperSectionTotal >= 63 ? 35 : 0;  // If 63 or more, give 35 points bonus
  scores.bonus = bonus;re

  // Update the bonus row in the table
  const bonusCell = document.getElementById("bonus");
  if (bonusCell) {
    bonusCell.textContent = bonus;
  }

  // Update the running total again to include the bonus
  updateTotalScore();
}

function updateTotalScore() {
  const totalScore = Object.values(scores).reduce((sum, score) => {
    return score !== null ? sum + score : sum;
  }, 0);

  // Update the total score in the table
  document.getElementById("totalScore").textContent = totalScore;
}

 // Function to enable clickability for the score cells
function enableScoreCellClickability() {
  categoryIds.forEach(category => {
    const scoreCell = document.getElementById(category);
    scoreCell.style.pointerEvents = 'auto';
    scoreCell.style.backgroundColor = ''; // Optional: reset background color
  });
}

loadHighScore();
applyRandomTitleColor();

function loadHighScore() {
  const stored = localStorage.getItem("yahtzeeHighScore");
  highScoreDisplay.textContent = stored ? stored : "0";
}

function updateUpperSectionTotal() {
  const upperCategories = ['aces', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperTotal = upperCategories.reduce((sum, category) => {
    return sum + (scores[category] || 0);
  }, 0);
  upperTotalDisplay.textContent = upperTotal;
}

	
});
