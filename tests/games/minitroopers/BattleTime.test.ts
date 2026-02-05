
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BattleScene } from '../../../src/components/games/minitroopers/scenes/BattleScene';

// Mock Phaser
vi.mock('phaser', () => {
    return {
        default: {
            Scene: class {
                add = {
                    text: vi.fn(() => ({
                        setOrigin: vi.fn().mockReturnThis(),
                        setScrollFactor: vi.fn().mockReturnThis(),
                        setDepth: vi.fn().mockReturnThis(),
                        setText: vi.fn()
                    })),
                    rectangle: vi.fn().mockReturnValue({ setDepth: vi.fn(), setOrigin: vi.fn() }),
                    image: vi.fn().mockReturnValue({ setAlpha: vi.fn(), setScrollFactor: vi.fn() }),
                    container: vi.fn().mockReturnValue({ add: vi.fn(), setData: vi.fn(), setInteractive: vi.fn(), on: vi.fn() })
                };
                cameras = {
                    main: {
                        centerOn: vi.fn(),
                        setViewport: vi.fn(),
                        setZoom: vi.fn()
                    }
                };
                scale = {
                    on: vi.fn(),
                    width: 800,
                    height: 600
                };
                time = {
                    delayedCall: vi.fn()
                };
                tweens = {
                    add: vi.fn()
                };
            }
        }
    };
});

describe('BattleScene Time & Speed', () => {
    let scene: any;

    beforeEach(() => {
        // We need to instantiate the mocked class. 
        // Since we mocked the whole module, we can just new it if we export it or access via the mock.
        // But BattleScene extends Phaser.Scene.
        scene = new BattleScene();
        // Manually inject mocks if needed or rely on the mock above
        scene.add = {
            text: vi.fn(() => ({
                setOrigin: vi.fn().mockReturnThis(),
                setScrollFactor: vi.fn().mockReturnThis(),
                setDepth: vi.fn().mockReturnThis(),
                setText: vi.fn()
            })),
            rectangle: vi.fn().mockReturnValue({ setDepth: vi.fn(), setOrigin: vi.fn() })
        };
        // Mock init data with valid logs
        // Create logs with future times to prevent immediate consumption
        const logs = Array(100).fill(null).map((_, i) => ({ time: (i + 1) * 1000, action: 'wait', actorId: '1' }));
        scene.init({ result: { winner: 'A', log: logs }, teamA: [], teamB: [] });
    });

    it('should initialize with speed multiplier 1', () => {
        expect((scene as any).speedMultiplier).toBe(1);
    });

    it('should update speed multiplier via setSpeed', () => {
        scene.setSpeed(2);
        expect((scene as any).speedMultiplier).toBe(2);
    });

    it('should advance battleTime based on delta and speed', () => {
        (scene as any).battleTime = 0;
        scene.setSpeed(1);
        
        // Update with 1000ms delta (1 sec)
        // Logic: 30 ticks per second * speed 1 = 30 ticks
        scene.update(0, 1000);
        
        expect(Math.floor((scene as any).battleTime)).toBe(30);
        
        // Speed 2
        scene.setSpeed(2);
        scene.update(0, 1000); // Another second
        // Should add 60 ticks
        expect(Math.floor((scene as any).battleTime)).toBe(90); // 30 + 60
    });
    
    it('should update time text', () => {
        // Setup timeText mock
        const setTextMock = vi.fn();
        (scene as any).timeText = { setText: setTextMock };
        
        (scene as any).updateBattleText(123);
        expect(setTextMock).toHaveBeenCalledWith('Time: 123');
    });
    
    it('should stop timer when battle logs are depleted', () => {
        // Mock log length handling (assuming currentTurnIndex vs log.length)
        // We need to access private properties via 'any' casting for white-box testing
        (scene as any).currentTurnIndex = 10;
        (scene as any).battleResult = { log: new Array(10) }; // 10 items
        (scene as any).battleTime = 100;
        
        scene.update(0, 1000);
        
        // Should NOT advance
        expect((scene as any).battleTime).toBe(100);
    });
    it('should NOT block timer when animations are active (Fluidity Check)', () => {
        // Mock active animations
        (scene as any).activeAnimations = 5;
        (scene as any).battleTime = 30;
        
        // Update
        scene.update(0, 1000);
        
        // Should ADVANCE even with active animations
        // Previous logic: would return early, so time would remain 30.
        // New logic: should be 60 (30 + 30 ticks in 1 second).
        expect(Math.floor((scene as any).battleTime)).toBe(60);
    });
});
