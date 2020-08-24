var os = require("os"),
  ifaces = os.networkInterfaces(),
  ip,
  players = [],
  currentTurn = 0,
  turn = 0,
  calledPlayers = 0,
  foldedPlayers = 0,
  handsSent = 0,
  tableCards = [],
  lastBet = 0,
  showdownPlayers = [],
  playerVendor = [],
  playerThatRaised,
  currentWinner = undefined,
  finalPlayers = [],
  tablePot = 0;

const socket = require("socket.io");
const express = require("express");
const http = require("http");
const Hand = require("pokersolver").Hand;
const app = express();
const server = http.createServer(app);
const io = socket.listen(server);

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ("IPv4" !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ":" + alias, iface.address);
      ip = iface.address;
    } else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ++alias;
  });
});

class Deck {
  constructor() {
    this.deck = [];
    this.dealt_cards = [];
  }

  // generates a deck of cards
  generate_deck() {
    // creates card generator function
    let card = (suit, value) => {
      let name = value + "_of_" + suit;
      //returns key and values into each instance of the this.deck array
      return { name: name, suit: suit, value: value };
    };

    let values = [
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "jack",
      "queen",
      "king",
      "ace"
    ];
    let suits = ["clubs", "diamonds", "spades", "hearts"];

    for (let s = 0; s < suits.length; s++) {
      for (let v = 0; v < values.length; v++) {
        this.deck.push(card(suits[s], values[v]));
      }
    }
  }

  // prints the deck of card objects
  print_deck() {
    if (this.deck.length === 0) {
      console.log(
        "Deck has not been generated. Call generate_deck() on deck object before continuing."
      );
    } else {
      for (let c = 0; c < this.deck.length; c++) {
        console.log(this.deck[c]);
      }
    }
  }

  // shuffle the deck
  shuffle() {
    for (let c = this.deck.length - 1; c >= 0; c--) {
      let tempval = this.deck[c];
      let randomindex = Math.floor(Math.random() * this.deck.length);

      //ensures that the randome index isn't the same as the current index. It runs the function again if this returns as true
      while (randomindex == c) {
        randomindex = Math.floor(Math.random() * this.deck.length);
      }
      this.deck[c] = this.deck[randomindex];
      this.deck[randomindex] = tempval;
    }
  }

  // deal a number cards
  deal(num_cards) {
    let cards = [];

    for (let c = 0; c < num_cards; c++) {
      let dealt_card = this.deck.shift();
      cards.push(dealt_card);
      this.dealt_cards.push(dealt_card);
    }

    return cards;
  }

  replace() {
    this.deck.unshift(this.dealt_cards.shift());
  }

  clear_deck() {
    this.deck = [];
  }
}

const StateMachine = require("javascript-state-machine");
const { truncate } = require("fs");
var game = new StateMachine({
  init: "Idle",
  transitions: [
    { name: "start", from: "Idle", to: "FirstBet" },
    { name: "dealFlop", from: "FirstBet", to: "FlopCards" },
    { name: "dealTurn", from: "FlopCards", to: "TurnCard" },
    { name: "dealRiver", from: "TurnCard", to: "RiverCard" },
    { name: "showdown", from: "RiverCard", to: "Results" },
    { name: "restart", from: "*", to: "FirstBet" }
  ],
  methods: {
    onStart: function () {
      io.of("/player").emit("startGame");
      playersActive = players.length;
      nextTurn(100);
    },
    onDealFlop: function () {
      console.log("Flop dealed");
      io.of("/table").emit("dealCards", deck.deal(3));
      io.of("/player").emit("showCards");
    },
    onDealTurn: function () {
      console.log("Turn dealed");
      io.of("/table").emit("dealCards", deck.deal(1));
    },
    onDealRiver: function () {
      console.log("River dealed");
      io.of("/table").emit("dealCards", deck.deal(1));
    },
    onShowdown: function () {
      console.log("showCards");
      io.of("/player").emit("showCards");
    },
    onRestart: function () {
      tablePot = 0;
      tableCards = [];
      currentWinner = undefined;
      currentTurn = 0;
      calledPlayers = 0;
      showdownPlayers = [];
      handsSent = 0;
      playersActive = players.length;
      foldedPlayers = 0;
      deck = new Deck();
      deck.generate_deck();
      deck.shuffle();
      io.of("/player").emit("startGame");
      io.of("/table").emit("removeCards");
      nextTurn(100);
    }
  }
});

