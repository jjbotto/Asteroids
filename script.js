const canvas = document.getElementById('game-window'); 
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('play-btn');
const resetBtn = document.getElementById('reset-btn');

// GAME CANVAS CONSTANTS
const gameWidth = canvas.width; 
const gameHeight = canvas.height;
const midPointCanvas = {
    x: gameWidth / 2,
    y: gameHeight / 2
}
const X_MIN = 0;
const X_MAX = gameWidth;
const Y_MIN = 0;
const Y_MAX = gameHeight;

// HELPERS
const TWO_PI = Math.PI * 2;



class Ship {
    constructor(position = midPointCanvas) {
        // Positioning
        this.position = position;
        this.angle = 0;
        
        // Control states
        this.destroyed = false;
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        this.isThrusting = false;
        this.hasFired = false;
        this.bullets = [];
        
        // Movement properties (per frame)
        this.rotationSpeed = 0.04;  // in radians
        this.thrust = 0.05;          // acceleration rate
        this.friction = 0.994;       // deceleration rate
        this.xVelocity = 0;         // X velocity
        this.yVelocity = 0;         // Y velocity
    }

    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        
        // Draw ship
        ctx.beginPath();
        ctx.strokeStyle = 'white'; 
        ctx.fillStyle = 'black'; 
        ctx.moveTo(0, -10);  // Top 
        ctx.lineTo(10, 10);  // Bottom right
        ctx.lineTo(0, 4);   // Middle 
        ctx.lineTo(-10, 10); // Bottom left
        ctx.closePath();
        ctx.stroke();
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = 'white';
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 5, 0, TWO_PI);
        ctx.stroke();
        ctx.closePath();

        ctx.restore();
    }

    keyDown(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.isRotatingLeft = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
                this.isRotatingRight = true;
                event.preventDefault();
                break;
            case 'ArrowUp':
                this.isThrusting = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
                event.preventDefault();
                break;
            case ' ':
                this.fireBullet();
                event.preventDefault();
                break;
        }
    }

    keyUp(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.isRotatingLeft = false;
                break;
            case 'ArrowRight':
                this.isRotatingRight = false;
                break;
            case 'ArrowUp':
                this.isThrusting = false;
                break;
            case ' ':
                this.hasFired = false;
                break;
        }
    }

    rotate() {
        if (this.isRotatingLeft) this.angle -= this.rotationSpeed;
        if (this.isRotatingRight) this.angle += this.rotationSpeed;
    }

    move() {
        // Apply thrust 
        if (this.isThrusting) {
            this.xVelocity += Math.cos(this.angle - Math.PI/2) * this.thrust;
            this.yVelocity += Math.sin(this.angle - Math.PI/2) * this.thrust;
        }
        
        // Apply friction 
        this.xVelocity *= this.friction;
        this.yVelocity *= this.friction;
        
        // Update position
        this.position.x += this.xVelocity;
        this.position.y += this.yVelocity;
        
        // Wrap around screen
        if (this.position.x > gameWidth) this.position.x = 0;
        if (this.position.x < 0) this.position.x = gameWidth;
        if (this.position.y > gameHeight) this.position.y = 0;
        if (this.position.y < 0) this.position.y = gameHeight;
    }

    fireBullet() {
        if (!this.hasFired) {
            let bullet = new Bullet(this);
            this.bullets.push(bullet);
            this.hasFired = true;
        }
    }

    checkShipCollision(asteroid) {
        let shipRadius = 5;
        let shipX = this.position.x;
        let shipY = this.position.y;    
        let asteroidRadius = asteroid.radius;
        let asteroidX = asteroid.position.x;
        let asteroidY = asteroid.position.y;

        let distance = Math.hypot(shipX - asteroidX, shipY - asteroidY);

        if (distance <= shipRadius + asteroidRadius - 1) {
            this.destroyed = true;
            asteroid.offScreen = true;
        }
    }

    update() {
        this.rotate();
        this.move();
        for (let bullet of this.bullets) {
            bullet.update();
        }
        this.draw();
    }

}

class Asteroid {
    spawnLocation = {
        top: {x: Math.random() * gameWidth, y: -35},   
        bottom: {x: Math.random() * gameWidth, y: gameHeight + 35},
        left: {x: -35, y: Math.random() * gameHeight},
        right: {x: gameWidth + 35, y: Math.random() * gameHeight},
    }

