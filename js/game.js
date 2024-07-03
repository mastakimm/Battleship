/*jslint browser this */
/*global _, player, computer, utils */

(function () {
    "use strict";

    var game = {
        PHASE_INIT_PLAYER: "PHASE_INIT_PLAYER",
        PHASE_INIT_OPPONENT: "PHASE_INIT_OPPONENT",
        PHASE_PLAY_PLAYER: "PHASE_PLAY_PLAYER",
        PHASE_PLAY_OPPONENT: "PHASE_PLAY_OPPONENT",
        PHASE_GAME_OVER: "PHASE_GAME_OVER",
        PHASE_WAITING: "waiting",

        currentPhase: "",
        phaseOrder: [],

        gameIsFinish: false,

        // l'interface utilisateur doit-elle être bloquée ?
        waiting: false,

        // garde une référence vers les noeuds correspondant du dom
        grid: null,
        miniGrid: null,

        // liste des joueurs
        players: [],

        // lancement du jeu
        init: function () {

            // initialisation
            this.grid = document.querySelector('.board .main-grid');
            this.miniGrid = document.querySelector('.mini-grid');

            // défini l'ordre des phase de jeu
            this.phaseOrder = [
                this.PHASE_INIT_PLAYER,
                this.PHASE_INIT_OPPONENT,
                this.PHASE_PLAY_PLAYER,
                this.PHASE_PLAY_OPPONENT,
                this.PHASE_GAME_OVER
            ];

            // initialise les joueurs
            this.setupPlayers();

            // ajoute les écouteur d'événement sur la grille
            this.addListeners();

            // c'est parti !
            document.getElementById('startGame').addEventListener('click', this.handleStartGameClick.bind(this));

            this.currentPhase = this.PHASE_INIT_PLAYER;
        },
        setupPlayers: function () {
            // donne aux objets player et computer une réference vers l'objet game
            player.setGame(this);
            computer.setGame(this);

            // todo : implémenter le jeu en réseaux
            this.players = [player, computer];

            this.players[0].init();
            this.players[1].init();
        },
        handleStartGameClick: function() {
            const startOption = document.querySelector('input[name="startOption"]:checked').value;
            console.log(startOption, 'startOption');
            if (startOption === 'random') {
                this.currentPhase = Math.random() < 0.5 ? this.PHASE_PLAY_PLAYER : this.PHASE_PLAY_OPPONENT;
            } else if (startOption === 'player') {
                this.currentPhase = this.PHASE_PLAY_PLAYER;
            } else {
                this.currentPhase = this.PHASE_PLAY_OPPONENT;
            }

            // Hide the start selection UI
            document.getElementById('startSelection').style.display = 'none';

            // Now start the game
            this.goNextPhase();
        },
        goNextPhase: function () {
            let ci = this.phaseOrder.indexOf(this.currentPhase);
            let self = this;

            if (ci !== this.phaseOrder.length - 1) {
                this.currentPhase = this.phaseOrder[ci + 1];
            } else {
                this.currentPhase = this.phaseOrder[0];
            }

            switch (this.currentPhase) {
                case this.PHASE_INIT_PLAYER:
                    utils.info("Placez vos bateaux");
                    break;
                case this.PHASE_INIT_OPPONENT:
                    this.wait();
                    utils.info("En attente de votre adversaire");
                    this.players[1].areShipsOk(function () {
                        self.stopWaiting();
                        const startSelection = document.getElementById('startSelection');

                        startSelection.style.display = 'flex';
                        startSelection.style.justifyContent = 'center';
                        startSelection.style.alignItems = 'center';
                        utils.info("Choisissez qui commence !");
                    });
                    break;
                case this.PHASE_PLAY_PLAYER:
                    if (this.gameIsOver(this.players[1])) {
                        this.setGameOver(this.players[0], 'You won');
                    } else {
                        utils.info("A vous de jouer, choisissez une case !");
                    }
                    break;
                case this.PHASE_PLAY_OPPONENT:
                    if (this.gameIsOver(this.players[0])) {
                        this.setGameOver(this.players[1], 'Bot won');
                    } else {
                        utils.info("A votre adversaire de jouer...");
                        this.players[1].play();
                    }
                    break;
                case this.PHASE_GAME_OVER:
                    this.currentPhase = this.phaseOrder[this.phaseOrder.indexOf(this.PHASE_PLAY_PLAYER) - 1];
                    this.goNextPhase();
                    break;
            }
        },
        gameIsOver: function (ply) {
            return ply.getAllFleetsDead();
        },

        setGameOver: function(plyWin, textWin) {
            this.gameIsFinish = true;

            const WinnerName = document.getElementById('namewin');
            WinnerName.innerText = textWin;

            const PopupFinish = document.getElementById('gameOverPhase');
            PopupFinish.style.display = 'flex';

            const BtnResetGame = document.getElementById('resetGame');
            BtnResetGame.addEventListener('click', () => {
                console.log('RESET THIS GAME');
            });

            console.log(namePly, plyWin);
        },

        getPhase: function () {
            if (this.waiting) {
                return this.PHASE_WAITING;
            }
            return this.currentPhase;
        },
        // met le jeu en mode "attente" (les actions joueurs ne doivent pas être pris en compte si le jeu est dans ce mode)
        wait: function () {
            this.waiting = true;
        },
        // met fin au mode mode "attente"
        stopWaiting: function () {
            this.waiting = false;
        },
        addListeners: function () {
            // on ajoute des acouteur uniquement sur la grid (délégation d'événement)
            this.grid.addEventListener('mousemove', _.bind(this.handleMouseMove, this));
            this.grid.addEventListener('click', _.bind(this.handleClick, this));
            this.grid.addEventListener('contextmenu', _.bind(this.handleRightclick, this));
        },
        handleMouseMove: function (e) {
            // on est dans la phase de placement des bateau
            if (this.getPhase() === this.PHASE_INIT_PLAYER && e.target.classList.contains('cell')) {
                var ship = this.players[0].fleet[this.players[0].activeShip];

                // si on a pas encore affiché (ajouté aux DOM) ce bateau
                if (!ship.dom.parentNode) {
                    this.grid.appendChild(ship.dom);
                    // passage en arrière plan pour ne pas empêcher la capture des événements sur les cellules de la grille
                    ship.dom.style.zIndex = -1;
                }

                if (this.players[0].vertical) {
                    ship.dom.style.height = "" + utils.CELL_SIZE + "px";
                    ship.dom.style.width = "" + utils.CELL_SIZE * ship.life + "px";
                } else {
                    ship.dom.style.width = "" + utils.CELL_SIZE + "px";
                    ship.dom.style.height = "" + utils.CELL_SIZE * ship.life + "px";
                }

                // décalage visuelle, le point d'ancrage du curseur est au milieu du bateau&
                ship.dom.style.top = "" + (utils.eq(e.target.parentNode)) * utils.CELL_SIZE + "px";
                ship.dom.style.left = "" + utils.eq(e.target) * utils.CELL_SIZE + "px";
            }
        },
        handleRightclick: function(event) {
            event.preventDefault();
            this.players[0].vertical = !this.players[0].vertical;
        },
        handleClick: function (e) {
            // self garde une référence vers "this" en cas de changement de scope
            var self = this;

            // si on a cliqué sur une cellule (délégation d'événement)
            if (e.target.classList.contains('cell')) {
                // si on est dans la phase de placement des bateau
                if (this.getPhase() === this.PHASE_INIT_PLAYER) {
                    // on enregistre la position du bateau, si cela se passe bien (la fonction renvoie true) on continue
                    if (this.players[0].setActiveShipPosition(utils.eq(e.target), utils.eq(e.target.parentNode))) {

                        if (!this.players[0].activateNextShip()) {
                            this.wait();
                            utils.confirm("Confirmez le placement ?", function () {
                                // si le placement est confirmé
                                self.stopWaiting();
                                self.renderMiniMap();
                                self.players[0].clearPreview();
                                self.goNextPhase();
                            }, function () {
                                self.stopWaiting();
                                // sinon, on efface les bateaux (les positions enregistrées), et on recommence
                                self.players[0].resetShipPlacement();
                                self.resetMinimapPlacement();
                            });
                        }
                    }
                    // si on est dans la phase de jeu (du joueur humain)
                } else if (this.getPhase() === this.PHASE_PLAY_PLAYER) {
                    this.players[0].play(utils.eq(e.target), utils.eq(e.target.parentNode));
                }
            }
        },
        // fonction utlisée par les objets représentant les joueurs (ordinateur ou non)
        // pour placer un tir et obtenir de l'adversaire l'information de réusssite ou non du tir
        fire: function (from, col, line, callback) {
            this.wait();
            var self = this;
            var msg = "";

            // determine qui est l'attaquant et qui est attaqué
            var target = this.players.indexOf(from) === 0
                ? this.players[1]
                : this.players[0];

            if (this.currentPhase === this.PHASE_PLAY_OPPONENT) {
                msg += "Votre adversaire vous a... ";
            }

            // on demande à l'attaqué si il a un bateaux à la position visée
            // le résultat devra être passé en paramètre à la fonction de callback (3e paramètre)
            target.receiveAttack(col, line, function (hasSucceed, idBoat) {
                if (!target.lastTryCombination) {
                    let BoatHit = self.players[0].getShipById(idBoat);
                    if (BoatHit) {
                        let currentLife = BoatHit.getLife();
                        BoatHit.setLife(currentLife - 1);

                        if (BoatHit.getLife() === 0) {
                            const img = document.querySelector(`.${BoatHit.name.toLowerCase()}`);
                            img.classList.add('sunk');
                        }
                    }
                } else {
                    let BoatHit = self.players[1].getShipById(idBoat);
                    if (BoatHit) {
                        let currentLife = BoatHit.getLife();
                        BoatHit.setLife(currentLife - 1);
                    }
                }

                const node = self.miniGrid.querySelector('.row:nth-child(' + (line + 1) + ') .cell:nth-child(' + (col + 1) + ')');

                if (hasSucceed) {
                    document.getElementById('hitSound').play();
                    if (node && !target.lastTryCombination) {
                        node.classList.add('explode');
                        node.removeAttribute('style');
                        node.innerText = 'X';
                    }

                    msg += "Touché !";
                } else {
                    document.getElementById('missSound').play();

                    if (node && !target.lastTryCombination) {
                        node.classList.add('miss');
                        node.removeAttribute('style');
                        node.innerText = 'O';
                    }

                    msg += "Manqué...";
                }

                utils.info(msg);

                // on invoque la fonction callback (4e paramètre passé à la méthode fire)
                // pour transmettre à l'attaquant le résultat de l'attaque
                callback(hasSucceed);

                // on fait une petite pause avant de continuer...
                // histoire de laisser le temps au joueur de lire les message affiché
                setTimeout(function () {
                    self.stopWaiting();
                    self.goNextPhase();
                }, 100);
            });

        },
        renderMap: function () {
            this.players[0].renderTries(this.grid);
        },
        resetMinimapPlacement: function () {
            this.players[0].grid.forEach((row, rowIndex) => {
                row.forEach((col, colIndex) => {
                    let node = this.miniGrid.querySelector('.row:nth-child(' + (rowIndex + 1) + ') .cell:nth-child(' + (colIndex + 1) + ')');

                    if (node) {
                        node.removeAttribute('style');
                    }
                });
            });
        },
        renderMiniMap: function () {
            this.players[0].grid.forEach((row, rowIndex) => {
                row.forEach((col, colIndex) => {
                    if (this.players[0].getShipById(col)) {

                        var node = this.miniGrid.querySelector('.row:nth-child(' + (rowIndex + 1) + ') .cell:nth-child(' + (colIndex + 1) + ')');

                        if (node) {
                            node.style.backgroundColor = this.players[0].getShipById(col).getColor();
                        }
                    }
                });
            });
        }
    };

    // point d'entrée
    document.addEventListener('DOMContentLoaded', function () {
        game.init();
    });
}());