import { Bodies, Events, World, Engine } from "matter-js";
import MovementController from '../../Hooks/MovementController';
import CameraFollowController from '../../Hooks/CameraFollowController';
import IInput from '../../../Input/IInput';
import container from "../../../inversify.config";
import { loadDougAssets } from "../../../Assets";
import { AnimatedSprite } from "pixi.js";
import GetSprite from "../../../Middleware/pixi/Hooks/GetSprite";

async function Player(input: IInput) {

  const dougAssets = await loadDougAssets();
  dougAssets.idle.animationSpeed = 0.1;
  dougAssets.jump.animationSpeed = 0.3;

  const sprite = new AnimatedSprite(dougAssets.idle.textures);
  sprite.scale.y *= -1;
  sprite.animationSpeed = 0.1;
  sprite.play();

  const player = Bodies.circle(100, 100, 25,{
    density: 0.001,
    friction: 0.7,
    frictionStatic: 0,
    frictionAir: 0.01,
    restitution: 0,
    render: {
      texture: sprite,
      destroy: false
    } as any
  });

  const playerHeight = (player.bounds.max.y - player.bounds.min.y);
  const halfPlayerHeight = playerHeight / 2;

  const playerWidth = (player.bounds.max.x - player.bounds.min.x);
  const halfPlayerWidth = playerWidth / 2;

  const emitter = dougAssets.player_land_on_ground_particle_factory(GetSprite(player));
  emitter.autoUpdate = true;
  emitter.addAtBack = false;
  emitter.emit = false;
  emitter.spawnRect.width = playerWidth;

  (player as any).dontTransferAngle = true;

  CameraFollowController(player);

  MovementController(player, input, {
    jumpAnimation: dougAssets.jump,
    walkAnimation: dougAssets.walk,
    idleAnimation: dougAssets.idle,
    onLand: (speed: number) => {
      emitter.updateOwnerPos(player.position.x, player.position.y + halfPlayerHeight);
      emitter.frequency = 1 / (speed * 60);
      setTimeout(() => {
        emitter.emit = true;
        setTimeout(() => emitter.emit = false, 20);
      }, 20);
    }
  });

  const engine = container.get(Engine);
  World.add(engine.world, player);

  return player;
}

export default Player;