    // Sets the flight angle of the asteroid based on its spawn location
    setFlightAngle() {
        let angle;
        switch (this.position) {
            case this.spawnLocation.top: // flight angle between 45 and 135 degrees
                angle = Math.PI / 4 + Math.random() * Math.PI / 2;
                break;
            case this.spawnLocation.right: // flight angle between 225 and 315 degrees
                angle = 3 * Math.PI / 4 + Math.random() * Math.PI / 2;
                break;
            case this.spawnLocation.bottom: // flight angle between 230 and 315 degrees
                angle = 5 * Math.PI / 4 + Math.random() * Math.PI / 2;
                break;
            case this.spawnLocation.left: // flight angle between 135 and 225 degrees
                angle = 7 * Math.PI / 4 + Math.random() * Math.PI / 2;
                break;
        }
        return angle;
    }

    /**
     * Asteroid constructor. 
     * 
     * Sets the starting position of the asteroid to a random side of the game window.
     * Sets the flight angle to a random direction between 45 and 135 degrees (counterclockwise from the positive x-axis).
     * Sets the speed of the asteroid to a random number between 5 and 10.
     * Sets the x and y velocities based on the speed and flight angle.
     * Sets the rotation angle to 0.
     * Sets the rotation speed to a random number between 0.5 and 2.
     * Sets the rotation direction to either -1 (counterclockwise) or 1 (clockwise).
     * Sets the radius of the asteroid to a random number between 20 and 55.
     * Sets the number of edges of the asteroid to a random number between 5 and 10.
     * Sets the random angle variations for each edge.
     */
    constructor() {
        // Positioning
        const spawnPoints = ['top', 'bottom', 'left', 'right'];
        const randomSpawn = spawnPoints[Math.floor(Math.random() * 4)];
        this.position = this.spawnLocation[randomSpawn];
        this.flightAngle = this.setFlightAngle();
        this.offScreen = false;
        
        // Control properties
        this.speed = 1 + Math.random() * 2; 
        this.xVelocity = Math.cos(this.flightAngle) * this.speed;
        this.yVelocity = Math.sin(this.flightAngle) * this.speed;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.005 + Math.random() * 0.02;
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.radius = 20 + Math.random() * 35;
        this.numEdges = Math.floor(5 + Math.random() * 5);
        
        // Random angle variations for each edge
        this.angleVariations = [];
        for (let i = 0; i < this.numEdges; i++) {
            this.angleVariations.push(Math.random() * Math.PI / 4);
        }
    }