nextTurn = (bet) => {
  turn = currentTurn++ % players.length;
  players[turn].emit("yourTurn", bet);
  console.log(
    "Next turn triggered. Current turn: " +
      currentTurn +
      ". Last Bet: " +
      bet
  );
};

formatHand = hand => {
  let new_hand = [];
  new Promise((res, rej) => {
    hand.forEach(card => {
      let card_value = card.value;
      let card_suit = card.suit;
      card_name = getCardName(card_suit, card_value);
      new_hand.push(card_name);
    });
    res();
  });
  return new_hand;
};

getCardName = (card_suit, card_value) => {
  switch (card_value) {
    case "two":
      card_value = "2";
      break;
    case "three":
      card_value = "3";
      break;
    case "four":
      card_value = "4";
      break;
    case "five":
      card_value = "5";
      break;
    case "six":
      card_value = "6";
      break;
    case "seven":
      card_value = "7";
      break;
    case "eight":
      card_value = "8";
      break;
    case "nine":
      card_value = "9";
      break;
    case "ten":
      card_value = "10";
      break;
    case "jack":
      card_value = "J";
      break;
    case "queen":
      card_value = "Q";
      break;
    case "king":
      card_value = "K";
      break;
    case "ace":
      card_value = "A";
      break;
  }

  switch (card_suit) {
    case "spades":
      card_suit = "s";
      break;
    case "diamonds":
      card_suit = "d";
      break;
    case "clubs":
      card_suit = "c";
      break;
    case "hearts":
      card_suit = "h";
      break;
  }

  card_name = card_value + card_suit;
  return card_name;
};

getWinner = arr => {
  let winnerIndex;
  new Promise((res, rej) => {
    let hands = [];
    arr.forEach((item, i) => {
      hands[i] = item.game.hand;
    });
    winner = Hand.winners(hands);
    winnerIndex = hands.indexOf(winner[0]);
    res();
  });
  return winnerIndex;
};

gameEnd = async() =>{
  var winnerIndex = await getWinner(showdownPlayers);
  let winner = showdownPlayers[winnerIndex];
  winner.cash += tablePot;
  io.of("/table").emit("updatePot", tablePot, true);
  io.of("/player").emit("beforeCardsDisplay");
  winner.emit("onWin", tablePot);
  io.of("/table").emit(
    "updatePlayer",
    winner.game.name,
    winner.game.cash
  );
  let loosers = showdownPlayers.filter(player=>{
    return player != winner
  });
  loosers.forEach(looser => {
    looser.emit("onLoose", winner.game.name);
  });
}

