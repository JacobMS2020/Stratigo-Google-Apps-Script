/* 
To-DO:
  []: Game Rooms (more than one game at a time).
  []: Show board on win.
  []: Place & Remove peices for setup.
  []: Show the remaining players peices on the board.
  []: Add image graphics?

*/

const intCachTimeout = 21600 // 6 hours

// -------------------------------------------------------------------- Website
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('Stratego - capture the flag')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// -------------------------------------------------------------------- CLEAR

const cachScriptKeys = [
  "gamePlayerTurn",
  "gameState",
  "gameLastMove",
  "p1Board",
  "p1Setup",
  "p1Name",
  "p2Board",
  "p2Setup",
  "p2Name",
  "log",
]

//  ------------------------------------------------------------------- ADMIN

function readLog() {
  const cachScript = CacheService.getScriptCache();
  const gamePlayerTurn = cachScript.get('gamePlayerTurn');
  const player1Board = JSON.parse(cachScript.get('p1Board'));
  const player2Board = JSON.parse(cachScript.get('p2Board'));
  const log = cachScript.get('log');

  console.log(log)
}

function test34875634() {
  console.log(check({playerName: "Jacob"}));
}

function readCachService() {
  const cachScript = CacheService.getScriptCache();
  const keys = cachScript.getAll(cachScriptKeys);
  var nullCount = 0;
  for (var i = 0; i < cachScriptKeys.length; i++) { 
    console.log(cachScriptKeys[i] + ":\n" + JSON.stringify(cachScript.get(cachScriptKeys[i])));
    nullCount+=1
  }
  console.log("NullCount = " + nullCount + "/" + cachScriptKeys.length);
}

function clear_All() {
  const cachScript = CacheService.getScriptCache();
  cachScript.removeAll(cachScriptKeys);
  console.log('Cleared ALL');
}

//  ------------------------------------------------------------------- MOVING

function moving(playerNAME, playerSelectRow, playerSelectCol, rowNumber, columnNumber) {
  var logging = false;

  const cachScript = CacheService.getScriptCache();
  const playerID = _playerNameToPlayerID(playerNAME);
  const gamePlayerTurn = cachScript.get('gamePlayerTurn');
  const player1Board = JSON.parse(cachScript.get('p1Board'));
  const player2Board = JSON.parse(cachScript.get('p2Board'));

  if (logging) { _log("moving(): player 1 Board:\n" + player1Board + "\nplayer 2 Board:\n" + player2Board + "\nplayerName" + playerNAME + " |playerSelectRow: " + playerSelectRow + " |playerSelectCol: " + playerSelectCol + " |rowNumber: " + rowNumber + " |columnNumber: " + columnNumber); }

// PieceType
  if (playerID == "p1") {    
    var attackerPieceType = player1Board[playerSelectRow][playerSelectCol];
    var defenderPieceType = player2Board[9-rowNumber][9-columnNumber];
  } else if (playerID == "p2") {    
    var attackerPieceType = player2Board[playerSelectRow][playerSelectCol];
    var defenderPieceType = player1Board[9-rowNumber][9-columnNumber];
  }
  if (logging) { _log("Moving(): attackerPieceType: " + attackerPieceType + " | defenterPieceType: " + defenderPieceType); }

// Win-Lose logic
  var msg = "err";
  if (defenderPieceType == "") {
    msg = "na";
  }else if (defenderPieceType == "F") {
    msg = "winGame";
  } else if (defenderPieceType == "B") {
    if (attackerPieceType == "3") { msg = "win"; }
    else { msg = "lose"; }
  } else if (defenderPieceType == "10") {
    if (attackerPieceType == "1") { msg = "win"; }
    else { msg = "lose"; }
  } else if (Number(defenderPieceType) < Number(attackerPieceType)) { 
    msg = "win"; 
  } else if (Number(defenderPieceType) > Number(attackerPieceType)) { 
    msg = "lose";
  } else if (defenderPieceType == attackerPieceType) {
    msg = "draw";
  } else {
    msg = "na";
  }

  if (playerID == "p1") {
    if (msg == "win") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player1Board[rowNumber][columnNumber] = attackerPieceType;
      player2Board[9-rowNumber][9-columnNumber] = "";
    } else if (msg == "lose") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
    } else if (msg == "draw") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[9-rowNumber][9-columnNumber] = "";
    } else if (msg == "na") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player1Board[rowNumber][columnNumber] = attackerPieceType;
    } else {
      _error("something went wrong 234266");
    }
  } else if (playerID == "p2") {
    if (msg == "win") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[rowNumber][columnNumber] = attackerPieceType;
      player1Board[9-rowNumber][9-columnNumber] = "";
    } else if (msg == "lose") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
    } else if (msg == "draw") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player1Board[9-rowNumber][9-columnNumber] = "";
    } else if (msg == "na") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[rowNumber][columnNumber] = attackerPieceType;
    }
  } else {
    _error("something went wrong 234267");
  }
  
  cachScript.put('p1Board', JSON.stringify(player1Board), intCachTimeout);
  cachScript.put('p2Board', JSON.stringify(player2Board), intCachTimeout);
  cachScript.put("gameLastMove", msg + "," + attackerPieceType + "," + defenderPieceType + "," + 
  playerSelectRow  + "," + playerSelectCol  + "," + rowNumber + "," + columnNumber, intCachTimeout);

  if (playerID == "p1") {
    cachScript.put("gamePlayerTurn", "p2", intCachTimeout); // change to player 2's turn 
  } else if (playerID == "p2") {
    cachScript.put("gamePlayerTurn", "p1", intCachTimeout); // change to player 2's turn 
  } else {
    _error("moving() nether p1 or p2")
  }

  if (logging) { _log("moving() msg: " + msg); }
  //return msg, attackerPieceType, defenderPieceType;
  return {msg: msg, attackerPieceType: attackerPieceType, defenderPieceType: defenderPieceType};
}