    checkOffScreen() {
        if (this.position.x < -35 || this.position.x > gameWidth + 35 || 
            this.position.y < -35 || this.position.y > gameHeight + 35) {
            this.offScreen = true;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotationAngle);
        
        ctx.beginPath();
        ctx.strokeStyle = 'white';
        const angle = TWO_PI / this.numEdges;
        let x = Math.cos(this.angleVariations[0]) * this.radius;
        let y = Math.sin(this.angleVariations[0]) * this.radius;
        ctx.moveTo(x, y);

        for (let i = 1; i < this.numEdges; i++) {
            const variationIndex = i % this.numEdges;
            let angleToVertex = i * angle + this.angleVariations[variationIndex];
            x = Math.cos(angleToVertex) * this.radius;
            y = Math.sin(angleToVertex) * this.radius;
            ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    rotate() {
        if (this.rotationDirection === -1) this.rotationAngle -= this.rotationSpeed;
        if (this.rotationDirection === 1) this.rotationAngle += this.rotationSpeed;
    }

    move() {
        this.position.x += this.xVelocity;
        this.position.y += this.yVelocity;
    }

    explode() {
        // implement explosion particle effects
    }

    update() {
        this.rotate();
        this.move();
        this.checkOffScreen();
        this.draw();
    }
}

class Game {
    constructor() {
        this.playGame = false;
        this.gameOver = false;
        this.pauseGame = false;
        this.ship = null;
        this.asteroids = [];
        this.score = 0;
        this.asteroidCleanupInterval = setInterval(() => this.checkAsteroids(), 1000);
        this.bulletCleanupInterval = setInterval(() => this.checkBullets(), 3000);
        this.spawnInterval = setInterval(() => this.spawnAsteroid(), 1000);
        this.invincibility = true;
        playBtn.addEventListener('click', () => this.play());
    }

    play() {
        this.playGame = true;
        this.ship = new Ship();
        this.ship.position = {...midPointCanvas};
        document.addEventListener('keydown', (e) => this.ship.keyDown(e));
        document.addEventListener('keyup', (e) => this.ship.keyUp(e));
        setTimeout(() => this.invincibility = false, 3000); 
        playBtn.classList.add('hidden');
        canvas.style.cursor = 'none';
    }

    stopGame() {
        this.playGame = false;
        document.removeEventListener('keydown', (e) => this.ship.keyDown(e));
        document.removeEventListener('keyup', (e) => this.ship.keyUp(e));
        this.ship = null;
        clearInterval(this.bulletCleanupInterval);
        canvas.style.cursor = 'auto';
        playBtn.style.display = 'none';
        resetBtn.style.display = 'block';
        resetBtn.addEventListener('click', () => this.resetGame());
    }

    resetGame() {
        this.score = 0;
        this.invincibility = true;
        resetBtn.style.display = 'none';
        playBtn.style.display = 'block';
        playBtn.classList.remove('hidden');
    }

    spawnAsteroid() {
        const asteroid = new Asteroid();
        this.asteroids.push(asteroid);
    }

    checkShipCollision() {
        let ship = this.ship;
        let asteroids = this.asteroids; 

        asteroids.forEach(asteroid => {
            ship.checkShipCollision(asteroid);
        });
    }

    checkBulletCollisions() {
        let bullets = this.ship.bullets;
        let asteroids = this.asteroids;

        bullets.forEach(bullet => {
            asteroids.forEach(asteroid => {
                bullet.checkHit(asteroid);
            });
        });
    }

    checkAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            if (this.asteroids[i].offScreen) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    checkBullets() {
        for (let i = this.ship.bullets.length - 1; i >= 0; i--) {
            if (this.ship.bullets[i].offScreen) {
                this.ship.bullets.splice(i, 1);
            }
        }
    }

    checkShipHealth() {
        if (this.ship.destroyed) {
            this.stopGame();
        }
    }

    loop() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, gameWidth, gameHeight);

        if (this.playGame && this.ship) {
            this.ship.update();
            this.checkBulletCollisions();
            if (!this.invincibility) {
                this.checkShipCollision();  
            }
            this.checkAsteroids();
            this.checkBullets();
            this.checkShipHealth();
        }
        
        this.asteroids.forEach(asteroid => {
            asteroid.update();
        });
        
        requestAnimationFrame(() => this.loop());
    }

} 

class Bullet {
    constructor(ship) {
        this.position = {
            x: ship.position.x,
            y: ship.position.y
        };
        this.angle = ship.angle;
        this.speed = 10;
        this.xVelocity = Math.cos(this.angle - Math.PI/2) * this.speed;
        this.yVelocity = Math.sin(this.angle - Math.PI/2) * this.speed;
        this.offScreen = false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle);
        
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.moveTo(1, -5);
        ctx.lineTo(1, 5);
        ctx.lineTo(-1, 5);
        ctx.lineTo(-1, -5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    checkOffScreen() {
        if (this.position.x < -5 || this.position.x > 805 || this.position.y < -5 || this.position.y > 605) {
            this.offScreen = true;
        }
    }

    checkHit(asteroid) {
        let radius = asteroid.radius;
        let bulletX = this.position.x;
        let bulletY = this.position.y;
        let distance = Math.hypot(bulletX - asteroid.position.x, bulletY - asteroid.position.y);

        if (distance <= radius - 1) {
            this.offScreen = true;
            asteroid.offScreen = true;
        }
    }

    move() {
        this.position.x += this.xVelocity;
        this.position.y += this.yVelocity;
    }

    update() {
        this.move();
        this.checkOffScreen();
        this.draw();
    }
}




// TESTING PURPOSES BELOW //

const game = new Game();

// Game loop
// function gameLoop() {
//     ctx.fillStyle = 'black';
//     ctx.fillRect(0, 0, gameWidth, gameHeight);

//     if (game.playGame && game.ship) {
//         game.ship.update();
//         game.checkBulletCollisions();
//         game.checkShipCollision();  
//         game.checkAsteroids();
//         game.checkBullets();
//         game.checkShipHealth();
//     }
    
//     game.asteroids.forEach(asteroid => {
//         asteroid.update();
//     });
    
//     requestAnimationFrame(gameLoop);
// }

window.onload = () => {
    game.loop();
    
};
