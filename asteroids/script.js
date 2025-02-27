// GLOBALS
const canvas = document.getElementById('game-window'); 
const ctx = canvas.getContext('2d');
const TWO_PI = Math.PI * 2;
const gameWidth = canvas.width; 
const gameHeight = canvas.height;
const midPointCanvas = {
    x: gameWidth / 2,
    y: gameHeight / 2
}


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
        top: {x: Math.random() * gameWidth, y: 0},
        bottom: {x: Math.random() * gameWidth, y: gameHeight},
        left: {x: 0, y: Math.random() * gameHeight},
        right: {x: gameWidth, y: Math.random() * gameHeight},
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
     */
    constructor() {
        // Positioning
        const spawnPoints = ['top', 'bottom', 'left', 'right'];
        const randomSpawn = spawnPoints[Math.floor(Math.random() * 4)];
        this.position = this.spawnLocation[randomSpawn];
        this.flightAngle = this.setFlightAngle();
        
        // Control properties
        this.speed = 1 + Math.random() * 2; 
        this.xVelocity = Math.cos(this.flightAngle) * this.speed;
        this.yVelocity = Math.sin(this.flightAngle) * this.speed;
        this.rotationAngle = 0;
        this.rotationSpeed = 0.005 + Math.random() * 0.01;
        this.rotationDirection = Math.random() < 0.5 ? -1 : 1;
        this.radius = 20 + Math.random() * 35;
        this.numEdges = Math.floor(5 + Math.random() * 5);
        
        // Random angle variations for each edge
        this.angleVariations = [];
        for (let i = 0; i < this.numEdges; i++) {
            this.angleVariations.push(Math.random() * Math.PI / 4);
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

    update() {
        this.rotate();
        this.move();
        this.draw();
    }
}

// TESTING PURPOSES BELOW //

const ship = new Ship();
const asteroid = new Asteroid();

// Game loop
function gameLoop() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, gameWidth, gameHeight);

    ship.update();
    asteroid.update();
    
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => ship.keyDown(e));
document.addEventListener('keyup', (e) => ship.keyUp(e));

window.onload = () => {
    gameLoop();
};
