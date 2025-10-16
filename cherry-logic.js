// ===============================================
// Cherry Court Timer - Game Logic and Synchronization
// ===============================================

// Global variables to hold the current game state
let gameState = {};
let timerInterval;

const TIMER_STORAGE_KEY = 'cherryCourtTimerConfig'; // Key for localStorage

/**
 * Loads the game state from localStorage.
 * If data is not found, redirects to the configuration page.
 * @returns {Object|null} The current game state object or null if failed.
 */
function loadGameState() {
    try {
        const storedData = localStorage.getItem(TIMER_STORAGE_KEY);
        if (storedData) {
            // Parse and return the stored data
            gameState = JSON.parse(storedData);
            return gameState;
        } else {
            console.error("No game configuration found. Redirecting to setup.");
            // Only redirect if we are not already on the config page to prevent loops
            if (!window.location.pathname.includes('configuracion.html')) {
                alert("Game not configured. Please start a new game.");
                window.location.href = 'configuracion.html';
            }
            return null;
        }
    } catch (e) {
        console.error("Error loading state from localStorage:", e);
        return null;
    }
}

/**
 * Saves the current gameState object to localStorage.
 */
function saveGameState() {
    try {
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.error("Error saving state to localStorage:", e);
    }
}

/**
 * Formats time from seconds into the MM:SS string format.
 * @param {number} totalSeconds - Time in seconds.
 * @returns {string} Formatted time string (MM:SS).
 */
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ===============================================
// TIMER FUNCTIONS (Used by control.html)
// ===============================================

/**
 * Starts or resumes the game timer.
 */
function startTimer() {
    if (gameState.isRunning || gameState.timeRemaining <= 0) return;

    gameState.isRunning = true;
    saveGameState(); // Save the 'isRunning' state change

    // Run the timer every 1000 milliseconds (1 second)
    timerInterval = setInterval(() => {
        if (gameState.timeRemaining > 0) {
            gameState.timeRemaining--;
        } else {
            // Time is zero, stop the current period
            clearInterval(timerInterval);
            gameState.isRunning = false;

            if (gameState.currentPeriod < gameState.totalPeriods) {
                // Advance to the next period
                gameState.currentPeriod++;
                // Reset time for the new period
                gameState.timeRemaining = gameState.periodDuration * 60;
                // Notify user to start next period manually (or automate if needed)
                alert(`End of Period ${gameState.currentPeriod - 1}. Starting Period ${gameState.currentPeriod}.`);
            } else {
                // Game Over
                alert("Game Over! Final Score: " + gameState.scoreLocal + " - " + gameState.scoreGuest);
                // Optionally reset the game state
            }
        }

        // Save state on every tick to ensure public board updates
        saveGameState();

        // Update the display in the control panel immediately
        if (typeof updateControlDisplay === 'function') {
            updateControlDisplay();
        }

    }, 1000);
}

/**
 * Pauses the game timer.
 */
function pauseTimer() {
    if (!gameState.isRunning) return;

    clearInterval(timerInterval);
    gameState.isRunning = false;
    saveGameState();

    // Update the display in the control panel immediately
    if (typeof updateControlDisplay === 'function') {
        updateControlDisplay();
    }
}

/**
 * Resets the timer for the current period back to the initial duration.
 */
function resetPeriodTimer() {
    if (gameState.isRunning) {
        pauseTimer();
    }

    // Reset time to the configured duration
    gameState.timeRemaining = gameState.periodDuration * 60;
    saveGameState();

    if (typeof updateControlDisplay === 'function') {
        updateControlDisplay();
    }
}

/**
 * Advances to the next period, resetting the timer.
 */
function nextPeriod() {
    if (gameState.currentPeriod >= gameState.totalPeriods) {
        alert("Maximum number of periods reached. Game is finished.");
        return;
    }

    pauseTimer();
    gameState.currentPeriod++;
    gameState.timeRemaining = gameState.periodDuration * 60;

    saveGameState();
    if (typeof updateControlDisplay === 'function') {
        updateControlDisplay();
    }
}

// ===============================================
// SCORING FUNCTIONS (Used by control.html)
// ===============================================

/**
 * Adds points to a specified team.
 * @param {string} team - 'local' or 'guest'.
 * @param {number} points - The number of points to add.
 */
function updateScore(team, points) {
    if (team === 'local') {
        gameState.scoreLocal = Math.max(0, gameState.scoreLocal + points);
    } else if (team === 'guest') {
        gameState.scoreGuest = Math.max(0, gameState.scoreGuest + points);
    }

    saveGameState();

    // Update the display in the control panel immediately
    if (typeof updateControlDisplay === 'function') {
        updateControlDisplay();
    }
}

// Make sure to load the game state when any page using this script loads
loadGameState();