
const intCachTimeout = 21600 // 6 hours

// -------------------------------------------------------------------- Spreadsheet

const spreadsheetID = "your-ID-here"; // Stratego Database

const gameID = 1;
const database = SpreadsheetApp.openById(spreadsheetID);
const databaseRange = database.getRange("A1:N2"); // also change clear_All()
const databaseValues = databaseRange.getValues();

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
  "p1EmailLast",
  "p2EmailLast",
]

// -------------------------------------------------------------------- Website
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('Stratego - capture the flag')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

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
  const cachScript = CacheService.getScriptCache();
  Logger.log(cachScript.get("p1EmailLast"));
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
  for (i = 1; i < 14; i++) {
    databaseValues[gameID][i] = "";
  }
  databaseRange.setValues(databaseValues);
}

//  ------------------------------------------------------------------- MOVING

function moving(playerNAME, playerSelectRow, playerSelectCol, rowNumber, columnNumber) {
  var logging = false;

  // read data
  const cachScript = CacheService.getScriptCache();
  const playerID = _playerNameToPlayerID(playerNAME);
  var player1Board = JSON.parse(cachScript.get('p1Board'));
  var player2Board = JSON.parse(cachScript.get('p2Board'));
  if (player1Board == null || player2Board == null) {    
    _loadToCach();
    var player1Board = JSON.parse(cachScript.get('p1Board'));
    var player2Board = JSON.parse(cachScript.get('p2Board'));
  }
  var player1BoardFound = JSON.parse(databaseValues[gameID][10]);
  var player2BoardFound = JSON.parse(databaseValues[gameID][11]);

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
      player2BoardFound[9-rowNumber][9-columnNumber] = attackerPieceType;
      player2BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
      player1BoardFound[rowNumber][columnNumber] = "";
      // update delete
    } else if (msg == "lose") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player1BoardFound[rowNumber][columnNumber] = defenderPieceType;
      player2BoardFound[9-playerSelectRow][9-playerSelectCol] = "";      
    } else if (msg == "draw") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[9-rowNumber][9-columnNumber] = "";
      player2BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
    } else if (msg == "na") {
      player1Board[playerSelectRow][playerSelectCol] = ""; 
      player1Board[rowNumber][columnNumber] = attackerPieceType;
      player2BoardFound[9-rowNumber][9-columnNumber] = player2BoardFound[9-playerSelectRow][9-playerSelectCol];
      player2BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
    } else {
      _error("something went wrong 234266");
    }
  } else if (playerID == "p2") {
    if (msg == "win") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[rowNumber][columnNumber] = attackerPieceType;
      player1Board[9-rowNumber][9-columnNumber] = "";
      player1BoardFound[9-rowNumber][9-columnNumber] = attackerPieceType;
      player1BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
      player2BoardFound[rowNumber][columnNumber] = "";
    } else if (msg == "lose") {
      player2Board[playerSelectRow][playerSelectCol] = "";
      player2BoardFound[rowNumber][columnNumber] = defenderPieceType;
      player1BoardFound[9-playerSelectRow][9-playerSelectCol] = ""; 
    } else if (msg == "draw") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player1Board[9-rowNumber][9-columnNumber] = "";
      player1BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
    } else if (msg == "na") {
      player2Board[playerSelectRow][playerSelectCol] = ""; 
      player2Board[rowNumber][columnNumber] = attackerPieceType;
      player1BoardFound[9-rowNumber][9-columnNumber] = player1BoardFound[9-playerSelectRow][9-playerSelectCol];
      player1BoardFound[9-playerSelectRow][9-playerSelectCol] = "";
    }
  } else {
    _error("something went wrong 234267");
  }
  
  cachScript.put('p1Board', JSON.stringify(player1Board), intCachTimeout);
  databaseValues[gameID][4] = JSON.stringify(player1Board);
  cachScript.put('p2Board', JSON.stringify(player2Board), intCachTimeout);
  databaseValues[gameID][7] = JSON.stringify(player2Board);
  var lastMove = msg + "," + attackerPieceType + "," + defenderPieceType + "," + playerSelectRow  + "," + playerSelectCol  + "," + rowNumber + "," + columnNumber;
  cachScript.put("gameLastMove", lastMove, intCachTimeout);
  databaseValues[gameID][3] = lastMove;

  if (playerID == "p1") {
    cachScript.put("gamePlayerTurn", "p2", intCachTimeout); // change to player 2's turn
    databaseValues[gameID][2] = "p2"; 
    // Email player 2
    const player2Email = databaseValues[gameID][13];
    if (player2Email != "" && player2Email != false && player2Email != null) {
      if (cachScript.get("p2EmailLast") == null) {
        MailApp.sendEmail(player2Email, "Your Turn!", "It is your turn to move on Stratego!\nhttps://dl9h.short.gy/Stratego-Daily");        
      }
      cachScript.put("p2EmailLast", new Date(), 60); // Dont send an email if a move has been made in the last 1 min
    }
  } else if (playerID == "p2") {
    cachScript.put("gamePlayerTurn", "p1", intCachTimeout); // change to player 1's turn 
    databaseValues[gameID][2] = "p1"; 
    // Email player 1
    const player1Email = databaseValues[gameID][12];
    if (player1Email != "" && player1Email != false && player1Email != null) {
      if (cachScript.get("p1EmailLast") == null) {
        MailApp.sendEmail(player1Email, "Your Turn!", "It is your turn to move on Stratego!\nhttps://dl9h.short.gy/Stratego-Daily");     
      }
      cachScript.put("p1EmailLast", new Date(), 60); // Dont send an email if a move has been made in the last 1 min
    }
  } else {
    _error("moving() nether p1 or p2")
  }

  if (logging) { _log("moving() msg: " + msg); }

  databaseValues[gameID][10] = JSON.stringify(player1BoardFound);
  databaseValues[gameID][11] = JSON.stringify(player2BoardFound);
  databaseRange.setValues(databaseValues);

  if (logging) { _log("Player1BoardFound at end befor string:\n" + player1BoardFound + "\n\nAfter String:\n" + databaseValues[gameID][10]); }
  
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
    var gameState = cachScript.get('gameState');
    var player1Setup = cachScript.get("p1Setup");
    var player2Setup = cachScript.get("p2Setup");
    var gamePlayerTurn = cachScript.get('gamePlayerTurn');
    var gameLastMove = cachScript.get('gameLastMove');
    if (gameState == null || player1Setup == null || player2Setup == null || gamePlayerTurn == null || gameLastMove == null) {
      _loadToCach();
      var gameState = cachScript.get('gameState');
      var player1Setup = cachScript.get("p1Setup");
      var player2Setup = cachScript.get("p2Setup");
      var gamePlayerTurn = cachScript.get('gamePlayerTurn');
      var gameLastMove = cachScript.get('gameLastMove');
    }

    const playerID = _playerNameToPlayerID(playerName);

    var msg = false;    

    if (gameState == 2 && player1Setup && player2Setup) {
      if (gamePlayerTurn == "") { // Setup first turn
        cachScript.put("gamePlayerTurn", playerID, intCachTimeout);
        databaseValues[gameID][2] = playerID;        
        databaseRange.setValues(databaseValues);
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
    _error('check(): Could not obtain lock after 10 seconds. e:\n' + e);    
  } finally {
    if (lock.hasLock()) {
      lock.releaseLock();
    }
  }  

  // STOP databaseRange.setValues(databaseValues); is within the function
  return {msg: msg, lastMove: gameLastMove};
}

