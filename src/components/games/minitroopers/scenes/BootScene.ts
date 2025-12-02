import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        this.load.setBaseURL('https://labs.phaser.io');
        
        // Load assets once here
        if (!this.textures.exists('sky')) {
            this.load.image('sky', 'assets/skies/space3.png');
        }
        if (!this.textures.exists('particle')) {
            this.load.image('particle', 'assets/particles/red.png');
        }
        
        // Add loading bar if needed
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);
        
        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        // Start the BattleScene, but don't run it yet. 
        // It will be started/restarted by the React component when props change.
        // Actually, we can just switch to it if we want, but the React component handles the scene start.
        // For now, we just signal that we are ready.
        this.scene.start('BattleScene');
    }
}
