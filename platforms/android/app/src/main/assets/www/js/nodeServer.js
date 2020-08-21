var os = require("os"),
  ifaces = os.networkInterfaces(),
  ip,
  players = [],
  currentTurn = 0,
  turn = 0,
  calledPlayers = 0,
  handsSent = 0,
  tableCards = [],
  playerVendor = [],
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
      currentWinner = undefined;
      currentTurn = 0;
      calledPlayers = 0;
      deck = new Deck();
      deck.generate_deck();
      deck.shuffle();
      io.of("/player").emit("startGame");
      io.of("/table").emit("startGameTable", players);
      io.of("/table").emit("removeCards");
      nextTurn(100);
    }
  }
});

nextTurn = lastBet => {
  turn = currentTurn++ % players.length;
  players[turn].emit("yourTurn", lastBet);
  console.log(
    "Next turn triggered. Current turn: " +
      currentTurn +
      ". Last Bet: " +
      lastBet
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
  var winnerIndex = await getWinner(players);
  let winner = players[winnerIndex];
  winner.game.cash += tablePot;
  io.of("/table").emit("updatePot", tablePot, true);
  io.of("/table").emit("openCards", players);
  winner.emit("onWin", tablePot);
  let loosers = players;
  loosers.splice(winnerIndex, 1);
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
    console.log("A number of players now ", players.length);
    io.of("/table").emit("deletePlayer", socket.game.username);
  });
  socket.on("Restart", () => {
    game.restart();
  });
  socket.on("returnPlayer", () => {
    players.push(socket);
  });
  socket.on("displayPlayer", (username, cash) => {
    socket.game = {};
    socket.game.username = username;
    socket.game.cash = cash;
    io.of("/table").emit("displayPlayer", username, cash);
  });
  socket.on("dealCardsServer", () => {
    socket.emit("dealCardsClient", deck.deal(2));
  });
  socket.on("passTurn", (lastBet, action) => {
    if (action == "call") {
      calledPlayers++;
      tablePot += lastBet;
      socket.game.cash -= lastBet;
      io.of("/table").emit(
        "updatePlayer",
        socket.game.username,
        socket.game.cash
      );
      io.of("/table").emit("updatePot", tablePot, false);
      if (calledPlayers < players.length) {
        if (players[turn] == socket) {
          nextTurn(lastBet);
        }
      } else {
        if (game.is("FirstBet")) {
          game.dealFlop();
          calledPlayers = 0;
          nextTurn(lastBet);
        } else if (game.is("FlopCards")) {
          game.dealTurn();
          calledPlayers = 0;
          nextTurn(lastBet);
        } else if (game.is("TurnCard")) {
          game.dealRiver();
          calledPlayers = 0;
          nextTurn(lastBet);
        } else if (game.is("RiverCard")) {
          calledPlayers = 0;
          game.showdown();
        }
      }
    } else if (action == "raise") {
      calledPlayers = 0;
      tablePot += lastBet;
      socket.cash -= lastBet;
      io.of("/table").emit("updatePlayer", socket.game.username, socket.cash);
      io.of("/table").emit("updatePot", tablePot, false);
      if (players[turn] == socket) {
        nextTurn(lastBet);
      }
    } else if (action == "fold") {
      players.splice(players.indexOf(socket), 1);
      turn--;
      io.of("/table").emit("foldPlayer", socket.game.username);
      if (!players.length > 1) {
        players[turn].emit("onWin", tablePot);
      }
      nextTurn(lastBet);
    } else {
      calledPlayers = 0;
      nextTurn(lastBet);
    }
  });
  socket.on("addCards", async data => {
    let playerIndex = players.indexOf(socket);
    console.log(playerIndex);
    players[playerIndex].game = data;
    let fmtHand = await formatHand(data.cards);
    let fmtTable = await formatHand(tableCards);
    let fullHand = fmtTable.concat(fmtHand);
    players[playerIndex].game.hand = Hand.solve(fullHand);
    handsSent++;
    if (handsSent == players.length && !players.includes(undefined)) {
      gameEnd();
    } else {
      console.log("ERROR: Winners could not be calculated");
    }
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
  socket.on("displayBlankCards", () => {
    io.of("/table").emit("displayBacks", (socket.game))
  })
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