//  ------------------------------------------------------------------- RECEIVE BOARD

function receiveBoard(playerName, response) {
  var logging = false;

  if (logging) { _log("receiveBoard() player Name: " + playerName); }
  if (logging) { _log(JSON.stringify(response)); }

  const cachScript = CacheService.getScriptCache();
  const playerID = _playerNameToPlayerID(playerName);

  var emptyBoard = [];
  for (var row = 0; row < 10; row++) {
    emptyBoard[row] = [];
    for (var col = 0; col < 10; col++) {      
      emptyBoard[row][col] = "";
    }
  }

  cachScript.put(playerID + "Board", JSON.stringify(response), intCachTimeout);
  cachScript.put(playerID + "Setup", true, intCachTimeout);
  if (playerID == "p1") {
    databaseValues[gameID][4] = JSON.stringify(response);
    databaseValues[gameID][5] = true;
    databaseValues[gameID][10] = JSON.stringify(emptyBoard);
  } else {
    databaseValues[gameID][7] = JSON.stringify(response);
    databaseValues[gameID][8] = true;
    databaseValues[gameID][11] = JSON.stringify(emptyBoard);
  }
  databaseRange.setValues(databaseValues);
}

//  ------------------------------------------------------------------- GAME

function game(response) { // response = (.playerName, .msg)
  var logging = false;

  if (logging) { _log("response = " + JSON.stringify(response)); }

  const playerName = response.playerName;
  const playerEmail = response.email;
  const cachScript = CacheService.getScriptCache();
  var gameState = cachScript.get("gameState");
  var p1Name = cachScript.get("p1Name");
  var p2Name = cachScript.get("p2Name");
  if (gameState == null || p1Name == null || p2Name == null) {
    _loadToCach();
    var gameState = cachScript.get("gameState");
    var p1Name = cachScript.get("p1Name");
    var p2Name = cachScript.get("p2Name");
  }

  if (gameState == "") { // Setup player 1 (p1)
    if (playerName != "" && p1Name == "") {
      if (logging) { _log("Game Waiting / false (from null)"); }
      cachScript.put("gameState", 1, intCachTimeout);
      databaseValues[gameID][1] = 1;
      if (logging) { _log("p1Name = " + playerName); }
      cachScript.put("p1Name", playerName, intCachTimeout);
      cachScript.put("p1Email", playerEmail, intCachTimeout);
      databaseValues[gameID][6] = playerName;
      databaseValues[gameID][12] = playerEmail; // Player 1 email
    } else { _error("No player name") }
  } else if (gameState == 1 && p2Name == "" && p1Name != playerName) { // Setup Player 2 (p2)
    if (playerName != "") {
      cachScript.put("p2Name", playerName, intCachTimeout);
      cachScript.put("gameState", 2, intCachTimeout);
      cachScript.put("p2Email", playerEmail, intCachTimeout);
      databaseValues[gameID][9] = playerName;
      databaseValues[gameID][13] = playerEmail; // Player 2 email      
      databaseValues[gameID][1] = 2;
    } else { _error("No player name") }
  } else if (gameState == 2 && p1Name == playerName) { // Load the Board for player 1
    return {
      msg: "load", 
      board: JSON.parse(databaseValues[gameID][4]), 
      enemyBoard: JSON.parse(databaseValues[gameID][7]),
      foundBoard: JSON.parse(databaseValues[gameID][10]),
    };
  } else if (gameState == 2 && p2Name == playerName) { // Load the Board for player 2
    return {
      msg: "load", 
      board: JSON.parse(databaseValues[gameID][7]), 
      enemyBoard: JSON.parse(databaseValues[gameID][4]),
      foundBoard: JSON.parse(databaseValues[gameID][11]),
    };
  } else {
    if (logging) { _log("WARNING: GAME FULL"); }
    return {msg: "full"};
  }

  databaseRange.setValues(databaseValues);
  return {msg: false};

}