//  ------------------------------------------------------------------- CHECK 

function check(response) {
  var logging = false;

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000)
    const playerName = response.playerName;
    const cachScript = CacheService.getScriptCache();

    const gameState = cachScript.get('gameState');
    const player1Setup = cachScript.get("p1Setup");
    const player2Setup = cachScript.get("p2Setup");

    const gamePlayerTurn = cachScript.get('gamePlayerTurn');
    var gameLastMove = cachScript.get('gameLastMove');
    const playerID = _playerNameToPlayerID(playerName);

    var msg = false;    

    if (gameState == 2 && player1Setup && player2Setup) {
      if (gamePlayerTurn == null) { // Setup first turn
        cachScript.put("gamePlayerTurn", playerID, intCachTimeout);
        msg = "first";
      } else if (gamePlayerTurn == playerID) {
        msg = "yt";
      } else {
        msg = "wait";
      }
    } else {
      msg = "setup";
    }
    if (logging) { _log("check(): \nplayerName: " + playerName + "\ngameState: " + gameState + "\nplayer1Setup: " + player1Setup  + "\nplayer2Setup: " + player2Setup  + "\ngamePlayerTurn: " +  gamePlayerTurn  + "\ngameLastMove: " +  gameLastMove  + "\nplayerID: " + playerID + "\nmsg: " + msg); }
  } catch (e) {
    _error('check(): Could not obtain lock after 10 seconds.');    
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }  

  return {msg: msg, lastMove: gameLastMove};
}

//  ------------------------------------------------------------------- RECEIVE BOARD

function receiveBoard(playerName, response) {
  var logging = false;

  if (logging) { _log("receiveBoard() player Name: " + playerName); }
  if (logging) { _log(JSON.stringify(response)); }

  const cachScript = CacheService.getScriptCache();
  const playerID = _playerNameToPlayerID(playerName);

  cachScript.put(playerID + "Board", JSON.stringify(response), intCachTimeout);
  cachScript.put(playerID + "Setup", true, intCachTimeout);
}

//  ------------------------------------------------------------------- GAME

function game(response) { // response = (.playerName, .msg)
  var logging = false;

  if (logging) { _log("response = " + JSON.stringify(response)); }

  const playerName = response.playerName;
  const cachScript = CacheService.getScriptCache();
  const gameState = cachScript.get("gameState");
  const p1Name = cachScript.get("p1Name");
  const p2Name = cachScript.get("p2Name");

  if (gameState == null) { // Setup player 1 (p1)
    if (playerName != null && p1Name == null) {
      if (logging) { _log("Game Waiting / false (from null)"); }
      cachScript.put("gameState", 1, intCachTimeout);
      if (logging) { _log("p1Name = " + playerName); }
      cachScript.put("p1Name", playerName, intCachTimeout);
    } else { _error("No player name") }
  } else if (gameState == 1 && p2Name == null && p1Name != playerName) { // Setup Player 2 (p2)
    if (playerName != null) {
      cachScript.put("p2Name", playerName, intCachTimeout);
      cachScript.put("gameState", 2, intCachTimeout);
    } else { _error("No player name") }
  } else { // Player 1 & 2 setup and there is no more room
    if (logging) { _log("WARNING: GAME FULL"); }
    return "Game Full or Same Name"
  }

  return false;

}

//  ------------------------------------------------------------------- player name to ID

function _playerNameToPlayerID(playerName) {

  const cachScript = CacheService.getScriptCache();
  const p1 = cachScript.get("p1Name");
  const p2 = cachScript.get("p2Name");
  var player = false;
  if (playerName == p1) { player = "p1" }
  else if (playerName == p2) { player = "p2" }
  else { _error("Player name does not match: " + playerName + "\np1: " + p1 + "\np2: " + p2); return false }
  return player;
}

//  ------------------------------------------------------------------- TESTING

function testing() {
  // testing...
}

//  ------------------------------------------------------------------- Logging

function _log(msg) { 
  const cachScript = CacheService.getScriptCache();
  var cachLog = cachScript.get("log");

  var msg = _timeStamp() + "|" + msg;
  Logger.log(msg); 

  if (cachLog == null ) { cachScript.put("log", msg, intCachTimeout); }
  else { cachScript.put("log", cachLog + "\n\n" + msg, intCachTimeout); }

}

//  ------------------------------------------------------------------- Error Logging

function _error(msg) { 
  var msg = "ERROR --- ERROR --- ERROR("+_timeStamp()+"):\n" + msg;
  Logger.log(msg); 
  const cachScript = CacheService.getScriptCache();
  var cachLog = cachScript.get("log");
  if (cachLog == null ) { cachScript.put("log", msg, intCachTimeout); }
  else { cachScript.put("log", cachLog + "\n\n" + msg, intCachTimeout); }
}

//  ------------------------------------------------------------------- Time Stamping for logging

function _timeStamp() {
  var date = new Date();
  var timestamp = date.getMinutes()+"m:"+date.getSeconds()+"s:"+date.getMilliseconds()+"ms";
  return timestamp;
}
