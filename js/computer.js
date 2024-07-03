/*jslint browser this */
/*global _, player */

(function (global) {
    "use strict";

    var computer = _.assign({}, player, {
        grid: [],
        tries: [],
        lastTryHit: false,
        isHit: false,
        lastTryCombination: [],
        fleet: [],
        game: null,
        play: function () {
            if (this.game.gameIsFinish) return;

            var self = this;
            var notAlreadyFired = false;
            var col, row;
            var directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

            // Random hit si pas de hit sur le coup d'avant (sans pouvoir attquer deux fois la même case)
            if (!self.isHit) {
                while (!notAlreadyFired) {
                    col = Math.floor(Math.random() * 10);
                    row = Math.floor(Math.random() * 10);

                    if (self.tries[col][row] === 0) {
                        notAlreadyFired = true;
                    }
                }
            } else {
                // tant que le bateau n'a pas été coulé continuer de tirer autour de lastTryCombinationHit
                // Sur un hit, essayer de trouver la direction du bateau
                var lastHit = self.lastTryCombination[self.lastTryCombination.length - 1];
                var countDirectionTry = 0;

                directions.some(function(direction) {
                    console.log(direction[0], 'direction 0 : COL');
                    console.log(direction[1], 'direction 1 : ROW');
                    col = lastHit.col + direction[0];
                    row = lastHit.row + direction[1];

                    // Ne pas attaquer une case qui a déjà été attaquée
                    // Ne pas attaquer hors des limites du board
                    if (col >= 0 && col < 10 && row >= 0 && row < 10 && self.tries[col][row] === 0) {
                        notAlreadyFired = true;
                        return true;
                    } else if (col >= 0 && col < 10 && row >= 0 && row < 10 && self.tries[col][row] !== 0) {
                        notAlreadyFired = false;
                        countDirectionTry = 0;
                        return false;
                    }
                });

                // Si plus aucune direction n'est valable, repasser en mode random
                if (!notAlreadyFired) {
                    while (!notAlreadyFired) {
                        col = Math.floor(Math.random() * 10);
                        row = Math.floor(Math.random() * 10);

                        if (self.tries[col][row] === 0) {
                            notAlreadyFired = true;
                        }
                    }
                }
            }

            setTimeout(function () {
                self.game.fire(this, col, row, function (hasSucceed) {
                    console.log(col, ' , ', row, 'SHOT BOT');
                    self.tries[col][row] = hasSucceed;

                    if (hasSucceed) {
                        self.lastTryCombination.push({col, row});
                        self.isHit = true;
                    } else {
                        if (self.lastTryHit) {
                            self.lastTryCombination = self.lastTryCombination.length - 1
                            countDirectionTry++;
                            self.isHit = false;
                        }
                        /*if (self.lastTryCombination.length > 1) {
                            // Reset to first hit if a direction after the first hit misses
                            self.lastTryCombination = [self.lastTryCombination[0]];
                            self.isHit = false;
                        }*/
                    }
                });
            }, 50);
        },
        areShipsOk: function (callback) {
            this.fleet.forEach(function (ship) {
                let placed = false;

                while (!placed) {
                    let isVertical = Math.random() > 0.5;

                    let x = Math.floor(Math.random() * 10);
                    let y = Math.floor(Math.random() * 10);

                    if (this.canPlaceShipAt(x, y, ship, isVertical)) {
                        let j = 0;
                        while (j < ship.life) {
                            if (!isVertical) {
                                this.grid[y + j][x] = ship.getId();
                            } else {
                                this.grid[y][x + j] = ship.getId();
                            }
                            j += 1;
                        }

                        placed = true;
                    }
                }
            }, this);

            console.log('COMPUTER GRID', this.grid)

            setTimeout(function () {
                callback();
            }, 2000);
        },
        canPlaceShipAt: function (x, y, ship, isVertical) {
            let i = 0;
            let tt = 0;
            while (tt < ship.getLife()) {
                if (isVertical) {
                    if (this.grid[y][x + tt] !== 0) return false;
                } else {
                    if (this.grid[y + tt] === undefined) return false;
                    if (this.grid[y + tt][x] !== 0) return false;
                }
                tt += 1;
            }

            while (i < ship.getLife()) {
                if (isVertical) {
                    this.grid[y][x + i] = ship.getId();
                } else {
                    this.grid[y + i][x] = ship.getId();
                }
                i += 1;
            }

            return true;
        }
    });

    global.computer = computer;

}(this));