//  ------------------------------------------------------------------- player name to ID

function _playerNameToPlayerID(playerName) {

  const cachScript = CacheService.getScriptCache();
  const p1 = cachScript.get("p1Name");
  const p2 = cachScript.get("p2Name");
  var player = false;
  if (playerName == p1) { player = "p1" }
  else if (playerName == p2) { player = "p2" }
  else { _error("_playerNameToPlayerID(): Player name does not match: " + playerName + "\np1: " + p1 + "\np2: " + p2); return false }
  return player;
}

//  ------------------------------------------------------------------- TESTING

function testing() {
  Logger.log(receiveBoard("a", ""));
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

//  ------------------------------------------------------------------- Time Stamping for logging

function _loadToCach() {
  const cachScript = CacheService.getScriptCache();
  cachScript.put("gameState", databaseValues[gameID][1], intCachTimeout);  
  cachScript.put("gamePlayerTurn", databaseValues[gameID][2], intCachTimeout);
  cachScript.put("gameLastMove", databaseValues[gameID][3], intCachTimeout);
  cachScript.put("p1Board", databaseValues[gameID][4], intCachTimeout);
  cachScript.put("p1Setup", databaseValues[gameID][5], intCachTimeout);
  cachScript.put("p1Name", databaseValues[gameID][6], intCachTimeout);
  cachScript.put("p2Board", databaseValues[gameID][7], intCachTimeout);
  cachScript.put("p2Setup", databaseValues[gameID][8], intCachTimeout);
  cachScript.put("p2Name", databaseValues[gameID][9], intCachTimeout);
  cachScript.put("p1Found", databaseValues[gameID][10], intCachTimeout);
  cachScript.put("p2Found", databaseValues[gameID][11], intCachTimeout);
  cachScript.put("p1Email", databaseValues[gameID][12], intCachTimeout);
  cachScript.put("p2Email", databaseValues[gameID][13], intCachTimeout);
  return
}


