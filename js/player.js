/*jslint browser this */
/*global _, shipFactory, player, utils */

(function (global) {
    "use strict";

    var ship = {dom: {parentNode: {removeChild: function () {}}}};

    const player = {
        vertical: false,
        grid: [],
        tries: [],
        fleet: [],
        game: null,
        activeShip: 0,
        setGame: function (game) {
            this.game = game;
        },
        init: function () {
            // créé la flotte
            this.fleet.push(shipFactory.build(shipFactory.TYPE_BATTLESHIP));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_DESTROYER));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SUBMARINE));
            this.fleet.push(shipFactory.build(shipFactory.TYPE_SMALL_SHIP));

            // créé les grilles
            this.grid = utils.createGrid(10, 10);
            this.tries = utils.createGrid(10, 10);
        },
        play: function (col, line) {
            if (this.game.gameIsFinish) return;

            // appel la fonction fire du game, et lui passe une calback pour récupérer le résultat du tir
            this.game.fire(this, col, line, _.bind(function (hasSucceed) {
                if (this.tries[line][col] === true) {
                    utils.info("Touché again, noob !");
                    return;
                }
                this.tries[line][col] = hasSucceed;

                if (hasSucceed) {
                    utils.info("Touché!");
                }
            }, this));

            this.game.renderMap();
        },
        // quand il est attaqué le joueur doit dire si il a un bateaux ou non à l'emplacement choisi par l'adversaire
        receiveAttack: function (col, line, callback) {
            var succeed = false;
            let idBoat = null;

            if (this.grid[line][col] !== 0) {
                succeed = true;
                idBoat = this.grid[line][col];
                this.grid[line][col] = 0;
            }
            callback.call(undefined, succeed, idBoat);
        },
        setActiveShipPosition: function (x, y) {
            let ship = this.fleet[this.activeShip];

            let i = 0;
            let tt = 0;

            while (tt < ship.getLife()) {
                if (this.vertical) {
                    if (this.grid[y][x + tt] !== 0) return false;
                } else {
                    if (this.grid[y + tt] === undefined) return false;
                    if (this.grid[y + tt][x] !== 0) return false;
                }
                tt += 1;
            }

            while (i < ship.getLife()) {
                if (this.vertical) {
                    this.grid[y][x + i] = ship.getId();
                } else {
                    this.grid[y + i][x] = ship.getId();
                }
                i += 1;
            }

            return true;
        },
        clearPreview: function () {
            this.fleet.forEach(function (ship) {
                if (ship.dom.parentNode) {
                    ship.dom.parentNode.removeChild(ship.dom);
                }
            });
        },
        resetShipPlacement: function () {
            this.clearPreview();

            this.activeShip = 0;
            this.grid = utils.createGrid(10, 10);
        },
        activateNextShip: function () {
            if (this.activeShip < this.fleet.length - 1) {
                this.activeShip += 1;
                return true;
            } else {
                return false;
            }
        },
        renderTries: function (grid) {
            this.tries.forEach(function (row, rid) {
                row.forEach(function (val, col) {
                    var node = grid.querySelector('.row:nth-child(' + (rid + 1) + ') .cell:nth-child(' + (col + 1) + ')');


                    if (val === true) {
                        node.style.backgroundColor = '#e60019';
                    } else if (val === false) {
                        node.style.backgroundColor = '#aeaeae';
                    }
                });
            });
        },
        renderShips: function (grid) {
        },


        getShipById: function (id) {
            let test = null;

            this.fleet.forEach(ship => {
                if (ship.getId() === id) {
                    test = ship;
                }
            });

            return test;
        },
        getAllFleetsDead: function () {
            let lifeFleets = 0;

            this.fleet.forEach(ship => {
                lifeFleets += ship.getLife();
            });

            return !(lifeFleets > 0);
        }
    };

    global.player = player;

}(this));