io.of("/player").on("connection", socket => {
  console.log("player id=" + socket.id + " connected");
  players.push(socket);
  socket.emit("connectToTable");
  socket.on("disconnect", () => {
    console.log("player id=" + socket.id + " disconnected");
    players.splice(players.indexOf(socket), 1);
    turn--;
    io.of("/table").emit("deletePlayer", socket.name);
  });
  socket.on("Restart", () => {
    game.restart();
  });
  socket.on("storePlayer", (User) => {
    socket.game = User;
  })
  socket.on("displayPlayer", (user) => {
    socket.name = user.name;
    socket.cash = user.cash;
    io.of("/table").emit("displayPlayer", user.name, user.cash);
  });
  socket.on("dealCardsServer", () => {
    socket.emit("dealCardsClient", deck.deal(2));
  });
  socket.on("passTurn", (bet, action) => {
    lastBet = bet;
    if (action == "call") {
      calledPlayers++;
      tablePot += lastBet;
      socket.cash -= lastBet;
      io.of("/table").emit(
        "updatePlayer",
        socket.name,
        socket.cash
      );
      io.of("/table").emit("updatePot", tablePot, false);
      if (calledPlayers < playersActive && playerThatRaised != players[(currentTurn) % players.length]) {
        if (players[turn] == socket) {
          nextTurn(lastBet);
        }
      } else {
        if (game.is("FirstBet")) {
          game.dealFlop();
          calledPlayers = 0;
          lastBet = 0;
          nextTurn(lastBet);
        } else if (game.is("FlopCards")) {
          game.dealTurn();
          calledPlayers = 0;
          lastBet = 0;
          nextTurn(lastBet);
        } else if (game.is("TurnCard")) {
          game.dealRiver();
          calledPlayers = 0;
          lastBet = 0;
          nextTurn(lastBet);
        } else if (game.is("RiverCard")) {
          calledPlayers = 0;
          lastBet = 0;
          game.showdown();
        }
      }
    } else if (action == "raise") {
      if (calledPlayers == 0){
        playerThatRaised = socket;
      }
      calledPlayers = 0;
      tablePot += lastBet;
      socket.cash -= lastBet;
      io.of("/table").emit("updatePlayer", socket.name, socket.cash);
      io.of("/table").emit("updatePot", tablePot, false);
      if (players[turn] == socket) {
        nextTurn(lastBet);
      }
    } else if (action == "fold") {
      playersActive--;
      foldedPlayers++;
      io.of("/table").emit("foldPlayer", socket.name);
      if (playersActive <= 1 || foldedPlayers >= players.length) {
        socket.cash += tablePot;
        io.of("/table").emit("updatePot", tablePot, true);
        players[turn+1].emit("onWin", tablePot);
        io.of("/table").emit(
          "updatePlayer",
          socket.name,
          socket.cash
        );
        let loosers = players.filter(player=>{
          return player != players[turn+1]
        });
        loosers.forEach(looser => {
          looser.emit("onLoose", players[turn+1].game.name);
        });
      } else {
        nextTurn(lastBet);
      }
    } else {
      calledPlayers = 0;
      lastBet = 0;
      nextTurn(lastBet);
    }
  });
  socket.on("addCards", async data => {
    showdownPlayers.push(socket);
    let player = showdownPlayers.indexOf(socket);
    showdownPlayers[player].game = data;
    let fmtHand = await formatHand(data.cards);
    let fmtTable = await formatHand(tableCards);
    let fullHand = fmtTable.concat(fmtHand);
    showdownPlayers[player].game.hand = Hand.solve(fullHand);
    handsSent++;
    console.log(handsSent, playersActive)
    if (handsSent == playersActive) {
      gameEnd();
    } else {
      console.log("ERROR: Winners could not be calculated");
    }
  });
  socket.on("displayBlankCards", () => {
    io.of("/table").emit("displayBacks", socket.name);
  });
  socket.on("showPlayersCards", (user) => {
    io.of("/table").emit("openCards", user);
  });
});

io.of("/table").on("connection", socket => {
  console.log("table id=" + socket.id + " connected");
  socket.on("disconnect", () => {
    console.log("table id=" + socket.id + " disconnected");
  });
  socket.on("storeCards", cards => {
    tableCards = tableCards.concat(cards);
  });
});

io.of("/admin").on("connection", socket => {
  console.log("admin id=" + socket.id + " connected");
  socket.on("disconnect", () => {
    console.log("admin id=" + socket.id + " disconnected");
  });
  socket.on("startGameAdmin", () => {
    console.log("game started");
    game.start();
  });
  socket.on("restartGame", () => {
    game.restart();
  });
});

deck = new Deck();
deck.generate_deck();
deck.shuffle();

server.listen(3000, ip);
