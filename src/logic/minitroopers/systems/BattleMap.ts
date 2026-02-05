import Phaser from 'phaser';

export class BattleMap {
    private scene: Phaser.Scene;
    private background: Phaser.GameObjects.TileSprite | Phaser.GameObjects.Image | null = null;
    private width: number = 800; // Default logical width
    private height: number = 600;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public preload() {
        this.scene.load.image('ground_bg', '/assets/minitroopers/ground.png');
    }

    public create() {
        // Create an infinite looking ground or a fixed field
        // User requested "Whole screen", no sky.
        // We us a TileSprite to cover everything easily
        const { width, height } = this.scene.scale;
        
        // Add a sky color behind just in case
        this.scene.add.rectangle(0, 0, 4000, 4000, 0x87CEEB).setDepth(-20).setScrollFactor(0);

        this.background = this.scene.add.tileSprite(400, 300, width, height, 'ground_bg');
        this.background.setDepth(-10);
        this.background.setScrollFactor(0); // If we want it static relative to camera, or move it parallax? 
        // MiniTroopers usually has a static field but camera moves. 
        // The user said "field occupy whole screen".
        
        // Let's make it large enough to cover the "world"
        this.background.setDisplaySize(width * 2, height * 2);
    }

    public resize(width: number, height: number) {
        if (this.background) {
            this.background.setSize(width, height);
        }
    }

    public getBounds(): Phaser.Geom.Rectangle {
        return new Phaser.Geom.Rectangle(0, 0, 1000, 600); // Logical bounds
    }

    public getObstacles(): Phaser.GameObjects.GameObject[] {
        // Placeholder: Generate random rocks/obstacles?
        return [];
    }
}
