const canvas = document.getElementById('game-window'); 
const ctx = canvas.getContext('2d');
const playBtn = document.getElementById('play-btn');

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
    constructor() {
        // Positioning
        this.position = midPointCanvas;
        this.angle = 0;
        
        // Control states
        this.isRotatingLeft = false;
        this.isRotatingRight = false;
        this.isThrusting = false;
        this.isFiring = false;
        
        // Movement properties (per frame)
        this.rotationSpeed = 0.05;  // in radians
        this.thrust = 0.05;          // acceleration rate
        this.friction = 0.99;       // deceleration rate
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
        ctx.moveTo(0, -10);  // Top 
        ctx.lineTo(10, 10);  // Bottom right
        ctx.lineTo(0, 4);   // Middle 
        ctx.lineTo(-10, 10); // Bottom left
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    keyDown(event) {
        switch (event.key) {
            case 'ArrowLeft':
                this.isRotatingLeft = true;
                break;
            case 'ArrowRight':
                this.isRotatingRight = true;
                break;
            case 'ArrowUp':
                this.isThrusting = true;
                break;
            case 'Space':
                this.isFiring = true;
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
            case 'Space':
                this.isFiring = false;
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

    update() {
        this.rotate();
        this.move();
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
        this.cleanupInterval = setInterval(() => this.checkAsteroids(), 1000);;
        this.spawnInterval = setInterval(() => this.spawnAsteroid(), 1000);
        this.invincibility = true;
        playBtn.addEventListener('click', () => this.play());
    }

    play() {
        this.playGame = true;
        this.ship = new Ship();
        setTimeout(() => this.invincibility = false, 3000); 
        playBtn.classList.add('hidden');
        canvas.style.cursor = 'none';
    }

    stopGame() {
        this.playGame = false;
        this.ship = null; 
        
    }

    spawnAsteroid() {
        const asteroid = new Asteroid();
        this.asteroids.push(asteroid);
    }

    checkAsteroids() {
        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            if (this.asteroids[i].offScreen) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    







}






// TESTING PURPOSES BELOW //

const game = new Game();

// Game loop
function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    // Update ship only if game is playing
    if (game.playGame && game.ship) {
        game.ship.update();
    }
    
    // Always update asteroids
    game.asteroids.forEach(asteroid => {
        asteroid.update();
    });
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => game.ship.keyDown(e));
document.addEventListener('keyup', (e) => game.ship.keyUp(e));

window.onload = () => {
    gameLoop();
};
